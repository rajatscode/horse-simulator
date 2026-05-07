import * as THREE from 'three';
import { HorseStats } from '../horse/HorseStats';
import { AgingSystem } from '../systems/AgingSystem';
import { Terrain } from '../world/Terrain';
import { RivalStallion } from '../entities/RivalStallion';
import { Mare } from '../entities/Mare';
import { Predator } from '../entities/Predator';

export class HUD {
  private hudEl: HTMLElement;
  private minimapContainer: HTMLElement;
  private minimapCanvas: HTMLCanvasElement;
  private minimapCtx: CanvasRenderingContext2D;
  private controlsEl: HTMLElement;
  private staminaVignette: HTMLElement;

  private healthFill: HTMLElement;
  private hungerFill: HTMLElement;
  private thirstFill: HTMLElement;
  private staminaFill: HTMLElement;
  private ageLabel: HTMLElement;

  constructor() {
    this.hudEl = document.getElementById('hud')!;
    this.minimapContainer = document.getElementById('minimap-container')!;
    this.minimapCanvas = document.getElementById('minimap') as HTMLCanvasElement;
    this.minimapCtx = this.minimapCanvas.getContext('2d')!;
    this.controlsEl = document.getElementById('controls-help')!;
    this.staminaVignette = document.getElementById('stamina-vignette')!;

    this.healthFill = document.getElementById('health-fill')!;
    this.hungerFill = document.getElementById('hunger-fill')!;
    this.thirstFill = document.getElementById('thirst-fill')!;
    this.staminaFill = document.getElementById('stamina-fill')!;
    this.ageLabel = document.getElementById('age-label')!;
  }

  show(): void {
    this.hudEl.style.display = 'block';
    this.minimapContainer.style.display = 'block';
    this.controlsEl.style.display = 'block';
    this.staminaVignette.style.display = 'block';
  }

  hide(): void {
    this.hudEl.style.display = 'none';
    this.minimapContainer.style.display = 'none';
    this.controlsEl.style.display = 'none';
    this.staminaVignette.style.display = 'none';
  }

  update(stats: HorseStats, aging: AgingSystem): void {
    this.healthFill.style.width = `${stats.health}%`;
    this.hungerFill.style.width = `${stats.hunger}%`;
    this.thirstFill.style.width = `${stats.thirst}%`;
    this.staminaFill.style.width = `${stats.stamina}%`;
    this.ageLabel.textContent = `AGE: ${stats.ageLabel}`;

    // Color warnings
    this.healthFill.style.background = stats.health < 30 ? '#ff2222' : '#e44';
    this.hungerFill.style.background = stats.hunger < 20 ? '#886600' : '#4a4';
    this.thirstFill.style.background = stats.thirst < 20 ? '#335588' : '#48f';

    // Stamina vignette effect
    if (stats.stamina < 25) {
      const vignetteOpacity = (1 - stats.stamina / 25) * 0.4;
      this.staminaVignette.style.opacity = String(vignetteOpacity);
    } else {
      this.staminaVignette.style.opacity = '0';
    }
  }

  updateMinimap(
    playerPos: THREE.Vector3,
    terrain: Terrain,
    rivals: RivalStallion[],
    mares: Mare[],
    predators: Predator[]
  ): void {
    const ctx = this.minimapCtx;
    const size = 150;
    const viewRange = 120; // world units shown on minimap

    ctx.clearRect(0, 0, size, size);

    // Draw terrain (simplified - just biome colors)
    const step = 5;
    for (let py = 0; py < size; py += step) {
      for (let px = 0; px < size; px += step) {
        const wx = playerPos.x + (px - size / 2) * (viewRange / size) * 2;
        const wz = playerPos.z + (py - size / 2) * (viewRange / size) * 2;
        const h = terrain.getHeightAt(wx, wz);

        if (h < 1.0) {
          ctx.fillStyle = '#2266aa';
        } else {
          const biome = terrain.getBiome(wx, wz);
          if (biome === 'desert') {
            ctx.fillStyle = '#c4a055';
          } else if (biome === 'forest') {
            ctx.fillStyle = '#2a5a2a';
          } else {
            ctx.fillStyle = '#4a8a3a';
          }
        }
        ctx.fillRect(px, py, step, step);
      }
    }

    // Draw entities
    const worldToMap = (wx: number, wz: number): [number, number] => {
      const mx = (wx - playerPos.x) / (viewRange * 2) * size + size / 2;
      const mz = (wz - playerPos.z) / (viewRange * 2) * size + size / 2;
      return [mx, mz];
    };

    // Rivals (red dots)
    for (const rival of rivals) {
      const [mx, mz] = worldToMap(rival.body.position.x, rival.body.position.z);
      if (mx >= 0 && mx < size && mz >= 0 && mz < size) {
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(mx, mz, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Mares (pink dots)
    for (const mare of mares) {
      const [mx, mz] = worldToMap(mare.body.position.x, mare.body.position.z);
      if (mx >= 0 && mx < size && mz >= 0 && mz < size) {
        ctx.fillStyle = '#ff88cc';
        ctx.beginPath();
        ctx.arc(mx, mz, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Predators (orange dots)
    for (const pred of predators) {
      const [mx, mz] = worldToMap(pred.body.position.x, pred.body.position.z);
      if (mx >= 0 && mx < size && mz >= 0 && mz < size) {
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(mx, mz, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player (white dot in center)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
