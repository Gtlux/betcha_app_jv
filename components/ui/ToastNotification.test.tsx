// ══════════════════════════════════════════════════════════════════════════════
// Autorius: JV (Jarek)
// Failas: ToastNotification.test.tsx
// ND1: Unit testai ToastNotification VIZUALINIAM komponentui
//
// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  ŠIE TESTAI = ND1 UNIT TESTAI                                          ║
// ║                                                                         ║
// ║  Tikslas: tikrinti ar ToastNotification VIZUALINIS komponentas           ║
// ║  teisingai atvaizduoja pranešimus. Mes tikriname patį UI elementą       ║
// ║  izoliuotai — ar rodo teisingą tekstą, ikonėlę, spalvą, ir ar          ║
// ║  automatiškai paslepiamas po nurodytos trukmės.                         ║
// ║                                                                         ║
// ║  SKIRTUMAS NUO ND2 (ToastProvider.test.tsx):                            ║
// ║  ND1 = tikrina KOMPONENTĄ (kaip atrodo ir elgiasi)                      ║
// ║  ND2 = tikrina SISTEMĄ (ar atitinka reikalavimo priėmimo kriterijus)    ║
// ╚═══════════════════════════════════════════════════════════════════════════╝
//
// Testuojamas komponentas: ToastNotification.tsx
// Tai vizualinis „burbulas", kuris pasirodo ekrano viršuje su pranešimo
// tekstu, spalva ir ikonėle. Jis gauna props (parametrus) iš ToastProvider'io
// ir tik juos ATVAIZDUOJA — jokios verslo logikos čia nėra.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
// render — funkcija, kuri sukuria komponentą atmintyje (be tikro telefono
// ekrano) ir leidžia jį tikrinti programiškai. Tai lyg „virtualus telefonas".
// act — wrapper'is, kuris užtikrina, kad visi React būsenos atnaujinimai
// (pvz., animacijos, setTimeout) įvyksta PRIEŠ mums tikrinant rezultatą.
import { render, act } from '@testing-library/react-native';
import ToastNotification from './ToastNotification';

// jest.useFakeTimers() — perjungia JavaScript laiko funkcijas
// (setTimeout, setInterval) į „netikrą" režimą.
//
// KODĖL tai reikalinga:
// ToastNotification naudoja setTimeout() kad automatiškai pasislėptų
// po nustatytos trukmės (pvz., 3 sekundės). Realiai testuose mes nenorime
// laukti 3 tikrų sekundžių — tai per ilgai. Su netikrais laikmačiais
// galime „persukti" laiką pirmyn: jest.advanceTimersByTime(3000)
// ir viskas įvyksta akimirksniu.
jest.useFakeTimers();

