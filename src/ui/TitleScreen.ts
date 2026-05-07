import { GameMode } from '../systems/GameMode';

export class TitleScreen {
  private el: HTMLElement;
  selectedMode: GameMode = 'survival';
  private modeContainer: HTMLElement | null = null;

  constructor() {
    this.el = document.getElementById('title-screen')!;
    this.setupModeSelector();
  }

  private setupModeSelector(): void {
    // Create mode selector HTML if not already present
    const existingContainer = this.el.querySelector('#mode-selector');
    if (existingContainer) {
      this.modeContainer = existingContainer as HTMLElement;
      return;
    }

    this.modeContainer = document.createElement('div');
    this.modeContainer.id = 'mode-selector';
    this.modeContainer.style.cssText = `
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      justify-content: center;
    `;

    const survivalBtn = document.createElement('button');
    survivalBtn.textContent = 'SURVIVAL MODE';
    survivalBtn.style.cssText = `
      padding: 10px 20px;
      background: #444;
      color: #fff;
      border: 2px solid #fff;
      font-family: 'Courier New', monospace;
      cursor: pointer;
      font-size: 14px;
      border-radius: 4px;
    `;
    survivalBtn.onclick = () => {
      this.selectedMode = 'survival';
      this.updateModeButtons();
    };

    const laststandBtn = document.createElement('button');
    laststandBtn.textContent = 'LAST STAND MODE';
    laststandBtn.style.cssText = `
      padding: 10px 20px;
      background: #444;
      color: #fff;
      border: 2px solid #888;
      font-family: 'Courier New', monospace;
      cursor: pointer;
      font-size: 14px;
      border-radius: 4px;
    `;
    laststandBtn.onclick = () => {
      this.selectedMode = 'laststand';
      this.updateModeButtons();
    };

    this.modeContainer.appendChild(survivalBtn);
    this.modeContainer.appendChild(laststandBtn);

    // Insert before the horse canvas
    const horseCanvas = this.el.querySelector('#title-horse');
    if (horseCanvas) {
      horseCanvas.parentElement?.insertBefore(this.modeContainer, horseCanvas);
    } else {
      this.el.insertBefore(this.modeContainer, this.el.firstChild);
    }

    this.updateModeButtons();
  }

  private updateModeButtons(): void {
    const buttons = this.modeContainer?.querySelectorAll('button');
    if (buttons) {
      buttons.forEach((btn, idx) => {
        const isSelected = (idx === 0 && this.selectedMode === 'survival') ||
                          (idx === 1 && this.selectedMode === 'laststand');
        btn.style.borderColor = isSelected ? '#fff' : '#888';
        btn.style.background = isSelected ? '#555' : '#444';
      });
    }
  }

  hide(): void {
    this.el.style.display = 'none';
  }

  show(): void {
    this.el.style.display = 'flex';
  }

  drawHorseSilhouette(): void {
    const canvas = document.getElementById('title-horse') as HTMLCanvasElement;
    canvas.width = 200;
    canvas.height = 150;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 10;

    // Simple horse silhouette using basic shapes
    // Body
    ctx.beginPath();
    ctx.ellipse(100, 85, 45, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.beginPath();
    ctx.moveTo(130, 75);
    ctx.lineTo(145, 40);
    ctx.lineTo(155, 40);
    ctx.lineTo(140, 78);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.ellipse(155, 35, 15, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Ear
    ctx.beginPath();
    ctx.moveTo(155, 25);
    ctx.lineTo(150, 15);
    ctx.lineTo(160, 22);
    ctx.fill();

    // Legs
    const legX = [70, 85, 115, 128];
    for (const lx of legX) {
      ctx.fillRect(lx - 3, 100, 6, 35);
      ctx.fillRect(lx - 4, 132, 8, 5);
    }

    // Tail
    ctx.beginPath();
    ctx.moveTo(55, 75);
    ctx.quadraticCurveTo(30, 60, 35, 90);
    ctx.quadraticCurveTo(40, 100, 55, 85);
    ctx.fill();

    // Mane
    ctx.beginPath();
    ctx.moveTo(130, 72);
    ctx.quadraticCurveTo(125, 50, 140, 40);
    ctx.lineTo(145, 42);
    ctx.quadraticCurveTo(130, 55, 135, 74);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#000';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(160, 33, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
