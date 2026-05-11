# ND1 Funkcionalumo Realizacijos Dokumentacija
> Autorius: JV (Jarek)

Šis dokumentas paprasta, neprogramuotojams suprantama kalba aprašo, kokie nauji funkcionalumai buvo sukurti „Betcha“ programėlėje, kodėl jie naudingi vartotojams ir kur tiksliai sistemoje jie yra įdiegti.

Visi failai kode yra specialiai pažymėti (pvz., `// FR-1:`, `// UR-1:` bei autoriaus inicialais `JV`), todėl programuotojams juos labai lengva surasti.

---

## 1. Naujoviški pranešimai ekrane (Toast Notifications) - FR-1

**Ką tai daro?**
Anksčiau, kai programėlėje paspausdavote mygtuką (pavyzdžiui, nusipirkdavote prekę iš parduotuvės), ekrano viduryje iššokdavo didelis standartinis telefono langas, kurį reikėdavo atskirai uždaryti spaudžiant „OK“. Mes tai pakeitėme. Dabar, sėkmingai atlikus veiksmą, ekrano viršuje gražiai iščiuožia nedidelis, spalvotas pranešimas (vadinamas „Toast“). Jis pabūna ekrane 3 sekundes ir pats sklandžiai pasislepia.

**Kokia iš to nauda?**
Vartotojo patirtis tampa daug malonesnė ir greitesnė. Žmogus nėra pertraukiamas nuo savo veiklos, jam nereikia spaudinėti papildomų mygtukų norint uždaryti pranešimą. Žalia spalva reiškia sėkmę, o raudona – klaidą (pavyzdžiui, neužtenka taškų).

**Kur tai padaryta sistemoje?**
- Sukūrėme specialius failus (`ToastNotification.tsx` ir `ToastProvider.tsx`), kurie atsakingi už pranešimo piešimą ekrane ir animacijas (iščiuožimą ir pasislėpimą).
- Ši sistema įjungta ant visos programėlės pagrindo (`_layout.tsx`), todėl dabar bet kuriame programėlės lange galima iškviesti pranešimą.
- Pakeitėme parduotuvės (`shop.tsx`) ir statymų (`bet.tsx`) ekranus, kad jie naudotų šią naują sistemą.

---

## 2. Išmani užduočių paieška (SearchBar) - FR-2

**Ką tai daro?**
Statymų ekrane pridėjome paieškos laukelį, kuriame galima ieškoti konkrečių užduočių (quest'ų). Ypatingas dalykas čia yra technologija, vadinama „debounce“ (delsimas). Kai vartotojas veda žodį, pavyzdžiui, „Krepšinis“, programėlė neieško raidžių „K“, paskui „Kr“, paskui „Kre“ atskirai. Ji palaukia mažą dalį sekundės (300 milisekundžių) po paskutinio mygtuko paspaudimo ir tik tada atlieka paiešką su pilnu žodžiu.

**Kokia iš to nauda?**
Tai nepaprastai padidina programėlės greitį ir taupo vartotojo interneto duomenis bei telefono bateriją. Jei programėlė ieškotų po kiekvienos įvestos raidės, ji nuolat strigtų bandydama atnaujinti sąrašą. Be to, paieškos laukelyje atsiranda mažas „X“ mygtukas, leidžiantis vienu paspaudimu ištrinti visą tekstą.

**Kur tai padaryta sistemoje?**
- Sukurtas naujas paieškos komponentas (`SearchBar.tsx`), kuriame įrašyta minėta laukimo (laikmačio) logika.
- Šis komponentas įdėtas į statymų ekraną (`bet.tsx`), kur vartotojai mato visų užduočių sąrašą.

---

## 3. Vartotojo veiklos istorija (Activity Log) - UR-1

**Ką tai daro?**
Tai lyg banko sąskaitos išrašas, tik skirtas žaidimo taškams. Vartotojo profilyje atsirado nauja skiltis, kurioje rodoma viskas, ką jis neseniai darė: už ką gavo taškų (pvz., atliko užduotį ar laimėjo lažybas) ir kur juos išleido (pvz., pirko parduotuvėje). Šalia kiekvieno veiksmo rodoma ikona (emoji), data, laikas ir taškų pokytis (žaliai, jei taškai gauti, raudonai – jei išleisti).

**Kokia iš to nauda?**
Skaidrumas. Vartotojams nebereikia spėlioti, kur dingo jų taškai arba ar jiems buvo sumokėta už atliktą užduotį. Viskas aiškiai matoma vienoje vietoje chronologine tvarka.

**Kur tai padaryta sistemoje?**
- **Serverio pusėje (Backend):** Sukurta speciali funkcija (`userController.ts` ir `userRoutes.ts`), kuri iš duomenų bazės ištraukia 20 paskutinių vartotojo veiksmų, juos iššifruoja (priskiria ikonėles ir lietuviškus pavadinimus) ir saugiai perduoda programėlei.
- **Programėlės pusėje (Frontend):** Sukurtas modulis (`useActivity.ts`), kuris atsisiunčia šiuos duomenis iš serverio, ir vizualinis komponentas (`ActivityLog.tsx`), kuris juos gražiai nupiešia ekrane. Viskas atvaizduojama profilio lange (`profile.tsx`).

---

## 4. Automatinis greičio matuoklis serveryje - NFR-1

**Ką tai daro?**
Mes sukūrėme nematomą, bet labai svarbų „chronometrą“ pagrindiniame programėlės serveryje. Kiekvieną kartą, kai programėlė paprašo informacijos iš serverio (pvz., parsiųsti užduotis), šis chronometras pamatuoja, kiek tiksliai milisekundžių užtruko atsakyti. Jei serveris užtrunka ilgiau nei pusę sekundės (500 milisekundžių), sistema automatiškai siunčia įspėjimą (WARN log'ą) administratoriams. 

**Kokia iš to nauda?**
Tai užtikrina, kad programėlė visada veiktų greitai ir nestrigtų. Programuotojai bus automatiškai informuoti apie lėtėjančią sistemą ir galės ją pataisyti dar prieš tai, kai vartotojai pradės skųstis. Taip pat kiekvienas atsakymas iš serverio dabar gauna specialią žymę (`X-Response-Time`), leidžiančią bet kam patikrinti, kaip greitai serveris veikia.

**Kur tai padaryta sistemoje?**
- Serveryje sukurtas specialus stebėjimo mechanizmas (`responseTime.ts`). Jis sumontuotas pačioje serverio širdyje (`app.ts`), todėl pro jį praeina absoliučiai visos užklausos. 
- Mechanizmas naudoja labai tikslų serverio laikrodį (`process.hrtime`) mikrosekundžių tikslumui užtikrinti.
