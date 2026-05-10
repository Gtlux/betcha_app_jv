/**
 * Apskaičiuoja lažybų koeficientus pagal užduoties sudėtingumo indeksą.
 *
 * difficulty_score yra AI priskirta reikšmė 1–10.
 * Koeficientai paremti tikimybe, kad užduotis bus atlikta:
 *
 *   p(sėkmė) = 0.80 - (difficulty - 1) × 0.067
 *     d=1  → p ≈ 80%   (labai lengva)
 *     d=5  → p ≈ 54%
 *     d=10 → p ≈ 20%   (labai sunki)
 *
 *   forOdds     = (1 / p)       × 0.90   // 10% house edge
 *   againstOdds = (1 / (1 - p)) × 0.90
 *
 * Rezultatas:
 *   Lengva (d=1): UŽ=1.13×, PRIEŠ=4.50×  — lengva atlikti, todėl prieš mokama daugiau
 *   Sunki (d=10): UŽ=4.50×, PRIEŠ=1.13×  — sunki atlikti, todėl už mokama daugiau
 */
export function calculateOdds(difficultyScore: number | null | undefined): {
  forOdds: number;
  againstOdds: number;
} {
  const d = Math.min(Math.max(difficultyScore ?? 5, 1), 10);
  const p = 0.8 - (d - 1) * 0.0667;
  const houseEdge = 0.9;

  const forOdds = Math.round((1 / p) * houseEdge * 100) / 100;
  const againstOdds = Math.round((1 / (1 - p)) * houseEdge * 100) / 100;

  return { forOdds, againstOdds };
}
