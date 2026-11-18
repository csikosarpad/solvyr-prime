# Kampányhoz kötött fegyverfeloldás és technológiai fejlődés

**Dátum:** 2026-11-18. **Státusz:** folytatható design- és megvalósítási terv,
nem kész játékműködés. Ez a dokumentáció nem módosít fegyverárat, mentést vagy térképet.

**Új tervezési irány:** a Páncéltörő, Gyújtólövedék, Lézer és Célkövető rakéta
ne legyen egyszerűen XP-ért megvásárolható. Megszerzésük legyen kampánycél:
kész fegyver jutalomként, illetve technológia és szükséges nyersanyag megszerzése.
A fejlesztési felület és a kampánytérkép ezt a folyamatot tegye érthetővé.

Ez felülírja a korábbi XP-s fegyverfeloldási **célt**, de a jelenlegi implementációt
csak egy későbbi, migrációval együtt kiadott fejlesztés válthatja le.
A konkrét jutalomelosztás, receptek, költségek és migrációs politika alább
**javaslatok**, nem már jóváhagyott vagy implementált szabályok.

Kapcsolódás: [roadmap](./roadmap.md), [gameplay és fejlődés](./gameplay-progression.md),
[műhelyterv](./gameplay-progression-todo.md#41-fejlesztés--műhely-felszerelés-és-reakciólehetőségek),
[technológiai kampányirány](./gameplay-progression-todo.md#6b-kampánycélok--nyersanyag-és-technológiaalapú-fejlődés).
A központi státusz továbbra is a roadmap; ez annak részletes designanyaga.

## 1. Kiinduló helyzet és a megoldandó probléma

| Terület | Jelenlegi működés | Az átállás következménye |
| --- | --- | --- |
| Fegyverek | Standard ingyenes; Páncéltörő 150, Gyújtólövedék 180, Lézer 250, Célkövető 300 XP | A különleges fegyverek kapjanak kampányból származó hozzáférést |
| Tulajdon | A `Profile.weapons` fegyver-ID-ket tárol, a megszerzés forrása nélkül | El kell különíteni a régi vásárlást, kampányjutalmat és gyártást |
| Bolt | A műhely egységpaneljeiben XP-s fegyversorok vannak | Nem elég a vásárlásgomb átnevezése: forrás, előfeltétel és haladás kell |
| Kampánygazdaság | VEYLORA: egyszeri érc- és tervrajzjutalom, állomási pajzsvásárlás | Új pénztárca helyett ezt az alapot érdemes általánosítani |
| Felső térkép | Öt önálló C3-harctér és a külön belső nézetű VEYLORA | A harctér és a többküldetéses hadjárat külön fogalom legyen |
| Játékmódok | Ember offline választhat feloldott fegyvert; AI és online jelenleg Standardot használ | A kampányátállás ne kapcsoljon be mellékesen új online vagy AI-fegyvereket |

Források: [fegyverkatalógus](../../src/game/data/weapons.ts),
[feloldási szabályok](../../src/game/systems/weapons.ts),
[profil](../../src/game/systems/upgrades.ts),
[műhely](../../src/ui/Workshop.tsx),
[fegyversor](../../src/ui/result/WeaponRow.tsx),
[kampánytartalom](../../src/game/data/campaignContent.ts),
[VEYLORA-adatok](../../src/game/data/veylora.json),
[kampánygazdaság](../../src/game/systems/campaignEconomy.ts),
[Game](../../src/game/engine/Game.ts).

Az XP-ár puszta emelése csak késleltetné ugyanazt a bevásárlási folyamatot.
A cél az, hogy a játékosnak oka legyen egy adott hadjáratot választani:
**„A lézertechnológiát szeretném megszerezni; ezért indulok erre a műveletre.”**

## 2. Javasolt alapelvek

1. **A Standard mindig elérhető.** Egy új mentés nem igényel kampányjutalmat a játékhoz.
2. **XP nem helyettesít kampányfeltételt.** A négy különleges fegyverhez ne legyen
   kerülőút egy másik boltban vagy közvetlen vásárlási parancson keresztül.
3. **Az XP-s statfejlődés maradhat.** A Robbanófej vagy Motor fejlesztése nem azonos
   egy új fegyver megszerzésével. Kompatibilitásuk ne változzon észrevétlenül.
4. **Technológia, tulajdon és kiválasztás külön állapot.** Egy ismert tervrajz még
   nem feltétlenül legyártott fegyver; a megszerzett fegyver nem feltétlenül az aktuális lövés típusa.
5. **Nincs kötelező általános szektorlánc.** A játékos a kívánt jutalom alapján
   válasszon hadjáratot; egy hadjáraton belül lehetnek indokolt küldetésfüggőségek.
6. **Nincs önmagát lezáró feloldás.** Egy fegyver megszerzéséhez ne legyen szükséges
   ugyanaz a fegyver. A kötelező útvonalak Standarddal is teljesíthetők legyenek.
7. **Az első változat determinisztikus.** Nem véletlen zsákmánydobás dönti el,
   hogy megkapjuk-e a fejlődéshez szükséges technológiát.
8. **A fegyvert egyszer szerezzük meg, nem lövésenként fizetünk érte.**
   Fogyó lőszer, javítási díj és időalapú kutatási várakozás nem része ennek a tervnek.

## 3. Fegyverenkénti kampánycélok

Az alábbi hozzárendelés **tartalmi javaslat**, nem a meglévő szektorok átírása.
A helyszín- és technológianevek munkanevek; új küldetések és jutalomdefiníciók szükségesek hozzájuk.

| Fegyver | Javasolt hely | A hadjárat célja | Megszerzés |
| --- | --- | --- | --- |
| Páncéltörő (`ap`) | FORGE-17 ipari hadjárat | Fegyverraktár és gyártási dokumentáció biztosítása | A záróküldetés kész fegyvert ad; ez legyen az első kis próba |
| Gyújtólövedék (`incendiary`) | DELTA-08 alá tervezett vegyipari helyszínek | Termovegyészeti technológia és megfelelő alapanyag megszerzése | Technológia + egyszeri, nyersanyagot fogyasztó gyártás |
| Lézer (`laser`) | VANGUARD-12 energetikai/kutatási művelet | Épségben megszerzett energiavezérlési technológia és gyártási alapanyag | Technológia + egyszeri gyártás egy biztosított állomáson |
| Célkövető rakéta (`homing`) | PRIME-00 irányítási hadjárat | Célkövetési adatok és vezérlőközpont megszerzése | A hadjárat zárásakor kész fegyver; a korábbi küldetések előkészítik a jutalmat |

Miért vegyes a modell?

- A kész fegyver erős, azonnal érthető kampányzáró jutalom.
- A technológia és alapanyag külön megszerzése útvonalválasztást és előkészítést ad.
- Nem kell minden fegyverhez ugyanazt a három lépést újra eljátszani.
- A Célkövető ne pusztán drágább bolttermék legyen, hanem érdemi hadjáratcél.

Az első próbához **csak a Páncéltörő-kampány** szükséges. A többi fegyver
küldetéseit a kipróbált jutalom- és térképi alapokra építsük, ne egyszerre négy
új gazdasági láncot vezessünk be.

## 4. Kampánytérkép: hierarchia és útvonalak

### 4.1. Két navigációs szint, külön harctérfogalom

```text
Műveleti térkép
  ALPHA-01       meglévő kiképzőharctér
  VEYLORA-03     meglévő bánya / labor / állomás
  FORGE-17       tervezett ipari hadjárat -> Páncéltörő
  DELTA-08       tervezett vegyipari hadjárat -> Gyújtólövedék
  VANGUARD-12    tervezett energetikai hadjárat -> Lézer
  PRIME-00       tervezett irányítási hadjárat -> Célkövető

Kiválasztott hadjárat
  helyszínek -> küldetések -> záróküldetés / állomás
                    |
                    +-> konkrét harctér és célfeltétel
```

Ez **tartalmazási vázlat**, nem ALPHA → VEYLORA → FORGE kötelező sorrend.
A jelenlegi ALPHA → VEYLORA hozzáférési feltételt az első bővítés nem módosítja.
A többi felső csomópont meglévő függetlenségét nem szabad mellékesen megszüntetni.
A hadjáratok közti új technológiai kapu csak külön, indokolt döntéssel kerülhet be.

A kódbeli `Sector` jelenleg harctéradatokat is jelent. A bővítésben legyen világos:

- **Térképi hadjárat/szektor:** helyszíneket és küldetéseket fog össze.
- **Helyszín:** bolygófelszín, kutatótelep, gyár vagy állomás.
- **Küldetés:** előfeltételek, győzelmi feltétel, jutalom.
- **Harctér:** terep, ellenfél, stratégiai objektumok és vizuális konfiguráció.

### 4.2. Az első Páncéltörő-hadjárat vázlata

```mermaid
flowchart LR
  F1["Ipari hídfő biztosítása"]
  F2["Kutatótelep biztosítása"]
  F3["Fegyverraktár felszabadítása"]
  AP["Páncéltörő megszerezve"]
  F1 --> F3
  F2 --> F3
  F3 --> AP
```

F1 és F2 szabad sorrendben választható. F3 mindkettőt igényli, tehát itt **AND**
előfeltétel van. Ne keverjük össze a korábbi felső szektorgrafikon OR szabályaival.
Az új küldetés-ID-k csak tartalomtervezés után véglegesítendők.

Az első szelet használja a már támogatott ellenséglegyőzést és
kutatóépület-megőrzési célfeltételt. Fizikai adatlopás, szállítmánykísérés,
felvehető láda vagy több egységes csata csak későbbi mechanikabővítés legyen.
A „technológia megtalálása” kezdetben sikeres küldetésért adott, világosan
előre jelzett jutalmat jelent, nem egy még nem létező pályabeli interakciót.

### 4.3. Térképi visszajelzések és meglévő csaták

- Felső csomópont: szektorkód, fő jutalom jelvénye, új küldetés/új technológia jelzés.
- Részletkártya: cél, várható jutalom, küldetéshaladás, belépési feltétel.
- Belső térkép: elérhető, zárolt, teljesített és már elszámolt jutalmú küldetések.
- A hiányzó technológiából közvetlenül el lehessen jutni a jutalmazó küldetéshez.
- Mobilon ne az összes küldetést zsúfoljuk a felső csillagtérképre.
- A meglévő C3-harcterek maradjanak újrajátszhatók. Egy bővített csomópont fő
  belépése lehet „Műveletek megnyitása”, a korábbi csata külön újrajátszási lehetőség.
- Egy korábban teljesített C3-csata nem bizonyítja az új hadjárat teljesítését.
  A régi teljesítés megmaradjon, az új küldetéssor saját haladást kapjon.

Forrás és bővítési pont: [CampaignMap](../../src/ui/CampaignMap.tsx),
[VeyloraOperations](../../src/ui/VeyloraOperations.tsx),
[szektorok](../../src/game/data/sectors.ts).
Jelenleg a VEYLORA térképi kezelése külön kódág: az új hadjáratokhoz ezt
adatvezérelt katalógussá kell általánosítani, nem további négy külön kivételt hozzáírni.

## 5. Technológia, nyersanyag és jutalom

### Megszerzési szabályok

- Technológia: tartós, nem fogyó ismeret. Ugyanazt a tervrajzot nem kell újra megvenni.
- Nyersanyag: konkrét készlet, amely gyártáskor fogy; pontos költsége külön balanszdöntés.
- Kész fegyver: közvetlen tulajdonjog, további XP-vásárlás vagy gyártás nélkül.
- Gyártási recept: ismert technológiát és készletet igényel, egyszer hozza létre a fegyvert.
- Feloldás és gyártás sikeres mentés után válik használhatóvá; nem pusztán a gomb megnyomásától.
- A jutalom forrása a küldetés tényleges sikerfeltétele. A győzelem önmagában nem
  elég, ha a megőrzendő labor közben megsemmisült.
- Vereség, döntetlen, csataelhagyás és sikertelen célfeltétel nem ad tartós technológiát.
- Az ismételt teljesítés ne termeljen újabb egyszeri jutalmat vagy kész fegyvert.

### Erőforrás-csapdák elkerülése

A VEYLORA jelenlegi 20 érces jutalma már a pajzsvásárlást szolgálja.
Nem lehet ugyanazt a véges készletet észrevétlenül egy új, kötelező fegyverhez is
elkérni, ha a pajzsra költő játékos utána nem tud továbbhaladni.

Minden gyártási lánchoz ellenőrizni kell:

1. Mely küldetésekből szerezhető a szükséges készlet?
2. Más, korábban elérhető vásárlás elköltheti-e?
3. Az ilyen vásárlás után marad-e garantált, teljesíthető utánpótlási út?
4. Elérhető-e a gyártás helyszíne a még meg nem szerzett fegyver nélkül?

Az első szeletben ne legyen véletlen farmolás vagy passzív kitermelés.
Ha a garantált készlet nem biztosítható, az adott fegyver inkább legyen közvetlen
kampányjutalom, amíg az erőforrásgazdaság nincs megtervezve.
Ne vezessünk be automatikusan fegyverenként külön pénznemet sem.

## 6. Fejlesztési felület: bolt helyett fejlődési központ

A meglévő műhely belépési pontjai és ResultScreen-stílusa megtartható.
A probléma elsősorban az információs szerkezet: az XP-s sor önmagában nem tud
kampányforrást, részleges technológiai haladást és gyártást megmutatni.

### Javasolt nézetek

| Nézet | Tartalom | Elsődleges művelet |
| --- | --- | --- |
| Fegyvertár | Standard, megszerzett és megszerezhető különleges fegyverek | Részletek, forrás megnyitása; meglévő fegyver használhatósága |
| Technológiák és gyártás | Tervrajzok, hiányzó feltételek, nyersanyagkészlet, receptek | Kapcsolódó küldetés megnyitása vagy egyszeri gyártás |
| Egységfejlesztések | Meglévő XP-s statfejlesztések és kompatibilitásuk | XP elköltése a jelenlegi szabályok szerint |

A tulajdonosválasztás és az XP-/nyersanyag-összesítő minden nézetben egyértelmű legyen.
A készlet kezdetben lehet fejléc és részletpanel; nem szükséges külön negyedik képernyő.
A pajzs meglévő tulajdonát és felszerelését ugyanebből a műhelyből továbbra is kezelni kell.

### Egy fegyverkártya kötelező adatai

- Név, rövid taktikai szerep és aktuális harci hatás.
- Állapot: **ismeretlen / feltételre vár / technológia megvan / gyártható / megszerezve**.
- A megszerzés pontos forrása: hadjárat, küldetés vagy recept.
- Hiányzó technológia és nyersanyagmennyiség, nem általános „zárolt” felirat.
- Megszerzett fegyvernél a forrás; régi tulajdonnál „Korábban megszerzett”.
- Mentési hiba és folyamatban lévő tranzakció jelzése.

Példa: **„Lézer – technológia megszerezve; gyártási alapanyag hiányzik”**.
Gombja nem „250 XP”, hanem „Alapanyag forrása” vagy teljes feltételeknél „Legyártás”.

A feloldás nem egyenlő új felszerelési slot bevezetésével. Az első változat
őrizze meg a lövésenkénti fegyverválasztást; a korlátozott loadout külön döntés.
A felület legyen HU/EN/DE nyelven érthető, billentyűzettel és mobilon használható;
státuszt ne csak szín vagy ikon közöljön.

## 7. Technikai terv és állapottulajdonlás

### 7.1. A harci és megszerzési adatok szétválasztása

A stabil fegyver-ID-k és a harci hatások maradjanak közösek.
A hozzáférés külön, explicit szabály legyen: kezdőfegyver, küldetésjutalom vagy gyártási recept.
Ez lehet a fegyverdefiníció része vagy hozzá kapcsolt katalógus; a pontos típust az első
implementáció előtt kell véglegesíteni. Ne jelenjen meg több eltérő feloldási szabály a UI-ban és az engine-ben.

**Kritikus átállási pont:** jelenleg az `unlockedWeapons()` a `cost === 0`
értékből is szabad hozzáférést vezet le, az egységpanel pedig a pozitív ár
alapján listáz fegyvereket. A kampányfegyver árának nullázása ezért
**nem** megfelelő megoldás: ingyenessé vagy láthatatlanná teheti a fegyvert.

A későbbi közös jogosultságfeloldó ugyanazt az állapotot adja:

- a műhelynek és a fegyverkártyáknak;
- a HUD fegyverválasztójának;
- a tényleges lövésindításnak és meccskezdeti készletsnapshotnak.

Az XP-s vásárlási útvonalat a [Game](../../src/game/engine/Game.ts) és a
[közös fegyverszabályok](../../src/game/systems/weapons.ts) szintjén is ki kell vezetni,
nem csak a [WeaponRow](../../src/ui/result/WeaponRow.tsx) gombját elrejteni.

### 7.2. Egyetlen hiteles kampánykészlet

Javasolt hiteles forrás: a meglévő, játékosonkénti IndexedDB-kampánygazdaság
bővítése fegyvertulajdonnal és annak eredetével. Az XP-s profil külön maradhat,
de ne legyen két, egymástól függetlenül írható fegyvertulajdon-lista.

Fogalmi állapot:

```text
Játékos kampánykészlete
  küldetéshaladás
  nyersanyagok
  ismert technológiák
  megszerzett fegyverek + megszerzésük forrása
  egyszeri jutalmak elszámolása
  meglévő vásárlások és pajzsfelszerelés
```

A `Profile.weapons` a migráció bemenete és szükség esetén kompatibilitási
vetület lehet, nem egy második jutalmazási adatbázis. A meccs csak a betöltött,
ellenőrzött tulajdonból kapjon rögzített fegyverkészletet.

### 7.3. Tranzakciók és tartalmi általánosítás

A [kampánytranzakció](../../src/game/state/campaignDatabase.ts) már egy írásban
kezeli a gazdasági állapotot. Ezen belül kell együtt elszámolni:

- sikeres küldetés és jutalomazonosító;
- technológia, nyersanyag, illetve közvetlen fegyverjutalom;
- gyártásnál a készletlevonás és az új tulajdon.

LocalStorage és IndexedDB egymás utáni írása nem közös tranzakció.
A sikeres jutalom ne függjön egy második tároló utólagos sikerétől.
A meglévő generációellenőrzés, több böngészőfüles védelem és explicit mentési hibajelzés megőrzendő.

Jelenleg a tartalombetöltő, a mentésellenőrző, a jutalomkulcs és a
[store](../../src/game/state/veyloraStore.ts) több helyen konkrétan a VEYLORA-hoz kötött.
A több hadjáratos támogatáshoz nem elég új JSON-fájlt létrehozni:
katalógus, hivatkozásellenőrzés, szektoronkénti haladás és recepttípus-bővítés is kell.
A jelenlegi recept csak pajzshatást ismer; fegyvergyártást még nem támogat.

Stabil jutalomazonosító szükséges, például hadjárat + küldetés + jutalomhely.
Tartalomverzió-váltás önmagában ne adja ki újra ugyanazt a jutalmat.
A sikeres mentés után frissüljön a műhely; későn visszaérkező művelet ne írja
felül egy másik kiválasztott játékos készletét vagy egy azóta resetelt kampányt.

## 8. Meglévő mentések, játékmódok és reset

### Migrációs javaslat

| Meglévő állapot | Javasolt kezelés |
| --- | --- |
| XP-ért korábban feloldott fegyver | Megmarad, egyszer migrált „korábbi tulajdon” forrással |
| Korábbi vásárláshoz tartozó technológia hiányzik | Nem találunk ki automatikusan tervrajzot vagy kampányteljesítést |
| Már teljesített régi C3-szektor | Teljesítését megőrizzük; új, korábban nem létező küldetésekért nem jár automatikus jutalom |
| Meglévő VEYLORA-készlet, tervrajz, pajzs | Változatlanul megmarad |
| Nagy XP-egyenleg, de nincs fegyvertulajdon | Önmagában nem ad kampányfegyvert |
| Ismeretlen vagy sérült mentés | Explicit migrációs/betöltési hiba; nem írjuk felül csendben üres készlettel |

A régi fegyver megőrzése és az XP-visszatérítés két külön döntés.
Javaslat: megőrzés, automatikus visszatérítés nélkül. A jelenlegi mentés nem
tárol teljes vásárlási árnaplót, ezért történeti árat nem szabad feltételezni.
A migráció újratöltés és több böngészőfül esetén is idempotens legyen.

### Módok és tulajdonosok

- P1 és P2 saját mentett haladást és fegyverkészletet kap; egyik jutalma nem a másiké.
- Az első offline átállás ne bővítse mellékesen az AI fegyverkészletét.
- Az online mód jelenlegi Standard-korlátozása maradjon, amíg külön snapshot-,
  protokoll- és replay-terv nem készül. A kampányfeloldás nem kész online támogatás.
- A csata közben megváltozó készlet ne módosítsa visszamenőleg az aktív meccs fegyverjogosultságait.

### Resetpolitika – kiadás előtt véglegesítendő

Javaslat: a küldetéshaladás újrajátszási resetje ne törölje a tartós fegyvereket
és az egyszeri jutalmak elszámolását. Így a reset nem termel újabb készletet.
Az XP-reset se vegyen vissza kampányfegyvert.

A gazdasági reset és a teljes mentéstörlés külön megerősítést és pontos
felsorolást igényel: érinti-e az új fegyvereket, a technológiákat és a korábbi tulajdont?
Ezt nem szabad egy meglévő resetgomb jelentésének észrevétlen megváltoztatásával bevezetni.

## 9. Megvalósítási sorrend és kiadási kapu

Ez függőségi sorrend, nem új, párhuzamos státuszlista.

| Lépés | Eredmény | Előfeltétel / határ |
| --- | --- | --- |
| 0. Döntések | Jutalommátrix, tulajdonforrás, migráció és módhatárok jóváhagyva | A 11. fejezet nyitott kérdései |
| 1. Adatalap | Több hadjáratos katalógus, mentésbővítés, közös hozzáférés, migrációs tesztek | Meglévő VEYLORA és profilok megőrzése |
| 2. Páncéltörő-próba | FORGE belső nézet, kis küldetéssor, egyszeri készfegyver-jutalom, forráskártya | Új motor és új nyersanyagrendszer nélkül |
| 3. Műhely és gyártás | Technológia/nyersanyag állapotok, recept és forrásra navigálás | A próba tapasztalatai és ellenőrzött készletköltségek |
| 4. További hadjáratok | Gyújtólövedék, Lézer és Célkövető saját megszerzési útja | Mindegyikhez teljesíthető tartalom és jutalom |
| 5. Éles átállás | A négy XP-s fegyvervásárlás kivezetve, migráció és új útmutató kiadva | Új mentésből mind a négy fegyver elérhető a tervezett úton |

Az első próba belső, kapcsolható szelet legyen. **Ne előbb szüntessük meg az
XP-s megszerzést, majd később találjuk ki a helyettesítő küldetéseket.**
Az éles váltásban ne maradjon megszerezhetetlen különleges fegyver.
A harci sebzés, égési idő, célkövetési fizika és lőszerfogyasztás átírása nem része ennek a munkának.

## 10. Elfogadási feltételek

- Új mentés: csak a Standard indul hozzáférhetőként; sok XP sem oldja fel a négy különleges fegyvert.
- Az ár eltávolítása vagy nullázása nem teszi ingyenessé a kampányfegyvereket.
- A fegyver forrása és az összes hiányzó feltétel a műhelyből megismerhető.
- A forrásgomb a megfelelő hadjárat és küldetés nézetét nyitja meg.
- Csak teljesített célfeltétel ad jutalmat; a labor elvesztése nem minősül technológiaszerzésnek.
- Ismételt győzelem, render, újratöltés, reset vagy két böngészőfül nem dupláz jutalmat.
- Sikertelen mentés nem ad tulajdont és nem von le végleg készletet; a hiba látható.
- A recept hiányzó technológiánál vagy készletnél nem hajtható végre közvetlen parancshívással sem.
- A jutalom és gyártás az aktív emberi tulajdonoshoz kerül, P1/P2 között nem szivárog át.
- A régi fegyverek és a VEYLORA-pajzs megmaradnak, nincs újabb díj vagy kitalált kampányteljesítés.
- A térképi és technológiai gráf körmentes; minden fegyverhez van elérhető, önmagát nem igénylő út.
- A költségterv a pajzs és más korai vásárlások után sem okoz végleges erőforráshiányt.
- A Standarddal induló játékos és a régi, már fejlett profil is végigpróbálható.
- Az offline átállás nem kapcsol be nem támogatott AI-/online fegyverhasználatot.
- A műhely és térkép HU/EN/DE nyelven, billentyűzettel és mobilnézetben is érthető.

## 11. Következő egyeztetés: mit kell eldönteni?

1. **Jutalommátrix:** elfogadható-e a FORGE → AP, DELTA → gyújtó,
   VANGUARD → lézer, PRIME → célkövető hozzárendelés?
2. **Megszerzési forma:** melyik kész jutalom, melyik technológia + gyártás?
3. **Tartalomméret:** a háromküldetéses AP-próba megfelelő első szelet-e?
4. **Gazdaság:** milyen kevés számú nyersanyag és garantált készlet fedezi a recepteket?
5. **Migráció:** megmaradnak-e a régi fegyverek visszatérítés nélkül?
6. **Reset:** pontosan mely állapotokat törli a haladási, gazdasági és teljes reset?
7. **Műhely:** megfelelő-e a három nézet, a jelenlegi lövésenkénti választás megtartásával?

Az XP-s fegyvervásárlás kiváltása és a kampányközpontú irány nem újra felteendő
kérdés; a fenti részletszabályok és a szállítási határok igényelnek döntést.

**Ajánlott folytatási feladat:** az AP-próba konkrét küldetéslapjainak és
jutalomadatainak megtervezése, majd a migrációs szerződés véglegesítése.
Ezután indulhat az adatalap implementációja; a teljes négyfegyveres átállás
előtt a kis csatakör legyen végigjátszható és hibás mentéssel is ellenőrzött.
