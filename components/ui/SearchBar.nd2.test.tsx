// ══════════════════════════════════════════════════════════════════════════════
// Autorius: JV (Jarek)
// Failas: SearchBar.nd2.test.tsx
// ND2 1-užduotis: Reikalavimais grįstas testavimas — FR-2 SearchBar paieškos sistema
//
// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  SKIRTUMAS NUO ND1 (SearchBar.test.tsx):                                ║
// ║                                                                         ║
// ║  ND1 testai = UNIT testai                                               ║
// ║    → Tikrina ar komponentas techniškai veikia (placeholder, debounce,   ║
// ║      clear mygtukas). Tai „baltos dėžės" požiūris — žiūrime į kodą      ║
// ║      ir tikriname ar kiekviena funkcija daro tai, ką parašėme.          ║
// ║                                                                         ║
// ║  ND2 testai (šis failas) = REIKALAVIMAIS GRĮSTI testai                  ║
// ║    → Tikrina ar komponentas atitinka FR-2 PRIĖMIMO KRITERIJUS (AC).     ║
// ║      Tai „juodos dėžės" (black-box) požiūris — mes NEŽIŪRIME į kodą,   ║
// ║      o tikriname ar sistema elgiasi taip, kaip aprašyta reikalavimuose.  ║
// ║                                                                         ║
// ║  Naudojamos black-box technikos:                                        ║
// ║    • EP (Equivalence Partitioning) — skirtingos įvesties klasės         ║
// ║    • BVA (Boundary Value Analysis) — ribinės reikšmės (pvz. 299ms)     ║
// ║    • Error Guessing — netikėti/kraštiniai scenarijai                    ║
// ║    • State Transition — būsenų perėjimai                                ║
// ╚═══════════════════════════════════════════════════════════════════════════╝
//
// TESTUOJAMAS REIKALAVIMAS: FR-2 — Išmani užduočių paieška (SearchBar)
//
// PRIĖMIMO KRITERIJAI (AC):
//   AC-1: Paieškos laukelis turi būti matomas Statyti (Bet) ekrane
//   AC-2: Paieška turi veikti su 300ms debounce (delsimas) —
//         t.y. paieška nevykdoma po kiekvienos raidės, o tik po 300ms pauzės
//   AC-3: X (clear) mygtukas turi iš karto išvalyti paieškos laukelį
//         ir atstatyti rezultatų sąrašą
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import SearchBar from './SearchBar';
import { ThemeProvider } from '@shopify/restyle';
import theme from '@/constants/theme';

// Perjungiame JavaScript laikmačius į „netikrą" režimą.
// Tai leidžia mums kontroliuoti setTimeout — vietoj tikro 300ms laukimo,
// mes galime „persukti" laiką pirmyn ir patikrinti kas vyksta.
jest.useFakeTimers();

