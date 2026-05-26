/**
 * Skriptas parduotuvės prekių pavadinimų taisymui Supabase DB.
 * Paleidimas: npx tsx scripts/fix-store-encoding.ts
 *
 * Problema: „Praleisti užduotį" rodomas kaip „Praleisti uÃ¾duotÄ"
 * (UTF-8 baitai interpretuoti kaip Latin-1).
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixStoreItems() {
  const { data, error } = await supabase.from('store_items').select('id, name, description');

  if (error) {
    console.error('Klaida:', error.message);
    return;
  }

  console.log('Dabartiniai store_items:');
  for (const item of data ?? []) {
    console.log(`  ${item.id}: name="${item.name}", desc="${item.description}"`);
  }

  // Pataisome pavadinimus
  const fixes: Record<string, { name: string; description: string }> = {};

  for (const item of data ?? []) {
    // Tikrinti ar yra sugadintos raidės
    if (item.name?.includes('Ã') || item.name?.includes('Ä') || item.name?.includes('Å')) {
      try {
        // Bandome atkurti: Latin-1 → UTF-8
        const fixedName = fixEncoding(item.name);
        const fixedDesc = item.description ? fixEncoding(item.description) : item.description;
        fixes[item.id] = { name: fixedName, description: fixedDesc };
        console.log(`  FIX: "${item.name}" → "${fixedName}"`);
      } catch {
        console.log(`  SKIP: "${item.name}" (negalima automatiškai pataisyti)`);
      }
    }
  }

  if (Object.keys(fixes).length === 0) {
    console.log('\nNėra ką taisyti — visi pavadinimai atrodo teisingi.');
    return;
  }

  console.log(`\nTaisome ${Object.keys(fixes).length} įrašų...`);

  for (const [id, { name, description }] of Object.entries(fixes)) {
    const { error: updateError } = await supabase
      .from('store_items')
      .update({ name, description })
      .eq('id', id);

    if (updateError) {
      console.error(`  Klaida taisiant ${id}:`, updateError.message);
    } else {
      console.log(`  ✅ Pataisyta: ${name}`);
    }
  }
}

function fixEncoding(str: string): string {
  // Konvertuojame: interpretuojame stringą kaip Latin-1 baitus,
  // tada dekoduojame kaip UTF-8
  const bytes = new Uint8Array([...str].map((c) => c.charCodeAt(0)));
  return new TextDecoder('utf-8').decode(bytes);
}

fixStoreItems().catch(console.error);
