# Solvyr Prime – kód- és dokumentáció-refaktorálási terv

**Állapot:** javaslat, nem jóváhagyott ütemezés.  
**Kiinduló felmérés:** [projektáttekintés és státusz](./project-status.md), 2026-11-10.  
**Státusz és termékprioritás:** továbbra is a [roadmap](./roadmap.md) az egyetlen központi forrás.

## Cél és hatókör

A terv célja a kód módosíthatóságának és a dokumentáció navigálhatóságának javítása
viselkedésváltoztatás nélkül. A refaktorálás nem funkciófejlesztés és nem jelent
automatikus jóváhagyást a roadmap játékmeneti terveire.

Két külön munkasávot fed le:

- **Kódrefaktorálás:** a teszt-visszajelzés helyreállítása után a nagy
  `Game` koordinátor felelősségeinek fokozatos tisztítása, majd a multiplayer és
  állapotkezelés határainak erősítése.
- **Dokumentáció-refaktorálás:** a dokumentumok szerepének pontosítása, az
  ismétlődő leírások visszavezetése egy kijelölt forráshoz, valamint a
  keresztlinkek és a státuszok következetességének javítása.

## Alapelvek és korlátok

- A munkát kis, külön ellenőrizhető lépésekben kell végezni; egy változtatás egy
  felelősséget vagy dokumentumcsoportot érintsen.
- A determinisztikus szimuláció, mentésmigráció, kampányjutalmak és online eseménysorrend
  meglévő szerződés. Megőrzésük minden refaktor elfogadási feltétele.
- A mentésformátum, a multiplayer payload és a játékszabály nem változhat pusztán
  refaktor címén. Szükséges változtatás külön, verziózással és kompatibilitási
  döntéssel járó feladat.
- Előbb a tesztkörnyezetet kell működőképessé tenni. Zöld, releváns ellenőrzés
  nélkül viselkedést érintő kódmozgatás nem kezdhető.
- A `Game` teljes újraírása, új tárolási absztrakció minden store fölé, valamint
  teljes dokumentációs átnevezés nem cél.
- Nincs határidő vagy becsült munkaidő rögzítve; a prioritás és függőség a
  roadmapben marad.

## Munkasáv A – kódrefaktorálás

### A0. Megbízható teszt-visszajelzés

**Miért első:** a felméréskor 312 teszt sikerült, 128 elbukott, mert a Vitest
futtatásban a `localStorage` `undefined` volt; a Vitest konfiguráció közben
`jsdom` környezetet és közös setupot állít be. A jelenlegi futás ezért nem
alkalmas regressziós alapnak.

**Munka:**

- A futtató Node/Vitest/JSDOM kombinációban megállapítani, miért nem jut el a
  `localStorage` a tesztkörnyezetbe.
- A globálok létrehozását a teszt setup egyetlen, dokumentált helyére tenni;
  ne legyen tesztfájlonkénti kerülőmegoldás.
- Először izolált i18n- és state-tesztekkel, utána a teljes suite-tal igazolni.

**Elfogadás:** `pnpm.cmd test`, `pnpm.cmd build` és `pnpm.cmd lint` lefut; a
tesztekből nem marad környezeti hiba. A feltárt, ténylegesen viselkedési hibákat
külön kell jelenteni, nem szabad a harness javításába rejteni.

### A1. `Game` felelősséghatárok tisztítása

A [Game.ts](../../src/game/engine/Game.ts) renderelést, meccs-életciklust,
harci folyamatot, AI-ütemezést, multiplayer-replayt és kampányeredményeket
koordinál. A cél nem a sorok mechanikus áthelyezése, hanem a változó szabályok és
az erőforrás-életciklus jól tesztelhető határainak kijelölése.

**Javasolt lépések:**

1. A belső felelősségek és függőségek feltérképezése, majd a meglévő életciklus-
   és kampánytesztek relevanciájának ellenőrzése az A0 után.
