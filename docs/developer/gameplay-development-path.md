# Játékmenet-fejlesztési útvonal

Ez az ábra a jelenlegi játékmeneti alapot és a tervezett fejlesztési ágakat
mutatja, a fő függőségekkel. Nem dátumozott ütemterv és nem vállalt
végrehajtási sorrend: a központi státuszt a [roadmap](./roadmap.md), a részletes
progressziós és fegyvertervet a [gameplay-elemzés](./gameplay-progression.md)
és a [végrehajtási TODO](./gameplay-progression-todo.md) tartalmazza.

```mermaid
flowchart TD
    subgraph NOW["Jelenlegi, működő alap"]
        CORE["Körökre osztott ballisztikus csata<br/>fix lépésű fizika · rombolható terep<br/>pajzs/páncél · fejlesztések"]
        PLAY["Játékmódok<br/>gyorscsata · hot-seat/online · offline AI"]
        CAMPAIGN["Campaign Map C1–C3 kész<br/>5 szektor · elágazó útvonal<br/>helyi mentés · replay"]
        SYNC["Determinista multiplayer/replay alap<br/>közös seed · revision eseménynapló"]
        CORE --> PLAY
        CORE --> CAMPAIGN
        PLAY --> SYNC
    end

    subgraph NEXT["Következő validáció és közös szabályalap"]
        VALIDATE["C3 játékpróba és regresszió<br/>szektorbalansz · mobil/akadálymentesség"]
        C4["C4 / Sector Operations<br/>környezeti modifikátorok<br/>szektorválasztás és közös setup"]
        RULES["Verziózott meccsszabályok<br/>közös feloldás: lövés · előnézet · AI"]
        CAMPAIGN --> VALIDATE
        CAMPAIGN --> C4
        SYNC --> RULES
        C4 --> RULES
    end

    subgraph WEAPONS["Taktikai felszerelés – elfogadott tervezési irány, külön roadmap-prioritás"]
        CATALOG["Közös fegyverkatalógus<br/>stabil ID-k · egyedi fegyverjellemzők"]
        UNLOCK["XP-s feloldások és saját loadout<br/>Standard kezdőfegyver · nincs fogyó lőszer"]
        TYPES["Első lövedékcsomag<br/>Standard · HE · AP · Seismic<br/>Smart Missile opcionális"]
        FIRE["Egységes fegyveres lövés<br/>Game · AI · röppálya-előnézet"]
        ONLINE["Saját feloldott készlet meccsenként<br/>offline · online · kampánytérkép"]
        VERIFY["Replay/szinkron ellenőrzés<br/>snapshot · szabályverzió · hibás ID elutasítása"]
        ENERGY["Későbbi energiafegyver-család<br/>lézer · energiasokkoló · energiagömb · villám"]
        CATALOG --> UNLOCK
        CATALOG --> TYPES
        UNLOCK --> ONLINE
        TYPES --> FIRE
        RULES --> FIRE
        FIRE --> VERIFY
        ONLINE --> VERIFY
        VERIFY --> ENERGY
    end

    subgraph TACTICAL["További taktikai ágak"]
        ABILITIES["Orbitális képességek<br/>slotok · töltetek · akcióköltség"]
        CLASSES["Szárazföldi egységosztályok<br/>eltérő statok és fegyverzet"]
        TERRAIN["Terep v2<br/>lebegő szigetek · esés/sebzés"]
        RULES --> ABILITIES
        FIRE --> CLASSES
        C4 --> TERRAIN
    end

    subgraph LONGTERM["Hosszú távú stratégiai játék"]
        subgraph SIEGE_MAP["Következményes ostromhadjárat – első játszható térképszelet"]
            direction LR
            SIEGE_ALPHA["ALPHA-01<br/>meglévő tréning"]
            RECON["Opcionális felderítés<br/>felfedi a kulcscélt"]
            DELTA["DELTA-08<br/>helyi felszabadítás<br/>FORGE-17 később is választható"]
            FORGE["FORGE-17 · kulcsszektor<br/>ostromplatform megsemmisítése<br/>ENERGY_NODE + CIVIL_HABITAT védelme"]
            OUTCOME["Szerződés 50/25/25<br/>1,5 egység játékos-kárkeret<br/>újrapróbálás: pont gyűlik · jutalom egyszer, lezáráskor<br/>ENERGY_NODE → következő kulcscsata pajzsa"]
            VANGUARD["VANGUARD-12<br/>kulcsszektor után"]
            PRIME["PRIME-00 · kötelező kampányzárás<br/>ENERGY_NODE + CIVIL_HABITAT felszabadítása"]
            SIEGE_ALPHA --> RECON
            SIEGE_ALPHA --> DELTA
            SIEGE_ALPHA --> FORGE
            FORGE --> OUTCOME --> VANGUARD --> PRIME
        end
        CAMPAIGN_OPS["Single-player hadjárat<br/>küldetések · szektorfoglalás · stratégiai AI"]
        ROGUE["Roguelite útvonalak<br/>run-állapot · kockázat/jutalom"]
        ONLINE_CAMPAIGN["Közös online kampány<br/>külön backend- és hitelesítési projekt"]
        CAMPAIGN --> CAMPAIGN_OPS
        CAMPAIGN --> SIEGE_ALPHA
        SIEGE_MAP --> CAMPAIGN_OPS
        C4 --> CAMPAIGN_OPS
        ABILITIES --> CAMPAIGN_OPS
        CLASSES --> CAMPAIGN_OPS
        CAMPAIGN_OPS --> ROGUE
        SYNC --> ONLINE_CAMPAIGN
    end

    subgraph PARALLEL["Párhuzamos, játékszabályt nem módosító ág"]
        VISUAL["Siege Platform vizuális irány<br/>HUD · animáció · shaderek · effektek"]
        QUALITY["Eszközös ellenőrzés<br/>mobil · reduced-motion · teljesítmény"]
        VISUAL --> QUALITY
    end

    classDef done fill:#7ec588,stroke:#27864a,color:#102a18
    classDef validate fill:#fff3bf,stroke:#c18b00,color:#382900
    classDef proposed fill:#6d55a7,stroke:#7148b8,color:#251347
    classDef long fill:#7bb0eb,stroke:#52677f,color:#172332
    classDef parallel fill:#dff3f5,stroke:#27818b,color:#10282b

    class CORE,PLAY,CAMPAIGN,SYNC done
    class VALIDATE,C4,RULES validate
    class CATALOG,UNLOCK,TYPES,FIRE,ONLINE,VERIFY,ENERGY,ABILITIES,CLASSES,TERRAIN proposed
    class SIEGE_ALPHA,RECON,DELTA,FORGE,OUTCOME,VANGUARD,PRIME proposed
    class CAMPAIGN_OPS,ROGUE,ONLINE_CAMPAIGN long
    class VISUAL,QUALITY parallel
```

