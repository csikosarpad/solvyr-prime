# Specifikáció — Tank színeinek beállítása

## 1. Fogalomtár

| Fogalom | Jelentés |
|---|---|
| Páncél | A tank testének fő színe (hajótest, torony) |
| Jelzés | A páncélon lévő részlet (csík, szám, embléma) színe |
| Paletta | A választható, rögzített színárnyalatok halmaza |
| Világosság (`L`) | A kiválasztott szín világos/sötét értéke, 0–1 között |
| `ΔL` | A jelzés és a páncél világosságértékének különbsége |

## 2. Alapelvek

### 2.1. A színárnyalat kötött, a világosság szabad

A játékos nem szabadon kever színt — egy rögzített palettáról választ, és csak az árnyalatot hangolja. Ezzel nem tud „elrontott” színt előállítani.

### 2.2. A jelzés a páncélból származik

A jelzés sosem független döntés: a páncél világosságához képest ellentétes irányba tolódik.

- Sötét páncél → világosabb jelzés
- Világos páncél → sötétebb jelzés

### 2.3. A világosságkülönbség garantált

A `ΔL` küszöb alá nem lehet menni. A rendszer a határon megállítja a csúszkát; a tiltott sáv vizuálisan elérhetetlen. Ez a számított HSL-színekre vonatkozó korlát, nem garantálja az árnyékolt textúra minden képpontjának látható kontrasztját.

## 3. A páncél beállítása

- **Bemenet:** palettaszín (egy kijelölés) + világosság (0–1)
- **Alapérték:** a paletta középső világosságértéke (`L = 0,50`)
- **Tartomány:** `L ∈ [0,15 … 0,85]`
  - A teljes fekete és teljes fehér tiltott, mert a tank árnyékolása elveszne.
- **A csúszka címe:** `VILÁGOSSÁG`, jobbra igazított százalékértékkel
- **Élő visszajelzés:** a tankelőnézet és a jelzés színe azonnal frissül

## 4. A jelzés beállítása

- **Bemenet:** palettaszín + a páncéltól mért távolság (`ΔL`)
- A csúszka nem abszolút világosságot állít, hanem `ΔL`-t.
- **Irány:** automatikus — a rendszer a páncél `L`-jéhez képest a kontrasztos oldalra tolja.
- **Alapérték:** `ΔL = 0,35`
- **Tényleges tartomány:** `ΔL ∈ [0,25 … ΔL_max]`, ahol
  `ΔL_max = max(L_páncél − 0,15; 0,85 − L_páncél)`. A felső határ a
  páncél világosságától függ, és `0,35–0,70` közé esik.
- **A csúszka címe:** `TÁVOLSÁG A PÁNCÉLTÓL`, jobbra a `ΔL` értékkel

| Páncél világossága | A `ΔL` tényleges tartománya |
|---:|---:|
| 0,15 | 0,25–0,70 |
| 0,30 | 0,25–0,55 |
| 0,50 | 0,25–0,35 |
| 0,70 | 0,25–0,55 |
| 0,85 | 0,25–0,70 |

A jelzés arra az oldalra kerül, ahol több hely van: `L < 0,50` esetén
világosabb, `L > 0,50` esetén sötétebb. `L = 0,50` esetén mindkét
irány megfelel: a jelzés sötétebb. A középérték átlépésekor az irány
azonnal vált, így a jelzés világossága ugrásszerűen változhat.

### 4.1. A küszöb viselkedése

A `ΔL = 0,25` alatti sáv elérhetetlen. A csúszka sávján ezen a ponton egy jelölő (stop marker) látszik, és a küszöb alatti rész halványított.

- A fogantyú a küszöbnél megáll, nem csúszik tovább.
- Ekkor megjelenik egy figyelmeztető ikon rövid szöveggel: „A jelzés beleolvad a páncélba”.
- A szöveg 2 másodperc után elhalványul, de a jelölő megmarad.

### 4.2. A páncél és a jelzés összefüggése

Ha a játékos a páncél világosságát úgy állítja, hogy a meglévő `ΔL`
meghaladná az új `ΔL_max` értéket, akkor:

