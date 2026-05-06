import { HorseStats } from '../horse/HorseStats';

export class AgingSystem {
  update(dt: number, stats: HorseStats): void {
    // Age is tracked by HorseStats.update, nothing extra needed here
    // This system provides scale/speed modifiers based on age
  }

  getScale(age: number): number {
    if (age < HorseStats.FOAL_END) {
      // Foal: start small, grow
      const t = age / HorseStats.FOAL_END;
      return 0.5 + t * 0.2;
    }
    if (age < HorseStats.YEARLING_END) {
      // Yearling
      const t = (age - HorseStats.FOAL_END) / (HorseStats.YEARLING_END - HorseStats.FOAL_END);
      return 0.7 + t * 0.2;
    }
    if (age < HorseStats.STALLION_END) {
      // Full stallion
      return 1.0;
    }
    // Elder: slightly smaller
    return 0.92;
  }

  getSpeedMultiplier(age: number): number {
    if (age < HorseStats.FOAL_END) return 0.6;
    if (age < HorseStats.YEARLING_END) return 0.85;
    if (age < HorseStats.STALLION_END) return 1.0;
    return 0.75;
  }

  getAgeLabel(age: number): string {
    if (age < HorseStats.FOAL_END) return 'Foal';
    if (age < HorseStats.YEARLING_END) return 'Yearling';
    if (age < HorseStats.STALLION_END) return 'Stallion';
    return 'Elder';
  }
}
