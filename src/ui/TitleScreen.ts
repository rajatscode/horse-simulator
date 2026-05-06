export class TitleScreen {
  private el: HTMLElement;

  constructor() {
    this.el = document.getElementById('title-screen')!;
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
