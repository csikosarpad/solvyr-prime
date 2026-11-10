# Gameplay progression – végrehajtási TODO

A [gameplay-elemzés](./gameplay-progression.md) mellé rendelt részletes munkalista.
A [roadmap](./roadmap.md) marad a központi státuszforrás; ez annak progressziós
részterületét bontja ellenőrizhető lépésekre. Nem új, párhuzamos projekt-roadmap.

Jelölés: `[x]` elkészült, `[ ]` hátravan. **2026-11-05: elfogadott prioritás a térképmód.**
Elkészült: C1+C2 **Campaign Map Foundation**, a meglévő ALPHA-01 csatakörével.
**2026-11-05: C3 öt szektora, szabad ágbejárása, OR feloldása és bónusz nélküli
első csomagja elkészült.** Öt valódi csata és mentésmigráció működik.
Hosszabb ember/AI balanszpróba és valós telefonos ellenőrzés még hátravan.

**2026-11-07: elfogadott designirány a következményes ostromhadjárat.**
A C3 utáni új prioritás a [6A pont](#6a-következményes-ostromhadjárat--első-játszható-próba)
kis próbája. Nem igényli előbb az összes C4-modifikátort, fegyvert, képességet
vagy egységosztályt; a részletes szabályok és a prototípustartalom még döntési kapuk.

**2026-11-09: új hosszú távú kampányirány az XP-, nyersanyag- és
technológiaszerzés, egymástól függetlenül választható szektorokkal.**
A fejlesztési előfeltételek a nyersanyag–technológia kapcsolatokban jelennek meg,
nem a szektorok kötelező teljesítési sorrendjében. A részletes mátrix későbbi
tervezési feladat; hatókör és nyitott kérdések a [6B pontban](#6b-kampánycélok--nyersanyag-és-technológiaalapú-fejlődés).
Ez jövőbeli irány, nem a jelenlegi C3 vagy a 6A próba átírása.

## 1. Szektoridentitás – első iteráció

A meglévő pálya neve **SECTOR ALPHA-01 / Training Grounds**. A nevek és
szektorazonosítók nyelvtől független katonai hívójelek; a magyarázó szövegek hu/en/de
fordítást kapnak. Az alap pálya fizikája, terepgenerálása és assetjei nem változnak.

- [x] Az alap szektor kódja és neve közös adatdefinícióból érkezik.
- [x] Főmenü: a játékcím alatt az aktuális harctér kódja és neve.
- [x] Meccsindítás: **SECTOR BRIEFING** panel rövid eligazítással,
  automatikus eltűnés helyett „Értettem” bezárógombbal.
  „Legközelebb ne mutasd ezen a pályán” checkbox: a választás bezáráskor
  szektor-ID-nként helyileg mentődik, újratöltés és játékmódváltás után is.
  Más pálya eligazítását nem rejti el, a kampányhaladást nem módosítja.
- [x] A felső középső HUD-ban a szektorkód és név folyamatosan látható.
- [x] A briefing offline, AI és online indítás/visszavágó közös meccséletciklusához kötött;
  körváltás és HUD-frissítés nem indítja újra.
- [x] A briefing prezentáció: nem állítja meg a fizikát, AI-t vagy replay-t,
  nem küld online eseményt és nem fogyaszt seedelt véletlent.
  A panel kezelőszerveinek billentyűeseményei nem indítanak harci műveletet.
- [x] Responsive, görgethető panel és reduced-motion animációkikapcsolás.
  Hibás vagy nem menthető preferencia explicit hibajelzést ad.
- [x] A kampánycél és a szektor-eligazítás külön felolvasógombot kapott:
  kizárólag gombnyomásra, az aktuális HU/EN/DE nyelven olvas fel.
  Megnyitás, új meccs és nyelvváltás nem indít felolvasást. A globális
  némítás, beszédcsatorna és hangerő érvényes; nem támogatott böngészőben
  a gomb tiltott, magyarázó szöveggel. A harci bemondások változatlanok.
- [x] Felolvasás közben a teljes szöveg látható marad; Web Speech `word`
  szóhatár-eseménynél az aktuális szó világosabb színnel, finom statikus
  glow-val jelölődik. Befejezés, megszakítás, bezárás és nyelvváltás törli
  a kiemelést. Ha a hang (pl. Chrome online angol/német hangjai) 700 ms-on
  belül nem küld szóhatárt, a kiemelés becsült ütemben halad (karakterszám,
  írásjel-szünetek, beszédtempó); az első valódi szóhatár átveszi az irányítást.
- [x] Felolvasás alatt ugyanaz a gomb „Leállítás”-ra vált, szóhatárjelzés
  nélkül is. Leállítás törli a kiemelést; új gombnyomás az elejéről olvas.
  Befejezés vagy megszakítás visszaállítja a „Felolvasás” feliratot.
- [x] Célzott tesztek: kézi bezárás, szektoronkénti mentés/visszatöltés,
  nyelvváltás, új meccs, körváltás, billentyűkezelés és tárolási hibák.
- [ ] Valós iOS/Android ellenőrzés: név, briefing, tájolási tipp és HUD együtt.

Ez még nem többpályás rendszer és nem oldja meg az XP-plafont.
Pályaválasztás, új fizikai szabályok és feloldások nincsenek az első iterációban.

## 2. Campaign Map – Foundation és első C3 bővítés elkészült

A [megvalósíthatósági elemzés](./gameplay-progression.md#10-campaign-map--sector-progression-megvalósíthatóság)
C1–C4 lépcsői. Először C1+C2: **menü → térkép → ALPHA-01 → eredmény → térkép**,
helyileg mentett teljesítéssel. Új pályák, modifikátorok, orbitális képességek és
osztályok nem előfeltételek. Az első katalógus csak ALPHA-01-et igényli; az új
képernyő/meccskontextus megteremtése a feladat része, nem már késznek feltételezett alap.
A 3. pont később ezt bővíti, nem új párhuzamos rendszert készít.
A C1/C2 alábbi listái az eredeti egycélpontos Foundation történeti elfogadási
feltételei; a jelenlegi öt szektoros működés és v2 mentés a C3 listában szerepel.

### Döntési kapuk – implementáció előtt

- [x] Mindig P1 ember vs P2 AI; a gyorscsata ellenfélválasztása változatlan.
- [x] Egy játszható ALPHA-01 pont, új pálya nélkül.
- [x] Helyi böngészőhaladás; meglévő P1/P2 profilok és AI-memória megosztása.
  Vereség/döntetlen/elhagyás nem teljesítés; eddigi harci XP megmarad, újrapróbálás lehetséges.
- [x] Progress: teljesített/összes, kezdetben 0/1; kijelölés nem teljesítés.
- [x] Külön kampányreset csak teljesítést töröl; teljes mentéstörlés XP-t, szinteket és kampányt.

### C1 – Térkép és valódi ALPHA-01 csatabelépés

Függőség: minimális ALPHA-katalógus és mód-/navigációs döntés. Nem ad kampánybónuszt.
Ez önmagában még nem a kész Foundation csomag; a C2-vel együtt szállítandó.

- [x] Minimális szektordefiníció és térképes meccskontextus kialakítása.
- [x] Új térképképernyő és menübelépés; meglévő gyorscsata indítása változatlan.
- [x] ALPHA-01 kiválasztása és indítása a meglévő tereppel/fizikával.
- [x] React gomb + SVG műveleti háló, cyan/arany stílus; külön Pixi térképmotor nélkül.
- [x] Kijelölt ALPHA, valós részletkártya, státusz és vissza gomb.
- [x] Tervezett pontokat az első verzió nem rajzol; nincs átnevezett ALPHA-csata.
- [x] Natív fókuszolható gombok és státuszfeliratok; emulált álló/fekvő mobil,
  legalább 44 px térképgombok. A térkép nem animált.
- [ ] Valós telefonos és képernyőolvasós használati próba.

### C2 – Mentett kampányváz

Függőség: C1 és offline csatakontekstus. Nincs új fizika vagy extra XP-jutalom.

- [x] Definíció, haladás és aktív csata külön adatai; kampánymentés v1, helyi UUID meccs-ID.
  Tartalomverzió/gráf csak több szektornál szükséges.
- [x] Térképes csata elkülönítése a gyorscsatától; csak a saját mód eredménye ad teljesítést.
- [x] Menü/current operation, briefing és HUD közös ALPHA-definícióból/meccskontextusból.
- [x] A Game lezáráskor teljesít; render/remount nem módosít haladást.
  Az egyetlen szektor boolean teljesítése idempotens, jutalomledger még nem szükséges.
- [x] Győzelem utáni teljesítés, vereség/döntetlen utáni újrapróbálás; térképre visszatérés.
- [x] ResultScreen kampánygomb és secured jelzés; new route nincs, mert nincs további útvonal.
- [x] Mentés, kezdeti üres kampány a régi profil mellé, kompatibilitási és tárolási hibajelzés.
  Hibás/ismeretlen mentésnél indítás tiltott, a mentést csak explicit reset írja felül.
- [x] Térképre/menübe visszatérés lezárja az elhagyott csatát és AI-időzítőit.
- [x] Tesztek: mentés-visszatöltés, duplikált teljesítés, vereség, döntetlen, visszavágó, reset.
- [x] Foundation elfogadás: teljes navigációs kör, egy pálya, kezdetben 0/1 majd 1/1;
  refresh után megmaradó teljesítés, változatlan gyorscsata/online játék.

### C3 – Elágazó művelet, öt játszható szektor

Függőség: C2 és négy további valódi csatadefiníció. A közös szektorkatalógus/
terepkonfiguráció minimális alapja a 3. pontból a C3 elé kerül; nem kell hozzá
modifikátor, online pályaválasztó vagy új fegyverrendszer.

#### Elfogadott első csomag

| Szektor | Név | Feloldás |
| --- | --- | --- |
| ALPHA-01 | Training Grounds | Kezdettől elérhető |
| DELTA-08 | Crystal Basin | ALPHA-01 teljesítése |
| FORGE-17 | Industrial Expanse | ALPHA-01 teljesítése |
| VANGUARD-12 | Defense Grid | DELTA-08 **vagy** FORGE-17 teljesítése |
| PRIME-00 | Capital Perimeter | VANGUARD-12 teljesítése |

ALPHA → DELTA / FORGE → VANGUARD → PRIME. A két ág nem zárja ki egymást;
a kihagyott ág később is bejárható. Mind az öt szektor beleszámít a teljesített/összes
haladásba. PRIME biztosítása a művelet lezárása (akár 4/5 mellett), az 5/5 minden
szektor teljesítését jelenti; a térkép és replay mindkét esetben használható marad.

- [x] Összesen 5 játszható pont: ALPHA-01, DELTA-08, FORGE-17, VANGUARD-12, PRIME-00.
- [x] DELTA-08 / Crystal Basin és VANGUARD-12 / Defense Grid nevei véglegesek ehhez a csomaghoz;
  DELTA-03 és GRID-09 nem új alias vagy további szektor.
- [x] Szabad ágbejárás, OR feloldás; nincs végleges ágkizárás.
- [x] Nincs extra kampánybónusz vagy +1 Smart Aim; a meglévő harci és győzelmi XP marad.
- [x] Részletes profiljavaslat dokumentálva: geometria, vizuális paletta, járhatóság,
  ALPHA regresszió és elfogadási próbák a
  [C3 csataprofil-tervben](./gameplay-progression.md#1010-c3-csataprofilok--részletes-tervezési-javaslat).
- [x] A profiljavaslat alapján C3 fejlesztés engedélyezve; balanszpróba továbbra is szükséges.
- [x] Öt valódi csatadefiníció: stabil ID, terepprofil és vizuális beállítás,
  alap fizikával; ALPHA változatlan, az új profilok a részletes terv paramétereit használják.
- [x] Körmentes gráf validálása, elfogadott OR feltétel, elérhető végpont és szabad ágbejárás.
- [x] Teljesített/elérhető/zárolt állapot levezetése; aktuális kijelölés külön kiemelés.
- [x] Kampánymentés bővítése szektor-ID alapú teljesítésekre; v1 `completed: true`
  migrációja csak ALPHA-01 teljesítésére, XP/szintek elvesztése nélkül.
- [x] Aktív csata szektor-ID-ja vezérli a teljesítést, briefinget, HUD-ot
  és eredményt; főmenü az elérhető kiválasztott/következő műveletet mutatja;
  a visszavágó ugyanazt a szektort indítja.
- [x] Kampányvége PRIME-nál, korábbi és kihagyott csaták replay-e; „új útvonal”
  csak újonnan elérhető pont esetén, replay győzelemkor ne legyen ál-feloldás.
- [x] Idempotens szektorteljesítés, mentési hibajelzés és újratöltés/reset tesztje.
  Extra bónusz hiányában XP+haladás jutalomtranzakció/ledger nem része a C3-nak.
- [x] Gyorscsata és online alapkonfiguráció változatlan; kampányfeloldás nem kapuzza a PvP-t.
- [x] Elfogadás: új mentés 0/5; ALPHA után két elérhető ág; bármelyik után VANGUARD;
  PRIME után műveletzárás; másik ág utólag teljesíthető, végül 5/5.
- [x] 100 seed/profil: determinisztikus, tükrözött, járható terep; ALPHA pontos regresszió.
  Alap/max stat kezdőmozgás és csőhelyzet, közeledés utáni találó lövések mindkét oldalról.
- [x] Böngészős teljes csatakör és mentés-visszatöltés; négy mobil/asztali viewporton
  nincs horizontális túlcsordulás vagy átfedő térképpont, gombmagasság legalább 64 px.
- [ ] Valós telefonos és képernyőolvasós C3 próba.
- [ ] Játékpróba: az útvonalválasztás érdemi, nem csak ágas rajz?

### C4 – Változatos csaták és opcionális polish

Függőség: C3 és a 3. pont további közös szabály-/modifikátoralapjai.

- [ ] A C3-ban elkészült terepprofilok további taktikai finomhangolása; a részletes
  profiljavaslat öt külön profilt tervez, a korábbi háromprofilos példa nem követelmény.
- [ ] Valós nehézség, gravitáció/szél, tereptípus és jutalom a kártyán.
- [ ] Kontrollált kampány-AI policy; a nehézség ne függjön észrevétlenül korábbi gyorscsatáktól.
- [ ] Közös fizika ellenőrzése lövedék/előnézet/Smart Aim/AI célzás és mozgástervezés esetén.
- [ ] Opcionális hu/en/de TTS: mute/voice kapcsoló, kijelölési bemondás, elavult beszéd törlése.
- [ ] Opcionális útvonalimpulzus/Pixi dekoráció a szabályoktól függetlenül, reduced-motionnel.
- [ ] Mobilon ne térjen vissza a harcteret takaró nagy konzol/részletpanel.

## 3. Sector Operations MVP – közös pálya- és szabályalap

Függőség: C1+C2 Foundation és a konfigurációs döntések. A minimális katalógus és
meccskontextus már a Foundation része. A valódi több-szektoros katalógus és
terep-/vizuális konfiguráció C3-at támogató része előre kerül.
A korábbi háromszektoros javaslatot az elfogadott ötcsomópontos C3 váltja fel;
a két modifikátor és az online szektorválasztás külön későbbi bővítés.

### Döntési kapuk

- [x] Az alap mellé DELTA-08, FORGE-17, VANGUARD-12 és PRIME-00 az első tartalmi csomag.
- [x] A C3 négy új terepprofilja és vizuális eltérése a részletes javaslat alapján bekötve.
- [ ] Meghatározni a két későbbi környezeti hatást (nem C3 előfeltétel).
- [x] Kampányban teljesítésalapú hozzáférés, az elfogadott C3 gráf szerint; nincs XP-belépődíj.
- [ ] Eldönteni az online pályahozzáférést úgy, hogy a host választása mindkét félnek használható legyen.
- [ ] Rögzíteni a szabályverziót, legacy online meccsek kezelését és a visszavágó pályaválasztását.

### Implementáció – a döntések után

- [x] Szektorkatalógus: stabil ID, név, leírás, terepprofil, vizuális beállítások.
- [ ] Közös, verziózott meccskonfiguráció és explicit hibák ismeretlen konfigurációnál.
- [ ] Offline választó és online host választása, lobby-előnézet, közös setup és replay.
- [x] Kampányszektor bekötése a főmenübe, briefingbe és HUD-ba; gyorscsata/online ALPHA.
- [x] Szektorfüggő terep és háttér; vizuális és játékmeneti véletlensorozatok elkülönítése.
- [ ] Közös környezeti szabályfeloldás: tényleges lövedék, előnézet, Smart Aim és AI.
- [ ] Hatások logikai körhatárokon, nem UI-időzítővel.
- [ ] Modifikátor-leírás választáskor és aktív hatás a briefingben/HUD-ban.
- [ ] Feloldás esetén profiladatok, migráció és mentés-visszatöltés.
- [ ] Régi alapkonfiguráció fizikai regressziótesztje.
- [ ] Két klienses, duplikált/darabolt eseményes és újracsatlakozási tesztek.
- [ ] Kezdőpozíciók, mozgás és találati lehetőségek ellenőrzése minden szektoron,
  alap- és maximális fejlesztésekkel, emberrel és AI-val.
- [ ] Játékpróba: az öt szektor ténylegesen eltérő döntésekre ösztönöz-e?

## 4. Orbitális támogatás – az MVP után, tervezési kapuval

Függőség: a közös meccskonfiguráció és környezeti szabályok.

- [ ] Elkülöníteni az Orbital Scan szerepét a Smart Aimtől.
- [ ] Eldönteni a slotok számát, tölteteket, célzást és akcióköltséget; kiváltja-e a lövést?
- [ ] Első képességcsomag kiválasztása: scan, drone, pajzsprojekció, supply drop vagy kinetic strike.
- [ ] Horizontális XP-feloldás és korábbi XP-egyenlegek kezelése, korlátlan erőelőny nélkül.
- [ ] Közös képességakció, backend-eseményvalidálás, determinisztikus replay.
- [ ] HUD/célzás/visszajelzés és AI képességválasztás.
- [ ] Balansz-, mentési és multiplayer-regressziótesztek.

## 4A. Választható lövedékek – megvalósíthatósági javaslat

**Státusz:** tervezési javaslat, még nem elfogadott roadmap-prioritás. A körökre
osztott játékmenethez jól illeszkedik: a játékos a lövés előtt választ típust,
majd a lövés a jelenlegi célzási és repülési fázisban oldódik fel. Külön
fegyverváltó kör vagy valós idejű célkövetés nem szükséges.

**Megvalósíthatóság: közepes, a jelenlegi engine megtartható.** A Game jelenleg
egyetlen lövedéket indít, majd becsapódáskor ugyanazt a robbanás-/tereprombolás-
folyamatot futtatja; az AI és a replay is ezt a szabályt modellezi. Az online
`fire` esemény most csak szöget és erőt visz át, a szerver pedig általános
JSON-eseményt tárol, nem szimulálja a harcot. Ezért a fegyverazonosító és a
fegyverspecifikus becsapódás-feloldás mindhárom kliensoldali útvonalon
(Game, AI-szimuláció, headless replay) azonos szabályból kell származzon.

### Döntési kapuk

- [x] Haladási modell: a játékos egy alapfegyverrel indul, a további fegyvereket
  XP-ért tartósan feloldhatja. Az MVP-ben a feloldott fegyverek lövésenként
  szabadon választhatók, nincs külön fogyó lőszer.
- [x] Fegyverkészlet-tulajdonlás: minden játékos a saját profillal feloldott
  fegyvereit viszi, offline, online és kampánytérképes meccsen egyaránt; nincs
  lobby-közös készlet. A meccssetup/snapshot rögzítse a használható ID-ket,
  hogy a készlet replay és visszavágó alatt ne változhasson.
- [x] **Robbanófej** upgrade: marad a fegyverfeloldásoktól különálló,
  kompatibilis sebzésfejlesztés. Az első fegyvercsomag rögzíti, mely
  fegyverosztályokra hat; a feloldás külön, stabil fegyver-ID-hoz kötött
  profiladat.
- [x] Fegyverenkénti XP-fejlesztés: nem része az MVP-nek. Később csak az kapjon
  fegyver-specifikus fejlesztést, amely új taktikai döntést ad (pl. AP-átütés,
  HE-sugár vagy Smart Missile-irányítás); a Robbanófej nem kerül automatikusan
  eltérő energiafegyverekre.
- [x] Fegyverenként eltérő alapértékek és hatások: egyedi sebzés, robbanási
  sugár, terephatás, valamint páncél-/pajzskölcsönhatás. Ezek adják a fegyverek
  közti taktikai változatosságot és a játékos fejlődésének új irányait; nem
  igényelnek automatikusan fegyverenként külön XP-fejlesztési ágat. Az Armor
  Piercing közvetlen találatot igényel; az átütés pontos szabálya és a
  fegyverenkénti számértékek balanszdöntést igényelnek.
- [x] Smart Missile elérhetetlen célpontja: ha a választott cél a beállított
  lövési erővel nem érhető el, a rakéta nem kap automatikus erőnövelést vagy
  garantált találatot; az addigi pályanyomvonal szerint halad tovább, majd
  annak megfelelően lehull/megsemmisül.
- [ ] Meghatározni a Smart Missile célfelvételi sugarát, fordulási korlátját,
  célpontválasztását és a fix lépésű, determinisztikus végfázisú korrekciót.
  Több lehetséges célpont esetén stabil ID szerinti döntés kell; a nem elérhető
  célpontra vonatkozó elfogadott szabály változatlanul hagyandó.
- [x] Seismic Charge: az HE-től elkülönülő, nagyobb tereprombolású,
  mérsékeltebb egységsebzésű hatás; késleltetett körhatás nélkül.
- [x] Közös fegyverkatalógus: minden játékos ugyanazokat a fegyver-ID-ket és
  definíciókat ismeri; az ismeretlen fegyver nem választható. A választó csak
  az adott játékos feloldott fegyvereit kínálja fel, offline és online is.
- [ ] Az online meccs szabály-/katalógusverzióját rögzíteni; eltérő vagy
  inkompatibilis verzió explicit hibát adjon, ne használjon csendes fallbacket.

### Javasolt végrehajtási lépések

- [ ] Típusos, stabil ID-jű `WeaponDefinition` katalógus és közös tiszta
  lövés-/becsapódás-szabályfeloldó; a szög, erő és fegyverazonosító a lövés
  paramétere legyen. A jelenlegi értékekkel a Standard Shell karakterizációs
  tesztje bizonyítsa a változatlan alapviselkedést.
- [ ] Első fegyvercsomag (4–5 típus, kiegyensúlyozva és XP-vel feloldható):
  **Standard Shell** (kezdő, jelenlegi viselkedés), **High Explosive** (nagyobb
  robbanási sugár, kisebb közvetlen sebzés), **Armor Piercing** (közvetlen
  találat, szűk hatás és páncélszabály), **Seismic Charge** (elsősorban
  tereprombolás), opcionálisan **Smart Missile** (végfázisú célkövetés).
  Az XP-költség és a feloldási sorrend balanszdöntés; a teljes csomag ne
  váljon automatikusan elérhetővé a kezdőprofilnak.
- [ ] A **Robbanófej** sebzés-upgrade, az új **High Explosive** fegyver és a
  későbbi fegyver-specifikus fejlesztések külön fogalmak/profiladatok legyenek.
  A meglévő Robbanófej-szintek kompatibilitása maradjon meg.
- [ ] Az első fegyvercsomag balanszánál ellenőrizni, hogy a közös Robbanófej
  fejlesztés mely fegyverekre érvényes; ne okozzon rejtett, nem szándékolt
  szorzóhalmozást az egyedi fegyverhatásokkal.
- [ ] A kezdőcsomag után külön fegyvernemként tervezni az energiafegyvereket:
  például lézerágyú/lézerfegyver (egyenes vagy hitscan), energiasokkoló
  (közeli hatás), energiagömb (lassú, területi lövedék) és villámcsapás
  (célpont-/lánchatás). Ezek nem részei az első lövedék-MVP-nek: eltérő
  célzási, találati, animációs és multiplayer-szabályt igényelnek.
- [ ] Az AP/HE/Seismic eltérő sebzés-/hatásszabályait, közvetlen tanktalálatot
  és terepütközést külön kezelni; sérülés és tereprombolás célzott tesztjei.
- [ ] Smart Missile csak a célfelvételi döntések után;
  az irányítás fix `dt`-vel, rendereléstől függetlenül és seedfogyasztás nélkül
  működjön. Elérhetetlen célpontnál a rakéta az addigi pályán marad, nem kap
  találati korrekciót. A pályaelhagyás, terepütközés és önsebzés szabálya legyen
  közös és determinisztikus.
- [ ] Fegyverfeloldások tárolása és migrációja a profilban; offline, online és
  kampánytérképes meccs egyaránt a játékos saját feloldott készletét használja.
  A meccssetup/snapshot rögzítse ezt a készletet, és az újrajátszás ugyanazt
  alkalmazza. A lövésnél a fegyver-ID szerepeljen a közös katalógusban, és
  tartozzon a lövő feloldott készletéhez; ettől eltérő ID-t explicit el kell
  utasítani, nem szabad másik fegyverre visszaesni.
- [ ] Játékmotor, röppálya-előnézet/Smart Aim és AI ugyanazt a fegyverdefiníciót
  és becsapódás-szabályt használja; ne legyen külön, eltérő AI- vagy preview-fizika.
- [ ] HUD-választó a meglévő célzási vezérlők mellé: billentyűzet, érintés,
  fókusz/akadálymentes címkék, hu/en/de fordítás, zárolás lövedékrepülés alatt.
  Lövés előtt a kiválasztott fegyver és releváns hatás legyen érthető.
- [ ] AI értékelje a fegyvereket várható sebzés, találati esély és saját
  kockázat alapján; azonos helyzetben és seed mellett legyen determinisztikus.
- [ ] A `fire` esemény tartalmazzon stabil `weaponId`-t; mindkét kliens azonosan
  validálja és alkalmazza. A régi, azonosító nélküli replay-esemény Standard
  lövedéket jelentsen; új, ismeretlen ID ne essen vissza Standardra.
- [ ] Replay-, kétklienses, darabolt/duplikált esemény- és újracsatlakozási
  teszt: azonos setup + eseménynapló azonos egységállapotot és terepet adjon.
  A headless replay ne csak saját magával, hanem a megosztott szabálymaggal
  egyezzen.
- [ ] Balanszpróba: minden fegyvernek legyen helyzeti előnye, de ne legyen
  domináns választás; ellenőrzés alap és fejlesztett statokkal, ember és AI ellen.

**Becsült MVP:** 10–16 nettó fejlesztői nap a tartós XP-feloldással és annak
profil-/snapshot-integrációjával; a véges lőszer, szerveroldali harcszimuláció
és új hálózati infrastruktúra nincs benne. Ez tartalmazza az első 4–5 típus
alapviselkedését, célzott UI-t, AI-, replay- és multiplayer-bekötést; a hosszas
balansziteráció és végleges VFX/hang nincs benne.
Az API jelenleg általános eseményeket tárol, így az eseménybővítés önmagában
kicsi, de a kliensek szabályazonossága és verzió-kompatibilitása elfogadási kapu.
Az egyes fegyverek saját fejlesztési ágai nem részei ennek a becslésnek: a jelenlegi
upgrade-rendszer közvetlenül közös `TankStats` értékeket módosít, ezért az egyedi
fegyverfejlesztésekhez külön, profilban mentett és online snapshotba kerülő
fegyver-szintű fejlesztési adatok és UI szükséges.

## 5. Egységosztályok – a taktikai alapok után

- [ ] Két első szárazföldi variáns erőssége/gyengesége, nem egyértelműen jobb utód.
- [ ] Stat-, fegyver- és prezentációs konfiguráció, meglévő fejlesztések érvényessége.
- [ ] Osztályválasztás, mentés, online snapshot és AI-stratégia.
- [ ] Minden szektor/osztály/modifikátor kombináció játékpróbája.
- [ ] Hover/orbitális mozgás csak külön fizikai és ütközési specifikáció után.

## 6. Hosszú távú single player

Függőség: változatos szektorok és taktikai összeállítások. A 2. pont egyszerű
útvonaltérképe ennél korábban készülhet el. Ez a teljes stratégiai hadjárat
határa; a 6A következménypróbájának nem előfeltétele.

- [ ] Szektorfoglalás: célpontok, küldetésfeltételek, jutalmak, menthető hadjárat.
- [ ] Stratégiai AI-követelmények elkülönítése a meglévő harci AI-tól.
- [ ] Roguelite: elágazó útvonalak, kockázat/jutalom, külön run- és tartós profilállapot.
- [ ] Prestige csak opcionális kihívásként, külön döntés után.
- [ ] Közös online kampány csak külön backend-/tulajdon-/eredményhitelesítési specifikáció után.

## 6A. Következményes ostromhadjárat – első játszható próba

**Státusz:** elfogadott Phase 1 MVP-specifikáció, még nincs implementálva.
Kampánytérképes következményrendszer két stratégiai objektumtípussal és egy
kezdeti kampányhatás-példával. A három küldetés csak lehetséges bemutató,
nem rögzített MVP-terjedelem; a küldetések lehetnek opcionálisak vagy
kulcsfontosságúak. A sima offline gyorscsata nem része ennek a rendszernek.
Részletes alapelvek és hatókör:
[gameplay-terv, 11. fejezet](./gameplay-progression.md#11-következményes-ostromhadjárat).

### Eddig feloldott tervezési döntések

- [x] Első próba: Campaign térkép, kis elágazású kampány, galaktikus
  kormányzó fennhatósága, ellenséges megszállás alatt álló szektorok
  felszabadítása.
- [x] A három küldetés csak példa, nem kötelező küldetésszám vagy lineáris
  sorrend. A kampányban lehetnek kihagyható és kulcsfontosságú küldetések.
- [x] Az opcionális küldetés jutalmat vagy előnyt ad, de kihagyása nem
  akadályozhatja a kulcsfontosságú felszabadítási küldetést.
- [x] Az első próba opcionális küldetésének jutalma felderítési információ;
  megmutatja, melyik megszállt szektor a kampány kulcscélja és milyen
  alternatív szektorok választhatók.
- [x] Első térképszelet: az `ALPHA-01` tréning marad; utána opcionális
  felderítő művelet és a `DELTA-08`/`FORGE-17` megszállt célágai választhatók.
  A `FORGE-17` a rejtett kulcsszektor; felszabadítása továbbviszi a fő célt
  és megnyitja a `VANGUARD-12`-t. A `DELTA-08` felszabadítása helyi eredmény,
  de a `FORGE-17` később is elérhető. A `PRIME-00` második kötelező,
  védendő létesítményes szektor, győzelme a kampányzárás.
- [x] Felderítés nélkül is választhatók a megszállt szektorok; csak a
  kulcsszektor halad a fő céllal, más szektor helyi eredményt ad, és a
  kulcscél később sem záródik el.
- [x] A szabály csak a Campaign módra vonatkozik; sima offline gyorscsatára nem.
- [x] Az AI/ellenfél által okozott objektumrombolás nem csökkenti a játékos
  szerződéses teljesítését; külön AI-sebzésnapló Phase 1-ben nem cél.
- [x] A szerződésszázalék súlyozott és folyamatos: a fő cél és a védett
  objektumok küldetésenként külön súlyt kapnak; a fő cél pontját a
  játékos-sebzés aránya, a védett objektumok pontját a játékos okozta
  HP-vesztés lineárisan határozza meg.
- [x] A szerződéssúlyokat az adott küldetés tartalma határozza meg; nincs
  minden küldetésre kötelező globális százalékfelosztás.
- [x] Az `ENERGY_NODE` fizikai végállapota a következő kapcsolódó kulcscsatában
  a P1 maximális energiapajzsát módosítja: ép +10%, sérült 0%,
  megsemmisült −10%. A tank a módosított maximumon indul, és eddig
  regenerálódik; az alap a P1 fejlesztésekkel számolt aktuális
  `maxEnergyShield`. Ennél a kampányhatásnál az AI/ellenfél által okozott
  pusztítás is számít, de nem csökkenti a szerződéspontot és nem fogyasztja
  a játékos kárkeretét.
- [x] A védett objektum szerződéses súlya lineárisan csökken a játékos által
  okozott HP-vesztéssel; az AI fizikai sebzése nem csökkenti a szerződéspontot.
- [x] Az első felszabadítási próba fő célja ad részpontot a megszálló
  ostromplatformon elért játékos-sebzés aránya alapján; a szektor csak az
  ellenség megsemmisítésekor szabadul fel.
- [x] Vereség vagy döntetlen esetén is mentődik az objektumok fizikai
  végállapota és a játékos okozta, kampánykárkeretbe számító kár; a szektor
  nem szabadul fel. Az eredményképernyőn látható szerződéspont előzetes;
  szerződéses jutalom nem jár, amíg a küldetés végleg le nem zárul.
  Újrapróbáláskor ezek az állapotok megmaradnak, a játékos szerződéses kára
  és pontja a próbálkozások között összeadódik.
- [x] A csata kifejezett elhagyása vereségnek számít: az objektumállapot és
  játékos-kárkeret commitolódik, nincs kampányelőrelépés; az eredmény
  előzetes pontot mutat, szerződéses jutalom nem kerül kifizetésre.
- [x] A kredit- és szerződéses XP-jutalom csak a küldetés végleges
  lezárásakor, az összes próbálkozásból számolt végső pont alapján jár, és
  szerződésenként egyszer számolható el. A csatánkénti állapotmentés
  meccsazonosítót, a jutalomelszámolás kampányküldetés-/szerződésazonosítót
  használ az ismételt eseményekből eredő duplikáció ellen.
- [x] Az első kulcsküldetésben az `ENERGY_NODE` és `CIVIL_HABITAT` is
  védett szerződéses objektum, külön súllyal.
- [x] A `FORGE-17` felszabadításakor az ostromplatform megsemmisítése az
  elsődleges cél, az `ENERGY_NODE` és `CIVIL_HABITAT` védett objektum;
  súlyok: platform 50%, energiaobjektum 25%, civil objektum 25%. Ez csak
  ennek a küldetésnek a szerződése, nem globális alapérték.
- [x] A robbanás közép/közeli/távoli 100/50/25%-os értékei az adott robbanás
  alap-sebzésének arányai, közvetlenül az objektum HP-jából vonódnak le;
  az ismételt robbanások összeadódnak.
- [x] Az első próbában az `ENERGY_NODE` és `CIVIL_HABITAT` maximális HP-ja
  egyaránt 100; a stratégiai fontosságukat a küldetés súlyai különböztetik meg.
- [x] A közép/közeli/távoli zónákat az adott robbanás effektív sebzési
  sugarához viszonyítjuk; így a zónák a különböző fegyverekhez skálázódnak.
- [x] A zónák egyenlő harmadokra oszlanak: közép `0–R/3`, közeli
  `R/3–2R/3`, távoli `2R/3–R`, azon kívül nincs objektumsebzés; a határértékek
  egyértelmű intervallumokkal tesztelendők.
- [x] Phase 1-ben a szerződéses kredit csak a szerződésben és az
  eredményjelentésben jelenik meg; nincs elkölthető kredit-egyenleg vagy bolt.
  Kampányegyenleg későbbi bővítésként tervezhető.
- [x] A szerződéses kredit- és XP-jutalom lineárisan arányos a 0–100%-os
  szerződésponttal; 0%-nál nincs szerződéses jutalom. A harci XP ettől külön
  számolódik.
- [x] A fő cél pontja a játékos sebzésének aránya; a védett objektumok pontja
  a játékos által okozott HP-vesztéssel lineárisan csökken. Az AI kára nem
  csökkenti a szerződéspontot.
- [x] A játékos által okozott objektumkár kampányszinten, bolygókon/
  küldetéseken át összeadódik; az AI/ellenfél kára nem számít bele.
- [x] A túl nagy összesített játékoskár meghiúsíthatja a fő kampánycélt és
  lezárhatja az adott kampányt; lehetséges csökkentett jutalom. Később egy
  hasonló, külön kampányban újra megpróbálható. Az első kampány küszöbe 1,5
  súlyozott objektum-egység.
- [x] A kampánykudarcot egy összesített, kampányon át fogyó járulékos
  kárkeret átlépése váltja ki, nem egyetlen objektum megsemmisítése.
- [x] A kárkeret az objektumonként elvesztett HP arányát az adott objektum
  fontossági súlyával szorozva számolja; az első próbában mindkét
  objektumtípus súlya 1.
- [x] A kárkeret kampányspecifikus; nem globális konstans.
- [x] Az első kampány kárkerete 1,5 súlyozott objektum-egység; a keret
  elérése vagy átlépése lezárja a kampányt. Egy objektum teljes elvesztése
  önmagában nem meríti ki.
- [x] Alapértelmezésben a teljes és hátralévő kárkeret látszik; ha játékpróbán
  túlzsúfolt, a megjelenítés egyszerűsíthető minőségi kockázatjelzésre.
- [x] A következményrendszer a jelenlegi Campaign Map/C3 fokozatos bővítése,
  nem külön kampánymód; a régi C3-teljesítés megmarad, de nem értelmezhető
  visszamenőlegesen objektumkárként.
- [x] A kampányreset törli az aktuális kampány küldetés-/felderítési
  állapotát, objektumkimeneteit és kárkeretét, de megtartja az XP-profilt és
  fejlesztéseket; a teljes mentéstörlés külön marad.

### Döntési kapuk – az érintett implementációs lépés előtt

- [ ] Meghatározni a `FORGE-17` szerződésének alap kredit- és XP-jutalmát.
  Ez a jutalmazás bekötésének kapuja, nem az alapozásé.
  Más kampányküldetések saját elsődleges célt és súlyokat kaphatnak.
- [x] Kiválasztani a két objektum pontos helyét és méretét, valamint
  rögzíteni a terepfelszínre illesztés szabályát a kampánytartalomban.
  A konkrét épületmegjelenés és az esetleges további civil/ipari típusok
  az érintett lépésnél döntendők el; nincs szükség előzetes teljes épületkatalógusra.
- [x] Az első épületmegjelenés egyszerű rajzolt prototípus: kék reaktor és
  fehér kupolás civil telep, HP-csíkkal.
- [x] A fix első elhelyezést seedelt elrendezés váltotta fel `FORGE-17` és
  `PRIME-00` szektorban: reaktor 48×44, civil telep 64×32 világpixel.
  FORGE X-helyei 380/540/720/900/1020, PRIME X-helyei 340/500/680/860/1000;
  új csatánként két külön helyet választunk, újrapróbáláskor is.
  Azonos seed azonos elrendezést ad, ismétlődés lehetséges.
  A talppont a középső X terepfelszíne (`surfaceY`), a rövid alapzat a
  lábnyom alatti egyenetlenséget követi, terepátalakítás nélkül. Robbanáskor
  a sebzés a rombolás előtti épületközéppont távolságából számolódik;
  utána az épület a megváltozott felszínhez igazodik, esési sebzés nélkül.
- [x] A megsemmisült objektum többé nem sebezhető, a maradék HP-t és
  játékoskárt a további robbanás nem módosítja.

### Végrehajtás és függőségek

- [x] **O1 logikai alap (2026-11-07):** `strategicObjectives.ts` tartalmazza
  a két objektumtípust, a 100 HP-s kezdőállapotot, a háromállapotú besorolást,
  a robbanás harmadolt sebzési zónáit, a tényleges HP-vesztésre korlátozott
  játékoskár-követést és a fejlesztett maximumból számolt pajzshatást.
  Az AI-sebzés csak a fizikai HP-t csökkenti.
- [x] **O1 – Stratégiai objektumok:** `ENERGY_NODE` és `CIVIL_HABITAT` adatok,
  háromállapotú HP-modell (70–100% ép, 20–69% sérült, 0–19% megsemmisült),
  terepfelszínhez illesztés, felismerhető pályabeli jelölés és HP-/állapotjelzés.
- [x] O1: csak a meglévő robbanás sebzi az objektumot; közvetlen lövedéktalálat
  nem. A 100/50/25% az alap-sebzés aránya, az ismételt robbanás összeadódik.
  A zónák egyenlő harmadokra osztják az effektív sebzési sugarat.
  A robbanáskezelés legyen determinisztikus; a szerződéshez csak a
  játékosnak tulajdonítható sebzést kell követni. AI-forrású kár ne adjon
  küldetésteljesítési levonást; külön AI-sebzésnapló Phase 1-ben nem cél.
- [x] O1: a sérült állapot szikrával/villódzással/füsttel, a megsemmisült
  roncsállapottal különbözzön; az animáció ne módosítsa a logikai állapotot.
  Reduced-motion mellett a repedés és füst statikus.
- [x] **O1 pályabeli próba:** a két épület a `FORGE-17` és `PRIME-00` Campaign
  csatában jelenik meg; a HUD hu/en/de névvel, állapottal és HP-val jelzi.
  A hadműveleti konzol külön naplózza a tényleges HP-vesztést és a
  megsemmisülést, az okozóval (játékos vagy AI); romokra nem ismétel
  káreseményt. A szöveges épületjelentés nem szakítja meg a harci bemondást.
  A térképi kártya és briefing egyértelművé teszi, hogy a kampánykár-mentés
  és szerződéses jutalmazás még nincs bekötve. Új csatában az objektumok
  jelenleg újra 100 HP-val indulnak; ez átmeneti, nem az O2 célviselkedése.
  Böngészőben asztali és mobil fekvő nézet ellenőrizve.
- [x] Kampánycél a térkép fejléce alatt: szektoronkénti felszabadítás,
  a létesítmények lehető legkisebb sérülése. FORGE nyitja VANGUARD-ot,
  PRIME győzelme zárja a kampányt, DELTA kihagyható. Mentési tartalomverzió
  1→2 migráció megőrzi a régi OR-útvonal teljesítéseit, nem talál ki épületkárt;
  újonnan VANGUARD csak FORGE után érhető el.
- [ ] O1: hu/en/de briefing és jelölés közölje a védendő objektumokat,
  a szerződést és a kockáztatott jutalmat; mobilon is olvasható legyen,
  ne csak színnel különböztessen meg.
- [ ] **O2 – Kampányküldetés és következménylánc:** a katonai győzelem maradjon
  ellenfél-megsemmisítés alapú; a szerződés súlyozott, folyamatos eredménye
  különüljön el, és a játékos által okozott károk kampányszinten adódjanak
  össze. A kampánytérkép kezelje a választható/átugorható, illetve
  kulcsfontosságú küldetéseket és a kampánykudarc lezárását.
- [ ] O2: a kampányállapot mentse a küldetés eredményeit és
  `strategicOutcomes` adatát, valamint az adott kampányban releváns következő
  kulcscsata pajzshatását. A tényleges `ENERGY_NODE` végállapot
  határozza meg a +10%/0%/−10% maximális energiapajzs-módosítást, a
  fejlesztésekkel számolt P1-értékhez képest.
- [ ] O2: C3 mentésmigráció és validáció mellett a korábbi teljesítés és XP-profil
  maradjon érintetlen; az új következményadat a meglévő Campaign rendszerhez
  adódjon hozzá, pixelterepet ne mentsünk. Gyorscsatában ne fusson.
- [ ] O2: a csatánkénti állapotmentés meccsazonosítóhoz, a végleges
  szerződésjutalom kampányküldetés-/szerződésazonosítóhoz kötött és idempotens
  legyen reload, remount, ismételt esemény vagy újrapróbálás esetén.
- [ ] **O3 – Érthető elszámolás:** ResultScreen-jelentés mutassa külön a
  Victory/Defeat eredményt, szerződésszázalékot, védett objektumállapotokat,
  játékosnak tulajdonítható objektumkárt, kredit-/XP-jutalmat és a következő
  kulcscsata maximális energiapajzs-módosítását.
- [ ] **O4 – Játékpróba és döntés:** ellenőrizni, hogy a játékos megnyerheti
  a csatát részleges vagy teljes szerződésbukással; a kampánykudarc a
  meghatározott küszöbnél valóban lezárja az adott kampányt, miközben később
  új kampányban újrapróbálható.

### Tesztek és elfogadás

- [ ] Objektumállapot-tesztek a küszöbök határán: 70%, 69%, 20%, 19%, 0%;
  robbanási zónák `R/3`, `2R/3`, `R` határain, halmozódó sebzés és azonos
  seed/eseménysor determinisztikussága.
- [ ] A játékos által okozott objektumkár módosítja a szerződés eredményét;
  az AI/ellenfél okozta kár nem csökkenti a játékos teljesítését.
- [ ] Mindhárom `ENERGY_NODE` állapot a megfelelő +10%/0%/−10%
  maximális energiapajzs-módosítást adja a következő kulcscsatában; a tank
  az új maximumon indul és eddig regenerálódik. AI-pusztítás módosíthatja
  ezt a hatást, de nem csökkentheti a szerződéspontot vagy a játékos
  kárkeretét. Gyorscsatában nincs ilyen következmény.
- [ ] Victory mellett is lehet részleges vagy 0%-os szerződéses eredmény;
  az elszámolás és a kredit-/XP-jutalom a rögzített képletet követi.
- [ ] A több küldetésből/bolygóról összegyűlt játékoskár 1,5 súlyozott
  objektum-egység elérésekor/átlépésekor lezárja az aktuális kampányt;
  az AI/ellenfél rombolása nem számít bele,
  és a kudarc lehetséges csökkentett jutalma egyszer számolódik el.
- [ ] Vereségnél, döntetlennél és elhagyáskor a kampány objektumállapota/
  kárkerete megmarad, de nem szabadul fel a szektor; az újrapróbálás nem
  resetelheti vagy duplázhatja a korábbi elszámolást.
- [ ] Mentés-visszatöltés, reload/remount, duplikált eredmény, elhagyás,
  újrapróbálás és reset nem dupláz jutalmat vagy kampányhatást, és nem sérti
  a régi C3 mentést.
- [ ] Gyorscsata/hot-seat/online regresszió, campaign AI, mobil olvashatóság,
  valamint a kampányállapot megszakítás utáni folytatása és a kihagyható/
  kulcsfontosságú küldetések helyes kezelése.
- [ ] A játékos előre érti a szerződés tétjét, és legalább két észszerű
  taktikai megoldást talál; különben balansz/design iteráció következik.

## 6B. Kampánycélok – nyersanyag- és technológiaalapú fejlődés

**Státusz:** 2026-11-09-én rögzített hosszú távú designirány, még nem
implementációs specifikáció. A nyersanyag–technológia lépcsők/mátrix
megalkotása későbbi feladat, nem a 6A próba előfeltétele.

### Rögzített alapelvek

- A kampányok célja lehet XP, nyersanyag vagy technológia megszerzése.
- A szektorok között nincs teljesítésalapú függőség vagy kötelező útvonal:
  a játékos a céljaihoz szükséges jutalmak alapján választ szektort.
- A nyersanyagok és technológiák fejlesztési előfeltételek. A legtöbb
  érintett technológia a szükséges előfeltételek nélkül nem érhető el;
  az XP önmagában nem helyettesíti ezeket.
- A szektorszabadság és a technológiai függőség külön fogalom: a fejlődés
  sorrendjét a megszerzendő nyersanyagok és technológiák adják, nem egy
  kötelező szektorlánc.
- Elméleti példa: uránbányászat nélkül nincs atommeghajtású csapatszállító
  űrhajó vagy atomerőmű. Ez szemléltetés, nem elfogadott egység-/épületlista
  és nem kész technológiai recept.

A jelenlegi C3 feloldási gráf és a 6A kulcsküldetés-lánc a korábbi csomagok
szabálya marad, amíg külön átállási terv nem készül. Az új irány bevezetésekor
ezeket felül kell vizsgálni; a meglévő mentések és teljesítések kezelése
explicit döntést igényel.

### Későbbi tervezési feladatok

Az alábbiak a teljes későbbi rendszer feladatai. A VEYLORA első szeletére
elfogadott konkrét szabályokat a 6C rögzíti; azokat nem kell újra eldönteni.

- [ ] Megalkotni a nyersanyag–technológia lépcsőket/mátrixot, és megadni,
  mely fejlesztésekhez milyen nyersanyag és technológia szükséges.
- [ ] Eldönteni, mit jelent a nyersanyag megszerzése: egyszeri készlet,
  tartós kitermelési hozzáférés vagy más modell; fejlesztéskor fogy-e.
- [ ] Meghatározni a technológiaszerzés, kutatás és XP szerepét, valamint
  az előfeltételek esetleges kivételeit.
- [ ] Megtervezni a szektoronkénti jutalmakat, az ismételt teljesítés
  elszámolását és a kampány-/tartós profilállapot határát.
- [ ] A régi C3/6A későbbi átállítása előtt megtervezni a szektorfüggőségek
  kivezetését, a kampányzárást és a haladás migrációját. A VEYLORA első
  szelete a régi tartalom mellett, annak átállítása nélkül készül.

## 6C. VEYLORA-03 – elfogadott fejlesztési alap

**Státusz:** 2026-11-09-én egyeztetett, elfogadott játékszabályok és
fejlesztési alap. A K1–K2 játszható alap és a K3–K4 gazdasági kör elkészült
az alább rögzített hatókörrel; távoli tartalomfrissítés még nincs.
A nyitott technikai és balanszfeladatok az
alábbi külön listában szerepelnek, nem további eldöntetlen alapszabályok.
Cél: a meglévő tartalom mellett
egy önállóan választható új szektorral kipróbálni a 6B irányát, teljes
gazdaság, technológiafa vagy új harci motor nélkül.

### Fogalmak és a jelenlegi alap

A kód jelenlegi `Sector` fogalma egyetlen csatát/harcteret ír le, nem
bolygók és állomások gyűjteményét. **2026-11-09: elfogadott tartalmi hierarchia:**
**szektor → helyszín (bolygó/állomás) → küldetés → harctér**.
A kampány ezeket szervezi össze. Az elfogadott első navigáció szektorválasztó,
helyszín-/küldetéskártyák és állomási készlet-/fejlesztésnézet;
nem szükséges minden szinthez külön képernyő.

| Meglévő alap | Újrahasználat és szükséges változás |
| --- | --- |
| [`sectors.ts`](../../src/game/data/sectors.ts) | Adatvezérelt terep, paletta, briefing és objektumelhelyezés már van. A jelenlegi definíciókat harctérként érdemes megtartani; az új szektor helyszínei ezekre hivatkoznak. |
| [`CampaignMap`](../../src/ui/CampaignMap.tsx) és [`CampaignSectorCard`](../../src/ui/CampaignSectorCard.tsx) | A kártyák és kiválasztás használhatók, de a képernyő most globális `SECTORS` listát, előfeltétel-vonalakat és fix PRIME kampányzárást használ. Ezeket aktív kampány-/szektorkontextusra kell átállítani. |
| [`campaignStore.ts`](../../src/game/state/campaignStore.ts) | Most egy kampány kijelölését és teljesített harctereit menti; több szektorhoz külön azonosított haladás és jutalomelszámolás szükséges. |
| [`Game.startCampaign`](../../src/game/engine/Game.ts) | A meglévő P1–AI csatakör megtartható. A belépésnek a küldetés kontextusát is rögzítenie kell; önmagában a harctér-ID nem azonosítja a jutalom jogosultját. |
| XP és profilmentés | A kampányteljesítés és az XP-profil most külön mentődik; erre nem szabad többkulcsos, atomikus jutalomtranzakcióként támaszkodni. |

**Megvalósíthatóság:** új felszíni harctér hozzáadása viszonylag kis munka;
a több helyszínes szektor, gazdaság és biztonságos jutalmazás közepes
összetettségű bővítés. A fizika, AI, terepgenerálás és Pixi-renderelés
megtartható. Űrcsata, űrhajómozgás vagy állomásbelső-harc már külön fejlesztés,
nem oldható meg pusztán konfigurációval.

### Elfogadott első tartalom: VEYLORA-03 / Mining Colony

A játékszabályok elfogadottak; a terep és az ellenfelek kezdőértékei
játékpróbával igazolandók. A részletes döntések alább szerepelnek.

| Helyszín | Szerep | Első próbában |
| --- | --- | --- |
| VEYLORA-A bolygó | Bányatelep biztosítása | Felszíni csata; az első sikeres teljesítésért 20 egység ipari érc. |
| VEYLORA-B bolygó | Kutatótelep felszabadítása | Felszíni csata; tankgyőzelem és legalább 20/100 kutatóépület-HP szükséges. Az első sikeres teljesítésért egy anyagtechnológiai tervrajz. |
| VEYLORA állomás | Logisztikai/kutatási központ | Kezdetben nem harci helyszín: készlet, megszerzett technológia és egy fejlesztési recept megjelenítése. |

- Az új szektor és mindkét felszíni küldetés a jelenlegi tartalom
  teljesítésétől és egymástól függetlenül választható.
- A harci és győzelmi XP marad a meglévő szabály szerint, újrajátszáskor is;
  nincs külön kampány-XP-bónusz. Kreditgazdaság nem része az első szeletnek.
- Az első recept: **20 ipari érc + anyagtechnológiai
  tervrajz megléte → Megerősített pajzs**. Így a két küldetés sorrendje szabad,
  de a fejlesztéshez mindkét eredmény kell. Ez még nem a teljes mátrix.
- Az érc fogyó készlet, a tervrajz tartós, nem fogyó feloldás; küldetésenként
  csak az első sikeres teljesítés ad gazdasági jutalmat. Nincs termelési,
  kutatási vagy gyártási időzítő.
- A Megerősített pajzs egyszer megvehető, +10% maximális energiapajzsot ad
  P1 XP-fejlesztésekkel számolt alapjához képest. VEYLORA és minden későbbi,
  új rendszerű kampányszektor új csatáiban hat; a régi kampány, gyorscsata
  és PvP változatlan. A meglévő XP-fejlesztések nem kapnak új árat.
- Mindkét küldetés sikere biztosítja a szektort; a vásárlás nem feltétel.
  A szektor visszalátogatható, a jutalom és a küldetésállapot külön látszik.
  Az utazás és küldetésindítás ingyenes.

### Konfigurációs határ – mi szerkeszthető kódváltoztatás nélkül?

**Elfogadott:** külön betölthető, verziózott JSON-tartalomkatalógus, kézi
szerkesztéssel és publikálással; az ismert mechanikák tartalmi módosítása
nem igényel új alkalmazásbuildet. Közös TypeScript-típusok és futásidejű
validálás szükséges. Elsőre nincs szerkesztőfelület vagy általános scriptszabály-motor.
Publikáláskor konzisztens tartalomverziót kell betölteni és a gyorsítótárazást
kezelni; az aktív csata és jutalmai a kezdéskor rögzített verziót használják.
**Elfogadott offline szabály:** legyen az alkalmazással szállított alap
VEYLORA-tartalom. Sikeres frissítés után a legutóbbi teljesen letöltött,
kompatibilis és ellenőrzött tartalomverzió maradjon internet nélkül is
használható. Ez a konfiguráció elérhetősége, nem automatikusan a teljes
böngészős alkalmazás offline indíthatósága: a program, képek és hangok
offline elérhetővé tétele külön technikai feladat. A böngésző tárhelytörlése
vagy tárhelykorlátja miatt a tartalom megőrzése nem garantálható korlátlanul.
**Elfogadott frissítési szabály:** induláskor és külön „Frissítések keresése”
gombbal ellenőrzünk. A teljesen letöltött és ellenőrzött új verzió a menüben
vagy szektorválasztón, játékosi jóváhagyással aktiválható; aktív csata közben
nem váltunk. Az elindított csata és jutalmai a kezdéskor rögzített verzión
maradnak, az új verzió csak később indított csatákra érvényes. Aktiváláskor
a függő vásárlásokat és kiválasztásokat újra ellenőrizni kell.
Letöltési, kompatibilitási vagy validálási hibánál látható jelzés mellett
a már használható verzió marad aktív; új programverziót igénylő tartalom
nem aktiválható.
**Elfogadott mentéskompatibilitás:** a megszerzett jutalmak és fejlesztések
megmaradnak; konfigurációfrissítés nem fizet újra, nem ad utólagos
különbözetet és nem árazza át a korábbi vásárlást. A megvett fejlesztés
hatása a megszerzéskor rögzített érték marad. Használt tartalom eltávolítása
vagy inkompatibilis módosítása az érintett mentéshez explicit migráció
nélkül nem aktiválható. A kompatibilitási ellenőrzés a jóváhagyás előtt fusson.
Az új fordítások és assetek build nélküli terítésének módja még technikai
tervezési feladat. A jelenlegi, buildelt fordítási kulcsokra hivatkozás önmagában
nem teszi lehetővé teljesen új szövegek build nélküli bevezetését.
Az alábbi részlet a formátumot szemlélteti, nem kész séma vagy betölthető tartalom:

```json
{
  "schemaVersion": 1,
  "contentVersion": 1,
  "id": "veylora-03",
  "nameKey": "campaign.veylora.name",
  "locations": [
    { "id": "veylora-a", "kind": "planet", "missionIds": ["secure-mine"] },
    { "id": "veylora-b", "kind": "planet", "missionIds": ["secure-lab"] },
    { "id": "veylora-station", "kind": "station", "missionIds": [] }
  ],
  "missions": [
    {
      "id": "secure-mine",
      "battlefieldId": "veylora-mine",
      "rewardPolicy": "first-success",
      "rewards": { "resources": { "industrial-ore": 20 } }
    },
    {
      "id": "secure-lab",
      "battlefieldId": "veylora-lab",
      "rewardPolicy": "first-success",
      "rewards": { "technologies": ["materials-blueprint"] }
    }
  ]
}
```

- A bolygók/állomások száma a `locations` listából származzon; ne legyen
  külön, könnyen elavuló `planetCount` vagy `stationCount`.
- Külön katalógus írja le a nyersanyagokat, technológiákat, recepteket és
  harctereket stabil ID-val. A szektor ezekre hivatkozzon, ne másolja a definíciókat.
- A recept különböztesse meg az elfogyasztott készletet, a megkövetelt tartós
  technológiát és az alkalmazott, motor által ismert fejlesztési hatást.
- Konfigurálható: helyszínek/küldetések száma, sorrendje, jutalma, ismert
  terepprofilok paraméterei, paletta, objektumok és meglévő hatások értékei.
  Új helyszín hozzáadásához ne kelljen komponensenként külön elágazás.
- Új mechanika, objektumtípus vagy fejlesztési hatás továbbra is kódot,
  tesztet és szükség esetén új assetet igényel. A lokalizáció megtartja a
  hu/en/de nyelveket és a kulcsalapú feloldást; új tartalmi fordítások
  build nélküli terítésének módja még technikai feladat. A konfiguráció
  adat, nem szabadon futtatható kód.
- Validálni kell a sémaverziót, egyedi ID-ket, minden hivatkozást,
  jutalom-/költségértékeket, terep-/elhelyezési korlátokat és fordítási kulcsokat.
  A későbbi technológiai gráf legyen körmentes; ez nem szektorbelépési gráf.
  Hibás tartalom látható hibával blokkoljon, ne adjon alapértelmezett jutalmat.
- Változó helyszínszámnál elsőre reszponzív helyszínkártyák készülnek; a jelenlegi
  százalékos térképpozíciók automatikus, átfedésmentes kiosztása külön feladat.

### Végrehajtási sorrend és elfogadás

Az alábbiak a teljes csomag implementációs lépései. Az elfogadott döntéseknél
szereplő `[x]` a döntés lezárását jelöli, nem a funkció elkészültét.

**Első stabilitási szelet – 2026-11-09:**

- [x] K1: csomagolt [`veylora.json`](../../src/game/data/veylora.json),
  típusos adatmodell, verzió-/hivatkozás-/paramétervalidálás és harctér-adapter.
  Ez még buildelt alapkonfiguráció; a build nélküli terítés a K6 feladata.
- [x] K2: külön főmenübelépés, konfigurációból rajzolt helyszínkártyák,
  két aszimmetrikus harctér és rögzített ellenfélprofil, újrakezdhető csaták.
- [x] K2: 100 HP-s kutatóépület három seedelt jelölt helyen,
  harci eredménytől külön kezelt, legalább 20 HP-s küldetéssiker.
  A kutatóépület önálló objektumtípus, nincs 6A pajzs-/kárkeretkövetkezmény.
- [x] K2: külön, verziózott helyi küldetéshaladás és biztosított státusz;
  hibás mentés blokkol, mentési hiba nem frissíti sikeresként a haladást,
  eredménynél a sikertelen mentés újrapróbálható. Külön megerősített
  haladásreset, a régi kampány és profiladatok megőrzésével.
- [x] HU/EN/DE felület, briefing, kutatóépület-HUD és harci napló;
  az állomási gazdaság is lokalizált, a még hiányzó távoli frissítés jelölve.
- [x] Automatikus ellenőrzés: konfigurációhibák, mentés/visszatöltés,
  tárolási hibák, 20 HP-s küszöb, győzelem melletti küldetésbukás,
  újrapróbálás, P2-profil-/AI-memória elkülönítés és régi módok regressziója.
  A két terep 100 seeden determinisztikus és aszimmetrikus; alap/max
  tankmozgás és tényleges alapfizikájú találó lövések külön tesztelve.
- [x] Böngészős indulás és kutatótelepi AI-kör; helyszínkártyák 1280×720,
  390×844 és 844×390 nézetben túlcsordulás nélkül, legalább 44 px gombokkal.
- [ ] Hosszabb emberi balanszpróba és valódi telefonos ellenőrzés.
- [x] Első felhasználói játékpróba: a bánya és a kutatótelep működött.
- [x] K3–K4: konfigurált érc-/tervrajzjóváírás, állomási készlet és
  megvehető kampánypajzs. A jutalom, haladás, készlet és ledger egy
  IndexedDB readwrite tranzakcióban; a vásárlás ára és hatása is együtt mentődik.
  Több lap párhuzamos jutalmazása/vásárlása nem dupláz és nem veszít írást.
- [x] K3–K4: külön megerősített gazdasági reset, az XP és XP-fejlesztések
  megtartásával. A szektorreset vagy főmenü XP-reset nem nyitja újra a jutalmat.
  Az új gazdasági generációt régi csata és annak mentésismétlése nem módosíthatja.
- [x] K3–K4: a megvett +10%-os szorzó a vásárláskor rögzül; P1 új
  operation-csatáiban az aktuális XP-alappajzsot növeli. Nulla alapnál
  figyelmeztetés mellett megvehető. Régi kampány, gyorscsata és PvP változatlan.
- [x] Migráció: a gazdaság nélküli K2 haladása megmarad; nincs visszamenőleges
  jutalom, de az első sikeres újrajátszás gazdasági jutalmat adhat.
  Az eredeti localStorage-mentést megtartjuk; a gazdaság IndexedDB-ben él.
- [x] Böngészős gazdasági próba külön origin alatt: bánya, bányaismétlés,
  labor, pajzsvásárlás nulla alapnál, későbbi XP-pajzs után 20 → 22,
  újratöltött vásárlás, külön szektor- és gazdasági reset.
  1280×720, 390×844 és 844×390 helyszínnézet túlcsordulás nélkül.
- [ ] K5–K6: bővítési elfogadási próba és teljes távoli tartalomfrissítési folyamat.

| Lépés | Eredmény | Ellenőrzés |
| --- | --- | --- |
| K1 – Tartalmi alap | Szektor/helyszín/küldetés külön adatai, validátor, csomagolt alapkonfiguráció és harctér-adapter; a régi tartalom változatlan belépéssel. | Duplikált/hiányzó ID, ismeretlen típus, hibás számérték és verzió tesztje; a jelenlegi kampány és mentés regressziója. |
| K2 – Második szektor | VEYLORA külön választható, két aszimmetrikus felszíni csata, rögzített ellenfélprofilok, kutatóépület és külön küldetéssiker, valamint nem harci állomáskártya. A jutalom ekkor még nem elérhetőként jelölendő. | Mindkét csata indítható; seedelt épülethelyek, 20 HP-s határérték, tankgyőzelem melletti küldetésbukás, teljes navigáció, mentett haladás és biztosított státusz tesztje. |
| K3 – Jutalom és készlet | Tartós P1-gazdaság, egyszeri 20 érc és egyszeri tervrajz sikeres küldetésért, készletnézet és a két resetművelet. | Sikertelen küldetés nem fizet; replay/remount/reload/ismételt eredmény nem dupláz; szektorreset nem fizet újra, teljes gazdasági törlés XP-t nem töröl; tárolási hiba nem jelenik meg sikeres kifizetésként. |
| K4 – Egy fejlesztési recept | Megerősített pajzs: 20 érc, nem fogyó tervrajz, +10%, új rendszerű kampányszektorokban, nullapajzs-figyelmeztetéssel. | Mindkét küldetéssorrend működik; hiányzó érc/tervrajz tilt; vásárlás egyszer fogyaszt, mentés után is hat; nulla alappajzsnál és későbbi XP-fejlesztésnél helyes; régi kampány, gyorscsata és PvP változatlan. |
| K5 – Konfigurálhatósági próba | Egy további bolygó/állomás és ismert szabályú küldetés hozzáadása kizárólag tartalommal és fordítással. | Nincs engine/UI-elágazás vagy kézzel módosított darabszám; mobilon is használható; érvénytelen config egyértelműen elutasított. |
| K6 – Tartalomfrissítés | Build nélküli publikálás, induláskori/kézi ellenőrzés, jóváhagyásos aktiválás és ellenőrzött offline tartalom megőrzése. | Hiányos/hibás/inkompatibilis csomag nem aktiválható; aktív csata és jutalma változatlan; régi szerzemények megmaradnak, nincs újrakifizetés vagy átárazás. |

K1 → K2 → K3 → K4; K5 a K4 utáni elfogadási próba.
A K2 már játszható köztes eredmény, de az új fejlődési kör csak K4-nél teljes.
A K6 a K1 tartalommodelljére és a K3–K4 mentési szabályaira épül;
a teljes, build nélkül frissíthető csomag elfogadásához is szükséges.

**Mentési minimum:** kampány-/szektor-/küldetés-ID azonosítsa a haladást;
a jutalomjogosultság a tartós gazdasági mentés azonosítójához és stabil küldetés-ID-hoz
kötődjön, ne új csata-ID-hoz. A tartalomverzió-váltás önmagában ne fizessen
újra. Készlet, technológiák és elszámolt jutalmak egy verziózott
mentési egységben frissüljenek; a receptfogyasztás és a megszerzett fejlesztés
szintén egy mentésben történjen. Sikertelen írásnál ne legyen sikerjelzés
vagy félig alkalmazott állapot. A meglévő profil-XP-hez elsőre ne adjunk új
kampánybónuszt, így nem kell új bónusz-XP-tranzakciót bevezetni két tároló között.
Több megnyitott lap írásütközését is kezelni kell, nem elég az egy lapon
futó idempotencia. Mentésmigrációkor a régi teljesítés és XP megmarad,
visszamenőleges nyersanyag-/technológiajutalom csak külön döntés alapján jár.

### Elfogadott döntések – implementációs kapuk

- [x] Többhelyszínes szektor: szektor → bolygó/állomás → küldetés → harctér.

**2026-11-09: elfogadott első tartalmi és hozzáférési döntések:**

- [x] Két bolygó, bolygónként egy felszíni küldetés, valamint egy nem harci állomás.
- [x] Az első változat csak offline P1 játékos AI ellen.
- [x] VEYLORA kezdettől szabadon választható; a régi kampány változatlan.
- [x] D3: tartós, a P1 játékos új kampányszektorai között közös
  nyersanyagkészlet, megszerzett technológiák és megvett kampányfejlesztések.
  Ez önmagában nem határozza meg a fejlesztések harci hatókörét.
- [x] A szektorhaladás resetje csak a küldetéshaladást törli; a vagyon és
  a korábbi jutalomfelvétel nyilvántartása megmarad.
- [x] Legyen külön, megerősítést kérő kampánygazdasági törlés: gazdasági
  haladás, vagyon (a megvett fejlesztésekkel együtt) és jutalomnyilvántartás
  együtt nullázódik, a meglévő XP-profil és XP-fejlesztések megmaradnak.
- [x] D4: külön betölthető JSON, kézi szerkesztéssel és publikálással;
  az ismert mechanikák konfigurációjának változtatásához nincs új build.
- [x] D4: helyszínkártyás navigáció: bolygó → küldetés;
  állomás → készlet/fejlesztés. Elsőre nincs külön szerkesztőfelület.
- [x] D5: a bányaküldetés célja a bányát megszálló ellenséges tank
  megsemmisítése; könnyű csata, lépcsőzetes külszíni fejtéssel.
- [x] D5: a kutatótelep célja az ellenséges tank megsemmisítése és a
  kutatóépület megóvása; közepes csata, tagoltabb tereppel.
- [x] D5: küldetésenként rögzített ellenfélprofil és AI-tudásszint,
  a korábbi AI-memóriától függetlenül. A konkrét statok és AI-paraméterek
  játékpróbával hangolandók; nem vezetünk be automatikus erőskálázást.
- [x] A kutatóépületnek a harci győzelemkor legalább 20% HP-val kell
  rendelkeznie: sérült lehet, de a jelenlegi objektummodell szerinti
  megsemmisült (0–19%) állapot nem elfogadható. A pontos 20% siker.
- [x] A kutatóépület tényleges végállapota számít: a játékos és az AI
  által okozott sebzés egyaránt befolyásolja a megóvási feltételt.
- [x] Tankgyőzelem sikertelen épületvédelemmel harci győzelem, de
  sikertelen küldetés: nem ad tervrajzot vagy küldetésteljesítést.
  Újrapróbálható; a harci eredmény és a küldetéseredmény külön jelzendő.
- [x] Minden új kutatótelepi próbálkozás teljes HP-s épülettel indul;
  nincs próbálkozások között átvitt pályakár vagy javítási kötelezettség.

A labor jutalmának jogosultsági feltétele az első sikeres, épületvédelmet
is teljesítő küldetés. A jutalom egyszeri, a részletes gazdasági és
XP-szabályokat a D7 rögzíti.
Az új objektum kutatóépületként azonosítandó; a meglévő objektumsebzési
és állapotkezelés újrahasználható, de nem kap automatikusan `ENERGY_NODE`
pajzskövetkezményt vagy 6A kárkeret-/szerződéselszámolást.

**D5 elfogadási tesztek:** legalább 20% HP + tankgyőzelem sikeres
kutatótelepi küldetés; 20% alatti HP + tankgyőzelem sikertelen küldetés,
tervrajz és teljesítés nélkül. Vereség/döntetlen nem teljesít akkor sem,
ha az épület ép. Játékos- és AI-sebzés ugyanúgy számít, újrapróbáláskor
teljes épület-HP áll vissza. A konkrét konfigurációval mindkét küldetés
kezdőprofillal, az új kampányfejlesztés nélkül is nyerhető legyen.

- [x] D6: a bányaküldetés azonnal jóváírt, fejlesztéseknél elkölthető
  érckészletet ad; nincs időalapú kitermelés vagy bányászati hozzáférés.
- [x] D6: a kutatótelepi tervrajz tartós technológiai jogosultság,
  fejlesztéskor nem fogy el.
- [x] D6: nincs kutatási vagy gyártási várakozás. Megfelelő készlet és
  technológia mellett a játékos az állomáson azonnal megveheti a fejlesztést;
  az előfeltételek megszerzése önmagában nem vásárol automatikusan.
- [x] D7: ebből a bányaküldetésből csak egyszer lehet
  ércet szerezni, az első sikeres teljesítéskor. Újrajátszott győzelem és
  szektorhaladás-reset nem ad újabb ércet; a korábban elfogadott teljes
  gazdasági törlés a készlettel együtt a jutalomnyilvántartást is nullázza.
  Az elfogadott egyszeri jutalom 20 egység érc.
  A későbbi recepteket a véges készlethez és további forrásokhoz kell igazítani,
  hogy kötelező fejlesztés ne váljon végleg elérhetetlenné.
- [x] D7: a kutatótelepi tervrajz egyszer szerezhető meg,
  az első sikeres, épületvédelmet is teljesítő küldetéskor. Ismételt
  sikerért nincs új tervrajz vagy más gazdasági jutalom. A szektorhaladás
  resetje nem adja újra; a teljes gazdasági törlés a jogosultságát is nullázza.
- [x] D7: marad a meglévő harci és győzelmi XP, újrajátszáskor is,
  külön VEYLORA-/kampánybónusz nélkül. A kutatóépület-védelem bukása nem
  vonja vissza a tankgyőzelem és harc XP-jét, bár nincs tervrajz vagy
  küldetésteljesítés. A meglévő vereség-/döntetlen-/elhagyáskezelés változatlan.
- [x] D8: az első kampányfejlesztés az egyszer megvehető
  „Megerősített pajzs”, amely a meglévő XP-fejlesztésekkel számolt maximális
  energiapajzsot 10%-kal növeli. A tank ezen a maximumon indul és eddig
  regenerálódik. Nem helyettesíti vagy árazza át az XP-fejlesztéseket.
  A bónusz P1-re, az újonnan indított csatákban érvényesül.
- [x] D8: a Megerősített pajzs ára 20 érc és a kutatótelepi tervrajz megléte.
  Csak az érc fogy el, a tervrajz megmarad. Nincs XP-költség vagy várakozás;
  az állomáson, külön játékosi döntésre vásárolható meg. Ez az első bánya
  teljes egyszeri készletét felhasználja; későbbi kötelező receptekhez
  további nyersanyagforrást kell biztosítani.
- [x] D8: a Megerősített pajzs VEYLORA és minden későbbi, új rendszerű
  kampányszektor csatáiban hat. A jelenlegi régi kampány, gyorscsata és
  online PvP változatlan. A fejlesztés tartós, nem csatánként elfogyó felszerelés.
- [x] D9: VEYLORA mindkét küldetés sikeres teljesítésekor biztosított;
  a kutatótelepnél az épületvédelmi feltétel is szükséges. A pajzs megvétele
  külön fejlesztési eredmény, nem feltétel. A küldetések sorrendje szabad,
  a biztosított szektor visszalátogatható és csatái újrajátszhatók.
- [x] VEYLORA-n az utazás és a küldetésindítás ingyenes, nincs üzemanyag-
  vagy belépési költség. Az újrapróbálás nem fogyasztja az egyszeri
  érckészletet; a pajzsfejlesztés elfogadott ára változatlan.

### Elfogadott helyszínarculat

- [x] VEYLORA-A: rozsdavörös, száraz bányavilág, széles külszíni fejtéssel
  és borostyán ipari fényekkel.
- [x] VEYLORA-B: hideg, kékesszürke kutatóvilág, tagolt sziklákkal
  és fehér-cián kutatóépülettel. A védendő épület a háttértől felismerhetően
  különüljön el, HP-/állapotjelzéssel.
- [x] VEYLORA állomás: ipari orbitális dokk, sötét acélburkolatokkal
  és borostyán-cián jelzésekkel; nem bejárható helyszín vagy új harctér.

Az arculat nem vezet be új fizikát (például csúszást).
A Ferrum, Nivalis és VEYLORA Relay felvetett nevek egyelőre munkanevek,
nem külön jóváhagyott végleges elnevezések.

### Kutatóépület és terepek – döntések

- [x] A kutatóépület maximális életereje 100 HP; tankgyőzelemkor
  legalább 20 HP szükséges a küldetéssikerhez. Minden új próbálkozás
  teljes, 100 HP-s épülettel indul.
- [x] A kutatóépület több előre ellenőrzött hely közül seed alapján kap
  pozíciót. Azonos seed és tartalomverzió azonos elhelyezést ad;
  ismétlődés lehetséges. A konkrét helylistát és méretet a terephez kell
  megadni, minden jelölt helyen ellenőrizve a kezdőtankoktól való távolságot,
  olvashatóságot és az épületvédelem teljesíthetőségét.
- [x] Bányaharctér: lépcsőzetes külszíni fejtés, több alacsony, járható
  padkával. A padkákat járható lejtők kapcsolják össze, nem függőleges
  falak; megmarad a könnyű, áttekinthető harctéri cél.
- [x] Kutatótelepi harctér: széles központi fennsík, két oldalán
  alacsonyabb sziklás völgyekkel. Az épület helylistája a fennsík
  ellenőrzött teraszaihoz igazítandó.
- [x] Mindkét pálya aszimmetrikus domborzatú, külön balanszolt
  kezdőoldalakkal. Nem követelmény az egyenlő kezdőmagasság vagy tükrözés.
  A meglévő 1280×720-as világméretet és alapfizikát megtartjuk.

**Technikai következmény:** a jelenlegi
[`generateSectorHeightmap`](../../src/game/terrain/heightmap.ts) félpályás
kontrollpontokat vár és mindig tükröz. Az új profilhoz explicit
aszimmetrikus, teljes szélességű kontrollpontkezelés kell; a régi profilok
és ALPHA generálása változatlan maradjon. Ez ismert terepmechanika
egyszeri kódbővítése; utána az aszimmetrikus profilok konfigurálhatók.

**Még kidolgozandó, játékpróbával igazolandó paraméterek:** teljes pályás
kontrollpontok és magasságok, lejtőhosszak, zajamplitúdó, kutatóépület-méret
és helylista, kezdőtankok biztonságos felszíne. A külön oldali balanszt
mindkét kezdőjátékossal, kezdő és fejlesztett P1-profillal ellenőrizni kell.
Minden engedett épülethelyen vizsgálandó a legalább 20 HP-s megóvás
teljesíthetősége. A nehézséget nem az aszimmetria vagy egy újabb
nehézségcímke bizonyítja, hanem a lövési/mozgási próbák és játékpróbák.

### Elfogadott ellenfélértékek – első balanszpróba

| Küldetés | HP | Energiapajzs | Páncél | AI-tudásszint |
| --- | --- | --- | --- | --- |
| Bánya | 100 | 0 | 0 | 0,35 |
| Kutatótelep | 100 | 0 | 20 | 0,55 |

Minden további ellenfélstat a meglévő alapérték: sebzésszorzó 1,
robbanási sugár 30, maximális lövési erő 600, mozgáskeret 60,
Smart Aim 1 töltet; a pajzsregeneráció alaparánya 0,2, ami nulla
maximális pajzsnál nem ad pajzsot. Az AI-tudásszint nem találati százalék.
Ezek konfigurálható, játékpróbával igazolandó kezdőértékek, nem mért balanszeredmények.
Az ellenfél nem örökli a korábbi P2-profilt és AI-memóriát, és nem erősödik
újrapróbáláskor. P1 a saját XP-fejlesztéseit megtartja; mindkét küldetés
kezdőprofillal, az új kampányfejlesztés nélkül is nyerhető legyen.

**Elfogadott nullapajzs-szabály:** a Megerősített pajzs tisztán +10%-os
szorzó marad; nem ad külön alap pajzspontot. Nulla XP-s alappajzsnál is
megvásárolható, de vásárlás előtt egyértelműen jelezni kell, hogy jelenleg
nincs hatása, és legalább egy XP-s pajzsfejlesztés szükséges a hasznosulásához.
A megvett bónusz a később megszerzett XP-s pajzskapacitásra is érvényes;
nem a vásárláskori nulla kapacitást rögzítjük, hanem a +10%-os hatásértéket.

A táblázat az elfogadott döntések rövid összefoglalója; a részletes
szabályokat a fenti döntéslisták tartalmazzák.
VEYLORA első szeletének épületvédelmi és újrapróbálási szabályait a D5
döntések rögzítik; a régi 6A kárkeret-/szerződéslánc nem következik belőlük.
Nem kell a teljes jövőbeli gazdaságot előre
megtervezni, de az első játszható szelet határait igen.

| ID / kapu | Téma | Elfogadott szabály |
| --- | --- | --- |
| D1 / K1 előtt | Mi fér bele az első VEYLORA-csomagba? | Két bolygó, bolygónként egy felszíni küldetés/harctér, egy nem harci állomás; offline P1–AI. Nincs űrcsata, utazási költség vagy multiplayer-gazdaság. |
| D2 / K1 előtt | Hogyan él együtt a régi tartalommal? | Külön választható új szektor, előzetes teljesítés nélkül. A jelenlegi kampány működése és mentése megmarad; a 6A következménylánc nem kerül automatikusan VEYLORA-ba. |
| D3 / K1 előtt | Kié a készlet, a technológia és a fejlesztés, és mit töröl a reset? | Egy helyi P1-kampányparancsnok tartós, szektorok között közös vagyona, elkülönítve a P2/AI-tól. A szektorhaladás resetje ne törölje a vagyont vagy a kifizetési nyilvántartást; csak explicit teljes gazdasági törlés indítsa újra mindkettőt. A resethez tartozó jogosultságok együtt változzanak. |
| D4 / K1 előtt | Hogyan szerkesztjük és jelenítjük meg a tartalmat? | Elfogadva: külön betölthető, validált JSON kézi szerkesztéssel és publikálással, új build nélkül; helyszínkártyák és állomási készlet-/fejlesztésnézet, szerkesztőfelület nélkül. |
| D5 / K2 előtt | Mi a két küldetés célja és nehézsége? | Bánya – ellenfél-megsemmisítés, könnyű, aszimmetrikus lépcsőzetes fejtés; kutatótelep – tankgyőzelem és legalább 20/100 épület-HP, közepes, aszimmetrikus központi fennsík és oldalsó völgyek. Minden sebzés számít, új próba teljes épület-HP-val indul. Rögzített ellenfélprofilok: bánya AI 0,35, labor AI 0,55; a teljes statlista fent szerepel. |
| D6 / K3 előtt | Mit jelent a nyersanyag és a technológia megszerzése? | Elfogadva: az érc azonnal jóváírt, fogyasztható készlet; a tervrajz nem fogyó, tartós technológiai jogosultság. Nincs termelési, kutatási vagy gyártási várakozás; a fejlesztést a játékos külön veszi meg az állomáson. |
| D7 / K3 előtt | Mikor és hányszor jár jutalom? | Elfogadva: a bánya első sikeres teljesítése 20 ércet ad; a labor első sikeres, épületvédelmet is teljesítő küldetése ad egyszeri tervrajzot, ismétléskor nincs más gazdasági jutalom. A meglévő harci és győzelmi XP újrajátszáskor is marad, külön kampánybónusz nélkül. |
| D8 / K4 előtt | Mit lehet megvenni, mennyiért, és hol hat? | Elfogadva: egyszer megvehető „Megerősített pajzs”, +10% maximális energiapajzs az XP-fejlesztésekkel számolt alaphoz képest; ezen indul és eddig regenerálódik. Ár: 20 érc + a nem fogyó kutatótelepi tervrajz megléte. P1-re hat VEYLORA és minden későbbi, új rendszerű kampányszektor újonnan indított csatáiban; a régi kampány, gyorscsata és PvP változatlan. |
| D9 / K2 előtt | Mit jelent a szektor teljesítése, és vissza lehet-e térni? | Elfogadva: mindkét küldetés sikeres teljesítése ad „biztosított” jelzést, a labor épületvédelmi feltételével együtt. A pajzsvásárlás nem feltétel. Szabad sorrend, visszalátogatás és újrajátszás megmarad. Az utazás és küldetésindítás ingyenes. |

A D3 meghatározza a mentési modellt, ezért már az alapozásnál figyelembe
kell venni. A tartós gazdasági mentés azonosítója és a stabil küldetés-ID
együtt adja a jutalomjogosultság kulcsát. Szektorreset vagy új csata-ID nem fizethet újra.
A D7–D8 számértékei később konfigurációból balanszolhatók; már kifizetett
jutalom vagy megvett fejlesztés módosításához viszont kompatibilitási szabály kell.

### Nyitott technikai és tartalmi feladatok

Ezek nem módosítják az elfogadott játékszabályokat. Az alapozás elkezdhető;
az érintett lépés elkészülte előtt a hozzá tartozó részleteket véglegesíteni kell.

- [x] K3: gazdasági sémabővítés, jutalomledger, prototípusmigráció és
  több megnyitott lap írásütközéseinek sorosítása IndexedDB-tranzakciókkal.
- [ ] K2 finomhangolás: a prototípus teljes szélességű kontrollpontjai,
  lejtői, 0,002-es zajamplitúdója és 64×40-es épülete (510/640/770 X-helyek)
  játékpróbás ellenőrzése, szükség szerinti balanszkorrekcióval.
- [ ] Végleges helyszínnevek; az elkészült hu/en/de briefingek és az elfogadott
  ellenfél-kezdőértékek hosszabb játékpróbás ellenőrzése.
- [ ] K6: tartalomcsomag és publikálási formátum, verzióellenőrzés,
  helyi tárolás, gyorsítótárazás és a fordítások/assetek build nélküli terítése.
- [ ] K5/K6: konfigurációból bővítés, offline tartalom, kompatibilitás,
  hibás frissítés és megszakított letöltés végponttól végpontig tartó próbája.

**Későbbre hagyható:** teljes nyersanyag–technológia mátrix, urán/nukleáris ág,
passzív kitermelés, kereskedelem, több fejlesztési szint, további bolygók,
állomási harc, saját konfigurációs szerkesztő és online kampány.
A validálás, jutalomduplázás elleni védelem, mentési hibajelzés és migráció
nem opcionális termékdöntés, hanem a megvalósítás része.

**Becslés:** egy fejlesztővel K1–K2 körülbelül 4–7 munkanap,
K3–K4 további 5–9 munkanap, K5 és készülékes/regressziós ellenőrzés
2–4 munkanap. Összesen nagyjából 2–4 hét, új egyedi látványvilág,
űrcsata és teljes technológiafa nélkül. Ez az eredeti K1–K5 javaslat
kódolvasásból adott nagyságrendi becslése, nem frissített teljes vállalás:
a build nélküli terítés (K6) és az aszimmetrikus terepbővítés részletes
technikai terve alapján újra kell becsülni.

## Szektornév-jelöltek

ALPHA-01, DELTA-08, FORGE-17, VANGUARD-12 és PRIME-00 játszható C3 tartalom;
a többi név későbbi jelölt.

| Kód | Név | Állapot |
| --- | --- | --- |
| SECTOR ALPHA-01 | Training Grounds | Meglévő alap harctér |
| SECTOR DELTA-08 | Crystal Basin | Játszható C3 szektor |
| SECTOR FORGE-17 | Industrial Expanse | Játszható C3 szektor |
| SECTOR BOREALIS-02 | Frozen Frontier | Jelölt |
| SECTOR HELIOS-21 | Solar Wastes | Jelölt |
| SECTOR ORBITAL-05 | Elevator Nexus | Jelölt |
| SECTOR TITAN-09 | Ringfall Ridge | Jelölt |
| SECTOR VANGUARD-12 | Defense Grid | Játszható C3 szektor |
| SECTOR VEYLORA-03 | Mining Colony | Jelölt |
| SECTOR PRIME-00 | Capital Perimeter | Játszható C3 szektor |
