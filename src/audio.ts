/* ------------------------------------------------------------------ */
/*  SonicCore — AERION's synthesized soundscape.                       */
/*  No audio assets: a low electric drone + filtered wind, built      */
/*  with WebAudio. Starts muted; toggled by the user.                 */
/* ------------------------------------------------------------------ */

import { useExperience } from "./store";
class SonicCore {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private on = false;
  private pending = false;
  private driving = false;
  private windGain: GainNode | null = null;
  driveMusic = 0.08;
  volume = 0.8;
  private syncMusicVolume() {
    if (this.music) this.music.volume = this.volume * (this.driving ? this.driveMusic : 1);
  }
  setDriveMusic(value: number) {
    this.driveMusic = Math.min(0.3, Math.max(0, value));
    this.syncMusicVolume();
  }
  setDrivingMix(driving: boolean) {
    this.driving = driving;
    this.motors.forEach((motor, i) => { motor.type = driving ? (i === 0 ? "sawtooth" : "triangle") : (i === 2 ? "triangle" : "sine"); });
    this.syncMusicVolume();
  }
  setVolume(value: number) {
    this.volume = Math.min(1, Math.max(0, value));
    this.syncMusicVolume();
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.on ? this.volume : 0, this.ctx.currentTime, 0.1);
  }
  private music: HTMLAudioElement | null = null;
  private motors: OscillatorNode[] = [];
  voiceEnabled = false;

  speak(text: string) {
    if (!this.voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 0.96;
    utterance.voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("es")) ?? null;
    if (this.music) this.music.volume = 0.12;
    utterance.onend = utterance.onerror = () => this.syncMusicVolume();
    window.speechSynthesis.speak(utterance);
  }

  respond(action: string) {
    const responses: Record<string,string> = {
      night: "Modo nocturno preparado. He reducido la luz de la cabina y seleccionado la firma azul. La ruta mostrada es una simulación.",
      range: "He abierto la vista de energía. En esta demostración, la propulsión representa el setenta y dos por ciento del consumo.",
      autonomous: "La vista conceptual muestra los límites del carril y los objetos de ejemplo. No es conducción autónoma real.",
      relax: "Listo. Iluminación cálida, interior claro y una atmósfera más tranquila. Disfruta el camino.",
    };
    this.speak(responses[action] ?? "Listo.");
  }

  private init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 3;
    master.connect(compressor);
    compressor.connect(ctx.destination);

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.05;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 260;
    filter.Q.value = 2;
    droneGain.connect(filter);
    filter.connect(master);

    const o1 = ctx.createOscillator();
    o1.type = "sine";
    o1.frequency.value = 52;
    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = 104.6;
    o2.detune.value = 4;
    const o3 = ctx.createOscillator();
    o3.type = "triangle";
    o3.frequency.value = 209.3;
    const g3 = ctx.createGain();
    g3.gain.value = 0.12;
    o1.connect(droneGain);
    o2.connect(droneGain);
    o3.connect(g3);
    g3.connect(droneGain);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 90;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    /* wind layer */
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 900;
    band.Q.value = 0.6;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.012;
    noise.connect(band);
    band.connect(windGain);
    windGain.connect(master);
    this.windGain = windGain;

    o1.start(); o2.start(); o3.start(); lfo.start(); noise.start();
    this.motors = [o1, o2, o3];
    this.music = new Audio(`${import.meta.env.BASE_URL}audio/drive.mp3`);
    this.music.loop = true;
    this.syncMusicVolume();
    this.music.id = "aerion-soundtrack";
    this.music.hidden = true;
    document.body.appendChild(this.music);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { this.music?.pause(); void ctx.suspend(); window.speechSynthesis?.cancel(); }
      else if (this.on) { void ctx.resume(); void this.music?.play().catch(() => {}); }
    });
    this.ctx = ctx;
    this.master = master;
    this.droneGain = droneGain;
    this.filter = filter;
    this.setDrivingMix(this.driving);
  }

  async toggle(): Promise<boolean> {
    this.init();
    if (!this.ctx || !this.master) return false;
    if (this.pending) return this.on;
    this.on = !this.on;
    if (this.on) {
      this.pending = true;
      try {
        await Promise.all([this.ctx.resume(), this.music?.play()]);
        useExperience.setState({audioError:""});
      } catch {
        this.on = false;
        this.music?.pause();
        useExperience.setState({audioError:"El navegador bloqueó el sonido. Pulsa Activar de nuevo y revisa el volumen de la pestaña."});
      } finally { this.pending = false; }
    }
    else { this.music?.pause(); window.speechSynthesis?.cancel(); }
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(this.on ? this.volume : 0, this.ctx.currentTime + 0.2);
    return this.on;
  }

  /** 0..1 — raise the electric hum (performance / finale) */
  hum(v: number, boost = false) {
    if (!this.ctx || !this.droneGain || !this.filter) return;
    const t = this.ctx.currentTime;
    const speed = Math.min(1.5, Math.max(0, v));
    this.motors.forEach((motor, i) => motor.frequency.setTargetAtTime((this.driving ? 65 + speed * 115 : 52 + speed * 145) * (i + 1), t, 0.12));
    this.droneGain.gain.setTargetAtTime(this.driving ? 0.22 + speed * 0.2 + (boost ? 0.08 : 0) : 0.1 + speed * 0.16, t, 0.15);
    this.filter.frequency.setTargetAtTime(this.driving ? 700 + speed * 850 + (boost ? 650 : 0) : 260 + speed * 700, t, 0.15);
    this.windGain?.gain.setTargetAtTime(this.driving ? 0.02 + speed * 0.03 + (boost ? 0.08 : 0) : 0.012, t, 0.15);
  }

  nitro() {
    if (!this.ctx || !this.master || !this.on) return;
    const ctx = this.ctx;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(90, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 0.65);
    oscillator.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 1.5);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);
    oscillator.connect(gain); gain.connect(this.master);
    oscillator.start(); oscillator.stop(ctx.currentTime + 1.65);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }

  /** short UI feedback */
  blip() {
    this.init();
    if (!this.ctx || !this.master || !this.on) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(720, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(340, ctx.currentTime + 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.07, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    o.connect(g);
    g.connect(this.master);
    o.start();
    o.stop(ctx.currentTime + 0.14);
  }
}

export const sonic = new SonicCore();