## A diagram olvasása

**2026-11-07: elfogadott következő gameplay-prioritás a következményes
ostromhadjárat Phase 1 MVP-je.** A diagramon a hosszú távú hadjárathoz
kapcsolódik, de ez a következő gameplay-próba: nem előfeltétele a teljes C4-,
fegyver-, orbitális vagy egységosztály-csomag. A rendszer a Campaign térképhez
tartozik, nem a sima offline módhoz. Az első térképszelet az `ALPHA-01`
tréningből, opcionális felderítésből és két megszállt célágból áll: a
`DELTA-08` helyi eredményt ad; a `FORGE-17` a felderítéssel felfedhető
kulcsszektor, amelynek felszabadítása nyitja meg a `VANGUARD-12`-t. A
felderítés kihagyható, és egyik célág teljesítése sem zárja el a másikat.
A módosított feloldás már működik: csak `FORGE-17` nyitja meg
`VANGUARD-12`-t, majd `PRIME-00` harci győzelme zárja a kampányt.
`FORGE-17` és `PRIME-00` egyaránt kötelező, védendő létesítményes szektor.
A régi C3 OR-útvonalon már teljesített szektorok megmaradnak a migráció során;
korábbi épületkárt nem állítunk elő ezekből.

`FORGE-17`-ben az ostromplatform a fő cél, az `ENERGY_NODE` és
`CIVIL_HABITAT` védendő szerződéses objektum; a 50/25/25 súlyok csak erre a
küldetésre vonatkoznak. A szerződéses kredit és XP a folyamatos pontszámmal
lineárisan skálázódik, míg a harci XP külön marad; a kredit Phase 1-ben csak
jelentés, elkölthető kampányegyenleg későbbi terv. A játékos okozta objektumkár
az 1,5 súlyozott egységű kampánykeretet fogyasztja, AI-kár nem csökkenti sem
a szerződést, sem ezt a keretet. Az `ENERGY_NODE` fizikai állapota — AI-kár
esetén is — a következő kulcscsata maximális pajzsát módosítja (+10/0/−10%).
Vereség, döntetlen vagy csataelhagyás nem szabadítja fel a szektort, de
elmenti az objektumállapotot és a játékos kárát. Az eredményképernyőn ilyenkor
csak előzetes szerződéspont látszik; az újrapróbálások kárai összeadódnak, a
szerződéses jutalom pedig csak a küldetés végleges lezárásakor, egyszer jár.
A kampányreset törli az új kampányadatokat, az XP-profilt és a fejlesztéseket
viszont megtartja.
**Fejlesztési állapot (2026-11-07):** az objektumállapot, a robbanási
sebzés, a játékoskár-követés és a pajzshatás tesztelt logikai alapja elkészült.
A jóváhagyott reaktor és civil kupolatelep már megjelenik a `FORGE-17` és `PRIME-00`
Campaign csatában, robbanásból sebződik, HP-ja és állapota a HUD-on is
látszik. A romok többé nem sebződnek; az épületek esési sebzés nélkül követik
a terepfelszínt. A kampánykár-mentés, szerződéselszámolás és pajzshatás
bekötése még hátravan; új csata jelenleg visszaállítja az objektumok HP-ját.
A pozíciókat új csatánként a meccs seedjéből, külön véletlenszámsorral
választjuk szektoronként öt, egymással és az induló tankokkal nem átfedő
helyből. Azonos seed azonos elrendezést ad; különböző seednél az elrendezés
ismétlődhet. A térkép fejléce alatt külön blokk magyarázza a kampány célját.
Előbb az ostromhelyzetet és a kampánykövetkezményt kell igazolni játékpróbával.
Részletes terv: [11. fejezet](./gameplay-progression.md#11-következményes-ostromhadjárat);
végrehajtás: [TODO, 6A](./gameplay-progression-todo.md#6a-következményes-ostromhadjárat--első-játszható-próba).

- **Zöld:** megvalósított alap. A Campaign Map C3 működik, de további
  játékpróba és eszközös ellenőrzés még szükséges.
- **Sárga:** következő validációs/közös szabályalap; a C4 és a verziózott
  konfiguráció részletes döntései még nyitottak.
- **Lila:** tervezett, még nem implementált bővítés. A fegyvereknél az
  implementáció és a központi roadmap-prioritás még nincs jóváhagyva; a
  következményes ostromhadjárat Phase 1 viszont elfogadott következő gameplay-próba.
- **Szürke:** hosszú távú stratégiai irány, külön specifikációt igényel.
- **Türkiz:** a gameplay-szabályoktól elkülöníthető vizuális és eszközminőségi
  munka.

A fegyvercsomagban minden fegyver saját alapkarakterisztikát kap; a játékos
Standard Shell-lel indul, további fegyvereket XP-ért old fel, és a saját
feloldott készletét viszi offline, online és kampánytérképes meccsre. A
Robbanófej upgrade ettől különálló marad. Fegyverenként külön XP-fejlesztési ág
nem része az első csomagnak; később csak új taktikai döntést adó fejlesztés
indokolt.
