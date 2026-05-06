export class GameLoop {
  private fixedTimestep = 1 / 60;
  private accumulator = 0;
  private lastTime = 0;
  private running = false;
  private updateFn: (dt: number) => void;
  private renderFn: (alpha: number) => void;

  constructor(
    updateFn: (dt: number) => void,
    renderFn: (alpha: number) => void
  ) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now() / 1000;
    requestAnimationFrame((t) => this.loop(t));
  }

  stop(): void {
    this.running = false;
  }

  private loop(timestamp: number): void {
    if (!this.running) return;

    const currentTime = timestamp / 1000;
    let frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Clamp frame time to avoid spiral of death
    if (frameTime > 0.25) frameTime = 0.25;

    this.accumulator += frameTime;

    while (this.accumulator >= this.fixedTimestep) {
      this.updateFn(this.fixedTimestep);
      this.accumulator -= this.fixedTimestep;
    }

    const alpha = this.accumulator / this.fixedTimestep;
    this.renderFn(alpha);

    requestAnimationFrame((t) => this.loop(t));
  }
}
