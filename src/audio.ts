/* SonicCore: recorded race engine, procedural electric motor and background music. */

import { useExperience } from "./store";
import { drivetrainAt } from "./drivetrain";
class SonicCore {
  private readonly localPreview = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location?.hostname ?? '');
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
  private lastGear = 1;
  private shiftingUntil = 0;
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
  volume = 0.8;
  private syncMusicVolume() {
    if (!this.music) return;
    this.music.volume = this.volume * (this.listening ? 0 : this.speechActive ? 0.12 : 1);
    this.music.muted = this.driving;
    if (this.driving || !this.on || document.hidden) this.music.pause();
    else void this.music.play().catch(() => {});
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
    if(this.localPreview){onDone?.();return;}
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
    if(this.localPreview)return;
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
      else if (this.on) { void ctx.resume(); this.syncMusicVolume(); }
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
        this.syncMusicVolume();
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
    const speed = Math.min(2.6, Math.max(0, Number.isFinite(v) ? v : 0));
    const moving = this.driving ? 0.48 + Math.min(0.52, speed * 6) : Math.min(1, speed * 3);
    const drive=drivetrainAt(speed*180);
    if(this.driving && drive.gear!==this.lastGear){
      this.lastGear=drive.gear;this.shiftingUntil=performance.now()+180;
      if(boost)this.exhaustPop(0,.032);
    }
    const shifting=performance.now()<this.shiftingUntil;
    const race = this.driving && this.engineMode === "race" && !!this.engineSource;
    this.engineSource?.playbackRate.setTargetAtTime((0.65+drive.rpm/7800*1.35+(boost?.12:0))*(shifting?.76:1),t,.07);
    this.engineGain?.gain.setTargetAtTime(race ? moving * Math.min(.46,.26+speed*.08+(boost?.05:0))*(shifting?.72:1) : 0,t,.06);
    this.motors.forEach((motor, i) => {
      motor.type = i === 2 ? "triangle" : "sine";
      motor.frequency.setTargetAtTime((this.driving ? 60 + Math.min(speed,2.6)*150 + (boost ? 80 : 0) : 52 + speed * 145) * (i + 1), t, 0.12);
    });
    this.droneGain.gain.setTargetAtTime(race ? 0 : moving * (this.driving ? .10 + Math.min(speed,2.6)*.025 + (boost ? .02 : 0) : .1+speed*.1), t, .18);
    this.filter.frequency.setTargetAtTime(this.driving ? 950 + speed * 1600 + (boost ? 750 : 0) : 260 + speed * 700, t, 0.15);
    this.windGain?.gain.setTargetAtTime(this.driving ? Math.min(speed*.022,.055) : moving*.008,t,.18);
  }

  private exhaustPop(delay:number,level:number){
    if(!this.ctx || !this.master || !this.on)return;
    const ctx=this.ctx,at=ctx.currentTime+delay;
    const source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
    const buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.11),ctx.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*.018));
    source.buffer=buffer;filter.type="lowpass";filter.frequency.value=1250;filter.Q.value=.6;
    gain.gain.setValueAtTime(level,at);gain.gain.exponentialRampToValueAtTime(.0001,at+.105);
    source.connect(filter);filter.connect(gain);gain.connect(this.master);source.start(at);source.stop(at+.12);
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  }

  nitro() {
    if (!this.ctx || !this.master || !this.on) return;
    const ctx = this.ctx;
    [0,.14,.31,.55,.83,1.2].forEach((delay,i)=>this.exhaustPop(delay,.065-i*.005));
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
