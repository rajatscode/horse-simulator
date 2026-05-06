export class InputManager {
  private keys: Set<string> = new Set();
  private mouseX = 0;
  private mouseY = 0;
  private mouseDeltaX = 0;
  private mouseDeltaY = 0;
  private _pointerLocked = false;

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('mousemove', (e) => {
      if (this._pointerLocked) {
        this.mouseDeltaX += e.movementX;
        this.mouseDeltaY += e.movementY;
      }
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    canvas.addEventListener('click', () => {
      if (!this._pointerLocked) {
        canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this._pointerLocked = document.pointerLockElement === canvas;
    });
  }

  isKeyDown(code: string): boolean {
    return this.keys.has(code);
  }

  get forward(): boolean {
    return this.keys.has('KeyW') || this.keys.has('ArrowUp');
  }
  get backward(): boolean {
    return this.keys.has('KeyS') || this.keys.has('ArrowDown');
  }
  get left(): boolean {
    return this.keys.has('KeyA') || this.keys.has('ArrowLeft');
  }
  get right(): boolean {
    return this.keys.has('KeyD') || this.keys.has('ArrowRight');
  }
  get sprint(): boolean {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
  }
  get jump(): boolean {
    return this.keys.has('Space');
  }
  get enter(): boolean {
    return this.keys.has('Enter');
  }

  get pointerLocked(): boolean {
    return this._pointerLocked;
  }

  consumeMouseDelta(): { dx: number; dy: number } {
    const dx = this.mouseDeltaX;
    const dy = this.mouseDeltaY;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return { dx, dy };
  }

  consumeKey(code: string): boolean {
    if (this.keys.has(code)) {
      this.keys.delete(code);
      return true;
    }
    return false;
  }
}
