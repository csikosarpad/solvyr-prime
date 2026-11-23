# Solvyr Prime: Siege Protocol – játékosútmutató

A jelenleg elérhető funkciók leírása. Fejlesztési tervek és technikai részletek:
[fejlesztői dokumentáció](../developer/README.md).

## Játékmódok

A nyitóképernyő **START** gombja nyitja meg a főmenüt. A főmenübe visszatérve
nem kell újra belépni; oldalfrissítéskor újra megjelenik a nyitóképernyő.

A főmenüben egy kis, felfelé gördülő **Köszönet** panel sorolja fel az ismert
tartalomforrásokat és alkotókat, kattintható linkekkel. Egérrel fölé állva megáll,
a Megállítás gombbal vagy billentyűzetfókusszal kézzel görgethető listára vált.
Csökkentett mozgás beállítás mellett nem animálódik. Kis kijelzőn a menü alatt található.

- **Hot-seat:** két ember egy eszközön, felváltva vezérli a két tankot.
- **Offline AI:** a Beállításokban a „Gép (AI)” ellenfél választható; P1 az ember, P2 a gép.
  Az ellenfélválasztás a következő meccstől érvényes.
- **Online:** két ember külön böngészőből, szobakódos lobbyval.
- **Műveleti térkép:** külön menügomb, a térképen P1 vagy P2 saját kampánya
  választható; a kiválasztott emberi játékos a másik oldalon álló AI ellen játszik, a gyorscsata
  ellenfélbeállításától függetlenül. Az öt C3-harctér mellett a VEYLORA-03
  szektor is elérhető; az ALPHA-01 teljesítése nyitja meg.
- **VEYLORA-03:** a térkép második szintje, két bolygóval és egy orbitális
  dokkal. A kiválasztott játékos rögzített AI-ellenféllel küzd; a két bolygóküldetés
  szabad sorrendben indítható, a dokk biztosítása ezek után nyílik meg.

A régi kampányban öt seed alapján változó, tükrözött terepprofil van;
VEYLORA két új terepe aszimmetrikus. Egy tanktípus használható.
A gyorscsata/online alap harctere **SECTOR ALPHA-01 / Training Grounds**.
A főmenü az aktuális kampányműveletet mutatja, a felső középső HUD a tényleges csataszektort.
Új csata és visszavágó elején 2,5 másodperces
**SECTOR BRIEFING** mutatja be; ez nem szünetelteti és nem zárolja a játékot.
Online szektorválasztás, környezeti modifikátorok, orbitális képességek, prestige
és stratégiai hadjárat még nincsenek.

### A műveleti térkép használata

Főmenü → Műveleti térkép → szektor kijelölése → Művelet indítása → Csata → Eredmény → Műveleti térkép.
A kiválasztott játékos győzelme teljesíti az adott szektort; vereség és döntetlen nem.
A teljesítés és az elérhető aktuális művelet játékosonként külön mentett,
újratöltés után is megmarad. A régi kampánymentés P1-é, P2 saját haladással indul.

| Szektor | Harctér | Elérés |
| --- | --- | --- |
| ALPHA-01 | Training Grounds – az eredeti hullámos terep | Kezdettől |
| VEYLORA-03 | Bányászati szektor – bánya, kutatótelep és orbitális dokk | ALPHA-01 teljesítése |
| DELTA-08 | Crystal Basin – mély központi medence | Nincs beállítva |
| FORGE-17 | Industrial Expanse – teraszok és rámpák | Nincs beállítva |
| VANGUARD-12 | Defense Grid – árkok és központi gerinc | Nincs beállítva |
| PRIME-00 | Capital Perimeter – védődombok és sekély teknő | Nincs beállítva |

A térképen a dobozok csak a szektorkódot mutatják; a név és leírás a jobb oldali
részletkártyán látható. A VEYLORA-03 csak ALPHA-01 teljesítése után nyílik meg.
A többi felső szektor közti függést még nem határoztuk meg; mindegyik saját
küldetéseket kap, azok egymás közti függései későbbi döntések. A C3-szektorok
jelenleg újrajátszható harcteret adnak; a visszavágó ugyanazt a szektort használja.

Mindegyik szektoron a megszokott gravitáció és szél működik, az AI-tapasztalat közös;
nincs szektorhoz rendelt rögzített AI-nehézség. A régi 1/1 mentés ALPHA teljesítésként
migrálódik, nem ad automatikusan győzelmet a többi szektoron.
Nincs külön kampányjutalom, a megszokott harci XP és +50 győzelmi XP jár.
A gyorscsata győzelme nem teljesít térképes szektort.

