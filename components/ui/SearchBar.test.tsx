// ══════════════════════════════════════════════════════════════════════════════
// Autorius: JV (Jarek)
// Failas: SearchBar.test.tsx
// ND1: Unit testai SearchBar komponentui su debounce mechanizmu
//
// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  ŠIE TESTAI = ND1 UNIT TESTAI                                          ║
// ║                                                                         ║
// ║  Tikslas: tikrinti ar SearchBar KOMPONENTAS techniškai veikia:          ║
// ║  - Ar rodo placeholder tekstą?                                          ║
// ║  - Ar debounce mechanizmas delsia 300ms prieš iškviečiant onSearch?     ║
// ║  - Ar X (clear) mygtukas veikia?                                        ║
// ║  - Ar greitas rašymas nesukelia kelių paieškos kvietimų?                ║
// ║                                                                         ║
// ║  SKIRTUMAS NUO ND2 (SearchBar.nd2.test.tsx):                            ║
// ║  ND1 = tikrina KOMPONENTĄ izoliuotai (ar kiekviena funkcija veikia)     ║
// ║  ND2 = tikrina ar komponentas atitinka FR-2 PRIĖMIMO KRITERIJUS (AC)    ║
// ║        naudojant black-box technikas (EP, BVA, Error Guessing)          ║
// ╚═══════════════════════════════════════════════════════════════════════════╝
//
// Testuojamas komponentas: SearchBar.tsx
// Tai paieškos laukelis su 300ms „debounce" mechanizmu. Debounce reiškia,
// kad programa neleidžia paieškos po kiekvienos paspaustos raidės —
// ji palaukia 300 milisekundžių po paskutinio paspaudimo ir tik tada
// iškviečia paieškos funkciją. Tai apsaugo nuo bereikalingo darbo.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
// render — sukuria komponentą „virtualiame telefone" testavimui
// fireEvent — simuliuoja vartotojo veiksmus:
//   - fireEvent.changeText() = vartotojas rašo tekstą
//   - fireEvent.press() = vartotojas paspaudžia mygtuką
// act — užtikrina, kad visi React būsenos atnaujinimai įvyksta sinchroniškai
import { render, fireEvent, act } from '@testing-library/react-native';
import SearchBar from './SearchBar';
// ThemeProvider reikalingas, nes SearchBar naudoja Box komponentą iš
// @shopify/restyle dizaino sistemos. Be ThemeProvider'io komponentas
// negautų spalvų/dydžių informacijos ir mestų klaidą.
import { ThemeProvider } from '@shopify/restyle';
import theme from '@/constants/theme';

// Perjungiame setTimeout/setInterval į „netikrą" režimą.
// SearchBar naudoja setTimeout(onSearch, 300) — su netikrais laikmačiais
// galime kontroliuoti kada šis setTimeout suveikia, vietoj tikro laukimo.
jest.useFakeTimers();

