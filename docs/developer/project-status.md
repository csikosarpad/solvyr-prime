# Solvyr Prime – projektáttekintés és státusz

**Felmérés dátuma:** 2026-11-10  
**Hatókör:** dokumentációs és kódstruktúra-áttekintés, build/lint/teszt futtatás.  
**Változtatás:** ez a státuszdokumentum készült; alkalmazáskód nem változott.

## Vezetői összefoglaló

A Solvyr Prime egy böngészős, körökre osztott taktikai tüzérségi játék. A projekt
egy működő, több játékmódot, kampányt, lokális fejlődést és online szobákat támogató
termékprototípus; a fejlesztői dokumentáció a megvalósított működést és a későbbi
terveket többnyire világosan elkülöníti.

A fő technikai kapu jelenleg a tesztfuttatás: a teljes Vitest futásból 312 teszt
sikerült, 128 megbukott 12 tesztfájlban. A hibák közös oka a futtatás során hiányzó
`localStorage` globál, nem egyetlen funkcióhoz kötődő elvárás. A build és az ESLint
hibamentes. A PHP backend helyi futtatását ebben a környezetben nem lehetett
ellenőrizni, mert a `php` parancs nem érhető el.

## Termék és jelenlegi működés

- Hot-seat két játékosnak, offline AI elleni játék és szobakódos online multiplayer.
- Öt szektoros, elágazó Campaign Map, helyi teljesítésmentéssel.
- VEYLORA-03 játszható prototípus két küldetéssel, IndexedDB-alapú haladással,
  egyszeri jutalmakkal és külön kampánygazdasággal.
- Körökre osztott, seedelt ballisztika, változó szél, rombolható terep,
  szektoronkénti terepprofilok, mozgó tankok, AI és fejleszthető profilok.
- Magyar, angol és német UI, HUD, briefing, eredményképernyő, hang és felolvasás.
- A tervezett következményes ostromhadjárat teljes kampánya, környezeti
  modifikátorok, orbitális képességek és stratégiai fejlődés még nem kész funkciók;
  a státuszuk és döntési kapuik a roadmapben vannak rögzítve.

## Kódarchitektúra

- **Belépés és képernyők:** a `src/main.tsx` inicializálja a React alkalmazást,
  az `src/App.tsx` pedig a Zustand állapot alapján választ menü, kampánytérkép,
  VEYLORA és játék/eredmény képernyő között. Online szoba esetén az alkalmazás
  másodpercenként frissítést kér.
- **Renderelés és játéklogika:** `src/game/engine/Game.ts` PixiJS renderelést,
  fix 60 Hz-es frissítést, fizikai/harci folyamatot, AI-t, audio- és meccs-életciklust
  koordinál. A React UI a HUD és képernyők rétege; a játéktér saját Pixi vásznon fut.
- **Domainmodulok:** `physics/`, `terrain/`, `entities/`, `systems/`, `data/` és
  `multiplayer/` mappák tartalmazzák a ballisztikát, terepet, tankot, AI-t,
  körkezelést, fejlődést, seedelést, kampányadatokat és online protokollt.
- **Állapot és mentés:** Zustand store-ok a HUD-nézetet, beállításokat, online
  szobát és kampányállapotot kezelik. Profilok, beállítások és a régi kampány
  böngésző-helyi tárolást használnak; a VEYLORA haladása és gazdasága IndexedDB-ben
  él. A dokumentált mentésverziók migrációval kezelik a kompatibilitást.
- **Backend:** külön PHP/MySQL szolgáltatás kezeli a lobbyt és revision-alapú
  eseménynaplót; a fizika és az események visszajátszása a klienseken történik.
  A Vite fejlesztői proxyval kapcsolódik a PHP API-hoz.

## Dokumentációs állapot

A dokumentáció szerepei rendezettek: a gyökér README belépési pont, a játékosútmutató
a kész funkciókat írja le, a fejlesztői index a technikai dokumentumokat sorolja,
a roadmap az aktív státusz és döntések központi helye, a history történeti napló.
Az architektúra-, indítási, backend-, kampány- és designleírások részletesek.