Harc közben a „Vissza a térképre” megerősítés után elhagyja a csatát.
Az addig szerzett XP megmarad, de a szektor nem teljesül. A meccsvégi Fejlesztésben
csak az aktuális emberi játékos fejleszthető. Az AI külön profilban kap és
költ XP-t, nem használja egyik emberi profil egyenlegét sem. A profilok és az AI-tapasztalat a
gyorscsatával közösek, külön kampánynehézség még nincs.

A haladás törlése a Beállítások „Játékmenet” szakaszában érhető el: kapcsolókkal
jelölhető ki, hogy az XP és fejlesztések, a kampányhaladás, a VEYLORA-haladás és
kampánygazdaság, illetve az AI-tapasztalat közül mi törlődjön. A törlés megerősítés
után fut le, és mindkét helyi játékosra érvényes.
Tárolási hibánál figyelmeztetés jelenik meg; sikertelen mentés után a kijelzett
haladás csak az aktuális munkamenetben érvényes. Hibás/nem támogatott kampánymentés
esetén az indítás tiltott; a Beállításokban elvégzett kampánytörlés új mentést hozhat
létre, a régi XP megtartásával.
Félbehagyott offline csata refresh után nem folytatható, a művelet újra indítható.

### VEYLORA-03 – első játszható prototípus

Főmenü → Műveleti térkép → ALPHA-01 teljesítése → VEYLORA-03 →
bolygó küldetésének indítása → csata → eredmény. A térkép szektorai az első
szintet, a VEYLORA bolygói és állomása a szektor belső nézetét adják.
A két bolygó sorrendje szabad; a térképen minden teljesített helyszín jelölést
kap. Az orbitális dokk végső biztosító küldetése csak mindkét bolygó
teljesítése után nyílik meg. Az utazás és az újrapróbálás ingyenes.

- **Bányabolygó:** rozsdavörös, lépcsőzetes külszíni fejtés. A könnyű
  küldetéshez az ellenséges tankot kell megsemmisíteni.
- **Kutatóbolygó:** kékesszürke völgyek és központi fennsík. A közepes
  küldetéshez tankgyőzelem és legalább 20/100 kutatóépület-HP szükséges.
  Mindkét fél épületsebzése számít. Minden új próbálkozás teljes épület-HP-val indul.
- **Orbitális dokk:** az aktuális játékos kampánykészlete és a fejlesztésvásárlás
  mellett külön harci küldetésben kell felszabadítani az ellenséges őrségtől.
  Ez a harmadik, szektorzáró művelet.

Tankgyőzelem mellett is elbukhat a kutatótelepi küldetés. Ilyenkor a harci
eredmény és annak XP-je megmarad, de nem jár küldetésteljesítés.
Mindhárom küldetés sikerével VEYLORA biztosított, de továbbra is újrajátszható.
A küldetéshaladás és a gazdaság helyileg, IndexedDB-ben mentődik. Mentési
hibánál figyelmeztetés látszik; az eredményképernyőn a sikertelen
teljesítés-/jutalommentés újrapróbálható. Hibás mentésnél az indítás tiltott;
a helyreállításhoz a Beállítások „Játékmenet” szakaszában törölhető a kampánygazdaság.

- A bánya első sikeres teljesítése **20 ipari ércet** ad.
- A kutatótelep első sikeres, épületvédelmet is teljesítő küldetése
  **anyagtechnológiai tervrajzot** ad. A két jutalom azonnal használható.
- Az állomáson **20 érc és a tervrajz megléte** ellenében egyszer
  megvehető a **Megerősített pajzs**. Csak az érc fogy el.
- A megvett pajzs automatikusan felszerelődik, és az állomáson levehető vagy
  újra felszerelhető. Az XP-alaphoz **20 pajzspontot ad**, majd a teljes összeget
  **10%-kal növeli**: nulla XP-alappal 22 pajzspontot ad. A következő, új
  rendszerű kampánycsatáiban hat a tulajdonosnak; a régi kampány, gyorscsata és PvP változatlan.
  A korábban megvásárolt pajzs is felszerelve marad.
- Az újrajátszás nem ad újabb gazdasági jutalmat, a megszokott XP viszont jár.
  A küldetés teljesítése és a jutalom elszámolása külön látszik.
