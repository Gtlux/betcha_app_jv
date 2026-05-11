// Autorius: JV (Jarek)
// FR-1: Unit testai ToastNotification komponentui.
// Šie testai tikrina, ar pranešimų komponentas teisingai atvaizduojamas,
// ar rodo teisingas ikonėles pagal tipą, ir ar automatiškai pasislėpia po nurodytos trukmės.

import React from 'react';
// render — funkcija, kuri sukuria komponentą atmintyje (be tikro telefono ekrano) ir leidžia jį tikrinti
// act — wrapper'is, kuris užtikrina, kad visi React būsenos atnaujinimai įvyksta prieš tikrinant rezultatą
import { render, act } from '@testing-library/react-native';
import ToastNotification from './ToastNotification';

// jest.useFakeTimers() — perjungia JavaScript laiko funkcijas (setTimeout, setInterval) į „netikrą" režimą.
// Tai leidžia mums kontroliuoti laiką testuose: vietoj tikro laukimo 3 sekundes,
// galime iš karto „perstumti" laiką į priekį su jest.advanceTimersByTime()
jest.useFakeTimers();

describe('ToastNotification', () => {
  // Sukuriame „netikrą" (mock) funkciją, kuri bus perduota kaip onHide callback.
  // jest.fn() leidžia vėliau patikrinti, ar ši funkcija buvo iškviesta ir kiek kartų
  const mockOnHide = jest.fn();

  // afterEach — vykdomas PO kiekvieno testo.
  // Išvalome mock funkcijos kvietimų istoriją, kad vieno testo rezultatai neįtakotų kito
  afterEach(() => {
    mockOnHide.mockClear();
  });

  // TESTAS 1: Tikriname, ar komponentas rodo pranešimo tekstą, kai jis turi būti matomas
  it('turėtų renderinti pranešimo tekstą kai visible=true', () => {
    // render() — sukuria ToastNotification komponentą su nurodytais parametrais
    // getByText — funkcija, kuri ieško elemento pagal jo tekstinį turinį
    const { getByText } = render(
      <ToastNotification
        message="Testas sėkmingas!"  // Pranešimo tekstas
        type="success"                // Tipas: sėkmės (žalias)
        visible={true}                // Komponentas turi būti matomas
        onHide={mockOnHide}           // Callback funkcija (mock)
      />,
    );

    // Tikriname, ar ekrane egzistuoja elementas su tekstu "Testas sėkmingas!"
    // toBeTruthy() — reiškia, kad elementas rastas (nėra null/undefined)
    expect(getByText('Testas sėkmingas!')).toBeTruthy();
  });

  // TESTAS 2: Tikriname, ar komponentas NERODO nieko, kai visible=false
  it('neturėtų renderinti nieko kai visible=false', () => {
    // queryByTestId — panašu į getByTestId, bet grąžina null vietoj klaidos, jei elementas nerastas
    const { queryByTestId } = render(
      <ToastNotification
        message="Neturi matytis"
        type="error"
        visible={false}              // Komponentas turi būti NEMATOMAS
        onHide={mockOnHide}
      />,
    );

    // Tikriname, ar elementas su testID="toast-notification" NEegzistuoja ekrane
    // toBeNull() — reiškia, kad queryByTestId grąžino null (elementas nerastas, kaip ir tikėjomės)
    expect(queryByTestId('toast-notification')).toBeNull();
  });

  // TESTAS 3: Tikriname, ar „success" tipo pranešimas rodo žalią varnelės ikonėlę ✅
  it('turėtų renderinti success tipo toast su ikona ✅', () => {
    const { getByText } = render(
      <ToastNotification
        message="Sėkmė"
        type="success"                // Tipas: success → turi rodyti ✅
        visible={true}
        onHide={mockOnHide}
      />,
    );

    // Tikriname, ar ekrane yra elementas su tekstu "✅" (emoji ikonėlė)
    expect(getByText('✅')).toBeTruthy();
  });

  // TESTAS 4: Tikriname, ar „error" tipo pranešimas rodo raudoną kryžiuko ikonėlę ❌
  it('turėtų renderinti error tipo toast su ikona ❌', () => {
    const { getByText } = render(
      <ToastNotification
        message="Klaida"
        type="error"                  // Tipas: error → turi rodyti ❌
        visible={true}
        onHide={mockOnHide}
      />,
    );

    expect(getByText('❌')).toBeTruthy();
  });

  // TESTAS 5: Tikriname, ar „warning" tipo pranešimas rodo oranžinę įspėjimo ikonėlę ⚠️
  it('turėtų renderinti warning tipo toast su ikona ⚠️', () => {
    const { getByText } = render(
      <ToastNotification
        message="Įspėjimas"
        type="warning"                // Tipas: warning → turi rodyti ⚠️
        visible={true}
        onHide={mockOnHide}
      />,
    );

    expect(getByText('⚠️')).toBeTruthy();
  });

  // TESTAS 6: Tikriname auto-hide funkciją — ar pranešimas automatiškai pasislėpia po nurodytos trukmės
  it('turėtų iškviesti onHide po nustatytos trukmės', () => {
    render(
      <ToastNotification
        message="Auto-hide"
        type="success"
        visible={true}
        onHide={mockOnHide}
        duration={3000}               // Pranešimas turi pasislėpti po 3000ms (3 sekundės)
      />,
    );

    // act() apgaubia laiko perstūmimą, kad React spėtų apdoroti visus būsenos pokyčius
    // jest.advanceTimersByTime(3300) — „perstumiame" netikrą laiką 3300ms į priekį
    // (3300ms, o ne 3000ms, nes dar reikia 250ms slėpimo animacijai pasibaigti)
    act(() => {
      jest.advanceTimersByTime(3300);
    });

    // Tikriname, ar onHide callback buvo iškviesta (tai reiškia, kad pranešimas pasislėpė)
    expect(mockOnHide).toHaveBeenCalled();
  });
});
