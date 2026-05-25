// Autorius: JV (Jarek)
// FR-2: Unit testai SearchBar komponentui su debounce mechanizmu.
// Šie testai tikrina: placeholder rodymą, 300ms debounce delsimą,
// X (clear) mygtuko veikimą, ir greito rašymo scenarijų (timer atšaukimas).

import React from 'react';
// render — sukuria komponentą atmintyje testavimui
// fireEvent — simuliuoja vartotojo veiksmus (teksto įvedimą, mygtuko paspaudimą)
// act — wrapper'is, užtikrinantis, kad React būsenos atnaujinimai įvyksta sinchroniškai
import { render, fireEvent, act } from '@testing-library/react-native';
import SearchBar from './SearchBar';
// ThemeProvider reikalingas, nes SearchBar naudoja Box komponentą, kuris priklauso nuo Restyle temos
import { ThemeProvider } from '@shopify/restyle';
import theme from '@/constants/theme';

// Perjungiame JavaScript timer'ius į „netikrą" režimą, kad galėtume kontroliuoti setTimeout
jest.useFakeTimers();

// Pagalbinė funkcija: apgaubia testuojamą komponentą ThemeProvider'iu,
// nes be jo Box/Text komponentai (iš @shopify/restyle) neveiktų
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('SearchBar', () => {
  // Sukuriame mock funkciją, kuri atstoja tikrąją onSearch callback funkciją
  // Tai leidžia tikrinti, kiek kartų ji buvo iškviesta ir su kokiais argumentais
  const mockOnSearch = jest.fn();

  // afterEach — vykdomas PO kiekvieno testo
  afterEach(() => {
    mockOnSearch.mockClear();     // Išvalome mock kvietimų istoriją
    jest.clearAllTimers();        // Išvalome VISUS aktyvius timer'ius (setTimeout)
    // ⚠️ jest.clearAllTimers() yra KRITIŠKAI svarbus:
    // Be jo, vieno testo neišvalytas setTimeout gali suveikti kito testo metu
    // ir sukelti netikėtą onSearch kvietimą (ši klaida buvo tikra mūsų projekte)
  });

  // TESTAS 1: Tikriname, ar paieškos laukelis rodo placeholder tekstą
  it('turėtų renderinti su placeholder tekstu', () => {
    const { getByPlaceholderText } = renderWithTheme(
      <SearchBar onSearch={mockOnSearch} placeholder="Ieškoti..." />,
    );

    // getByPlaceholderText ieško TextInput elemento, kurio placeholder atitinka nurodytą tekstą
    expect(getByPlaceholderText('Ieškoti...')).toBeTruthy();
  });

  // TESTAS 2: Tikriname debounce mechanizmą — onSearch turi būti iškviesta TIK po 300ms
  it('turėtų iškviesti onSearch po 300ms debounce', () => {
    const { getByTestId } = renderWithTheme(
      <SearchBar onSearch={mockOnSearch} />,
    );

    // Simuliuojame teksto įvedimą — „testas" įrašomas į TextInput laukelį
    // Tai sukelia handleChange() funkciją SearchBar komponente
    fireEvent.changeText(getByTestId('search-bar-input'), 'testas');

    // Perstumiame laiką tik 200ms — dar nepraėjo 300ms debounce laikotarpis
    act(() => {
      jest.advanceTimersByTime(200);
    });
    // onSearch DAR NETURI būti iškviesta, nes 300ms dar nepraėjo
    expect(mockOnSearch).not.toHaveBeenCalled();

    // Perstumiame dar 150ms (iš viso 350ms nuo teksto įvedimo — jau praėjo 300ms riba)
    act(() => {
      jest.advanceTimersByTime(150);
    });
    // Dabar onSearch TURI būti iškviesta su „testas" argumentu
    expect(mockOnSearch).toHaveBeenCalledWith('testas');
  });

  // TESTAS 3: Tikriname, ar X (clear) mygtukas atsiranda tik kai yra tekstas
  it('turėtų rodyti X mygtuką kai yra tekstas', () => {
    const { getByTestId, queryByTestId } = renderWithTheme(
      <SearchBar onSearch={mockOnSearch} />,
    );

    // Pradžioje, kai laukelis tuščias, X mygtukas turi būti NEMATOMAS
    expect(queryByTestId('search-bar-clear')).toBeNull();

    // Įvedus tekstą, X mygtukas turi ATSIRASTI
    fireEvent.changeText(getByTestId('search-bar-input'), 'abc');
    expect(getByTestId('search-bar-clear')).toBeTruthy();
  });

  // TESTAS 4: Tikriname, ar X mygtukas išvalo laukelį ir iš karto iškviečia onSearch('')
  it('turėtų išvalyti lauką paspaudus X', () => {
    const { getByTestId } = renderWithTheme(
      <SearchBar onSearch={mockOnSearch} />,
    );

    // Įvedame tekstą, tada paspaudžiame X (clear) mygtuką
    fireEvent.changeText(getByTestId('search-bar-input'), 'valymas');
    fireEvent.press(getByTestId('search-bar-clear'));

    // handleClear() turi iš karto iškviesti onSearch('') su tuščiu stringu
    // (ne per debounce, o iš karto — nes vartotojas aiškiai nori išvalyti paiešką)
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  // TESTAS 5: Tikriname debounce atšaukimą — greitas rašymas turi iškviesti onSearch tik VIENĄ kartą
  // Šis testas imituoja vartotoją, kuris greitai rašo „a" → „ab" → „abc" su 100ms tarpais
  it('turėtų atšaukti ankstesnį timer prie greito rašymo', () => {
    const { getByTestId } = renderWithTheme(
      <SearchBar onSearch={mockOnSearch} />,
    );

    // 1. Vartotojas įveda „a" — SearchBar sukuria setTimeout(onSearch, 300ms)
    fireEvent.changeText(getByTestId('search-bar-input'), 'a');
    act(() => {
      jest.advanceTimersByTime(100); // Praėjo 100ms
    });

    // 2. Vartotojas įveda „ab" — senas timeris ATŠAUKIAMAS (clearTimeout), sukuriamas naujas
    fireEvent.changeText(getByTestId('search-bar-input'), 'ab');
    act(() => {
      jest.advanceTimersByTime(100); // Praėjo dar 100ms
    });

    // 3. Vartotojas įveda „abc" — vėl senas timeris atšaukiamas, naujas sukuriamas
    fireEvent.changeText(getByTestId('search-bar-input'), 'abc');

    // 4. Perstumiame laiką 350ms nuo paskutinio input'o — tik dabar suveikia paskutinis timeris
    act(() => {
      jest.advanceTimersByTime(350);
    });

    // onSearch turi būti iškviesta TIK VIENĄ kartą (ne tris) su galutiniu tekstu „abc"
    // Jei debounce neveiktų, onSearch būtų iškviesta 3 kartus: su „a", „ab", „abc"
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith('abc');
  });
});
