interface GameOverStats {
  distanceTraveled: number;
  fightsWon: number;
  objectsCrashedInto: number;
  timeSurvived: number;
  age: string;
}

export class GameOver {
  private el: HTMLElement;
  private statsEl: HTMLElement;

  constructor() {
    this.el = document.getElementById('game-over-screen')!;
    this.statsEl = document.getElementById('game-over-stats')!;
  }

  show(stats: GameOverStats): void {
    const minutes = Math.floor(stats.timeSurvived / 60);
    const seconds = stats.timeSurvived % 60;

    this.statsEl.innerHTML = `
      Time Survived: ${minutes}m ${seconds}s<br>
      Final Age: ${stats.age}<br>
      Distance Traveled: ${stats.distanceTraveled} units<br>
      Fights Won: ${stats.fightsWon}<br>
      Objects Crashed Into: ${stats.objectsCrashedInto}<br>
      <br>
      You lived a ${stats.age === 'Elder' ? 'full and' : 'short but'} glorious life.
    `;
    this.el.style.display = 'flex';
  }

  hide(): void {
    this.el.style.display = 'none';
  }
}
