// A dist/ tartalmát FTP(S)-en feltölti az éles mappába. Semmit nem töröl, kivéve --prune-assets esetén
// a távoli assets/ mappa már nem használt fájljait; így a mellette lévő api/, lib/ és config.php érintetlen.
//
//   pnpm deploy:ftp                  build + feltöltés
//   pnpm deploy:ftp:only             feltöltés a meglévő dist/-ből
//   ... -- --dry-run                 csak kiírja, mit töltene fel / törölne
//   ... -- --prune-assets            a feltöltés után törli a régi assets/ fájlokat
//
// Beállítások: .env.deploy.local (minta: .env.deploy.example) vagy környezeti változók.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { argv, env, exit, loadEnvFile, stdin, stdout } from "node:process";
import { fileURLToPath } from "node:url";
import { Client } from "basic-ftp";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");
const ENV_FILE = join(ROOT, ".env.deploy.local");
/** A szerveren a frontend mellett élő backend-fájlok; a dist/ ezeket soha nem írhatja felül. */
const BACKEND_ENTRIES = new Set(["api", "lib", "config.php", ".htaccess"]);
/** A Vite tartalom-hash-es fájlnevei: azonos név és méret esetén a fájl nem változott. */
const HASHED_NAME = /-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/;

const args = new Set(argv.slice(2).filter((arg) => arg !== "--"));
const dryRun = args.has("--dry-run");
const pruneAssets = args.has("--prune-assets");
for (const arg of args) {
  if (arg !== "--dry-run" && arg !== "--prune-assets") fail(`Ismeretlen kapcsoló: ${arg}`);
}

function fail(message) {
  console.error(`\n✖ ${message}`);
  exit(1);
}

function listLocalFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listLocalFiles(path) : [path];
  });
}

function promptHidden(question) {
  if (!stdin.isTTY) return Promise.reject(new Error("Az FTP_PASSWORD nincs megadva, és nincs interaktív terminál."));
  stdout.write(question);
  stdin.setRawMode(true);
  stdin.setEncoding("utf8");
  stdin.resume();
  let value = "";
  return new Promise((resolve, reject) => {
    const done = (error) => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") return done();
        if (char === "\u0003") return done(new Error("Megszakítva."));
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else value += char;
      }
    };
    stdin.on("data", onData);
  });
}

function readConfig() {
  if (existsSync(ENV_FILE)) loadEnvFile(ENV_FILE);
  const host = env.FTP_HOST;
  const user = env.FTP_USER;
  const remoteDir = env.FTP_REMOTE_DIR?.replace(/\/+$/, "");
  if (!host || !user || !remoteDir) {
    fail(
      "Hiányzó FTP_HOST, FTP_USER vagy FTP_REMOTE_DIR. Másold le a .env.deploy.example fájlt .env.deploy.local néven.",
    );
  }
  if (!remoteDir.includes("solvyr-prime")) {
    fail(`Az FTP_REMOTE_DIR (${remoteDir}) nem a solvyr-prime mappára mutat; biztonsági okból leálltam.`);
  }
  const secureSetting = (env.FTP_SECURE || "true").toLowerCase();
  if (!["true", "false", "implicit"].includes(secureSetting))
    fail("Az FTP_SECURE értéke true, false vagy implicit lehet.");
  const secure = secureSetting === "implicit" ? "implicit" : secureSetting === "true";
  const port = env.FTP_PORT ? Number(env.FTP_PORT) : undefined;
  if (port !== undefined && !Number.isInteger(port)) fail("Az FTP_PORT nem egész szám.");
  return {
    host,
    user,
    password: env.FTP_PASSWORD || undefined,
    remoteDir,
    secure,
    port,
    publicUrl: env.DEPLOY_PUBLIC_URL,
  };
}

function localPlan() {
  if (!existsSync(join(DIST, "index.html"))) fail("Nincs dist/index.html. Futtasd előbb: pnpm build");
  for (const entry of readdirSync(DIST)) {
    if (BACKEND_ENTRIES.has(entry)) fail(`A dist/${entry} felülírná a szerver backendjét; feltöltés megszakítva.`);
  }
  const files = listLocalFiles(DIST).map((path) => {
    const rel = relative(DIST, path).split(sep).join("/");
    const slash = rel.lastIndexOf("/");
    return {
      path,
      rel,
      dir: slash === -1 ? "" : rel.slice(0, slash),
      name: rel.slice(slash + 1),
      size: statSync(path).size,
    };
  });
  // Előbb az eszközök, utoljára a HTML: az élő oldal így sosem hivatkozik még fel nem töltött fájlra.
  return files.sort(
    (a, b) => Number(a.name.endsWith(".html")) - Number(b.name.endsWith(".html")) || a.rel.localeCompare(b.rel),
  );
}

