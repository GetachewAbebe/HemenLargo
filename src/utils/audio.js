// Pure Web Audio API sound effects for cashier register (Zero external dependencies)

class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = typeof window !== "undefined" && localStorage.getItem("sukie_sound_muted") === "true";
    this.listeners = new Set();
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("sukie_sound_muted", String(this.muted));
    }
    this.listeners.forEach((fn) => fn(this.muted));
    return this.muted;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Soft liquid droplet bubble sound on tapping soap containers
  playPop() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      const now = this.ctx.currentTime;

      // Frequency glide (pop bubble)
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Audio playback silently ignored if blocked by browser policy
    }
  }

  // Quick scanner / button click beep
  playBeep() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      const now = this.ctx.currentTime;

      osc.frequency.setValueAtTime(1200, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Silently ignore
    }
  }

  // Downward swoosh sound when removing an item or clearing cart
  playTrash() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      const now = this.ctx.currentTime;

      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Silently ignore
    }
  }

  // Low alert buzz when stock limit is hit or error occurs
  playWarning() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [now, now + 0.09].forEach((t) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(190, t);

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.06);
      });
    } catch {
      // Silently ignore
    }
  }

  // Crisp metallic coin chimes when cash is received
  playCoin() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [
        { freq: 987.77, time: now, duration: 0.12 }, // B5
        { freq: 1318.5, time: now + 0.08, duration: 0.22 }, // E6
      ].forEach((note) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(note.freq, note.time);

        gain.gain.setValueAtTime(0.14, note.time);
        gain.gain.exponentialRampToValueAtTime(0.001, note.time + note.duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(note.time);
        osc.stop(note.time + note.duration);
      });
    } catch {
      // Silently ignore
    }
  }

  // Cashier completion chime (two pleasant ascending harmonic notes)
  playCheckoutChime() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      [
        { freq: 523.25, time: now, duration: 0.15 },       // C5
        { freq: 659.25, time: now + 0.08, duration: 0.18 }, // E5
        { freq: 783.99, time: now + 0.16, duration: 0.28 }, // G5
        { freq: 1046.5, time: now + 0.24, duration: 0.4 },  // C6
      ].forEach((note) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(note.freq, note.time);

        gain.gain.setValueAtTime(0.12, note.time);
        gain.gain.exponentialRampToValueAtTime(0.001, note.time + note.duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(note.time);
        osc.stop(note.time + note.duration);
      });
    } catch {
      // Silently ignored if policy blocked
    }
  }

  // Harmonic uplifting chime for successful auth, profile updates, and saves
  playSuccess() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      [
        { freq: 587.33, time: now, duration: 0.14 },       // D5
        { freq: 739.99, time: now + 0.07, duration: 0.16 }, // F#5
        { freq: 880.0, time: now + 0.14, duration: 0.22 },  // A5
        { freq: 1174.66, time: now + 0.21, duration: 0.35 },// D6
      ].forEach((note) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(note.freq, note.time);

        gain.gain.setValueAtTime(0.13, note.time);
        gain.gain.exponentialRampToValueAtTime(0.001, note.time + note.duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(note.time);
        osc.stop(note.time + note.duration);
      });
    } catch {
      // Silently ignored
    }
  }
}

const rawSoundFX = new SoundFX();

// Defensive proxy ensuring unknown or misspelled sound calls never crash the app
export const soundFX = new Proxy(rawSoundFX, {
  get(target, prop, receiver) {
    if (prop in target) {
      const val = Reflect.get(target, prop, receiver);
      return typeof val === "function" ? val.bind(target) : val;
    }
    // Safe fallback for any undefined sound function
    return () => {};
  },
});


