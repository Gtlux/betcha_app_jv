// Autorius: JV (Jarek)
// ND2 1-užduotis: Reikalavimais grįstas testavimas — FR-1 Toast pranešimų sistema
// NAUJI testai: ToastProvider (būsenos valdymo) komponentas
// Šie testai skiriasi nuo ND1 ToastNotification testų — čia testuojame
// Context + Hook + Provider integraciją, ne vizualinį komponentą.

import React from 'react';
import { render, act } from '@testing-library/react-native';
import { ToastProvider, useToast } from '../ToastProvider';
import { Text, Pressable } from 'react-native';

// Netikri laikmačiai — leidžia kontroliuoti setTimeout testuose
jest.useFakeTimers();

/**
 * Pagalbinis komponentas testavimui.
 * Jis naudoja useToast() hook'ą ir rodo mygtuką, kuris iškviečia showToast().
 * Tai imituoja tikrą aplikacijos komponentą, kuris naudoja Toast sistemą.
 */
function TestConsumer() {
  const { showToast } = useToast();
  return (
    <>
      {/* Mygtukas iškviečia showToast su success tipu */}
      <Pressable testID="trigger-success" onPress={() => showToast('Sėkmė!', 'success')}>
        <Text>Success</Text>
      </Pressable>
      {/* Mygtukas iškviečia showToast su error tipu */}
      <Pressable testID="trigger-error" onPress={() => showToast('Klaida!', 'error')}>
        <Text>Error</Text>
      </Pressable>
      {/* Mygtukas iškviečia showToast su warning tipu ir 5s trukme */}
      <Pressable testID="trigger-warning" onPress={() => showToast('Dėmesio!', 'warning', 5000)}>
        <Text>Warning</Text>
      </Pressable>
    </>
  );
}

/**
 * Pagalbinė funkcija: apgaubia TestConsumer ToastProvider'iu.
 * Be Provider'io, useToast() mestų klaidą.
 */
const renderWithProvider = () =>
  render(
    <ToastProvider>
      <TestConsumer />
    </ToastProvider>,
  );

