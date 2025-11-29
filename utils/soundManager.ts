
export class SoundManager {
  private audioContext: AudioContext | null = null;
  public isMuted: boolean = false;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.audioContext && muted) {
      this.audioContext.suspend();
    } else if (this.audioContext && !muted) {
      this.audioContext.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, vol: number = 0.1) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    // Ensure context is running (browser autoplay policy)
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
    
    // Envelope
    gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
  }

  public playClick() {
    // High 'pop'
    this.playTone(800, 'sine', 0.1, 0, 0.05);
  }

  public playSwap() {
    // Whoosh-like slide
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  public playInvalid() {
    // Low double thud
    this.playTone(150, 'sawtooth', 0.15, 0, 0.1);
    this.playTone(100, 'sawtooth', 0.15, 0.1, 0.1);
  }

  public playMatch(count: number = 3) {
    // Arpeggio based on count. More tiles = more complex sound
    const base = 440; // A4
    const notes = [base, base * 1.25, base * 1.5]; // Major triad
    
    notes.forEach((freq, i) => {
       this.playTone(freq, 'sine', 0.2, i * 0.06, 0.1);
    });
    
    if (count > 3) {
       // High finish for big matches
       this.playTone(base * 2, 'triangle', 0.3, 0.18, 0.1);
    }
  }

  public playSpecialCreated() {
     // Rising powerup sound
     this.playTone(300, 'square', 0.3, 0, 0.05);
     this.playTone(600, 'square', 0.3, 0.1, 0.05);
  }

  public playSpecialExplosion() {
    // Low explosion noise/rumble
     this.playTone(100, 'sawtooth', 0.4, 0, 0.15);
     this.playTone(50, 'square', 0.5, 0.05, 0.15);
  }

  public playWin() {
    const melody = [523.25, 659.25, 783.99, 1046.50]; // C E G C
    melody.forEach((freq, i) => {
      this.playTone(freq, 'triangle', 0.5, i * 0.12, 0.2);
    });
    // Final chord
    setTimeout(() => {
        this.playTone(523.25, 'sine', 0.8, 0, 0.1);
        this.playTone(783.99, 'sine', 0.8, 0, 0.1);
        this.playTone(1046.50, 'sine', 0.8, 0, 0.1);
    }, 500);
  }

  public playLoss() {
    const melody = [783.99, 739.99, 698.46, 659.25]; // Descending
    melody.forEach((freq, i) => {
      this.playTone(freq, 'sawtooth', 0.6, i * 0.25, 0.1);
    });
  }
}

export const soundManager = new SoundManager();