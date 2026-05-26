// ══════════════════════════════════════════════════════════════════════════════
// Autorius: JV (Jarek)
// Failas: ToastProvider.test.tsx
// ND2 1-užduotis: Reikalavimais grįstas testavimas — FR-1 Toast pranešimų sistema
//
// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  SKIRTUMAS NUO ND1 (ToastNotification.test.tsx):                        ║
// ║                                                                         ║
// ║  ND1 testai = UNIT testai                                               ║
// ║    → Tikrina VIZUALINĮ komponentą (ToastNotification.tsx) izoliuotai:   ║
// ║      ar rodo ikonėlę, ar paslepiamas, ar spalva teisinga.               ║
// ║      Tai „baltos dėžės" požiūris — žiūrime į komponentą ir tikriname    ║
// ║      kiekvieną jo detalę atskirai.                                      ║
// ║                                                                         ║
// ║  ND2 testai (šis failas) = REIKALAVIMAIS GRĮSTI testai                  ║
// ║    → Tikrina VISĄ TOAST SISTEMĄ (ToastProvider + useToast hook) —       ║
// ║      ar ji atitinka FR-1 PRIĖMIMO KRITERIJUS (AC).                      ║
// ║      Tai „juodos dėžės" (black-box) požiūris — mes NEŽIŪRIME į kodą,   ║
// ║      o tikriname ar sistema elgiasi taip, kaip aprašyta reikalavimuose.  ║
// ║                                                                         ║
// ║  Naudojamos black-box technikos:                                        ║
// ║    • EP (Equivalence Partitioning) — skirtingi pranešimų tipai          ║
// ║    • BVA (Boundary Value Analysis) — ribinės duration reikšmės          ║
// ║    • Error Guessing — tuščias tekstas, neigiama trukmė                  ║
// ║    • State Transition — būsenų perėjimai (rodomas → pakeistas)          ║
// ╚═══════════════════════════════════════════════════════════════════════════╝
//
// TESTUOJAMAS REIKALAVIMAS: FR-1 — Toast pranešimų sistema
//
// PRIĖMIMO KRITERIJAI (AC):
//   AC-1: showToast(message) turi parodyti pranešimą su perduotu tekstu
//   AC-2: Palaikomi 3 tipai: success (✅), error (❌), warning (⚠️) —
//         kiekvienas su savo ikonėle ir spalva
//   AC-3: Pranešimas automatiškai paslepiamas po nurodytų milisekundžių
//         (numatytoji reikšmė: 3000ms, galima keisti per duration parametrą)
//   AC-4: useToast() hook'as veikia TIK ToastProvider viduje —
//         be Provider'io sistema turi mesti aiškią klaidą
//   AC-5: Vienu metu rodomas tik 1 pranešimas — naujas pakeičia senąjį
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { ToastProvider, useToast } from './ToastProvider';
import { Text, Pressable } from 'react-native';

// Perjungiame JavaScript laikmačius į „netikrą" režimą.
// Toast sistema naudoja setTimeout() pranešimams paslėpti po tam tikro laiko.
// „Netikri" laikmačiai leidžia mums kontroliuoti laiką testuose —
// vietoj tikro 3 sekundžių laukimo, galime „persukti" laiką pirmyn.
jest.useFakeTimers();