- **Törlés:** a VEYLORA-haladás és a kampánygazdaság együtt, külön megerősítés
  után törölhető a Beállítások „Játékmenet” szakaszában. A haladás, vagyon,
  fejlesztések és jutalomnyilvántartás együtt törlődik, és a jutalmak újra
  megszerezhetők. Az XP, az XP-fejlesztések és a régi kampány csak akkor törlődik,
  ha a saját águk is ki van jelölve. Másik lapon korábban indult csata nem írhat
  az új gazdaságba.

A korábbi, gazdaság nélküli prototípus haladása átemelődik, de nem ad
visszamenőleges jutalmat. Az első gazdasági jutalomhoz újra sikeresen teljesítsd
az érintett küldetést. Az eredeti prototípusmentés biztonsági másolatként megmarad.
Az IndexedDB elérhetősége szükséges; böngészőadat-törlés a készletet is törli.

**Build nélküli tartalomfrissítés még nem érhető el.** Az új ellenfelek
nem öröklik és nem fejlesztik a másik játékos profilját vagy az AI-memóriát.
A jelenlegi cél a stabil működés; a nehézség és a látvány még finomhangolható.

## A csata menete

A játék körökre osztott. A soron lévő játékos mozoghat a körönkénti mozgáskeretéből,
beállíthatja a löveg szögét és erejét, majd tüzelhet. A szél minden körben változik
és eltéríti a lövedéket. A lövés lezárása után a következő élő játékos jön.

A fegyverek fénycsíkja eltér: a standard a pálya alapszínét követi, a páncéltörő
vékonyabb, kékesfehér, a gyújtólövedék narancsos, a célkövető rakéta zöldes,
a lézer pedig vörös sugarat húz. A Robbanófej fejlesztése szintenként erősebb
izzást ad a standard lövedéknek; a többi fegyver látványát nem módosítja.

A gyújtólövedék után a talaj 5 másodpercig ég. A terepet követő vöröses-narancs
izzás mutatja a zónát; a lángok fölött füst és parázs száll. A csökkentett
mozgású nézetben az izzás és a lángok megmaradnak, animáció nélkül.
A tűz másodpercenként 8 sebzést
okoz minden rajta álló tanknak, a lövő saját tankjának is, függetlenül attól,
ki van soron. A sebzés először a pajzsot, majd a páncélt, végül a HP-t fogyasztja.
A zónából kilépve a sebzés megszűnik, visszalépve folytatódik.
Az AI előrenyomulás és kitérés közben sem hajt újabb égő területre.
Ha tűzben áll, a lövés helyett először menekül: a legrövidebb járható kijárat
felé használja a megmaradt mozgáskeretét, akár a másik játékos köre alatt is.
Ha nincs járható menekülőút vagy elfogyott a kerete, helyben marad, és a saját
körében onnan lő.

A kampányban és a VEYLORA-műveletekben az ellenfél küldetésenként eltérő
speciális fegyvereket használhat. A Standard mindig elérhető számára; lézerrel
csak akkor lő, ha a terep nem takarja a célt. Az ALPHA-01 gyakorlópályán és az
offline gyorscsatában a gép továbbra is csak Standard lövedéket használ.

A győztes a fanfár után három véletlenszerű zárómondat egyikét mondja:
„Ez remek csata volt!”, „Győzni jöttünk!”, „Ránk mindig számíthat, {játékosnév}!”.
A megszólítás a győzteshez beállított játékosnevet használja; a győztes neve
továbbra is külön megjelenik a konzolon.

A terep rombolható; egy robbanás a későbbi mozgást és lövési lehetőségeket is módosítja.
A talajról teljesen leszakadt terepdarabok azonnal eltűnnek. Az oldalról még
megtámasztott túlnyúlások megmaradnak; nincs külön omlási sebzés vagy lehulló törmelék.
A külön háttér-/szikladekorációkat ez nem törli.
A játék a győztest, a lövéseket, az okozott sebzést és a meccsen szerzett XP-t
az eredményképernyőn összesíti.

### Billentyűzet és egér

| Vezérlő | Művelet |
| --- | --- |
| Bal / jobb nyíl | Mozgás; az ellenfél lövedéke alatt kitérés |
| Fel / le nyíl | Lövési erő ±10; Shift mellett ±50 |
| Ctrl + bal / jobb nyíl | Szög ±1°; Shift mellett ±5° |
| Szóköz | Tűz |
| T | Célzástámogatás / röppálya-előnézet |
| M | Globális némítás (minden képernyőn működik) |
| HUD gombok és csúszkák | Mozgás, célzás, tüzelés és hang |

