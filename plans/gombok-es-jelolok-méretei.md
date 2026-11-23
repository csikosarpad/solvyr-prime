# Gombok és jelölők — ajánlott méretek

**Projekt:** 2D tank tüzérségi játék — Settings / Játékosok felület
**Dátum:** 2026. november 20.
**Nézetek:** mobil és desktop

---

## 1. Mértékegységek

Minden érték **logikai (CSS) pixelben** értendő. Desktopon a fix `px` rendben van; mobilon a betűméretet érdemes `rem`-ben megadni, hogy a rendszer szintű szövegnagyítás ne törje el az elrendezést.

| Környezet | Alapszabály |
|---|---|
| Desktop | 32–40 px a kattintható elemek magassága |
| Mobil | 44 px a minimum érintési célfelület |

Az Apple 44 pt-t, a Google 48 dp-t ír elő minimális érintési célfelületként. Ez alá csak akkor szabad menni, ha a szomszédos elemek között legalább 8 px a hézag.

---

## 2. Érintési célfelületek

| Vezérlő | Desktop | Mobil | Megjegyzés |
|---|---|---|---|
| Gomb (elsődleges) | 36–40 px magas | 48 px magas | mobilon teljes szélesség ajánlott |
| Gomb (másodlagos) | 32–36 px | 44 px | |
| Ikon-gomb (×, vissza) | 32 × 32 px | 44 × 44 px | a látható ikon 20 px lehet, a célfelület 44 |
| Kapcsoló (toggle) | 40 × 22 px | 44 × 26 px | a mozgó rész 18–20 px |
| Szegmentált kapcsoló | 32 px magas | 44 px magas | pl. Gép / Ember |
| Csúszka sáv | 4–6 px vastag | 6–8 px vastag | a fogantyú 16–20 px |
| Csúszka célfelülete | 24 px | 44 px | a fogantyúnál mindig nagyobb a koppintási terület |
| Accordion sor | 44–48 px magas | 52–56 px magas | |
| Szövegmező (játékosnév) | 36 px magas | 44–48 px magas | |
| Listaelem | 40 px magas | 48 px magas | |

---

## 3. Színminták (swatch)

| Elem | Desktop | Mobil |
|---|---|---|
| Kiválasztott szín (nagy) | 48–56 px | 56–64 px |
| Választható szín (kicsi) | 24–28 px | 28–32 px |
| **Koppintási terület** | 32 px | **44 px** |
| Színek közötti hézag | 8 px | 10–12 px |

**Kulcsszabály:** a látható minta és a koppintási terület két külön méret. Egy 28 px-es kör mobilra kicsi, de ha körülötte `padding`-gel 44 px-re nő a célfelület, kényelmes lesz — és a minták vizuálisan nem híznak.

Javasolt megvalósítás:

```css
.swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  /* a koppintási területet padding adja, nem a méret */
  padding: 8px;
  box-sizing: content-box;
  background-clip: content-box;
}
@media (min-width: 768px) {
  .swatch { width: 24px; padding: 4px; }
}
```

---

## 4. Kijelölés jelölése

| Elem | Érték |
|---|---|
| Kijelöletlen szegély | 1 px, 30% átlátszóság |
| Kijelölt: belső gyűrű | 2 px, sötét (a háttér színe) |
| Kijelölt: külső gyűrű | 2 px, világos (fehér) |
| Kijelölt: méretarány | 1,15–1,25× |
| Fókusz-gyűrű (billentyűzet) | 2 px, elkülönülő szín, 2 px offset |

**Miért dupla gyűrű:** egyetlen jelzés mindig elveszik. Fehér mintán a világos gyűrű tűnik el, fekete mintán a sötét. A kettő együtt minden háttéren látszik, és a méretnövelés a második, tartalék jelzés.

A **szerep** (fő szín / kiegészítő szín) és az **állapot** (kijelölt / nem kijelölt) két külön jel legyen. A szerepet a swatch formája hordozza (telt kör = fő szín, gyűrű = kiegészítő szín), az állapotot a kontrasztgyűrű.

---

## 5. Távolságok

| Elem | Desktop | Mobil |
|---|---|---|
| Sorok közötti hézag | 8–12 px | 12–16 px |
| Szekciók közötti hézag | 24–32 px | 24–32 px |
| Panel belső margó | 16–20 px | 16 px |
| Kártyák közötti hézag | 12–16 px | 12–16 px |
| Gombok közötti hézag | 8–12 px | 12 px |
| Panel sarok-lekerekítés | 8–12 px | 12–16 px |
| Gomb sarok-lekerekítés | 6–8 px | 8–10 px |

---

## 6. Tipográfia

| Elem | Desktop | Mobil |
|---|---|---|
| Címke (kis kapitális) | 11–12 px, `letter-spacing` 0.06em | 12–13 px |
| Leíró szöveg | 12–13 px, halványabb (60–70% átlátszóság) | 13–14 px |
| Érték (jobb szélen) | 12–13 px, halványabb | 13–14 px |
| Szekciócím | 14–16 px | 15–17 px |
| Képernyőcím | 18–22 px | 18–20 px |

A cím legyen egyenes és visszafogott — ne dőlt, ne ragyogó, ne a képernyő legnagyobb eleme. A leíró szöveg **kisbetűs**, halványabb és kisebb, mint a címkék: így a szem el tudja különíteni, mi a cím és mi a magyarázat.

---

## 7. Állapotok

| Állapot | Megjelenés |
|---|---|
| Aktív / normál | telt vagy körvonalas, normál átlátszóság |
| Kijelölt | kontrasztgyűrű + méretnövelés |
| Letiltott | 30–40% átlátszóság, `cursor: not-allowed`, nem reagál |
| Veszélyes művelet | piros körvonal, halvány piros háttér |
| Fókusz (billentyűzet) | 2 px gyűrű, 2 px offset, minden vezérlőn |

**A letiltott gomb legyen tényleg letiltott.** A „Kijelöltek törlése" gomb addig, amíg nulla jelölés van, 30–40% átlátszósággal, halványan jelenjen meg, és ne reagáljon kattintásra. Ez önmagában megelőzi a véletlen üres törlést.

---

## 8. Touch-specifikus szabályok

1. **44 px a mobil minimum** minden kattintható elem célfelületén.
2. **A célfelület legyen nagyobb, mint a látható elem** — a körülötte lévő láthatatlan dobozt méretezd.
3. **Soha ne hover-re bízz állapotot.** Mobilon nincs hover; a kijelölést, az aktívat és a letiltottat mindig a vezérlő saját megjelenése hordozza.
4. **A csúszka fogantyúja** legyen legalább 16–20 px láthatóan, a koppintási területe 44 px.
5. **A modal mobilon alsó lap (bottom sheet)** legyen, ne középre úszó kártya — közelebb van a hüvelykujjhoz.
6. **Kerüld a `hover`-alapú lenyíló menüket** mobil nézetben; koppintásra nyíljanak.

---

## 9. Összefoglaló — a legfontosabb öt szám

| Érték | Mire |
|---|---|
| **44 px** | mobil érintési célfelület minimuma |
| **48 px** | mobil elsődleges gomb magassága |
| **28 px** | választható színminta átmérője (mobilon 32) |
| **8 px** | minimum hézag a szomszédos célfelületek között |
| **2 px** | kontrasztgyűrű vastagsága kijelölt állapotban |
