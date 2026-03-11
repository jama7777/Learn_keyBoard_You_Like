class AudioService {
  private context: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private muted: boolean = false;

  private init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  // Play a specific musical frequency
  public playTone(frequency: number, type: OscillatorType = 'triangle') {
    if (this.muted) return;
    this.init();
    if (!this.context || !this.gainNode) return;

    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.context.currentTime);

    const now = this.context.currentTime;
    
    // Smooth envelope for musical tone
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02); // Attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4); // Release/Decay

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // High-pitched click for correct keystroke (mechanical switch simulation)
  public playClick() {
    if (this.muted) return;
    this.init();
    if (!this.context || !this.gainNode) return;

    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.connect(gain);
    gain.connect(this.context.destination);

    // Short, sharp burst
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.context.currentTime); // Start freq
    osc.frequency.exponentialRampToValueAtTime(1200, this.context.currentTime + 0.05); // Chirp up

    gain.gain.setValueAtTime(0.1, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.08);

    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.08);
  }

  // Low dull thud for error
  public playError() {
    if (this.muted) return;
    this.init();
    if (!this.context || !this.gainNode) return;

    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.context.currentTime);
    osc.frequency.linearRampToValueAtTime(100, this.context.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.15);

    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.15);
  }
}

export const audioService = new AudioService();