// Pagalbinė funkcija: apgaubia testuojamą komponentą ThemeProvider'iu.
// Be jo, Box/Text komponentai (iš @shopify/restyle) mestų klaidą,
// nes negautų temos (spalvų, tarpų, šriftų) konfigūracijos.
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('SearchBar', () => {
  // mockOnSearch — „netikra" funkcija, kuri atstoja tikrąją paieškos
  // callback funkciją. Realiai programėlėje ši funkcija filtruoja
  // quest'ų sąrašą pagal įvestą tekstą. Testuose mes ją „šnipinėjame":
  // - Ar ji buvo iškviesta? (expect(mockOnSearch).toHaveBeenCalled())
  // - Kiek kartų? (expect(mockOnSearch).toHaveBeenCalledTimes(1))
  // - Su kokiu argumentu? (expect(mockOnSearch).toHaveBeenCalledWith('abc'))
  const mockOnSearch = jest.fn();

  // afterEach — vykdomas AUTOMATIŠKAI po kiekvieno testo.
  // Išvalome mock funkcijos kvietimų istoriją ir VISUS aktyvius timer'ius.
  //
  // ⚠️ jest.clearAllTimers() yra KRITIŠKAI svarbus šiame projekte:
  // Be jo, vieno testo neišvalytas setTimeout gali suveikti kito testo
  // metu ir sukelti netikėtą onSearch kvietimą. Ši klaida buvo tikra
  // mūsų projekte (commit #206: „pataisytas timer leak tarp testų").
  afterEach(() => {
    mockOnSearch.mockClear();
    jest.clearAllTimers();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTAS 1: Ar paieškos laukelis rodo placeholder tekstą?
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Ką tikrina žmogiškai:
  //   Atidarome Statyti ekraną ir žiūrime ar paieškos laukelyje matome
  //   pilką tekstą „Ieškoti..." (tai placeholder — tekstas, kuris matomas
  //   kol vartotojas dar nieko neįvedė). Jei laukelis tuščias ir be
  //   placeholder — vartotojas nežinos, kad čia galima ieškoti.
  // ═══════════════════════════════════════════════════════════════════════════
  it('turėtų renderinti su placeholder tekstu', () => {
    const { getByPlaceholderText } = renderWithTheme(
      <SearchBar onSearch={mockOnSearch} placeholder="Ieškoti..." />,
    );

    // getByPlaceholderText ieško TextInput elemento, kurio placeholder
    // atitinka nurodytą tekstą „Ieškoti..."
    expect(getByPlaceholderText('Ieškoti...')).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTAS 2: Ar debounce delsia 300ms prieš iškviečiant paiešką?
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Ką tikrina žmogiškai:
  //   Vartotojas įrašo „testas" į paieškos laukelį.
  //   Po 200ms (dar nepraėjo 300ms) — paieška DAR NETURI būti iškviesta.
  //   Po dar 150ms (iš viso 350ms) — paieška TURI būti iškviesta.
  //
  //   Debounce yra esminis SearchBar mechanizmas — be jo, programa
  //   ieškotų po KIEKVIENOS raidės (t, te, tes, test, testa, testas),
  //   kas sukeltų 6 atskiras paieškas per mažiau nei sekundę.
  // ═══════════════════════════════════════════════════════════════════════════
  it('turėtų iškviesti onSearch po 300ms debounce', () => {
    const { getByTestId } = renderWithTheme(<SearchBar onSearch={mockOnSearch} />);

    // Simuliuojame: vartotojas įrašo „testas" į laukelį
    // Tai iškviečia handleChange() funkciją SearchBar komponente
    fireEvent.changeText(getByTestId('search-bar-input'), 'testas');

    // Persukame laiką 200ms — dar nepraėjo 300ms debounce laikotarpis
    act(() => {
      jest.advanceTimersByTime(200);
    });
    // Po 200ms onSearch DAR NETURI būti iškviesta
    expect(mockOnSearch).not.toHaveBeenCalled();

    // Persukame dar 150ms (iš viso 350ms — jau praėjo 300ms riba)
    act(() => {
      jest.advanceTimersByTime(150);
    });
    // Dabar onSearch TURI būti iškviesta su „testas" argumentu
    expect(mockOnSearch).toHaveBeenCalledWith('testas');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTAS 3: Ar X (clear) mygtukas atsiranda tik kai yra tekstas?
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Ką tikrina žmogiškai:
  //   1. Kai laukelis tuščias — X mygtuko NĖRA (nėra ko valyti)
  //   2. Kai vartotojas įrašo „abc" — X mygtukas ATSIRANDA
  //
  //   Tai svarbu dėl UX: jei X mygtukas būtų matomas kai laukelis tuščias,
  //   tai būtų klaidinantis elementas (mygtukas be funkcijos).
  // ═══════════════════════════════════════════════════════════════════════════
  it('turėtų rodyti X mygtuką kai yra tekstas', () => {
    const { getByTestId, queryByTestId } = renderWithTheme(<SearchBar onSearch={mockOnSearch} />);

    // Pradžioje: laukelis tuščias, X mygtuko NĖRA
    expect(queryByTestId('search-bar-clear')).toBeNull();

    // Įvedame tekstą „abc" — X mygtukas TURI atsirasti
    fireEvent.changeText(getByTestId('search-bar-input'), 'abc');
    expect(getByTestId('search-bar-clear')).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTAS 4: Ar X mygtukas teisingai išvalo laukelį?
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Ką tikrina žmogiškai:
  //   1. Vartotojas įrašo „valymas" į paieškos laukelį
  //   2. Paspaudžia X mygtuką
  //   3. Laukelis turi būti tuščias ir onSearch('') turi būti iškviesta IŠ KARTO
  //      (ne per debounce, o akimirksniu — nes vartotojas aiškiai nori
  //      atšaukti paiešką)
  // ═══════════════════════════════════════════════════════════════════════════
  it('turėtų išvalyti lauką paspaudus X', () => {
    const { getByTestId } = renderWithTheme(<SearchBar onSearch={mockOnSearch} />);

    // Įvedame tekstą, tada paspaudžiame X mygtuką
    fireEvent.changeText(getByTestId('search-bar-input'), 'valymas');
    fireEvent.press(getByTestId('search-bar-clear'));

    // handleClear() turi IŠ KARTO iškviesti onSearch('') su tuščiu stringu
    // (ne per debounce 300ms, o akimirksniu)
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTAS 5: Ar greitas rašymas nesukelia kelių paieškos kvietimų?
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Ką tikrina žmogiškai:
  //   Vartotojas greitai rašo: „a" → „ab" → „abc" kas 100ms.
  //   Kiekvienas naujas simbolis turi ATŠAUKTI ankstesnį debounce timerį
  //   ir sukurti naują. Rezultate onSearch turi būti iškviesta TIK VIENĄ
  //   kartą su galutiniu tekstu „abc" (ne tris kartus su „a", „ab", „abc").
  //
  //   Tai esminis debounce testas — jei jis nepavyksta, reiškia
  //   clearTimeout() neveikia ir programa vykdo bereikalingas paieškas.
  // ═══════════════════════════════════════════════════════════════════════════
  it('turėtų atšaukti ankstesnį timer prie greito rašymo', () => {
    const { getByTestId } = renderWithTheme(<SearchBar onSearch={mockOnSearch} />);

    // 1. Vartotojas įveda „a" — sukuriamas setTimeout(onSearch, 300ms)
    fireEvent.changeText(getByTestId('search-bar-input'), 'a');
    act(() => {
      jest.advanceTimersByTime(100); // Praėjo 100ms
    });

    // 2. Vartotojas įveda „ab" — senas setTimeout ATŠAUKIAMAS, naujas sukuriamas
    fireEvent.changeText(getByTestId('search-bar-input'), 'ab');
    act(() => {
      jest.advanceTimersByTime(100); // Praėjo dar 100ms
    });

    // 3. Vartotojas įveda „abc" — vėl senas atšaukiamas, naujas sukuriamas
    fireEvent.changeText(getByTestId('search-bar-input'), 'abc');

    // 4. Persukame laiką 350ms nuo paskutinio input'o —
    //    tik dabar suveikia PASKUTINIS setTimeout
    act(() => {
      jest.advanceTimersByTime(350);
    });

    // onSearch iškviesta TIK VIENĄ kartą su galutiniu tekstu „abc"
    // Jei debounce neveiktų — būtų 3 kvietimai: su „a", „ab", „abc"
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith('abc');
  });
});