describe('ToastNotification', () => {
  // mockOnHide — tai „netikra" (mock) funkcija, kuri atstoja tikrąjį
  // onHide callback'ą. Realioje programėlėje onHide() paslepia toast'ą —
  // čia mes ją „šnipinėjame" ir tikriname:
  // - Ar ji buvo iškviesta? (expect(mockOnHide).toHaveBeenCalled())
  // - Kiek kartų? (expect(mockOnHide).toHaveBeenCalledTimes(1))
  const mockOnHide = jest.fn();

  // afterEach — vykdomas AUTOMATIŠKAI po kiekvieno testo.
  // Išvalome mock funkcijos kvietimų istoriją, kad vieno testo rezultatai
  // neturėtų įtakos kitam. Be to — tai buvo tikra klaida mūsų projekte,
  // kai timer leak sukeldavo klaidingus test rezultatus.
  afterEach(() => {
    mockOnHide.mockClear();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTAS 1: Ar pranešimas MATOMAS kai visible=true?
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Ką tikrina žmogiškai:
  //   Sukuriame Toast pranešimą su tekstu „Testas sėkmingas!" ir nustatome
  //   visible=true (matomas). Tikriname ar šis tekstas tikrai matomas ekrane.
  //
  //   Tai pagrindinis testas — jei pranešimas nematomas kai turėtų būti
  //   matomas, visas Toast komponentas yra sugadintas.
  // ═══════════════════════════════════════════════════════════════════════════
  it('turėtų renderinti pranešimo tekstą kai visible=true', () => {
    // render() sukuria ToastNotification komponentą „virtualiame telefone"
    // getByText — funkcija, kuri ieško elemento pagal jo tekstinį turinį
    const { getByText } = render(
      <ToastNotification
        message="Testas sėkmingas!" // Pranešimo tekstas, kurį vartotojas matys
        type="success" // Tipas: sėkmės (žalias fonas)
        visible={true} // Komponentas TURI būti matomas
        onHide={mockOnHide} // Callback — bus iškviesta kai toast dinges
      />,
    );

    // Tikriname: ar ekrane egzistuoja elementas su tekstu „Testas sėkmingas!"?
    // toBeTruthy() = elementas rastas (nėra null/undefined)
    // Jei getByText neranda teksto — testas FAILINA su klaidos pranešimu
    expect(getByText('Testas sėkmingas!')).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTAS 2: Ar pranešimas NEMATOMAS kai visible=false?
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Ką tikrina žmogiškai:
  //   Sukuriame Toast pranešimą su visible=false (nematomas).
  //   Tikriname ar komponentas tikrai NERODOMAS ekrane.
  //
  //   Tai svarbu, nes jei pranešimas vis dar renderinamas kai turėtų būti
  //   paslėptas, vartotojas matys „vaiduokliškus" pranešimus ir tai
  //   eikvos telefono resursus (atminties, CPU).
  // ═══════════════════════════════════════════════════════════════════════════
  it('neturėtų renderinti nieko kai visible=false', () => {
    // queryByTestId — panašu į getByTestId, BET grąžina null vietoj klaidos
    // jei elementas nerastas. Tai tinka kai TIKIMĖS kad elemento NEBUS.
    const { queryByTestId } = render(
      <ToastNotification
        message="Neturi matytis"
        type="error"
        visible={false} // Komponentas TURI būti NEMATOMAS
        onHide={mockOnHide}
      />,
    );

    // Tikriname: ar elementas su testID="toast-notification" NEegzistuoja?
    // toBeNull() = queryByTestId grąžino null (elementas nerastas — gerai!)
    expect(queryByTestId('toast-notification')).toBeNull();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTAS 3: Ar SUCCESS tipas rodo ✅ ikonėlę?
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Ką tikrina žmogiškai:
  //   Sukuriame sėkmės (success) tipo pranešimą ir tikriname ar matome
  //   žalią varnelės ikonėlę ✅. Kiekvienas pranešimo tipas turi savo
  //   unikalią ikonėlę — tai padeda vartotojui greitai atpažinti pranešimo
  //   svarbą be teksto skaitymo (pvz., ✅ = viskas gerai, ❌ = klaida).
  // ═══════════════════════════════════════════════════════════════════════════
  it('turėtų renderinti success tipo toast su ikona ✅', () => {
    const { getByText } = render(
      <ToastNotification
        message="Sėkmė"
        type="success" // Tipas: success → TURI rodyti ✅
        visible={true}
        onHide={mockOnHide}
      />,
    );

    // Tikriname: ar ekrane yra ✅ emoji ikonėlė?
    expect(getByText('✅')).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTAS 4: Ar ERROR tipas rodo ❌ ikonėlę?
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Ką tikrina žmogiškai:
  //   Sukuriame klaidos (error) tipo pranešimą ir tikriname ar matome
  //   raudoną kryžiuko ikonėlę ❌. Ši ikonėlė signalizuoja vartotojui,
  //   kad veiksmas nepavyko (pvz., nepakanka taškų, serverio klaida).
  // ═══════════════════════════════════════════════════════════════════════════
  it('turėtų renderinti error tipo toast su ikona ❌', () => {
    const { getByText } = render(
      <ToastNotification
        message="Klaida"
        type="error" // Tipas: error → TURI rodyti ❌
        visible={true}
        onHide={mockOnHide}
      />,
    );

    expect(getByText('❌')).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTAS 5: Ar WARNING tipas rodo ⚠️ ikonėlę?
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Ką tikrina žmogiškai:
  //   Sukuriame įspėjimo (warning) tipo pranešimą ir tikriname ar matome
  //   oranžinę/geltoną įspėjimo ikonėlę ⚠️. Ši ikonėlė naudojama kai
  //   veiksmas pavyko, bet yra kažkas, į ką vartotojas turėtų atkreipti
  //   dėmesį (pvz., „Prenumerata baigiasi rytoj!").
  // ═══════════════════════════════════════════════════════════════════════════
  it('turėtų renderinti warning tipo toast su ikona ⚠️', () => {
    const { getByText } = render(
      <ToastNotification
        message="Įspėjimas"
        type="warning" // Tipas: warning → TURI rodyti ⚠️
        visible={true}
        onHide={mockOnHide}
      />,
    );

    expect(getByText('⚠️')).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTAS 6: Ar pranešimas automatiškai paslepiamas po nurodytos trukmės?
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Ką tikrina žmogiškai:
  //   Sukuriame pranešimą su trukme 3000ms (3 sekundės).
  //   Persukame „netikrą" laiką 3300ms į priekį (3000ms trukmė + 300ms
  //   slėpimo animacija) ir tikriname ar onHide callback buvo iškviesta.
  //   Tai reiškia, kad pranešimas sėkmingai pasislėpė automatiškai.
  //
  //   Be šio testo nežinotume ar auto-hide funkcionalumas veikia —
  //   pranešimai galėtų likti ekrane amžinai ir trukdyti vartotojui.
  // ═══════════════════════════════════════════════════════════════════════════
  it('turėtų iškviesti onHide po nustatytos trukmės', () => {
    render(
      <ToastNotification
        message="Auto-hide"
        type="success"
        visible={true}
        onHide={mockOnHide}
        duration={3000} // Pranešimas turi pasislėpti po 3000ms
      />,
    );

    // Persukame netikrą laiką 3300ms į priekį:
    // - 3000ms = trukmė (duration)
    // - +300ms = slėpimo animacijos laikas (fade out)
    // Po šio laiko Toast komponentas turi iškviesti onHide()
    act(() => {
      jest.advanceTimersByTime(3300);
    });

    // Tikriname: ar onHide callback buvo iškviesta?
    // Tai patvirtina, kad pranešimas sėkmingai pasislėpė automatiškai
    expect(mockOnHide).toHaveBeenCalled();
  });
});