async function remoteSizes(client, dir) {
  try {
    const entries = await client.list(dir);
    return new Map(entries.filter((entry) => entry.isFile).map((entry) => [entry.name, entry.size]));
  } catch {
    return new Map();
  }
}

const formatSize = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} kB`;

async function main() {
  const config = readConfig();
  const files = localPlan();
  const password = config.password ?? (await promptHidden(`FTP jelszó (${config.user}@${config.host}): `));

  const client = new Client(60_000);
  console.log(`Kapcsolódás: ${config.host} (${config.secure === false ? "titkosítás nélkül" : "FTPS"})…`);
  try {
    await client.access({ host: config.host, port: config.port, user: config.user, password, secure: config.secure });
  } catch (error) {
    if (error?.code === "ERR_TLS_CERT_ALTNAME_INVALID") {
      const names = error.cert?.subjectaltname?.replace(/DNS:/g, "") ?? "ismeretlen";
      fail(`A szerver tanúsítványa erre a névre szól: ${names}. Állítsd az FTP_HOST értékét erre (nem IP-címre).`);
    }
    throw error;
  }

  try {
    const target = config.remoteDir;
    const dirs = [...new Set(files.map((file) => file.dir))];
    const existing = new Map();
    for (const dir of dirs) existing.set(dir, await remoteSizes(client, dir ? `${target}/${dir}` : target));

    let uploaded = 0;
    let skipped = 0;
    let bytes = 0;
    for (const file of files) {
      const remoteSize = existing.get(file.dir)?.get(file.name);
      if (HASHED_NAME.test(file.name) && remoteSize === file.size) {
        skipped += 1;
        continue;
      }
      const remoteFolder = file.dir ? `${target}/${file.dir}` : target;
      console.log(`${dryRun ? "[próba] " : ""}↑ ${file.rel} (${formatSize(file.size)})`);
      if (!dryRun) {
        await client.ensureDir(remoteFolder);
        await client.uploadFrom(file.path, `${remoteFolder}/${file.name}`);
      }
      uploaded += 1;
      bytes += file.size;
    }
    console.log(`\nFeltöltve: ${uploaded} fájl (${formatSize(bytes)}), változatlan, kihagyva: ${skipped}.`);

    const localAssets = new Set(files.filter((file) => file.dir === "assets").map((file) => file.name));
    const stale = [...(existing.get("assets")?.keys() ?? [])].filter((name) => !localAssets.has(name));
    if (pruneAssets) {
      for (const name of stale) {
        console.log(`${dryRun ? "[próba] " : ""}✖ assets/${name}`);
        if (!dryRun) await client.remove(`${target}/assets/${name}`);
      }
      console.log(`Törölve a régi assets/ fájlok közül: ${stale.length}.`);
    } else if (stale.length > 0) {
      console.log(`A távoli assets/ mappában ${stale.length} már nem használt fájl van (törlés: --prune-assets).`);
    }
  } finally {
    client.close();
  }

  if (config.publicUrl && !dryRun) {
    let response;
    try {
      response = await fetch(config.publicUrl, { cache: "no-store" });
    } catch (error) {
      fail(
        `A feltöltés kész, de az élő oldal (${config.publicUrl}) nem érhető el: ${error.cause?.message ?? error.message}`,
      );
    }
    const live = await response.text();
    const local = readFileSync(join(DIST, "index.html"), "utf8");
    if (!response.ok || live.trim() !== local.trim()) {
      fail(`Az élő oldal (${config.publicUrl}) nem a most feltöltött index.html-t adja (HTTP ${response.status}).`);
    }
    console.log(`Ellenőrizve: ${config.publicUrl} a friss buildet szolgálja ki.`);
  }
  console.log(dryRun ? "\nPróbafutás vége, semmi nem változott." : "\n✔ Kész.");
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