// Pagalbinė funkcija: SearchBar naudoja @shopify/restyle dizaino sistemą,
// todėl kiekvienas renderinimas turi būti apgaubtas ThemeProvider'iu.
// Be jo, komponentas mestų klaidą, nes negautų spalvų/šriftų informacijos.
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('SearchBar (ND2 — reikalavimais grįstas testavimas FR-2)', () => {
  // mockOnSearch — tai „netikra" funkcija, kuri atstoja tikrąją paieškos funkciją.
  // Realiai programėlėje ši funkcija filtruoja quest'ų sąrašą.
  // Testuose mes ją „šnipinėjame" — galime patikrinti:
  // - ar ji buvo iškviesta?
  // - kiek kartų?
  // - su kokiu argumentu (kokiu paieškos tekstu)?
  const mockOnSearch = jest.fn();

  // Po kiekvieno testo: išvalome mock funkcijos istoriją ir visus laikmačius,
  // kad vienas testas neturėtų įtakos kitam.
  afterEach(() => {
    mockOnSearch.mockClear();
    jest.clearAllTimers();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTINIS ATVEJIS TA-1
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Priėmimo kriterijus: AC-1 — Paieškos laukelis turi būti matomas
  // Black-box technika: Equivalence Partitioning (EP)
  //   → Ekvivalenčių klasė: „normalus atvejis" — SearchBar renderinamas
  //     su numatytais parametrais, be jokių papildomų nustatymų.
  //
  // Ką tikrina žmogiškai:
  //   Atidarome Statyti ekraną ir tikriname, ar matome paieškos laukelį
  //   su užrašu „Ieškoti quest'ų..." viduje. Jei laukelis nematomas arba
  //   neturi placeholder teksto — testas nepavyksta.
  //
  // Kodėl svarbu:
  //   Tai pagrindinis reikalavimas — jei paieškos laukelio nėra, visa
  //   paieškos funkcionalumas neegzistuoja vartotojui.
  // ═══════════════════════════════════════════════════════════════════════════
  it('TA-1: AC-1 — SearchBar renderinamas su numatytu placeholder (EP)', () => {
    const { getByTestId, getByPlaceholderText } = renderWithTheme(
      <SearchBar onSearch={mockOnSearch} />,
    );

    // Tikriname ar paieškos laukelis (TextInput) egzistuoja ekrane
    const input = getByTestId('search-bar-input');
    expect(input).toBeTruthy();

    // Tikriname ar rodomas numatytasis placeholder tekstas
    // (tai tekstas, kurį vartotojas mato, kol dar nieko neįvedė)
    expect(getByPlaceholderText("Ieškoti quest'ų...")).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTINIS ATVEJIS TA-2
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Priėmimo kriterijus: AC-2 — Paieška turi veikti su 300ms debounce
  // Black-box technika: Boundary Value Analysis (BVA)
  //   → Tiksliai tikriname ribą: 299ms (dar neturi ieškoti) vs 300ms (jau turi).
  //     BVA esmė — tikrinti reikšmes TIES riba, ne šiaip „daugiau" ar „mažiau".
  //
  // Ką tikrina žmogiškai:
  //   Vartotojas įveda „krepšinis" į paieškos laukelį.
  //   Po 299 milisekundžių (beveik 0.3 sekundės) programa DAR NEIEŠKO —
  //   nes delsimo laikas dar nepraėjo.
  //   Po dar 1 milisekundės (iš viso 300ms) — programa PRADEDA IEŠKOTI.
  //   Tai užtikrina, kad paieška nebus vykdoma per anksti.
  //
  // Kodėl svarbu:
  //   Debounce apsaugo nuo bereikalingų paieškos kvietimų. Jei jis neveiktų,
  //   programa ieškotų po KIEKVIENOS raidės (k, kr, kre, krep...), kas
  //   sulėtintų programėlę ir eikvotų baterijos/interneto resursus.
  // ═══════════════════════════════════════════════════════════════════════════
  it('TA-2: AC-2 — debounce tiksliai 299ms vs 300ms riba (BVA)', () => {
    const { getByTestId } = renderWithTheme(<SearchBar onSearch={mockOnSearch} />);

    // Simuliuojame: vartotojas įrašo „krepšinis" į paieškos laukelį
    fireEvent.changeText(getByTestId('search-bar-input'), 'krepšinis');

    // BVA riba: 299ms — viena milisekundė PRIEŠ ribą
    // Paieška DAR NETURI būti pradėta
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(mockOnSearch).not.toHaveBeenCalled();

    // BVA riba: +1ms = iš viso 300ms — TIKSLIAI ant ribos
    // Dabar paieška TURI prasidėti su tekstu „krepšinis"
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith('krepšinis');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTINIS ATVEJIS TA-3
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Priėmimo kriterijus: AC-3 — X mygtukas turi iš karto išvalyti paiešką
  // Black-box technika: State Transition (būsenų perėjimas)
  //   → Tikriname 3 būsenas ir 2 perėjimus:
  //     BŪSENA 1: Tuščias laukelis (X mygtukas nerodomas)
  //       ↓ perėjimas: vartotojas įveda tekstą
  //     BŪSENA 2: Su tekstu (X mygtukas atsiranda)
  //       ↓ perėjimas: vartotojas paspaudžia X
  //     BŪSENA 3: Išvalytas (X mygtukas dingsta, paieška atstatyta)
  //
  // Ką tikrina žmogiškai:
  //   1. Kai laukelis tuščias — X mygtuko nėra (nėra ko valyti)
  //   2. Kai vartotojas įrašo „futbolas" — pasirodo X mygtukas
  //   3. Kai vartotojas paspaudžia X — laukelis išsivalo, sąrašas atstatomos
  //
  // Kodėl svarbu:
  //   Vartotojas turi galėti greitai atšaukti paiešką vienu paspaudimu,
  //   o ne trinti kiekvieną raidę po vieną.
  // ═══════════════════════════════════════════════════════════════════════════
  it('TA-3: AC-3 — būsenų perėjimas: tuščias → įvedimas → clear (State Transition)', () => {
    const { getByTestId, queryByTestId } = renderWithTheme(<SearchBar onSearch={mockOnSearch} />);

    // BŪSENA 1: Pradinis — laukelis tuščias, X mygtuko NĖRA
    expect(queryByTestId('search-bar-clear')).toBeNull();

    // PERĖJIMAS 1→2: vartotojas įveda tekstą „futbolas"
    fireEvent.changeText(getByTestId('search-bar-input'), 'futbolas');

    // BŪSENA 2: Su tekstu — X mygtukas MATOMAS
    expect(getByTestId('search-bar-clear')).toBeTruthy();

    // PERĖJIMAS 2→3: vartotojas paspaudžia X mygtuką
    fireEvent.press(getByTestId('search-bar-clear'));

    // BŪSENA 3: Išvalytas — paieška atstatyta (onSearch('') iškviesta),
    // X mygtukas vėl DINGSTA
    expect(mockOnSearch).toHaveBeenCalledWith('');
    expect(queryByTestId('search-bar-clear')).toBeNull();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTINIS ATVEJIS TA-4
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Priėmimo kriterijus: AC-2 — Debounce turi veikti greito rašymo metu
  // Black-box technika: Equivalence Partitioning (EP)
  //   → Ekvivalenčių klasė: „greitas rašymas" — vartotojas spaudžia
  //     klavišus kas 50ms (labai greitai), ir sistema turi išlaukti
  //     300ms nuo PASKUTINIO paspaudimo prieš pradėdama ieškoti.
  //
  // Ką tikrina žmogiškai:
  //   Vartotojas greitai rašo: „f" → „fu" → „fut" → „futb" (kas 50ms).
  //   Sistema NETURI ieškoti 4 kartus (po kiekvieną raidę).
  //   Ji turi palaukti 300ms nuo paskutinio paspaudimo ir ieškoti
  //   TIK VIENĄ kartą su galutiniu tekstu „futb".
  //
  // Kodėl svarbu:
  //   Tai realistiškiausias vartotojo scenarijus — žmonės rašo greitai.
  //   Jei debounce neveiktų, programėlė vykdytų 4 atskiras paieškas
  //   per mažiau nei sekundę, kas sukeltų mirgėjimą ir lėtumą.
  // ═══════════════════════════════════════════════════════════════════════════
  it('TA-4: AC-2 — greitas rašymas sukelia tik vieną debounce kvietimą (EP)', () => {
    const { getByTestId } = renderWithTheme(<SearchBar onSearch={mockOnSearch} />);

    const input = getByTestId('search-bar-input');

    // Simuliuojame greitą rašymą: „f" → „fu" → „fut" → „futb"
    // su 50 milisekundžių tarpais (kaip tikras žmogus rašo)
    fireEvent.changeText(input, 'f');
    act(() => {
      jest.advanceTimersByTime(50);
    });

    fireEvent.changeText(input, 'fu');
    act(() => {
      jest.advanceTimersByTime(50);
    });

    fireEvent.changeText(input, 'fut');
    act(() => {
      jest.advanceTimersByTime(50);
    });

    fireEvent.changeText(input, 'futb');

    // Po 300ms nuo PASKUTINIO raidės įvedimo — tik VIENAS paieškos kvietimas
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Tikimės vieno kvietimo su galutiniu tekstu „futb", o ne 4 kvietimų
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith('futb');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTINIS ATVEJIS TA-5
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Priėmimo kriterijus: AC-2 — Paieškos tekstas turi būti apvalytas (trim)
  // Black-box technika: Boundary Value Analysis (BVA)
  //   → Ribinė reikšmė: tekstas su tarpais pradžioje ir pabaigoje.
  //     Tokia įvestis yra „ant ribos" tarp validaus ir nevalidaus teksto.
  //
  // Ką tikrina žmogiškai:
  //   Vartotojas netyčia įvedė „  futbolas  " (su tarpais prieš ir po).
  //   Sistema turi automatiškai nukirpti tarpus ir ieškoti „futbolas"
  //   (be tarpų), nes paieška su tarpais grąžintų klaidingus rezultatus.
  //
  // Galimas defektas:
  //   Jei trim() neveikia, programa ieškotų „  futbolas  " vietoj „futbolas"
  //   ir gali nerasti jokių quest'ų, nors jie egzistuoja.
  //
  // Kodėl svarbu:
  //   Mobiliuose telefonuose autocorrect dažnai prideda tarpus.
  //   Sistema turi būti atlaidi vartotojo klaidoms.
  // ═══════════════════════════════════════════════════════════════════════════
  it('TA-5: AC-2 — RIBINĖ REIKŠMĖ: tarpai aplink tekstą turi būti apkirpti (BVA)', () => {
    const { getByTestId } = renderWithTheme(<SearchBar onSearch={mockOnSearch} />);

    // Vartotojas netyčia įvedė tarpus prieš ir po žodžio
    fireEvent.changeText(getByTestId('search-bar-input'), '  futbolas  ');

    // Laukiame kol debounce suveiks (300ms)
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // onSearch turi gauti APKIRPTĄ tekstą „futbolas" (be tarpų),
    // o NE „  futbolas  " (su tarpais)
    expect(mockOnSearch).toHaveBeenCalledWith('futbolas');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTINIS ATVEJIS TA-6
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Priėmimo kriterijus: AC-2 (kraštinis atvejis)
  // Black-box technika: Error Guessing (klaidų spėjimas)
  //   → Ši technika remiasi testuotojo patirtimi: „kas nutiks jei
  //     vartotojas padarys kažką neįprasto?" Čia spėjame: kas bus
  //     jei vartotojas paliks paieškos laukelį tuščią?
  //
  // Ką tikrina žmogiškai:
  //   Vartotojas paspaudžia ant paieškos laukelio, bet nieko neįveda
  //   (arba įveda tarpą ir ištrina). Paieškos laukelis yra tuščias.
  //   Testas tikrina: ar sistema vis tiek bando ieškoti su tuščiu tekstu?
  //
  // Galimas defektas:
  //   Jei onSearch kviečiamas su tuščiu stringu (''), tai gali sukelti
  //   nereikalingą quest'ų sąrašo perpiešimą, kas eikvoja resursus.
  //   Idealiu atveju, tuščias stringas neturėtų triggerinti paieškos,
  //   bet dabartinė realizacija tai daro — tai yra žinomas trūkumas.
  //
  // Kodėl svarbu:
  //   Error Guessing padeda rasti klaidas, kurių neaptinka kitos technikos.
  //   Tuščio input'o scenarijus yra vienas dažniausių kraštinių atvejų.
  // ═══════════════════════════════════════════════════════════════════════════
  it('TA-6: ERROR — tuščio teksto įvedimas vis tiek triggerina debounce (Error Guessing)', () => {
    const { getByTestId } = renderWithTheme(<SearchBar onSearch={mockOnSearch} />);

    // Simuliuojame: vartotojas paspaudžia ant laukelio bet nieko neįveda
    fireEvent.changeText(getByTestId('search-bar-input'), '');

    // Laukiame debounce (300ms)
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Rezultatas: onSearch VIS TIEK kviečiamas su tuščiu stringu ('')
    // Tai yra potencialus defektas — tuščias stringas neturėtų triggerinti
    // paieškos, nes nėra ko ieškoti
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTINIS ATVEJIS TA-7
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Priėmimo kriterijus: AC-2 (kraštinis atvejis — labai ilga įvestis)
  // Black-box technika: Error Guessing (klaidų spėjimas)
  //   → Spėjame: kas nutiks jei vartotojas įves labai ilgą tekstą?
  //     Ar komponentas „nulūš" (crash)? Ar debounce vis tiek veiks?
  //
  // Ką tikrina žmogiškai:
  //   Vartotojas (ar automatinis bottas) įveda 250 raidžių „a" į paieškos
  //   laukelį. Tai ekstremaliai ilgas paieškos tekstas, kuris normaliai
  //   niekada nebūtų įvedamas. Testas tikrina ar programa necrashina
  //   ir ar paieška vis tiek vykdoma normaliai.
  //
  // Kodėl svarbu:
  //   Programa turi būti atspari netikėtoms įvestims. Jei 250 simbolių
  //   tekstas sukeltų klaidą, tai būtų saugumo ir stabilumo spraga.
  //   Tokios klaidos dažnai aptinkamos tik production aplinkoje.
  // ═══════════════════════════════════════════════════════════════════════════
  it('TA-7: ERROR — labai ilgas paieškos tekstas (>200 simbolių) necrashina (Error Guessing)', () => {
    const { getByTestId } = renderWithTheme(<SearchBar onSearch={mockOnSearch} />);

    // Generuojame 250 raidžių „a" stringą — tai ekstremaliai ilga įvestis
    const longText = 'a'.repeat(250);
    fireEvent.changeText(getByTestId('search-bar-input'), longText);

    // Laukiame debounce (300ms)
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Komponentas NETURI crashinti — onSearch turi būti iškviesta normaliai
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith(longText);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTINIS ATVEJIS TA-8
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Priėmimo kriterijai: AC-3 + AC-2 (kombinuotas scenarijus)
  // Black-box technika: Boundary Value Analysis (BVA)
  //   → Ribinis scenarijus: vartotojas paspaudžia X (clear) TARP debounce
  //     laikotarpio — t.y. prieš paieška spėja įvykti. Ar sistema teisingai
  //     atšauks laukiančią paiešką ir vykdys tik clear veiksmą?
  //
  // Ką tikrina žmogiškai:
  //   1. Vartotojas įrašo „testas" į paieškos laukelį
  //   2. Po 100ms (dar nepraėjo 300ms debounce) — paspaudžia X mygtuką
  //   3. Laukiame dar 300ms — ar paieška su „testas" VIS TIEK įvyksta?
  //
  //   Teisingas elgesys: X mygtukas turi ATŠAUKTI laukiančią paiešką su „testas"
  //   ir iš karto vykdyti tik clear veiksmą (onSearch('')).
  //
  //   Klaidingas elgesys: jei po X paspaudimo vis tiek suveikia debounce,
  //   programa pirmiau ieškos „testas", o paskui „" — dvigubas kvietimas.
  //
  // Kodėl svarbu:
  //   Tai realistiškas scenarijus — vartotojas pradeda rašyti, persigalvoja
  //   ir spaudžia X. Sistema turi reaguoti TIK į paskutinį veiksmą (clear),
  //   o ne vykdyti ir senąją paiešką, ir valymo veiksmą.
  // ═══════════════════════════════════════════════════════════════════════════
  it('TA-8: AC-3 — clear mygtuko paspaudimas atšaukia laukiantį debounce (BVA)', () => {
    const { getByTestId } = renderWithTheme(<SearchBar onSearch={mockOnSearch} />);

    // 1. Vartotojas įveda „testas" — debounce timeris pradeda skaičiuoti 300ms
    fireEvent.changeText(getByTestId('search-bar-input'), 'testas');

    // 2. Po 100ms (dar 200ms iki debounce pabaigos) vartotojas paspaudžia X
    act(() => {
      jest.advanceTimersByTime(100);
    });
    fireEvent.press(getByTestId('search-bar-clear'));

    // 3. Laukiame dar 300ms — ar senasis debounce su „testas" vis tiek suveikia?
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Teisingas rezultatas: onSearch iškviesta TIK VIENĄ kartą — su '' (iš clear),
    // o NE su „testas" (iš debounce, kuris turėjo būti atšauktas)
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });
});
