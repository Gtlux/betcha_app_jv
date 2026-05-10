import { LEVELS, LevelConfig, MAX_LEVEL_POINTS } from '../constants/levels';

/**
 * Grąžina vartotojo dabartinį lygį pagal bendrus taškus.
 */
export const getCurrentLevel = (points: number): LevelConfig => {
  const sortedLevels = [...LEVELS].sort((a, b) => b.minPoints - a.minPoints);
  return sortedLevels.find((level) => points >= level.minPoints) || LEVELS[0];
};

/**
 * Apskaičiuoja progresijos procentą (0-1) tarp dabartinio ir kito lygio slenksčių.
 */
export const getProgressPercentage = (points: number): number => {
  const currentLevel = getCurrentLevel(points);
  const currentIndex = LEVELS.findIndex((l) => l.name === currentLevel.name);
  const nextLevel = LEVELS[currentIndex + 1];

  if (!nextLevel) return 1; // Pasiektas maksimalus lygis

  const range = nextLevel.minPoints - currentLevel.minPoints;
  const progressInLevel = points - currentLevel.minPoints;

  return Math.min(Math.max(progressInLevel / range, 0), 1);
};

/**
 * Grąžina taškų kiekį iki kito lygio slenksčio.
 */
export const getPointsToNextThreshold = (points: number): number => {
  const currentLevel = getCurrentLevel(points);
  const currentIndex = LEVELS.findIndex((l) => l.name === currentLevel.name);
  const nextLevel = LEVELS[currentIndex + 1];

  if (!nextLevel) return 0;

  return nextLevel.minPoints - points;
};
