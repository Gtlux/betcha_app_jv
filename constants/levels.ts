import { Theme } from './theme';

export interface LevelConfig {
  name: string;
  minPoints: number;
  color: keyof Theme['colors'];
}

export const LEVEL_COLORS = {
  iron: '#94A3B8', // 0 - Geležinis
  bronze: '#CD7F32', // 50 - Bronzinis
  silver: '#C0C0C0', // 100 - Sidabrinis
  gold: '#FFD700', // 200 - Auksinis
  platinum: '#E5E4E2', // 500 - Platininis
  emerald: '#10B981', // 1000 - Smaragdinis
  ruby: '#EF4444', // 2000 - Rubininis
  diamond: '#0EA5E9', // 5000 - Deimantinis
  master: '#8B5CF6', // 10000 - Meistro
} as const;

export const LEVELS: LevelConfig[] = [
  { name: 'Geležinis', minPoints: 0, color: 'levelIron' },
  { name: 'Bronzinis', minPoints: 50, color: 'levelBronze' },
  { name: 'Sidabrinis', minPoints: 100, color: 'levelSilver' },
  { name: 'Auksinis', minPoints: 200, color: 'levelGold' },
  { name: 'Platininis', minPoints: 500, color: 'levelPlatinum' },
  { name: 'Smaragdinis', minPoints: 1000, color: 'levelEmerald' },
  { name: 'Rubininis', minPoints: 2000, color: 'levelRuby' },
  { name: 'Deimantinis', minPoints: 5000, color: 'levelDiamond' },
  { name: 'Meistro', minPoints: 10000, color: 'levelMaster' },
];

export const MAX_LEVEL_POINTS = 10000;