2. Első, kis kockázatú jelöltként az AI-időzítők és AI-körlépések kezelése
   (`clearAiTimers`, `afterAi`, `scheduleAiTurn`, `aiMove`, `aiAimAndFire`)
   választható le. A döntés csak akkor végleges, ha a függőségi irány tiszta,
   és a viselkedés külön tesztelhetővé válik.
3. Külön lépésben vizsgálni a multiplayer események sorba rendezését,
   revision-kezelését és visszajátszását. Ez maradjon a játékszabályoktól
   elkülönített adapter/orchestration határ; a replay sorrendje nem változhat.
4. A Pixi erőforrások inicializálását és felszabadítását csak akkor kiemelni,
   ha az A1 korábbi lépései után egyértelmű tulajdonosi határ rajzolódik ki.
   A renderelő nem szabadíthat fel más canvas által használt globális erőforrást.

**Elfogadás:** minden egyes lépés után a célzott teszt és a teljes ellenőrzési
kapu sikeres; a lövés, körváltás, kilépés, AI-időzítők törlése, kampányteljesítés,
online revision és renderer-cleanup meglévő viselkedése változatlan.

### A2. Multiplayer protokoll határainak tisztítása

A [protocol.ts](../../src/game/multiplayer/protocol.ts) eseménytípusa jelenleg
általános `string`, a payload `Record<string, unknown>`. Első lépésként a kliens
oldali események diszkriminált uniója és payload-ellenőrzése mérlegelendő, a PHP
API és a TypeScript-kliens tényleges szerződését egyeztetve.

Ez a pont részben viselkedési/biztonsági fejlesztés, nem tiszta refaktor:
az aktív játékos, a lövés tartománya vagy a szimuláció szerveroldali ellenőrzése
külön termékdöntést és protokoll-kompatibilitási tervet igényel. A tisztább
típusmodell önmagában nem jelent csalásvédelmet.

**Elfogadás:** érvényes régi kliensfolyam változatlanul működik, hibás payload
tesztelt és expliciten elutasított, az online eseménysorrend nem változik. Új
mező vagy szabály csak explicit protokollverzióval vezethető be.

### A3. Mentések és store-határok

A kampány- és profiladatok helyi tárolása, illetve a VEYLORA IndexedDB-s
tranzakciós mentése eltérő követelményeket szolgál. Ezeket nem szükséges egyetlen
általános adattárolóba összevonni. A refaktor fókusza a hibakezelési, verziózási,
migrációs és reset-szerződések egyértelműsége legyen.

**Elfogadás:** a tárolási hiba látható, az érvénytelen mentés nincs csendben
felülírva, a resetek csak a hozzájuk tartozó adatot érintik, párhuzamos gazdasági
tranzakciók idempotensek, migrációk teszteltek.

### Kódsáv sorrendje

1. A0 tesztkörnyezet.
2. A1 első, kis felelősségű Game-bontása, majd célzottan további bontás.
3. A2 protokolltípusok és validáció külön döntési kapuval.
4. A3 csak konkrét duplikáció vagy tesztelhetőségi akadály esetén.

## Munkasáv B – dokumentáció-refaktorálás

### Dokumentumtulajdon és elsődleges forrás

| Téma | Elsődleges dokumentum | Határ |
| --- | --- | --- |
| Projekt-pillanatkép és ellenőrzések | [Projektstátusz](./project-status.md) | Dátumozott felmérés; nem backlog |
| Aktív termékstátusz, prioritás, döntés | [Roadmap](./roadmap.md) | Egyetlen központi státuszforrás |
| Kódszerkezet, működési korlátok | [Fejlesztői kontextus](./dev-notes.md) | Rövid architektúra és invariánsok; ne legyen második roadmap |
| Környezet, telepítés, napi parancsok | [Getting started](./getting-started.md) | Indítási referencia; ne legyen teljes feature-leírás |
| Jelenleg elérhető játékmenet | [Játékosútmutató](../user/guide.md) | Játékosnak szóló leírás, belső implementáció nélkül |
| Részletes kampányterv és checklist | [Progressziós TODO](./gameplay-progression-todo.md) | Részterületi feladatlista, roadmapre visszamutatva |
| Dátumozott projektelőzmény | [History](./history.md) | Történet; lezárt állításokat nem használ aktív státuszként |
| Vizuális és hangtervek | [Redesign dokumentumok](./README.md) | Saját részterület; aktív státusz a roadmapben |
| Backend API és üzemeltetés | [Backend README](../../server/README.md) | API-, konfiguráció- és telepítési részletek |

