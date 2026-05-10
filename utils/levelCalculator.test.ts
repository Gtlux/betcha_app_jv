import { getCurrentLevel, getProgressPercentage } from './levelCalculator';
import { LEVELS } from '../constants/levels';

describe('levelCalculator', () => {
  describe('getCurrentLevel', () => {
    it('turėtų grąžinti Geležinį lygį, kai taškų yra 0', () => {
      const level = getCurrentLevel(0);
      expect(level.name).toBe('Geležinis');
      expect(level.color).toBe('levelIron');
    });

    it('turėtų grąžinti Bronzinį lygį, kai taškų yra 50', () => {
      const level = getCurrentLevel(50);
      expect(level.name).toBe('Bronzinis');
      expect(level.color).toBe('levelBronze');
    });

    it('turėtų grąžinti Smaragdinį lygį, kai taškų yra 1000', () => {
      const level = getCurrentLevel(1000);
      expect(level.name).toBe('Smaragdinis');
      expect(level.color).toBe('levelEmerald');
    });

    it('turėtų grąžinti Meistro lygį, kai taškų yra 10000 ar daugiau', () => {
      const level = getCurrentLevel(15000);
      expect(level.name).toBe('Meistro');
      expect(level.color).toBe('levelMaster');
    });
  });

  describe('getProgressPercentage', () => {
    it('turėtų grąžinti 0% Geležinio lygio pradžioje', () => {
      expect(getProgressPercentage(0)).toBe(0);
    });

    it('turėtų grąžinti 50% Geležinio lygio viduryje (25 taškai)', () => {
      // Geležinis: 0, Bronzinis: 50. (25-0)/(50-0) = 0.5
      expect(getProgressPercentage(25)).toBe(0.5);
    });

    it('turėtų grąžinti 100% pasiekus maksimalų lygį', () => {
      expect(getProgressPercentage(10000)).toBe(1);
      expect(getProgressPercentage(20000)).toBe(1);
    });

    it('turėtų grąžinti teisingą procentą tarp Sidabrinio ir Auksinio (150 taškų)', () => {
      // Sidabras: 100, Auksas: 200. (150-100)/(200-100) = 0.5
      expect(getProgressPercentage(150)).toBe(0.5);
    });
  });
});