Erősség, hogy a terv és a kész funkciók nem mosódnak össze, és a mentési,
determinista multiplayer- és kliensverzió-korlátok dokumentáltak. A részletes
anyag ugyanakkor több dokumentumban ismétlődik; új státuszoknál a roadmapet kell
elsődlegesnek tekinteni, a jelen fájlt pedig pillanatfelvételként kezelni.

## Ellenőrzések

| Ellenőrzés | Eredmény |
| --- | --- |
| `pnpm.cmd build` | Sikeres: `tsc --noEmit` és Vite production build lefutott. |
| `pnpm.cmd lint` | Sikeres: ESLint nem jelzett hibát. |
| `pnpm.cmd test` | 312 sikeres, 128 sikertelen teszt; 54 fájlból 12 bukott, 4 teljesen sikeres. |
| Izolált i18n-teszt | 6/6 teszt megbukott ugyanazon hiányzó `localStorage` miatt. |
| PHP backend | Nem ellenőrizhető: a `php` CLI nem található ezen a környezeten. |

A tesztfutásban a tesztek `localStorage.clear()` / `getItem()` hívásai
`undefined` értéken futottak, noha a Vite/Vitest konfiguráció `jsdom` környezetet
és közös setupot állít be. Ezért a jelen teszteredmény nem tekinthető érvényes
funkcionális regressziós jelzésnek; a Vitest/JSDOM globál inicializálását kell
először helyreállítani, majd a teljes suite-ot újrafuttatni.

## Fő kockázatok és teendők

1. **Tesztkörnyezet:** a hiányzó `localStorage` miatt jelenleg nem megbízható a
   teljes automatizált tesztkapu. A setup/runtime eltérés okát fel kell tárni,
   majd újra kell futtatni mind az 54 tesztfájlt.
2. **Online biztonsági modell:** a backend szoba-hozzáférést, revisiont,
   eseménytípust és néhány host-jogot ellenőriz, de nem igazolja a teljes
   játékszabályt, a soron következő játékost vagy a fizikát. A dokumentáció szerint
   ez nem csalásvédett modell; versenyszerű vagy rangsorolt játékhoz szerveroldali
   autoritás és protokollverziózás szükséges.
3. **Eszközös ellenőrzés:** a roadmap és az útmutató is nyitottként jelöli a valódi
   iOS/Android, hozzáférhetőségi és képernyőolvasós próbát. A böngészős build ezt
   nem helyettesíti.
4. **Kiadási megfelelőség és letöltés:** a dokumentáció jelzi, hogy egyes
   Freesound-hangok fájlonkénti szerző-/forrásnyilvántartása hiányzik, és a
   háttérzene licence nyilvános terjesztés előtt ellenőrzendő. A buildben a zenei
   MP3 körülbelül 4 MB; érdemes a licencellenőrzéssel együtt a betöltési módot és
   a mobil adatforgalmi hatást is felülvizsgálni.
5. **Motor koordinátor:** a `Game` több felelősséget fog össze. A dokumentáció
   helyesen nagy koordinátorként kezeli; célzott kivonás akkor indokolt, ha egy
   új funkció vagy tesztelhetőségi probléma ténylegesen érinti, nem általános
   előzetes újraírásként.

## Javasolt sorrend

1. Vitest/JSDOM `localStorage` inicializálásának javítása és teljes tesztfutás.
2. A roadmap szerinti következő kampánypróba folytatása a hozzá tartozó nyitott
   döntési kapukkal; a hosszú távú kampánytervet külön kezelni a kész VEYLORA/C3
   működéstől.
3. Valódi telefonos és hozzáférhetőségi ellenőrzés, majd a hanganyagok kiadási
   licenc- és méretellenőrzése.
4. Backend-tesztfuttatás PHP/MySQL környezetben; online szabályvalidáció csak akkor
   kerüljön a hatókörbe, ha a bizalmi modell erre termékigényt ad.

## Hivatkozások

- [Fejlesztői indítás](./getting-started.md)
- [Fejlesztői kontextus és architektúra](./dev-notes.md)
- [Roadmap és aktuális státusz](./roadmap.md)
- [Kód- és dokumentáció-refaktorálási terv](./refactoring-plan.md)
- [Játékosútmutató](../user/guide.md)
- [Backend telepítés és API](../../server/README.md)