### B1. Átfedések csökkentése

- A `getting-started.md` maradjon technikai belépő. A jelenlegi CSS-, megszakítás-,
  AI- és skinezhetőségi részleteket csak akkor kell áthelyezni, ha már van
  egyértelmű, stabil cél-dokumentum; addig ne vesszen el hasznos referencia.
- A `dev-notes.md` őrizze meg a jelenlegi architektúrát és invariánsokat. A hosszú
  kampány-/VEYLORA-adatfolyamok részletes terve a progressziós dokumentumokban,
  az aktív státusz a roadmapben maradjon; a kontextus ezekre hivatkozzon.
- A roadmap rövid státuszösszefoglaló maradjon. A megvalósítási részleteket és
  elfogadási checklistet ne másolja át a szakági TODO-ból.
- A státuszriport maradjon dátumozott pillanatfelvétel, és frissítéskor jelezze,
  hogy mi változott; ne tartalmazzon új, független feladatlistát.

### B2. Linkek, dátumok és státuszok

- Az új vagy átnevezett dokumentum kerüljön a [fejlesztői indexbe](./README.md),
  a releváns szomszédos dokumentumok pedig hivatkozzanak az elsődleges forrásra.
- A belső linkek legyenek relatívak, működő címkékkel; cím- vagy fájlátnevezés
  előtt az anchor linkeket is ellenőrizni kell.
- Minden státusz kapjon egyértelmű jelölést: megvalósított, nyitott,
  elfogadott terv vagy javaslat. A történeti teszteredmény ne tűnjön aktuális
  validációnak.
- Dátumozott pillanatképek és archív dokumentumok ne írják felül a roadmap
  jelenlegi állapotát.

### Dokumentációs sorrend és elfogadás

1. **B0 – forrásjegyzék:** minden fejlesztői dokumentum kapjon egy tulajdonosi
   témát és elsődleges forrást; először csak az átfedések térképe készüljön el.
2. **B1 – kis átrendezés:** az index, `getting-started`, `dev-notes` és roadmap
   közötti ismétlések rövidítése, hivatkozásokra cserélése. Egy témacsoport
   egyszerre változzon.
3. **B2 – konzisztencia:** relatív linkek, anchorok, dátumok, státuszjelölések,
   és példák összevetése a forráskóddal.
4. **B3 – fenntartás:** minden későbbi kódmódosítás frissítse a hozzá tartozó
   tulajdonosi dokumentumot; a history csak utólagos, lezárt összefoglaló legyen.

**Elfogadás:** az indexből minden aktív dokumentum elérhető; minden témához egy
elsődleges státuszforrás tartozik; nincs eltört belső link; a kész és tervezett
funkciók megkülönböztethetők; a felhasználói útmutatóban nincs implementációs
részlet, a fejlesztői anyagban nincs második központi backlog.

## Közös ellenőrzési kapu

Kódrefaktor minden kis egysége után:

- az érintett viselkedés tesztjei, majd `pnpm.cmd test`;
- `pnpm.cmd build` és `pnpm.cmd lint`;
- mentési, replay- vagy protokollérintettségnél a migrációs/kompatibilitási
  tesztek külön ellenőrzése;
- dokumentációt érintő PR-nál belső linkek és tulajdonosi források átnézése.

PHP-t érintő változtatás csak PHP/MySQL környezetben kap backend-ellenőrzést;
frontend build ezt nem helyettesíti.

## Kapcsolódó dokumentumok

- [Projektáttekintés és státusz](./project-status.md)
- [Fejlesztői kontextus](./dev-notes.md)
- [Roadmap](./roadmap.md)
- [Fejlesztői dokumentációs index](./README.md)