A 0° jobbra, a 180° balra mutat, ezért a Ctrl + bal nyíl növeli a szöget.
A lövés alatt, az ellenfél körében és meccsvégén a harci vezérlés zárolt.
Kivétel a kitérés: az ellenfél lövedékének repülése alatt a védekező tank a saját
körében megmaradt mozgási keretéből elmozdulhat (◀ ▶ vagy a mozgásgombok).
A gépi ellenfél a tapasztalatától függő eséllyel és reakcióidővel szintén kitérhet
az előre jelzett becsapódás elől. Online meccsen nincs kitérés.

### Érintésvezérlés

- A HUD ±1° / ±10 erő gombjai és a mozgásgombok nyomva tartva ismételnek.
- A soron lévő tank közeléből indított húzás iránya a szöget, hossza az erőt állítja.
- Alacsony, fekvő kijelzőn a vezérlők oldalra rendeződnek.
- Mobilnézetben kisebb védelmi műszerek és tömörebb vezérlőpanelek hagynak helyet
  a csatatérnek. A parancsnoki konzol a felső HUD alatt csak a legfrissebb közlést
  mutatja egy sorban, időbélyeg és külön fejléc nélkül; a felolvasás változatlan.
- Indításkor támogatott érintőböngészőben teljes képernyőt és fekvő tájolást kér a játék.
  Ha ezt a böngésző nem támogatja vagy elutasítja, a bezárható tájolási tipp marad.

A fekvő használat ajánlott. Valós iOS Safari / Android Chrome eszközös ellenőrzés
még hátravan; az emulált mobilnézet nem garantál minden telefonon azonos működést.

## Védelem és célzástámogatás

A sebzés sorrendben az **erőtér pajzsot → páncélt → HP-t** csökkenti.
A pajzs a saját kör kezdetén a maximum 20%-ával töltődik vissza, kivéve ha a tankot
a legutóbbi köre kezdete óta találat érte. A páncél nem regenerálódik.
Pajzs és páncél alapból nincs; a Fejlesztés menüben fejleszthetők.

A HUD gyűrűmérőket, a tank fölötti kijelzés vékony állapotsávokat használ.
Pajzs és páncél kijelzése csak akkor látszik, ha az egység rendelkezik velük.

A Célzástámogatás alapból játékosonként **1 töltet meccsenként**.
A fejlesztés szintenként +1-et ad, maximum 4 töltetig. Egy aktiválás az aktuális
kör végéig mutatja a várható röppályát; a töltetek új meccsben visszaállnak.

## XP, Fejlesztés és rendfokozat

A **Fejlesztés** a főmenüből, a műveleti térképről, VEYLORA nézetéből és
az eredményképernyőről érhető el. A Vissza gomb az előző képernyőre visz.
Itt a kiválasztott játékos XP-fejlesztései mellett a saját megvásárolt kampánypajzsa
is levehető vagy felszerelhető; a vásárlás továbbra is a VEYLORA-állomáson
történik. Mindkét játékos fejlesztési panelje látható, de a nem kijelölt oldal
elsötétítve és zárolva jelenik meg. P1 és P2 kampányhaladása, jutalmai és felszerelése különállók.
A pajzs jelenleg csak tulajdonosa új rendszerű kampánycsatáiban hat; online
pajzsszinkron még nincs.

- Az ellenfél pajzsának, páncéljának és HP-jának okozott sebzésért XP jár.
- A győzelem további **50 XP-t** ad.
- XP-ből csaták között páncél, pajzs, sebzés, robbanási sugár, lőtávolság, motor és
  célzástámogatás fejleszthető.
- A hét fejlesztés összesen 31 szintje nulláról **3768 XP-be** kerül.
- A fejlesztések együtt érvényesülnek, nincs egymást kizáró specializáció.
- A kijelzett XP **elkölthető egyenleg**, vásárláskor csökken; életút-XP
  összesítő nincs. Sikertelen profilmentésnél a vásárlás nem történik meg.
- A maximális fejlesztések után az XP tovább nő, de nincs újabb vásárlási lehetőség.

Hot-seat módban mindkét profil fejleszthető. AI-meccs után a másik játékos profilja
helyett az AI-ellenfél fejlesztései és fegyverei látszanak, csak megtekintésre.
Ahol a küldetés rögzíti az ellenfél felszerelését, a beállított páncél és fegyverek
jelennek meg. Online csak a saját profil
módosítható, a vásárlás a meccsvége szinkronizálásáig zárolt.

