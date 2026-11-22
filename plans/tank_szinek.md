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

### 2.3. A megkülönböztethetőség garantált

A `ΔL` küszöb alá nem lehet menni. A rendszer a határon megállítja a csúszkát; a tiltott sáv vizuálisan elérhetetlen.

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
- **Alapérték:** `ΔL = 0,40`
- **Tartomány:** `ΔL ∈ [0,25 … 0,70]`
- **A csúszka címe:** `TÁVOLSÁG A PÁNCÉLTÓL`, jobbra a `ΔL` értékkel

### 4.1. A küszöb viselkedése

A `ΔL = 0,25` alatti sáv elérhetetlen. A csúszka sávján ezen a ponton egy jelölő (stop marker) látszik, és a küszöb alatti rész halványított.

- A fogantyú a küszöbnél megáll, nem csúszik tovább.
- Ekkor megjelenik egy figyelmeztető ikon rövid szöveggel: „A jelzés beleolvad a páncélba”.
- A szöveg 2 másodperc után elhalványul, de a jelölő megmarad.

### 4.2. A páncél és a jelzés összefüggése

Ha a játékos a páncél világosságát úgy állítja, hogy a meglévő jelzés `ΔL`-je a küszöb alá kerülne, akkor:

1. A jelzés világossága automatikusan követi a páncélt, hogy a `ΔL` a küszöbön maradjon.
2. A jelzés csúszkája a küszöbhöz ugrik.
3. Ugyanaz a figyelmeztetés jelenik meg.

Így a páncél állítása soha nem teszi olvashatatlanná a jelzést.

## 5. Visszaállítás

Három szint létezik, amelyek mindegyike megerősítés nélkül visszavonható. A művelet nem adatvesztést, csak beállításmódosítást jelent.

| Szint | Hely | Hatás |
|---|---|---|
| Mező | A csúszka melletti ↺ ikon | Az adott csúszka visszaáll az alapértékre |
| Játékos | A P1 / P2 panel fejlécében látható ↺ ikon | Az adott játékos páncélja és jelzése visszaáll az alapértékre |
| Globális | A Settings alja, `SZÍNEK VISSZAÁLLÍTÁSA` gomb | Mindkét játékos mindkét színe visszaáll az alapértékre |

> A globális gomb letiltott, ha minden érték már az alapértéken van.

## 6. Élő előnézet

A panel alján a tankelőnézet mindkét színt egyszerre mutatja. A beállítás közben az előnézet azonnal frissül — ez a felület egyetlen visszajelzése arról, hogy a két szín együtt hogyan néz ki.

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
    "lightness": 0.72
  },
  "marking": {
    "paletteIndex": 0,
    "deltaL": 0.44
  }
}
```

- Csak ez a hat érték mentődik játékosonként.
- A jelzés tényleges világossága számítással áll elő:  
  `L_marking = clamp(L_armour ± ΔL, 0.15, 0.85)`
- A mentés lokális — online nem szinkronizálódik, ahogy a jelenlegi felirat is jelzi.

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