1. A `ΔL` az új `ΔL_max` értékre csökken, és a jelzés világossága ehhez igazodik.
2. A jelzés csúszkájának felső határa és értéke az új maximumra áll.

A `0,25`-ös minimum minden megengedett páncélvilágosság mellett tartható.
A páncél módosítása önmagában nem csökkenti a `ΔL`-t a minimum alá.

## 5. Visszaállítás

Három szint létezik, amelyek mindegyike megerősítés nélkül visszavonható. A művelet nem adatvesztést, csak beállításmódosítást jelent.

| Szint | Hely | Hatás |
|---|---|---|
| Mező | A csúszka melletti ↺ ikon | Az adott csúszka visszaáll az alapértékre |
| Játékos | A kiválasztott játékos paneljén látható ↺ ikon | Az adott játékos páncélja és jelzése visszaáll az alapértékre |
| Globális | A Settings Játékosok szekciója, `SZÍNEK VISSZAÁLLÍTÁSA` gomb | Mindkét játékos mindkét színe visszaáll az alapértékre |

> A globális gomb letiltott, ha minden érték már az alapértéken van.
> A legutóbbi visszaállítás külön gombbal visszavonható a beállítások nyitva
> tartása alatt; újabb színmódosítás vagy visszaállítás után az előző
> visszavonási lehetőség megszűnik.

## 6. Élő előnézet

Egyetlen tankelőnézet látható, felette a P1 / P2 játékosválasztóval. Az előnézet a kiválasztott játékos mindkét színét egyszerre mutatja, és a beállítás közben azonnal frissül.

## 7. Hozzáférés és érintés

| Elem | Desktop | Mobil |
|---|---:|---:|
| Csúszkasáv | 6 px | 8 px |
| Csúszkafogantyú | 18 px | 22 px |
| Koppintási terület | 32 px | 44 px |
| Stop marker szélessége | 3 px | 4 px |
| Paletta-swatch | 28 px | 32 px |
| Swatch célfelülete | 32 px | 44 px |

## 8. Akadálymentesség

- A csúszka billentyűzettel is állítható (nyilak, 0,05-ös lépések).
- A fókuszgyűrű 2 px vastag és elkülönülő színű.
- A `VILÁGOSSÁG` / `TÁVOLSÁG` értéke szövegesen is megjelenik, nem csak a csúszka állásából olvasható.
- A küszöbnél megállás tényét szöveges üzenet is közli, nem csak a vizuális jelölő.

## 9. Adatmodell

```json
{
  "player": 1,
  "armour": {
    "paletteIndex": 2,
    "lightness": 0.70
  },
  "marking": {
    "paletteIndex": 0,
    "deltaL": 0.40
  }
}
```

- Játékosonként a két palettaválasztás, a páncél világossága és a `ΔL` mentődik.
- A jelzés tényleges világossága számítással áll elő:  
  `L_marking = L_armour ± ΔL`, a 4. szakaszban megadott iránnyal és
  dinamikus felső korláttal.
- A mentés lokális — online nem szinkronizálódik, ahogy a jelenlegi felirat is jelzi.
- A korábban választható fekete és fehér jelzésszín egyetlen semleges
  szürke palettává egyesül; mindkét korábbi választás erre migrálódik.
- Az `L` a palettaszín HSL-világossága. Az árnyékolt tanktextúrán látható
  kontraszt nem egyenlő minden képponton a színértékek `ΔL` különbségével.

## 10. Ellenőrző lista a megvalósításhoz

- [ ] A `ΔL` küszöb (`0,25`) kikényszerítve, nem csak vizuálisan jelezve
- [ ] A páncél állítása automatikusan korrigálja a jelzést
- [ ] Stop marker a csúszka sávján, a küszöb alatti rész halványítva
- [ ] Háromszintű visszaállítás
- [ ] A globális visszaállítás letiltva, ha nincs mit visszaállítani
- [ ] Élő előnézet mindkét színt mutatja
- [ ] 44 px-es célfelület mobilon minden interaktív elemen
- [ ] Szöveges érték és szöveges küszöbüzenet
- [ ] Billentyűzetes vezérlés