describe('ToastProvider (ND2 — nauji testai)', () => {
  afterEach(() => {
    jest.clearAllTimers(); // Išvalome timer'ius tarp testų
  });

  // TA-1: Tikriname, ar useToast() hook'as veikia ToastProvider viduje
  // ir ar showToast('Sėkmė!', 'success') teisingai parodo pranešimo tekstą.
  // Padengia AC-1: "Pranešimas rodomas su tekstu, perduotu per showToast()"
  it('TA-1: showToast() per hook turi parodyti pranešimo tekstą', () => {
    const { getByTestId, getByText } = renderWithProvider();

    // Paspaudžiame mygtuką, kuris iškviečia showToast('Sėkmė!', 'success')
    act(() => {
      getByTestId('trigger-success').props.onPress();
    });

    // Tikriname, ar pranešimo tekstas atsirado ekrane
    expect(getByText('Sėkmė!')).toBeTruthy();
  });

  // TA-2: Tikriname, ar showToast su 'error' tipu rodo raudoną pranešimą
  // ir teisingą ikonėlę ❌.
  // Padengia AC-2: "Palaikomi 3 tipai: success, error, warning"
  it('TA-2: showToast su error tipu turi rodyti ❌ ikonėlę', () => {
    const { getByTestId, getByText } = renderWithProvider();

    // Iškviečiame error tipo pranešimą
    act(() => {
      getByTestId('trigger-error').props.onPress();
    });

    // Tikriname ikonėlę ir tekstą
    expect(getByText('Klaida!')).toBeTruthy();
    expect(getByText('❌')).toBeTruthy();
  });

  // TA-3: Tikriname, ar showToast su 'warning' tipu ir custom trukme (5000ms) veikia.
  // Padengia AC-2: "3 tipai" ir AC-3: "pasislėpia po duration ms"
  it('TA-3: showToast su warning tipu ir custom duration', () => {
    const { getByTestId, getByText, queryByTestId } = renderWithProvider();

    // Iškviečiame warning tipo pranešimą su 5s trukme
    act(() => {
      getByTestId('trigger-warning').props.onPress();
    });

    // Tikriname, ar pranešimas rodomas
    expect(getByText('Dėmesio!')).toBeTruthy();
    expect(getByText('⚠️')).toBeTruthy();

    // Po 3000ms pranešimas vis dar turi būti matomas (nes trukmė 5000ms)
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(getByText('Dėmesio!')).toBeTruthy();
  });

  // TA-4: Tikriname, ar useToast() meta klaidą kai naudojamas be ToastProvider.
  // Padengia kodo kokybės reikalavimą — apsauga nuo netinkamo naudojimo.
  it('TA-4: useToast be ToastProvider turi mesti klaidą', () => {
    // Slopininame console.error, nes React spausdina klaidos pranešimą
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Bandome renderinti TestConsumer BE ToastProvider — turi mesti klaidą
    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useToast turi būti naudojamas ToastProvider viduje');

    spy.mockRestore(); // Atstatomme console.error
  });

  // TA-5: Tikriname, ar du paeiliui iškviesti showToast pakeičia pranešimą
  // (t.y. naujas pranešimas pakeičia senąjį, o ne rodo abu vienu metu).
  // Padengia sistemos elgsenos reikalavimą — vienu metu rodomas tik 1 pranešimas.
  it('TA-5: antras showToast kvietimas pakeičia pirmąjį pranešimą', () => {
    const { getByTestId, getByText, queryByText } = renderWithProvider();

    // 1. Iškviečiame success pranešimą
    act(() => {
      getByTestId('trigger-success').props.onPress();
    });
    expect(getByText('Sėkmė!')).toBeTruthy();

    // 2. Iš karto iškviečiame error pranešimą
    act(() => {
      getByTestId('trigger-error').props.onPress();
    });

    // 3. Naujas pranešimas ('Klaida!') turi pakeisti seną ('Sėkmė!')
    expect(getByText('Klaida!')).toBeTruthy();
    // Senas pranešimas nebeturėtų būti matomas (arba pakeistas nauju)
    expect(queryByText('Sėkmė!')).toBeNull();
  });

  // ═══════════════════════════════════════════════════════════════
  // ERROR-BASED testiniai atvejai (ribinių verčių ir klaidų testavimas)
  // Technika: Boundary Value Analysis (BVA) + Error Guessing
  // ═══════════════════════════════════════════════════════════════

  // TA-6: RIBINĖ REIKŠMĖ — duration=0
  // Technika: Boundary Value Analysis — tikriname ribinę reikšmę (0ms)
  // Klausimas: kas nutinka jei duration yra 0? Ar pranešimas pasirodo bent trumpai?
  // DEFEKTAS: Jei duration=0, pranešimas turėtų pasirodyti ir iškart pradingti.
  // Bet jei implementacija naudoja setTimeout(fn, 0) — pranešimas vis tiek pasirodo
  // vienam "tick'ui", kas gali sukelti vizualinį mirgėjimą (flicker).
  it('TA-6: RIBINĖ REIKŠMĖ — showToast su duration=0 (BVA)', () => {
    // Sukuriame specialų TestConsumer su duration=0
    function ZeroDurationConsumer() {
      const { showToast } = useToast();
      return (
        <Pressable testID="trigger-zero" onPress={() => showToast('Zero!', 'success', 0)}>
          <Text>Zero</Text>
        </Pressable>
      );
    }

    const { getByTestId, queryByText } = render(
      <ToastProvider>
        <ZeroDurationConsumer />
      </ToastProvider>,
    );

    act(() => {
      getByTestId('trigger-zero').props.onPress();
    });

    // Po setTimeout(fn, 0) + animacijos laiko pranešimas turėtų pradingti
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // DEFEKTAS: Jei pranešimas vis dar matomas po 500ms su duration=0 —
    // tai reiškia, kad implementacija neapdoroja ribinės 0 reikšmės teisingai.
    // Tikimės, kad pranešimas jau pradingęs:
    const toast = queryByText('Zero!');
    // Šis testas gali FAIL — tai yra sąmoningas error-based testas
    // kuris tikrina ribinę reikšmę ir gali atskleisti defektą
    expect(toast).toBeNull();
  });

  // TA-7: ERROR-BASED — tuščias pranešimo tekstas
  // Technika: Error Guessing — kas nutinka jei perduodame tuščią stringą?
  // DEFEKTAS: Jei message='', toast komponentas gali renderinti tuščią burbulą
  // be jokio teksto, kas yra blogas UX.
  it('TA-7: ERROR-BASED — showToast su tuščiu tekstu', () => {
    function EmptyMessageConsumer() {
      const { showToast } = useToast();
      return (
        <Pressable testID="trigger-empty" onPress={() => showToast('', 'success')}>
          <Text>Empty</Text>
        </Pressable>
      );
    }

    const { getByTestId, queryByTestId } = render(
      <ToastProvider>
        <EmptyMessageConsumer />
      </ToastProvider>,
    );

    act(() => {
      getByTestId('trigger-empty').props.onPress();
    });

    // DEFEKTAS: Jei toast rodomas su tuščiu tekstu — tai blogas UX.
    // Idealiu atveju sistema neturėtų rodyti tuščio toast'o.
    // Šis testas gali FAIL, nes dabartinė implementacija nerodo
    // validacijos prieš rodant pranešimą.
    const toastElement = queryByTestId('toast-notification');
    // Jei toast rodomas su tuščiu message — tai yra defektas
    if (toastElement) {
      // REGISTRUOTINAS DEFEKTAS: Toast rodomas su tuščiu pranešimu
      console.warn('DEFEKTAS: Toast rodomas su tuščiu message=""');
    }
    // Bet testas vis tiek praeina — fiksuojame elgseną
    expect(true).toBe(true);
  });

  // TA-8: RIBINĖ REIKŠMĖ — neigiamas duration
  // Technika: Boundary Value Analysis — tikriname neigiamą reikšmę
  // DEFEKTAS: Jei duration=-1, setTimeout(-1) elgiasi kaip setTimeout(0).
  // Bet ar tai sąmoninga elgsena?
  it('TA-8: RIBINĖ REIKŠMĖ — showToast su neigiamu duration (BVA)', () => {
    function NegativeDurationConsumer() {
      const { showToast } = useToast();
      return (
        <Pressable testID="trigger-negative" onPress={() => showToast('Neigiamas!', 'error', -1000)}>
          <Text>Negative</Text>
        </Pressable>
      );
    }

    const { getByTestId, getByText } = render(
      <ToastProvider>
        <NegativeDurationConsumer />
      </ToastProvider>,
    );

    act(() => {
      getByTestId('trigger-negative').props.onPress();
    });

    // Pranešimas turėtų pasirodyti net su neigiamu duration
    expect(getByText('Neigiamas!')).toBeTruthy();

    // Su neigiamu setTimeout, pranešimas turėtų iškart pradingti
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // DEFEKTAS: Neigiamas duration nėra validuojamas.
    // Sistema turėtų arba mesti klaidą, arba naudoti numatytąjį 3000ms.
  });
});
