import { eventBus } from '../core/EventBus';

export class HorseStats {
  health = 100;
  hunger = 100;
  thirst = 100;
  stamina = 100;
  age = 0; // in seconds of play time

  // Age thresholds (in seconds)
  static FOAL_END = 180;       // 3 min
  static YEARLING_END = 480;   // 8 min
  static STALLION_END = 780;   // 13 min
  // After 13 min = elder

  get ageLabel(): string {
    if (this.age < HorseStats.FOAL_END) return 'Foal';
    if (this.age < HorseStats.YEARLING_END) return 'Yearling';
    if (this.age < HorseStats.STALLION_END) return 'Stallion';
    return 'Elder';
  }

  reset(): void {
    this.health = 100;
    this.hunger = 100;
    this.thirst = 100;
    this.stamina = 100;
    this.age = 0;
  }

  update(dt: number, moving: boolean, sprinting: boolean): void {
    // Drain hunger and thirst over time
    this.hunger -= dt * 1.0;
    this.thirst -= dt * 1.2;

    // Stamina drains when moving, recovers when still
    if (sprinting) {
      this.stamina -= dt * 12;
    } else if (moving) {
      this.stamina -= dt * 3;
    } else {
      this.stamina += dt * 8;
    }

    // Low hunger/thirst damages health
    if (this.hunger <= 0) {
      this.hunger = 0;
      this.health -= dt * 3;
    }
    if (this.thirst <= 0) {
      this.thirst = 0;
      this.health -= dt * 4;
    }

    // Clamp
    this.health = Math.max(0, Math.min(100, this.health));
    this.hunger = Math.max(0, Math.min(100, this.hunger));
    this.thirst = Math.max(0, Math.min(100, this.thirst));
    this.stamina = Math.max(0, Math.min(100, this.stamina));

    // Age
    this.age += dt;

    // Death
    if (this.health <= 0) {
      eventBus.emit('horse-died');
    }
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }

  feedHunger(amount: number): void {
    this.hunger = Math.min(100, this.hunger + amount);
  }

  feedThirst(amount: number): void {
    this.thirst = Math.min(100, this.thirst + amount);
  }
}