A HUD rendfokozata 0–5 csillag: embernél a megvásárolt fejlesztések arányát,
AI-nál a meccsekből gyűjtött tapasztalatot jelzi, nem külön XP-szintet.

## Online játék

1. A főmenüben válaszd az **Online játék** lehetőséget.
2. Az egyik játékos hozzon létre szobát a nevével.
3. A másik játékos a szobakóddal csatlakozzon.
4. A host indítsa el a meccset; mindenki csak a saját körében vezérelhet.
5. Meccs után mindenki a saját profilját fejlesztheti, a visszavágót a host indítja.

Mindkét játékosnak azonos játékbuildet kell használnia. Oldalfrissítés után a
böngészőfülben tárolt sessionből a szoba és az eseménynapló visszatölthető, amíg a
session és a szoba érvényes. Ez nem fiókalapú, eszközök közötti felhőmentés.

## Beállítások, hang és mentés

A Beállításokban a **Nyelv**, **Hang** és **Játékosok** csoport külön nyitható
és csukható. Az ellenfél és az AI beállításai a Játékosok csoportban találhatók.

- **Nyelv:** magyar, angol és német. Mentett választás hiányában magyar vagy német
  böngészőnyelv esetén az adott nyelv, egyébként angol indul.
- **Játékosnevek:** P1/P2 neve legfeljebb 16 karakter. Üres névnél az azonosító marad;
  online a lobbyban megadott név az elsődleges.
- **Tankok színe:** P1 és P2 külön választhat fő színt a páncélhoz és a löveghez (acélszürke,
  kék, piros vagy olívazöld) és kiegészítő színt a jelzésekhez. A tankelőnézet
  azonnal mutatja a változást. Mindkét választás
  látszik a következő csatában és a Fejlesztésben; a játékosválasztók továbbra is
  a kiegészítő színt használják. A beállítás helyben mentődik.
  Online a színek csak a saját böngésző megjelenítését módosítják, nem szinkronizálódnak.
  Azonos színek is választhatók, ezért a játékosazonosítókat is érdemes figyelni.
- **Hang:** a fő hang és a Zene, Parancsnok, Effektek csoportok külön-külön
  be/ki kapcsolóval kapcsolhatók; az M billentyű bármely képernyőn némít, és a fő
  hang kapcsolójával azonos állapotot vált. A némítás mindhárom csoportot felülírja.
  A Beállítások **Játék hangereje** csúszkája 0–100% között szabályozza mindhárom hangcsoportot,
  és a választás megmarad újratöltés után. A 100% az eddigi hangkeverésnek felel meg;
  a némítás nem törli a beállított hangerőt. Mindhárom csoport kapcsolója mellett saját
  0–100%-os csúszka van (**Zene / Parancsnok / Effektek hangereje**); a tényleges hangerő
  a központi és a csoport hangerejének szorzata, így a zene halkítható a parancsnok
  halkítása nélkül. A parancsnoki hangerő módosítása megszakítja az aktuális
  felolvasást; a következő közlés már az új hangerőn szól. Mentési hiba esetén figyelmeztetés jelenik meg.
  A háttérzene energysound „Cyberpunk Neon City”; zeneválasztó még nincs.
- **Parancsnoki konzol:** időbélyeges taktikai közlések és böngészős felolvasás.
  A hangok a böngészőtől/operációs rendszertől függnek; P2 magasabban és gyorsabban szól.
  Győzelemkor szintetizált fanfár és győzelmi bemondás hallható.
- **AI:** a tapasztalata a Játékmenet szakasz „AI-tapasztalat” ágával törölhető;
  normál célzása hibázhat, Smart Aim használatakor pontos találó lövést is kereshet.
- **Játékmenet törlése:** kapcsolókkal kijelölhető, hogy az XP és fejlesztések,
  a kampányhaladás, a VEYLORA-haladás és kampánygazdaság, illetve az AI-tapasztalat
  közül mi törlődjön. A törlés megerősítés után fut le, és mindkét játékosra érvényes.

A profilok és beállítások a böngésző helyi tárolójában maradnak meg.
Nincs fiókalapú szinkron; tárolótörlés vagy másik böngésző/eszköz eltérő állapotot jelenthet.
A böngésző korlátozhatja a hang automatikus indítását: támogatott felhasználói gesztus
után indulhat a lejátszás.
