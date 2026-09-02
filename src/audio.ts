/**
 * Procedural Web Audio Synthesizer for Neon Cyber Runner
 * Zero external audio assets. All sound FX and Synthwave BGM synthesized dynamically.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private bgmInterval: number | null = null;
  private isBgmPlaying: boolean = false;
  private bgmStep: number = 0;
  private currentBpm: number = 130;

  constructor() {}

  public init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio init skipped', e);
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.isMuted = !enabled;
    if (this.sfxGain && this.ctx) {
      try {
        this.sfxGain.gain.setValueAtTime(enabled ? 0.8 : 0, this.ctx.currentTime);
      } catch {}
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.isMusicMuted = !enabled;
    if (this.musicGain && this.ctx) {
      try {
        this.musicGain.gain.setValueAtTime(enabled ? 0.3 : 0, this.ctx.currentTime);
      } catch {}
    }
    if (!enabled && this.isBgmPlaying) {
      this.stopBGM();
    } else if (enabled && !this.isBgmPlaying && this.ctx) {
      this.startBGM();
    }
  }

  // --- SOUND EFFECTS ---

  /** Jump sound: punchy synth rise & slide */
  public playJump() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(520, t + 0.12);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(300, t + 0.15);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.16);
    } catch {}
  }

  /** Double Jump: High-tech aerial jet burst with noise + high resonance sweep */
  public playDoubleJump() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.18);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(2800, t + 0.15);
      filter.Q.setValueAtTime(3.5, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.2);
      noise.start(t);
      noise.stop(t + 0.15);
    } catch {}
  }

  /** Slide / Duck: Fast low-frequency friction whoosh */
  public playSlide() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const bufferSize = this.ctx.sampleRate * 0.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(700, t);
      filter.frequency.exponentialRampToValueAtTime(180, t + 0.18);
      filter.Q.setValueAtTime(1.5, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
      noise.stop(t + 0.2);
    } catch {}
  }

  /** Data Chip Collect: Dynamic Harmonic Chime based on streak combo */
  public playCollect(combo = 1) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const baseFreqs = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      const freqIndex = Math.min(combo - 1, baseFreqs.length - 1);
      const baseFreq = baseFreqs[Math.max(0, freqIndex)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.08);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.15);
    } catch {}
  }

  /** Powerup Acquired */
  public playPowerup() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.04);
        gain.gain.setValueAtTime(0.2, t + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t + idx * 0.04);
        osc.stop(t + idx * 0.04 + 0.16);
      });
    } catch {}
  }

  /** Overdrive / Hyper Dash Burst */
  public playDash() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(1100, t + 0.25);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.3);
    } catch {}
  }

  /** Player Damage / Collision Hit Impact */
  public playHit() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.18);
    } catch {}
  }

  /** Shield Break Impact */
  public playShieldBreak() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(100, t + 0.25);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
      noise.stop(t + 0.25);
    } catch {}
  }

  /** Lethal Crash / Game Over */
  public playGameOver() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.6);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.7);
    } catch {}
  }

  public playClick() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.06);
    } catch {}
  }

  public playGameStart() {
    this.playPowerup();
  }

  public startCyberpunkMusic() {
    this.startBGM();
  }

  public stopMusic() {
    this.stopBGM();
  }

  /** Plasma Laser Blaster Fire */
  public playLaserFire() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.13);
    } catch {}
  }

  /** Data Terminal Hack Success Chime */
  public playHackSuccess() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const freqs = [587.33, 880.0, 1174.66]; // D5, A5, D6
      freqs.forEach((f, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + i * 0.06);
        gain.gain.setValueAtTime(0.25, t + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.18);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + i * 0.06);
        osc.stop(t + i * 0.06 + 0.19);
      });
    } catch {}
  }

  /** True Metallic Gold Coin Pickup Chime */
  public playCoinCollect() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // High-pitched crystal bell arpeggio (B5 -> E6)
      const freqs = [987.77, 1318.51];
      freqs.forEach((f, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + i * 0.05);
        gain.gain.setValueAtTime(0.28, t + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.22);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + i * 0.05);
        osc.stop(t + i * 0.05 + 0.23);
      });
    } catch {}
  }

  /** Physical Cash Stack Pickup Sound */
  public playCashCollect() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // Cash register bell + crisp flutter
      const freqs = [523.25, 659.25, 1046.5]; // C5, E5, C6
      freqs.forEach((f, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t + i * 0.04);
        gain.gain.setValueAtTime(0.25, t + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.25);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + i * 0.04);
        osc.stop(t + i * 0.04 + 0.26);
      });
    } catch {}
  }

  /** Visceral Blood/Plasma Cell Recovery Sound */
  public playHealCollect() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // Warm organic resonant swell (F4 -> A4 -> C5 -> F5)
      const notes = [349.23, 440.0, 523.25, 698.46];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.04);
        gain.gain.setValueAtTime(0.22, t + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + idx * 0.04);
        osc.stop(t + idx * 0.04 + 0.36);
      });
    } catch {}
  }

  /** Overdrive Sound */
  public playOverdrive() {
    this.playDash();
  }

  /** Chrono Matrix Slow Sound */
  public playChrono() {
    this.playPowerup();
  }

  /** Rare Encrypted Bio-Core Extraction Sound (Harmonic Quantum Chime) */
  public playBioCoreCollect() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // 4-note ascending crystal arpeggio
      const notes = [587.33, 739.99, 880.0, 1174.66, 1479.98]; // D5, F#5, A5, D6, F#6
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.06);
        gain.gain.setValueAtTime(0.3, t + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.45);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.46);
      });
    } catch {}
  }

  /** Exit Portal Unlocked Sound (Deep Sub-Bass Resonant Swell + High Cyber Swirl) */
  public playPortalUnlocked() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // Sub bass boom
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(80, t);
      subOsc.frequency.exponentialRampToValueAtTime(45, t + 0.8);
      subGain.gain.setValueAtTime(0.4, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      subOsc.start(t);
      subOsc.stop(t + 0.9);

      // Sci-fi power surge
      const surgeOsc = this.ctx.createOscillator();
      const surgeGain = this.ctx.createGain();
      surgeOsc.type = 'sawtooth';
      surgeOsc.frequency.setValueAtTime(220, t);
      surgeOsc.frequency.exponentialRampToValueAtTime(960, t + 0.5);
      surgeGain.gain.setValueAtTime(0.25, t);
      surgeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      surgeOsc.connect(surgeGain);
      surgeGain.connect(this.sfxGain);
      surgeOsc.start(t);
      surgeOsc.stop(t + 0.56);
    } catch {}
  }

  /** Cyber Katana Slash SFX */
  public playSlash() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.14);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch {}
  }

  /** Critical Hit / Lethal Execution Sound */
  public playCritical() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.28);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.32);
    } catch {}
  }

  /** Stealth Takedown / Silent Assassination Execution Sound */
  public playStealthKill() {
    this.playCritical();
  }

  /** Taking Cover / Cloak Rustle */
  public playCover() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.08);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch {}
  }

  /** Exit Portal Hyperspace Transition Sound */
  public playPortalEnter() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(1800, t + 0.6);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.66);
    } catch {}
  }

  /** Ghost Glitch / Spooky Virus Phase Shift Sound */
  public playGhostGlitch() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // FM Frequency Modulation Ghost Tone
      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const masterGain = this.ctx.createGain();

      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(440, t);
      carrier.frequency.exponentialRampToValueAtTime(120, t + 0.22);

      modulator.type = 'square';
      modulator.frequency.setValueAtTime(65, t);
      modulator.frequency.linearRampToValueAtTime(800, t + 0.22);

      modGain.gain.setValueAtTime(300, t);
      modGain.gain.exponentialRampToValueAtTime(10, t + 0.22);

      modulator.connect(carrier.frequency);
      carrier.connect(masterGain);
      masterGain.connect(this.sfxGain);

      masterGain.gain.setValueAtTime(0.3, t);
      masterGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

      carrier.start(t);
      modulator.start(t);
      carrier.stop(t + 0.25);
      modulator.stop(t + 0.25);
    } catch {}
  }

  /** Enemy Panic & Flee Screech Sound */
  public playPanicScreech() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.linearRampToValueAtTime(1400, t + 0.08);
      osc.frequency.linearRampToValueAtTime(850, t + 0.16);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.19);
    } catch {}
  }

  /** Tactical Ambush Warning Cue */
  public playAmbushAlert() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(520, t + 0.18);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.23);
    } catch {}
  }

  /** Stage Clear Epic Synth Fanfare */
  public playStageClear() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // Epic Victory Arpeggio: C4, E4, G4, C5, E5, G5, C6
      const fanfare = [
        { freq: 261.63, delay: 0.0, dur: 0.2 },
        { freq: 329.63, delay: 0.12, dur: 0.2 },
        { freq: 392.0, delay: 0.24, dur: 0.2 },
        { freq: 523.25, delay: 0.36, dur: 0.3 },
        { freq: 659.25, delay: 0.52, dur: 0.3 },
        { freq: 783.99, delay: 0.68, dur: 0.4 },
        { freq: 1046.5, delay: 0.88, dur: 0.8 },
      ];

      fanfare.forEach((n) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, t + n.delay);
        gain.gain.setValueAtTime(0.35, t + n.delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n.delay + n.dur);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + n.delay);
        osc.stop(t + n.delay + n.dur + 0.05);
      });
    } catch {}
  }

  /** Upgrade Purchased / Workshop Sound */
  public playUpgradePurchase() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.setValueAtTime(880, t + 0.08);
      osc.frequency.setValueAtTime(1320, t + 0.16);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.36);
    } catch {}
  }

  // --- PROCEDURAL SYNTHWAVE BGM GENERATOR WITH BEAT TRACKING ---

  private bgmStartTime: number = 0;
  private lastBeatTime: number = 0;

  public getBpm(): number {
    return this.currentBpm;
  }

  /**
   * Get current rhythm timing accuracy relative to the nearest Synthwave beat.
   * Returns exact millisecond delta, timing grade (PERFECT / CRITICAL / GOOD / NORMAL), and beat phase (0..1).
   */
  public getRhythmAccuracy(): {
    deltaMs: number;
    grade: 'PERFECT' | 'CRITICAL' | 'GOOD' | 'NORMAL';
    beatPhase: number;
    pulseScale: number;
    isNearBeat: boolean;
  } {
    const beatIntervalMs = (60 / this.currentBpm) * 1000;
    const now = performance.now();
    const elapsed = now - (this.bgmStartTime || now);
    const mod = elapsed % beatIntervalMs;
    // Distance to closest beat: either from start of beat or next beat
    let delta = mod;
    if (delta > beatIntervalMs / 2) {
      delta = delta - beatIntervalMs;
    }
    const absDelta = Math.abs(delta);
    const beatPhase = mod / beatIntervalMs;

    // Visual pulse scale that spikes at beat onset (1.0 to 1.35)
    const pulseScale = 1.0 + Math.max(0, 1.0 - beatPhase * 3.5) * 0.35;

    let grade: 'PERFECT' | 'CRITICAL' | 'GOOD' | 'NORMAL' = 'NORMAL';
    if (absDelta <= 110) {
      grade = 'PERFECT';
    } else if (absDelta <= 170) {
      grade = 'CRITICAL';
    } else if (absDelta <= 240) {
      grade = 'GOOD';
    }

    return {
      deltaMs: delta,
      grade,
      beatPhase,
      pulseScale,
      isNearBeat: absDelta <= 240,
    };
  }

  /** Play Heavy Bass-Drop & Synthesized Rhythm Strike Impact */
  public playRhythmStrike(grade: 'PERFECT' | 'CRITICAL' | 'GOOD') {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // 1. Deep Sub-Bass 808 Thump
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      const startFreq = grade === 'PERFECT' ? 160 : grade === 'CRITICAL' ? 140 : 120;
      subOsc.frequency.setValueAtTime(startFreq, t);
      subOsc.frequency.exponentialRampToValueAtTime(36, t + 0.35);

      const subVol = grade === 'PERFECT' ? 0.7 : grade === 'CRITICAL' ? 0.55 : 0.4;
      subGain.gain.setValueAtTime(subVol, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      subOsc.start(t);
      subOsc.stop(t + 0.4);

      // 2. High-Tech Laser Saw Slash Glitch
      const laserOsc = this.ctx.createOscillator();
      const laserGain = this.ctx.createGain();
      laserOsc.type = 'sawtooth';
      laserOsc.frequency.setValueAtTime(grade === 'PERFECT' ? 1800 : 1200, t);
      laserOsc.frequency.exponentialRampToValueAtTime(150, t + 0.18);

      laserGain.gain.setValueAtTime(grade === 'PERFECT' ? 0.45 : 0.3, t);
      laserGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      laserOsc.connect(laserGain);
      laserGain.connect(this.sfxGain);
      laserOsc.start(t);
      laserOsc.stop(t + 0.22);

      // 3. Perfect Strike Crystal Arpeggio Chime
      if (grade === 'PERFECT') {
        [880, 1174.66, 1760].forEach((freq, idx) => {
          if (!this.ctx || !this.sfxGain) return;
          const chimeOsc = this.ctx.createOscillator();
          const chimeGain = this.ctx.createGain();
          chimeOsc.type = 'triangle';
          chimeOsc.frequency.setValueAtTime(freq, t + idx * 0.03);
          chimeGain.gain.setValueAtTime(0.3, t + idx * 0.03);
          chimeGain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.03 + 0.25);
          chimeOsc.connect(chimeGain);
          chimeGain.connect(this.sfxGain);
          chimeOsc.start(t + idx * 0.03);
          chimeOsc.stop(t + idx * 0.03 + 0.26);
        });
      }
    } catch {}
  }

  public startBGM() {
    if (this.isBgmPlaying || this.isMusicMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      this.isBgmPlaying = true;
      this.bgmStep = 0;
      this.bgmStartTime = performance.now();
      this.lastBeatTime = this.bgmStartTime;

      const stepInterval = (60 / this.currentBpm / 4) * 1000;
      this.bgmInterval = window.setInterval(() => {
        this.tickBGM();
      }, stepInterval);
    } catch {}
  }

  public updateGameSpeedBGM(_gameSpeedRatio: number) {
    // Graceful speed adjustment without interrupting audio loop
  }

  public stopBGM() {
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.isBgmPlaying = false;
  }

  private tickBGM() {
    if (!this.ctx || !this.musicGain || this.isMusicMuted) return;
    if (this.ctx.state !== 'running') return;
    try {
      const t = this.ctx.currentTime;
      const step = this.bgmStep % 16;
      const bar = Math.floor((this.bgmStep % 64) / 16);

      const bassChords = [
        [73.42, 146.83], // D2, D3
        [87.31, 174.61], // F2, F3
        [65.41, 130.81], // C2, C3
        [98.0, 196.0], // G2, G3
      ];
      const currentChord = bassChords[bar] || bassChords[0];

      // 1. Kick Drum on every beat (steps 0, 4, 8, 12)
      if (step % 4 === 0) {
        this.lastBeatTime = performance.now();
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(130, t);
        kickOsc.frequency.exponentialRampToValueAtTime(38, t + 0.12);

        kickGain.gain.setValueAtTime(0.35, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(t);
        kickOsc.stop(t + 0.15);
      }

      // 2. Snare / Clack on steps 4 and 12
      if (step === 4 || step === 12) {
        const snareNoise = this.ctx.createBufferSource();
        const bSize = this.ctx.sampleRate * 0.08;
        const b = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
        snareNoise.buffer = b;

        const snareFilter = this.ctx.createBiquadFilter();
        snareFilter.type = 'highpass';
        snareFilter.frequency.setValueAtTime(1000, t);

        const snareGain = this.ctx.createGain();
        snareGain.gain.setValueAtTime(0.18, t);
        snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        snareNoise.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(this.musicGain);

        snareNoise.start(t);
        snareNoise.stop(t + 0.1);
      }

      // 3. Synthwave Rolling 16th Bassline
      if (step % 2 === 0) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        const freq = step % 4 === 0 ? currentChord[0] : currentChord[1];
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + 0.12);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(t);
        osc.stop(t + 0.13);
      }

      // 4. Off-beat Synth Lead Arpeggio Melody
      if (step % 4 === 2) {
        const leadFreqs = [293.66, 349.23, 440.0, 587.33]; // D4, F4, A4, D5
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'triangle';
        leadOsc.frequency.setValueAtTime(leadFreqs[(step + bar) % leadFreqs.length], t);

        leadGain.gain.setValueAtTime(0.12, t);
        leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        leadOsc.connect(leadGain);
        leadGain.connect(this.musicGain);
        leadOsc.start(t);
        leadOsc.stop(t + 0.11);
      }

      this.bgmStep++;
    } catch {}
  }

  /** Boss Roar: Deep ominous sub-bass drop with resonance growl */
  public playBossRoar() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.9);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(150, t + 0.9);
      filter.Q.setValueAtTime(6.0, t);

      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.95);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 1.0);
    } catch {}
  }

  /** Boss Attack: Heavy cyber explosion boom */
  public playBossAttack() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.45);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.52);
    } catch {}
  }

  /** Surrender Sound: Gentle harmonic chime with white noise whistle */
  public playSurrender() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.08);

        gain.gain.setValueAtTime(0.2, t + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.45);
      });
    } catch {}
  }

  /** Weapon Unlock: Uplifting polyphonic cyber synth chime */
  public playWeaponUnlock() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + i * 0.07);

        gain.gain.setValueAtTime(0.25, t + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(t + i * 0.07);
        osc.stop(t + i * 0.07 + 0.4);
      });
    } catch {}
  }

  /** Weapon Switch: High-tech mechanical lock */
  public playWeaponSwitch() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, t);
      osc.frequency.exponentialRampToValueAtTime(1400, t + 0.06);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {}
  }

  /** Spread Cannon: Triple burst plasma sound */
  public playSpreadShot() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(540, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.16);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.2);
    } catch {}
  }

  /** Chain Lightning: Zap resonance with electric high crackle */
  public playChainLightning() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.14);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.16);
    } catch {}
  }

  /** Homing Missile: Thruster launch whoosh */
  public playHomingMissile() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(760, t + 0.18);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.22);
    } catch {}
  }

  /** Quantum Vortex: Sci-fi singularity warp sound */
  public playQuantumVortex() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(920, t + 0.3);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.38);
    } catch {}
  }

  /** Victory Fanfare: Glorious synthwave triumph anthem */
  public playVictoryFanfare() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const notes = [
        { f: 523.25, d: 0.15 }, // C5
        { f: 659.25, d: 0.15 }, // E5
        { f: 783.99, d: 0.18 }, // G5
        { f: 1046.5, d: 0.45 }, // C6
      ];

      let delay = 0;
      notes.forEach((note) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.f, t + delay);

        gain.gain.setValueAtTime(0.35, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + note.d);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(t + delay);
        osc.stop(t + delay + note.d + 0.05);

        delay += note.d * 0.85;
      });
    } catch {}
  }

  /** Exotic Weapon: Spread Cannon blast */
  public playWeaponSpread() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.16);
      gain.gain.setValueAtTime(0.38, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.17);
    } catch {}
  }

  /** Exotic Weapon: High-voltage Lightning Chain discharge */
  public playWeaponLightning() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.linearRampToValueAtTime(2400, t + 0.05);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.18);
      gain.gain.setValueAtTime(0.32, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.19);
    } catch {}
  }

  /** Exotic Weapon: Homing Micro-Missiles rocket whistle */
  public playWeaponHoming() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(1400, t + 0.14);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.15);
    } catch {}
  }

  /** Exotic Weapon: Quantum Vortex Singularity pull */
  public playWeaponVortex() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.linearRampToValueAtTime(440, t + 0.1);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.28);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch {}
  }

  /** Enemy Surrender Whistle */
  public playEnemySurrender() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, t);
      osc.frequency.linearRampToValueAtTime(500, t + 0.2);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.23);
    } catch {}
  }

  /** Dynamic Neon Flicker: Failing neon tube electric buzz + capacitor click + brief low hum drop */
  public playNeonFlicker() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // 1. Low 60Hz / 120Hz transformer buzz with stuttering amplitude
      const buzzOsc = this.ctx.createOscillator();
      const buzzGain = this.ctx.createGain();
      buzzOsc.type = 'sawtooth';
      buzzOsc.frequency.setValueAtTime(118, t);
      buzzOsc.frequency.linearRampToValueAtTime(122, t + 0.18);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(340, t);
      filter.Q.setValueAtTime(4.0, t);

      // Stutter envelope
      buzzGain.gain.setValueAtTime(0.18, t);
      buzzGain.gain.setValueAtTime(0.01, t + 0.04);
      buzzGain.gain.setValueAtTime(0.22, t + 0.08);
      buzzGain.gain.setValueAtTime(0.02, t + 0.12);
      buzzGain.gain.setValueAtTime(0.14, t + 0.16);
      buzzGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      buzzOsc.connect(filter);
      filter.connect(buzzGain);
      buzzGain.connect(this.sfxGain);

      buzzOsc.start(t);
      buzzOsc.stop(t + 0.3);

      // 2. High electrical spark noise tick
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.6 ? 1 : 0.2);
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(2400, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, t);
      noiseGain.gain.setValueAtTime(0.005, t + 0.03);
      noiseGain.gain.setValueAtTime(0.15, t + 0.07);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noiseSource.start(t);
      noiseSource.stop(t + 0.2);
    } catch {}
  }

  /** Flashlight Glitch / Proximity Interference Buzz when near an enemy */
  public playFlashlightGlitch() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // Soft high-frequency electromagnetic interference flutter
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(680, t);
      osc.frequency.linearRampToValueAtTime(320, t + 0.08);
      osc.frequency.linearRampToValueAtTime(840, t + 0.14);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.Q.setValueAtTime(6.0, t);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.setValueAtTime(0.01, t + 0.04);
      gain.gain.setValueAtTime(0.16, t + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.17);
    } catch {}
  }

  /** Enemy Glitch Dash Evasion Sound (Phase Warp + Digital Slip) */
  public playEnemyGlitchDash() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // Pitch sweep with phase modulation
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.15);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, t);
      filter.frequency.exponentialRampToValueAtTime(300, t + 0.15);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.18);
    } catch {}
  }

  /** Enemy Direct Charge Attack (Heavy Aggressive Roar / Thruster Impulse) */
  public playEnemyChargeAttack() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // Deep aggressive surge
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.linearRampToValueAtTime(260, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.28);

      gain.gain.setValueAtTime(0.32, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.32);
    } catch {}
  }

  /** Neon Clone Split Ability (Holographic Resonance & Tri-Frequency Shatter) */
  public playCloneSplit() {
    this.playNeonCloneSplit();
  }

  public playNeonCloneSplit() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // 3 Harmonic Chimes
      [580, 880, 1160].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t + idx * 0.03);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + idx * 0.03 + 0.18);

        gain.gain.setValueAtTime(0.2, t + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.03 + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + idx * 0.03);
        osc.stop(t + idx * 0.03 + 0.24);
      });
    } catch {}
  }

  /** Decoy Clone Destroyed (Digital Dust Dissipation & Fizzle) */
  public playDecoyDestroyed() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // Glassy digital shatter
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.18);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, t);
      filter.Q.setValueAtTime(3.5, t);

      gain.gain.setValueAtTime(0.26, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch {}
  }

  /** Specialized EMP Blast Sound (Heavy Shockwave & Electronic Shutdown Boom) */
  public playEmpBlast() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // 1. Heavy Sub-Bass Boom
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, t);
      subOsc.frequency.exponentialRampToValueAtTime(35, t + 0.5);
      subGain.gain.setValueAtTime(0.45, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      subOsc.start(t);
      subOsc.stop(t + 0.6);

      // 2. High-Frequency Electronic Overload Zap
      const zapOsc = this.ctx.createOscillator();
      const zapGain = this.ctx.createGain();
      zapOsc.type = 'sawtooth';
      zapOsc.frequency.setValueAtTime(2200, t);
      zapOsc.frequency.exponentialRampToValueAtTime(120, t + 0.35);
      zapGain.gain.setValueAtTime(0.3, t);
      zapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      zapOsc.connect(zapGain);
      zapGain.connect(this.sfxGain);
      zapOsc.start(t);
      zapOsc.stop(t + 0.4);
    } catch {}
  }

  /** Flashlight Reboot / System Restore Sound after EMP expires */
  public playFlashlightReboot() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // 2-tone rising power-up chirp
      [520, 1040].forEach((f, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + i * 0.06);
        gain.gain.setValueAtTime(0.2, t + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.16);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + i * 0.06);
        osc.stop(t + i * 0.06 + 0.18);
      });
    } catch {}
  }

  public playPlayerHurt() {
    this.playShieldBreak();
  }

  public playFlashlightJam() {
    this.playFlashlightGlitch();
  }

  /** Pro Parry Clash: Loud metallic impact with high harmonic resonance */
  public playParryClash() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // High metallic ring 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2450, t);
      osc1.frequency.exponentialRampToValueAtTime(1800, t + 0.35);
      gain1.gain.setValueAtTime(0.55, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.sfxGain);
      osc1.start(t);
      osc1.stop(t + 0.35);

      // Harsh metallic strike overtone
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(3920, t);
      osc2.frequency.exponentialRampToValueAtTime(880, t + 0.18);
      gain2.gain.setValueAtTime(0.4, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc2.connect(gain2);
      gain2.connect(this.sfxGain);
      osc2.start(t);
      osc2.stop(t + 0.18);

      // Anvil strike noise crack
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.5, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      noise.connect(nGain);
      nGain.connect(this.sfxGain);
      noise.start(t);
      noise.stop(t + 0.08);
    } catch {}
  }

  /** Tactical Smoke Poof Burst */
  public playSmokeBomb() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(120, t + 0.24);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
      noise.stop(t + 0.25);
    } catch {}
  }

  /** Exploding Trap Decoy */
  public playDecoyExplode() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(550, t);
      osc.frequency.exponentialRampToValueAtTime(75, t + 0.28);
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch {}
  }

  /** Executioner Mode Warning Alarm */
  public playExecutionerAlarm() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.setValueAtTime(440, t + 0.1);
      osc.frequency.setValueAtTime(320, t + 0.2);
      osc.frequency.setValueAtTime(440, t + 0.3);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.45);
    } catch {}
  }

  /** Plunging Aerial Vault Slam */
  public playVaultSlam() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.3);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.32);
    } catch {}
  }

  /** Abyss / Pit Fall Sound Effect (Falling slide into deep neon void) */
  public playPitFall() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // Downward screaming whistle oscillator
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.65);
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.68);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.68);

      // Deep sub-bass vortex rumble
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(90, t);
      subOsc.frequency.exponentialRampToValueAtTime(18, t + 0.7);
      subGain.gain.setValueAtTime(0.5, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      subOsc.start(t);
      subOsc.stop(t + 0.7);
    } catch {}
  }

  /** Daily Mission Completion Celebratory Cyber-Synth Arpeggio */
  public playDailyMissionComplete() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // 4-Note triumphant Cyber Arpeggio (C5 -> E5 -> G5 -> C6)
      const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      freqs.forEach((freq, idx) => {
        const noteTime = t + idx * 0.08;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.35, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(noteTime);
        osc.stop(noteTime + 0.35);
      });

      // Shimmering High Harmonic Chime
      const shimmer = this.ctx.createOscillator();
      const shimmerGain = this.ctx.createGain();
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(2093.00, t + 0.32);
      shimmer.frequency.exponentialRampToValueAtTime(2637.02, t + 0.85);
      shimmerGain.gain.setValueAtTime(0.2, t + 0.32);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(this.sfxGain);
      shimmer.start(t + 0.32);
      shimmer.stop(t + 0.85);
    } catch {}
  }

  /** Daily Mission Step Incremented / Progress Blip */
  public playDailyMissionProgress() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1320, t + 0.09);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.09);
    } catch {}
  }

  /** Bacterial Pit Ranged Splash / Toxic Acid Fluid Projectile Spit SFX */
  public playToxicAcidSpit() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // 1. Wet organic acid bubble squirt (Frequency modulated downward squelch)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(560, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.18);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, t);
      filter.Q.setValueAtTime(3.5, t);

      gain.gain.setValueAtTime(0.38, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.22);

      // 2. High bubbling acid sizzle noise burst
      const noiseBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.12), this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < output.length; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(1200, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.22, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noiseSource.start(t);
      noiseSource.stop(t + 0.14);
    } catch {}
  }

  /** Ineffective Repetitive Button Mash Penalty: Dull blunted metallic thud / dissipation */
  public playBluntMashPenalty() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // 1. Low pitched dull thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.14);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.16);

      // 2. Muffled clunk noise
      const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.08), this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noise.start(t);
      noise.stop(t + 0.09);
    } catch {}
  }

  /** Dynamic Rotating Combo Step 2: Harmonic Rising Synth Pulse */
  public playComboBridge() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(740, t + 0.14);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, t);
      filter.Q.setValueAtTime(3.0, t);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.16);
    } catch {}
  }

  /** Dynamic Rotating Combo Finisher: Maximum Critical Nano-Burst Explosion & Synth Climax */
  public playCriticalFinisher() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // 1. Heavy resonant sub-bass drop
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(280, t);
      bassOsc.frequency.exponentialRampToValueAtTime(35, t + 0.45);
      bassGain.gain.setValueAtTime(0.65, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      bassOsc.connect(bassGain);
      bassGain.connect(this.sfxGain);
      bassOsc.start(t);
      bassOsc.stop(t + 0.48);

      // 2. Dual critical synth flare
      [880, 1320, 1760].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.04);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + idx * 0.04 + 0.22);
        gain.gain.setValueAtTime(0.25, t + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + idx * 0.04);
        osc.stop(t + idx * 0.04 + 0.26);
      });
    } catch {}
  }

  /** Enemy AI Protective Defensive Block / Barrier Deflection SFX */
  public playPredictiveBlock() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // High-energy magnetic shield ring & pulse
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'square';
      osc.frequency.setValueAtTime(980, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.22);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.Q.setValueAtTime(5.0, t);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch {}
  }
}

export const sound = new SoundSynthesizer();
