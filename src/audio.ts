/* SonicCore: recorded race engine, procedural electric motor and background music. */

import { useExperience } from "./store";
class SonicCore {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private on = false;
  private pending = false;
  private driving = false;
  engineMode: "electric" | "race" = "race";
  private engineSource: AudioBufferSourceNode | null = null;
  private engineGain: GainNode | null = null;
  private engineLoad: Promise<void> | null = null;
  private lastSpeed = 0;
  private lastBoost = false;
  private speechActive = false;
  private listening = false;
  private speechId = 0;
  private speechTimer = 0;
  private syncMaster() {
    if (!this.master || !this.ctx) return;
    const gain = this.master.gain;
    const level = this.on ? this.volume * (this.listening ? 0.04 : this.speechActive ? 0.18 : 1) : 0;
    gain.cancelScheduledValues(this.ctx.currentTime);
    gain.setTargetAtTime(level, this.ctx.currentTime, 0.08);
  }
  setListening(value: boolean) {
    this.listening = value;
    this.syncMaster(); this.syncMusicVolume();
  }
  cancelSpeech() {
    this.speechId++;
    clearTimeout(this.speechTimer);
    window.speechSynthesis?.cancel();
    this.speechActive = false;
    this.syncMaster(); this.syncMusicVolume();
  }
  setEngineMode(mode: "electric" | "race") {
    this.engineMode = mode;
    useExperience.setState({ engineMode: mode });
    this.hum(this.lastSpeed, this.lastBoost);
  }
  private loadEngine() {
    if (!this.ctx || !this.master) return Promise.resolve();
    if (this.engineLoad) return this.engineLoad;
    const ctx = this.ctx;
    const master = this.master;
    this.engineLoad = (async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}audio/engine-race.wav?v=seam2`, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error("Engine sample unavailable");
      const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = buffer; source.loop = true; gain.gain.value = 0;
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass"; lowpass.frequency.value = 3400; lowpass.Q.value = 0.5;
      source.connect(lowpass); lowpass.connect(gain); gain.connect(master); source.start();
      this.engineSource = source; this.engineGain = gain;
      this.hum(this.lastSpeed, this.lastBoost);
    })().catch(() => {
      this.engineLoad = null;
      this.setEngineMode("electric");
      useExperience.setState({audioError:"No se pudo cargar la grabación. El motor eléctrico sigue disponible."});
    });
    return this.engineLoad;
  }
  private windGain: GainNode | null = null;
  driveMusic = 0.08;
  volume = 0.8;
  private syncMusicVolume() {
    if (this.music) this.music.volume = this.volume * (this.driving ? this.driveMusic : 1) * (this.listening ? 0 : this.speechActive ? 0.12 : 1);
  }
  setDriveMusic(value: number) {
    this.driveMusic = Math.min(0.3, Math.max(0, value));
    useExperience.setState({musicVolume: Math.round(this.driveMusic * 100)});
    this.syncMusicVolume();
  }
  setDrivingMix(driving: boolean) {
    this.driving = driving;
    this.syncMusicVolume();
    this.hum(this.lastSpeed, this.lastBoost);
  }
  setVolume(value: number) {
    this.volume = Math.min(1, Math.max(0, value));
    useExperience.setState({audioVolume: Math.round(this.volume * 100)});
    this.syncMusicVolume();
    this.syncMaster();
  }
  private music: HTMLAudioElement | null = null;
  private motors: OscillatorNode[] = [];
  voiceEnabled = false;

  speak(text: string, onDone?: () => void) {
    if (!this.voiceEnabled || !("speechSynthesis" in window)) { onDone?.(); return; }
    this.cancelSpeech();
    const id = this.speechId;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 0.96;
    utterance.volume = 0.9;
    utterance.voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("es")) ?? null;
    this.speechActive = true;
    this.syncMaster(); this.syncMusicVolume();
    let finished = false;
    const finish = () => {
      if (finished || id !== this.speechId) return;
      finished = true;
      clearTimeout(this.speechTimer);
      this.speechActive = false;
      this.syncMaster(); this.syncMusicVolume(); onDone?.();
    };
    utterance.onend = utterance.onerror = finish;
    this.speechTimer = window.setTimeout(finish, Math.max(12000, text.length * 110));
    try { window.speechSynthesis.speak(utterance); } catch { finish(); }
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
    compressor.threshold.value = -10;
    compressor.ratio.value = 4;
    master.connect(compressor);
    compressor.connect(ctx.destination);

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.05;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 260;
    filter.Q.value = 0.55;
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
      if (document.hidden) { this.music?.pause(); this.cancelSpeech(); void ctx.suspend(); }
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
        const resumed = this.ctx.resume();
        void this.music?.play().catch(() => {});
        await resumed;
        useExperience.setState({audioError:""});
        // Let the electric layer play immediately while the recording downloads.
        void this.loadEngine();
      } catch {
        this.on = false;
        this.music?.pause();
        useExperience.setState({audioError:"El navegador bloqueó el sonido. Pulsa Activar de nuevo y revisa el volumen de la pestaña."});
      } finally { this.pending = false; }
    }
    else { this.music?.pause(); }
    this.syncMaster();
    return this.on;
  }

  /** 0..1 — raise the electric hum (performance / finale) */
  hum(v: number, boost = false) {
    this.lastSpeed = v; this.lastBoost = boost;
    if (!this.ctx || !this.droneGain || !this.filter) return;
    const t = this.ctx.currentTime;
    const speed = Math.min(1.5, Math.max(0, Number.isFinite(v) ? v : 0));
    const moving = this.driving ? Math.min(1, speed * 12) : Math.min(1, speed * 3);
    const race = this.driving && this.engineMode === "race" && !!this.engineSource;
    this.engineSource?.playbackRate.setTargetAtTime(0.85 + speed * 0.75 + (boost ? 0.12 : 0), t, 0.24);
    this.engineGain?.gain.setTargetAtTime(race ? moving * (0.20 + speed * 0.16 + (boost ? 0.05 : 0)) : 0, t, 0.18);
    this.motors.forEach((motor, i) => {
      motor.type = i === 2 ? "triangle" : "sine";
      motor.frequency.setTargetAtTime((this.driving ? 110 + speed * 330 + (boost ? 120 : 0) : 52 + speed * 145) * (i + 1), t, 0.12);
    });
    this.droneGain.gain.setTargetAtTime(race ? 0 : moving * (this.driving ? 0.09 + speed * 0.07 + (boost ? 0.03 : 0) : 0.1 + speed * 0.1), t, 0.18);
    this.filter.frequency.setTargetAtTime(this.driving ? 950 + speed * 1600 + (boost ? 750 : 0) : 260 + speed * 700, t, 0.15);
    this.windGain?.gain.setTargetAtTime(moving * (this.driving ? speed * 0.02 + (boost ? 0.025 : 0) : 0.008), t, 0.18);
  }

  nitro() {
    if (!this.ctx || !this.master || !this.on) return;
    const ctx = this.ctx;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = this.engineMode === "electric" ? "sine" : "triangle";
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
    o.onended = () => { o.disconnect(); g.disconnect(); };
  }
}

export const sonic = new SonicCore();
