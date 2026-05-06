export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private windNode: OscillatorNode | null = null;
  private windGain: GainNode | null = null;
  private initialized = false;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playClipClop(): void {
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;

      // Clip-clop: short noise burst shaped to sound like a hoof strike
      const bufferSize = ctx.sampleRate * 0.04;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        // Sharp attack, quick decay
        const envelope = Math.exp(-t * 30);
        // Noise with some tonal quality
        data[i] = (Math.random() * 2 - 1) * envelope * 0.5;
        // Add a bit of tone
        data[i] += Math.sin(i * 0.3) * envelope * 0.3;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 800 + Math.random() * 400;

      const gain = ctx.createGain();
      gain.gain.value = 0.15 + Math.random() * 0.05;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      source.start(now);
      source.stop(now + 0.04);
    } catch (e) {
      // Audio not available
    }
  }

  playNeigh(): void {
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;

      // Neigh: frequency sweep from ~300Hz up to ~800Hz and back
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.2);
      osc.frequency.linearRampToValueAtTime(600, now + 0.5);
      osc.frequency.linearRampToValueAtTime(400, now + 0.8);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gain.gain.setValueAtTime(0.12, now + 0.3);
      gain.gain.linearRampToValueAtTime(0, now + 0.8);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 600;
      filter.Q.value = 2;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {
      // Audio not available
    }
  }

  playImpactBonk(): void {
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;

      // Low thud with some distortion character
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      // Noise burst for impact texture
      const noiseLen = ctx.sampleRate * 0.1;
      const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const noiseData = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-(i / noiseLen) * 10);
      }
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;

      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.15;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 300;

      osc.connect(gain);
      gain.connect(this.masterGain!);

      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.4);
      noiseSrc.start(now);
      noiseSrc.stop(now + 0.1);
    } catch (e) {
      // Audio not available
    }
  }

  playDramaticSting(): void {
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;

      // Rising chord: C-E-G arpeggiated quickly
      const notes = [261.6, 329.6, 392.0, 523.2];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        const gain = ctx.createGain();
        const start = now + i * 0.08;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.06, start + 0.05);
        gain.gain.setValueAtTime(0.06, start + 0.3);
        gain.gain.linearRampToValueAtTime(0, start + 0.8);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(start);
        osc.stop(start + 0.8);
      });
    } catch (e) {
      // Audio not available
    }
  }

  startAmbientWind(): void {
    try {
      const ctx = this.ensureContext();

      if (this.windNode) return;

      // Filtered noise for wind
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 0.5;

      this.windGain = ctx.createGain();
      this.windGain.gain.value = 0.03;

      source.connect(filter);
      filter.connect(this.windGain);
      this.windGain.connect(this.masterGain!);

      source.start();

      // Store reference to stop later (we actually store the oscillator concept)
      // BufferSourceNode can't be stopped and restarted, so we manage differently
      this.windNode = source as any; // Store for cleanup
    } catch (e) {
      // Audio not available
    }
  }

  stopAmbientWind(): void {
    try {
      if (this.windNode) {
        (this.windNode as any).stop();
        this.windNode = null;
      }
      if (this.windGain) {
        this.windGain.disconnect();
        this.windGain = null;
      }
    } catch (e) {
      // Ignore
    }
  }
}