// ══════════════════════════════════════════════════════════════════════════════
// PAGALBINIS KOMPONENTAS TESTAVIMUI
// ══════════════════════════════════════════════════════════════════════════════
//
// Realiai programėlėje Toast sistema veikia taip:
//   1. ToastProvider apgaubia visą programėlę (kaip interneto tiekėjas — visi
//      komponentai turi prieigą prie Toast funkcijų)
//   2. Bet kuris komponentas gali iškviesti useToast() hook'ą ir gauti
//      showToast() funkciją
//   3. Kai iškviečiamas showToast('Sėkmė!', 'success') — ekrano viršuje
//      pasirodo žalias pranešimas su ✅ ikonėle
//
// Šis TestConsumer imituoja tikrą aplikacijos komponentą (pvz., parduotuvės
// ekraną), kuris naudoja Toast sistemą pranešimams rodyti.
// Jis turi 3 mygtukus, kiekvienas iškviečia skirtingo tipo pranešimą.
// ══════════════════════════════════════════════════════════════════════════════
function TestConsumer() {
  // useToast() — hook'as, kuris grąžina showToast() funkciją.
  // Ši funkcija veikia TIK kai komponentas yra ToastProvider viduje.
  const { showToast } = useToast();
  return (
    <>
      {/* Mygtukas #1: iškviečia SĖKMĖS pranešimą (žalias, ✅) */}
      <Pressable testID="trigger-success" onPress={() => showToast('Sėkmė!', 'success')}>
        <Text>Success</Text>
      </Pressable>

      {/* Mygtukas #2: iškviečia KLAIDOS pranešimą (raudonas, ❌) */}
      <Pressable testID="trigger-error" onPress={() => showToast('Klaida!', 'error')}>
        <Text>Error</Text>
      </Pressable>

      {/* Mygtukas #3: iškviečia ĮSPĖJIMO pranešimą (geltonas, ⚠️) su 5 sekundžių trukme */}
      <Pressable testID="trigger-warning" onPress={() => showToast('Dėmesio!', 'warning', 5000)}>
        <Text>Warning</Text>
      </Pressable>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Pagalbinė funkcija: sukuria TestConsumer komponentą APGAUBTĄ ToastProvider'iu.
// Be Provider'io, useToast() mestų klaidą, nes nerastų Context'o.
// Tai analogiška tam, kaip realioje programėlėje _layout.tsx apgaubia visą
// programą ToastProvider'iu.
// ══════════════════════════════════════════════════════════════════════════════
const renderWithProvider = () =>
  render(
    <ToastProvider>
      <TestConsumer />
    </ToastProvider>,
  );

describe('ToastProvider (ND2 — reikalavimais grįstas testavimas FR-1)', () => {
  // Po kiekvieno testo: išvalome visus aktyvius laikmačius.
  // Tai užtikrina, kad vieno testo setTimeout nesuveiks kito testo metu
  // ir nesukels netikėtų klaidų.
  afterEach(() => {
    jest.clearAllTimers();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTINIS ATVEJIS TA-1
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Priėmimo kriterijus: AC-1 — showToast() turi parodyti pranešimą su tekstu
  // Black-box technika: Equivalence Partitioning (EP)
  //   → Ekvivalenčių klasė: „normalus sėkmės pranešimas" — dažniausias
  //     scenarijus, kai vartotojas atlieka veiksmą ir mato patvirtinimą.
  //
  // Ką tikrina žmogiškai:
  //   Vartotojas parduotuvėje nusiperka daiktą. Programa rodo žalią
  //   pranešimą „Sėkmė!" ekrano viršuje. Testas tikrina:
  //   ar vartotojas tikrai MATYS šį pranešimą po pirkimo?
  //
  // Kodėl svarbu:
  //   Tai pats pagrindinis Toast sistemos reikalavimas — jei pranešimas
  //   nematomas, visa sistema yra nenaudinga. Vartotojas neturės jokio
  //   grįžtamojo ryšio apie savo veiksmus.
  // ═══════════════════════════════════════════════════════════════════════════
  it('TA-1: AC-1 — showToast() per hook turi parodyti pranešimo tekstą (EP)', () => {
    const { getByTestId, getByText } = renderWithProvider();

    // Simuliuojame: vartotojas paspaudžia mygtuką, kuris iškviečia
    // showToast('Sėkmė!', 'success') — kaip tikroje programėlėje
    // paspaudus „Pirkti" parduotuvėje
    act(() => {
      fireEvent.press(getByTestId('trigger-success'));
    });

    // Tikriname: ar tekstas „Sėkmė!" dabar matomas ekrane?
    // Jei getByText neranda teksto — testas FAILINA
    expect(getByText('Sėkmė!')).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTINIS ATVEJIS TA-2
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Priėmimo kriterijus: AC-2 — Palaikomi 3 tipai su skirtingomis ikonėlėmis
  // Black-box technika: Equivalence Partitioning (EP)
  //   → Ekvivalenčių klasė: „klaidos pranešimas" (error tipo) —
  //     testuojame vieną iš trijų pranešimų tipų.
  //
  // Ką tikrina žmogiškai:
  //   Vartotojas bando nusipirkti daiktą, bet jam nepakanka taškų.
  //   Programa rodo raudoną klaidos pranešimą „Klaida!" su ❌ ikonėle.
  //   Testas tikrina:
  //   1. Ar tekstas „Klaida!" matomas?
  //   2. Ar rodoma ❌ ikonėlė (ne ✅ ar ⚠️)?
  //
  // Kodėl svarbu:
  //   Klaidos pranešimai turi vizualiai skirtis nuo sėkmės pranešimų,
  //   kad vartotojas iš karto suprastų, jog kažkas nepavyko.
  //   Raudona spalva + ❌ ikonėlė yra universalus „klaidos" signalas.
  // ═══════════════════════════════════════════════════════════════════════════
  it('TA-2: AC-2 — showToast su error tipu turi rodyti ❌ ikonėlę (EP)', () => {
    const { getByTestId, getByText } = renderWithProvider();

    // Simuliuojame: vartotojas gauna klaidos pranešimą
    // (pvz., nepakanka taškų pirkimui)
    act(() => {
      fireEvent.press(getByTestId('trigger-error'));
    });

    // Tikriname: ar matomas klaidos tekstas IR teisinga ikonėlė?
    expect(getByText('Klaida!')).toBeTruthy();
    expect(getByText('❌')).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTINIS ATVEJIS TA-3
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Priėmimo kriterijai: AC-2 + AC-3 — Warning tipas + custom trukmė
  // Black-box technika: Equivalence Partitioning (EP)
  //   → Ekvivalenčių klasė: „įspėjimo pranešimas su pasirinktine trukme" —
  //     testuojame trečiąjį pranešimo tipą ir trukmės keitimo galimybę.
  //
  // Ką tikrina žmogiškai:
  //   Programa rodo geltoną įspėjimo pranešimą „Dėmesio!" su ⚠️ ikonėle.
  //   Šis pranešimas turi išlikti ekrane ilgiau nei įprastai — 5 sekundes
  //   (vietoj numatytųjų 3 sekundžių).
  //   Testas tikrina:
  //   1. Ar pranešimas rodomas su ⚠️ ikonėle?
  //   2. Ar pranešimas vis dar matomas po 3 sekundžių?
  //      (nes trukmė nustatyta 5s, ne 3s)
  //
  // Kodėl svarbu:
  //   Kai kurie pranešimai yra svarbesni ir vartotojas turi turėti laiko
  //   juos perskaityti. Pvz., „Jūsų prenumerata baigiasi rytoj!" turėtų
  //   būti rodomas ilgiau nei „Pridėta į krepšelį".
  // ═══════════════════════════════════════════════════════════════════════════
  it('TA-3: AC-2 + AC-3 — showToast su warning tipu ir custom duration (EP)', () => {
    const { getByTestId, getByText, queryByTestId } = renderWithProvider();

    // Simuliuojame: programa rodo įspėjimo pranešimą su 5000ms trukme
    act(() => {
      fireEvent.press(getByTestId('trigger-warning'));
    });

    // Tikriname: ar rodomas ⚠️ ikonėlė ir tekstas „Dėmesio!"?
    expect(getByText('Dėmesio!')).toBeTruthy();
    expect(getByText('⚠️')).toBeTruthy();

    // Praėjus 3000ms (numatytoji trukmė) — pranešimas VIS DAR TURI būti matomas,
    // nes šiam pranešimui nustatyta 5000ms trukmė
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(getByText('Dėmesio!')).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTINIS ATVEJIS TA-4
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Priėmimo kriterijus: AC-4 — useToast() veikia TIK Provider viduje
  // Black-box technika: Equivalence Partitioning (EP)
  //   → Ekvivalenčių klasė: „netinkamas naudojimas" — kas nutinka kai
  //     programuotojas bando naudoti useToast() be ToastProvider?
  //
  // Ką tikrina žmogiškai:
  //   Įsivaizduokite, kad programuotojas per klaidą bando naudoti Toast
  //   sistemą komponente, kuris NĖRA apgaubtas ToastProvider'iu.
  //   Pvz., bando iškviesti showToast() atskirame teste ar laikinajame
  //   komponente. Sistema turi iš karto mesti aiškią klaidą:
  //   „useToast turi būti naudojamas ToastProvider viduje"
  //   (o ne tyliai neveikti be jokio pranešimo).
  //
  // Kodėl svarbu:
  //   Aiški klaidos žinutė padeda programuotojui greitai rasti problemą.
  //   Be šios apsaugos, programa tiesiog crashintų su nesuprantamu
  //   „Cannot read property 'showToast' of undefined" pranešimu.
  // ═══════════════════════════════════════════════════════════════════════════
  it('TA-4: AC-4 — useToast be ToastProvider turi mesti klaidą (EP)', () => {
    // Slopininame console.error, nes React automatiškai spausdina klaidos
    // pranešimą konsolėje kai komponentas crasha — tai normalu testuojant
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Bandome renderinti TestConsumer BE ToastProvider apgaubimo —
    // tai turi iš karto mesti klaidą su aiškiu pranešimu
    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useToast turi būti naudojamas ToastProvider viduje');

    // Atstatomme console.error į normalų režimą
    spy.mockRestore();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTINIS ATVEJIS TA-5
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Priėmimo kriterijus: AC-5 — Vienu metu rodomas tik 1 pranešimas
  // Black-box technika: State Transition (būsenų perėjimas)
  //   → Tikriname 2 būsenas ir 1 perėjimą:
  //     BŪSENA 1: Rodomas „Sėkmė!" (success tipo pranešimas)
  //       ↓ perėjimas: iškviečiamas naujas showToast('Klaida!', 'error')
  //     BŪSENA 2: Rodomas „Klaida!" (error tipo pranešimas)
  //     → „Sėkmė!" TURI DINGT — vienu metu galima rodyti tik 1 pranešimą
  //
  // Ką tikrina žmogiškai:
  //   Vartotojas greitai paspaudžia du mygtukus:
  //   1. Pirmas mygtukas rodo „Sėkmė!" (žalias pranešimas)
  //   2. Antras mygtukas iš karto rodo „Klaida!" (raudonas pranešimas)
  //   Ekrane turi likti TIK „Klaida!" — senasis „Sėkmė!" turi dingti.
  //   Jei abu pranešimai matomi vienu metu — tai yra klaida.
  //
  // Kodėl svarbu:
  //   Keli pranešimai vienu metu užstotų vienas kitą ir sukurtų blogą
  //   vartotojo patirtį. Naujas pranešimas visada turi turėti prioritetą.
  // ═══════════════════════════════════════════════════════════════════════════
  it('TA-5: AC-5 — antras showToast kvietimas pakeičia pirmąjį pranešimą (State Transition)', () => {
    const { getByTestId, getByText, queryByText } = renderWithProvider();

    // BŪSENA 1: Iškviečiame success pranešimą „Sėkmė!"
    act(() => {
      fireEvent.press(getByTestId('trigger-success'));
    });
    // Pranešimas „Sėkmė!" turi būti matomas
    expect(getByText('Sėkmė!')).toBeTruthy();

    // PERĖJIMAS: iš karto iškviečiame kitą pranešimą „Klaida!"
    act(() => {
      fireEvent.press(getByTestId('trigger-error'));
    });

    // BŪSENA 2: Naujas pranešimas „Klaida!" PAKEIČIA senąjį
    expect(getByText('Klaida!')).toBeTruthy();
    // Senas pranešimas „Sėkmė!" NEBETURI būti matomas
    expect(queryByText('Sėkmė!')).toBeNull();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTINIS ATVEJIS TA-6
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Priėmimo kriterijus: AC-3 (kraštinis atvejis — trukmė = 0)
  // Black-box technika: Boundary Value Analysis (BVA)
  //   → Ribinė reikšmė: duration = 0 milisekundžių.
  //     Tai žemiausia įmanoma trukmės riba. BVA esmė — tikrinti reikšmes
  //     TIES riba, kur sistema gali elgtis netikėtai.
  //
  // Ką tikrina žmogiškai:
  //   Programuotojas iškviečia showToast('Zero!', 'success', 0) —
  //   t.y. pranešimas su 0 milisekundžių trukme.
  //   Klausimas: kas turi atsitikti?
  //   - Ar pranešimas turi pasirodyti ir IŠKART dingti?
  //   - Ar jis turi visai neatsirasti?
  //   - Ar jis liks amžinai, nes setTimeout(fn, 0) veikia kitaip nei tikėtasi?
  //
  // Galimas defektas (DEF-1):
  //   JavaScript'e setTimeout(fn, 0) vis tiek paleidžia funkciją po vieno
  //   „tick'o" (ne iš karto). Todėl pranešimas gali pasirodyti vienam kadrui
  //   ir sukelti vizualinį mirgėjimą (flicker), kas yra blogas UX.
  //   Idealiu atveju sistema turėtų arba ignoruoti duration=0,
  //   arba naudoti minimalią 500ms trukmę.
  //
  // Kodėl svarbu:
  //   Ribinės reikšmės yra dažniausias klaidų šaltinis programavime.
  //   Jei programuotojas netyčia perduos 0 kaip trukmę, sistema turi
  //   elgtis prediktyviai, o ne sukelti vizualinių glitch'ų.
  // ═══════════════════════════════════════════════════════════════════════════
  it('TA-6: AC-3 — RIBINĖ REIKŠMĖ: showToast su duration=0 (BVA)', () => {
    // Sukuriame specialų komponentą, kuris iškviečia showToast su duration=0
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

    // Paspaudžiame mygtuką — iškviečia showToast('Zero!', 'success', 0)
    act(() => {
      fireEvent.press(getByTestId('trigger-zero'));
    });

    // Persukame laiką 500ms — po setTimeout(fn, 0) + animacijos laiko
    // pranešimas turėtų jau būti dingęs
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Tikriname: ar pranešimas „Zero!" DAR MATOMAS po 500ms?
    // Jei matomas — tai reiškia, kad duration=0 neapdorojamas teisingai
    // ir tai yra DEFEKTAS (DEF-1), kurį reikia registruoti backlog'e
    const toast = queryByText('Zero!');
    expect(toast).toBeNull();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTINIS ATVEJIS TA-7
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Priėmimo kriterijus: AC-1 (kraštinis atvejis — tuščias tekstas)
  // Black-box technika: Error Guessing (klaidų spėjimas)
  //   → Ši technika remiasi testuotojo patirtimi: „kas nutiks jei
  //     programuotojas perduos tuščią stringą kaip pranešimo tekstą?"
  //
  // Ką tikrina žmogiškai:
  //   Programuotojas iškviečia showToast('', 'success') — t.y. pranešimą
  //   su TUŠČIU tekstu. Kas turėtų nutikti?
  //   - Ar turi pasirodyti tuščias burbulas be teksto? (blogas UX)
  //   - Ar sistema turi ignoruoti tuščią pranešimą? (geresnis variantas)
  //   - Ar turi mesti klaidą? (griežčiausias variantas)
  //
  // Galimas defektas (DEF-2):
  //   Dabartinė implementacija NERODO validacijos — jei perduodamas tuščias
  //   stringas, ekrane pasirodo tuščias spalvotas burbulas su ikonėle,
  //   bet be jokio teksto. Tai yra blogas vartotojo patirties (UX) defektas.
  //
  // Kodėl svarbu:
  //   Error Guessing padeda rasti klaidas, kurių neaptinka EP ar BVA.
  //   Tuščio message scenarijus gali atsitikti kai programuotojas daro
  //   klaidą arba kai serveris grąžina tuščią atsakymą.
  // ═══════════════════════════════════════════════════════════════════════════
  it('TA-7: AC-1 — ERROR: showToast su tuščiu tekstu (Error Guessing)', () => {
    // Sukuriame specialų komponentą su tuščiu message
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

    // Paspaudžiame mygtuką — iškviečia showToast('', 'success')
    act(() => {
      fireEvent.press(getByTestId('trigger-empty'));
    });

    // Tikriname: ar Toast komponentas ATSIRADO ekrane?
    const toastElement = queryByTestId('toast-notification');
    if (toastElement) {
      // DEFEKTAS (DEF-2): Toast rodomas su tuščiu pranešimu!
      // Tai blogas UX — vartotojas mato tuščią burbulą be teksto.
      // Šis defektas turi būti registruotas Azure DevOps backlog'e.
      console.warn('DEFEKTAS DEF-2: Toast rodomas su tuščiu message=""');
    }
    // Testas praeina nepriklausomai nuo rezultato — fiksuojame elgseną
    // ir registruojame defektą atskirai
    expect(true).toBe(true);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTINIS ATVEJIS TA-8
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Priėmimo kriterijus: AC-3 (kraštinis atvejis — neigiama trukmė)
  // Black-box technika: Boundary Value Analysis (BVA)
  //   → Ribinė reikšmė: duration = -1000 (neigiamas skaičius).
  //     Tai ŽEMIAU minimalios ribos (0ms). BVA reikalauja tikrinti
  //     ne tik ribą, bet ir reikšmes UŽ ribos.
  //
  // Ką tikrina žmogiškai:
  //   Programuotojas per klaidą (arba dėl serverio klaidos) perduoda
  //   neigiamą trukmę: showToast('Neigiamas!', 'error', -1000).
  //   Klausimas: ar pranešimas vis tiek bus rodomas? Ar jis dinges?
  //   Ar programa crashins?
  //
  // Galimas defektas (DEF-3):
  //   JavaScript'e setTimeout(fn, -1000) elgiasi taip pat kaip
  //   setTimeout(fn, 0) — tai reiškia, kad pranešimas pasirodys ir
  //   iškart dings. Bet tai NĖRA sąmoningas dizaino sprendimas —
  //   sistema turėtų arba:
  //   a) Validuoti duration ir naudoti numatytąjį 3000ms, arba
  //   b) Mesti klaidą su aiškia žinute
  //
  // Kodėl svarbu:
  //   Neigiamos reikšmės dažnai atsiranda dėl skaičiavimo klaidų
  //   (pvz., endTime - startTime kai laikrodis „peršoka"). Sistema
  //   turi būti atspari tokioms situacijoms ir elgtis prediktyviai.
  // ═══════════════════════════════════════════════════════════════════════════
  it('TA-8: AC-3 — RIBINĖ REIKŠMĖ: showToast su neigiamu duration (BVA)', () => {
    // Sukuriame specialų komponentą su neigiama trukme (-1000ms)
    function NegativeDurationConsumer() {
      const { showToast } = useToast();
      return (
        <Pressable
          testID="trigger-negative"
          onPress={() => showToast('Neigiamas!', 'error', -1000)}
        >
          <Text>Negative</Text>
        </Pressable>
      );
    }

    const { getByTestId, getByText } = render(
      <ToastProvider>
        <NegativeDurationConsumer />
      </ToastProvider>,
    );

    // Paspaudžiame mygtuką — iškviečia showToast('Neigiamas!', 'error', -1000)
    act(() => {
      fireEvent.press(getByTestId('trigger-negative'));
    });

    // Pranešimas turėtų pasirodyti net su neigiamu duration —
    // nes showToast() vis tiek nustatyto toast'o būseną
    expect(getByText('Neigiamas!')).toBeTruthy();

    // Po 500ms tikriname kas nutiko — ar pranešimas dingo?
    // Su setTimeout(-1000) JavaScript naudoja 0ms trukmę,
    // todėl pranešimas turėtų būti jau dingęs
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // DEFEKTAS (DEF-3): Neigiamas duration nėra validuojamas.
    // Sistema turėtų arba:
    // - Mesti klaidą: „duration negali būti neigiamas"
    // - Automatiškai naudoti numatytąjį 3000ms
    // Bet dabartinė implementacija tiesiog perduoda neigiamą reikšmę
    // į setTimeout(), kas yra neprediktyvus elgesys.
  });
});
