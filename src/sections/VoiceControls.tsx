import { useEffect, useRef, useState } from "react";
import { sonic } from "../audio";
import { useAIDemo } from "../hooks/useAIDemo";

export default function VoiceControls() {
  const run = useAIDemo();
  const [voice, setVoice] = useState(false);
  const [status, setStatus] = useState("Di: noche, autonomía, sensores o relajar.");
  const recognition = useRef<any>(null);
  const supported = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
  useEffect(() => () => { recognition.current?.abort(); window.speechSynthesis?.cancel(); }, []);
  const listen = () => {
    if (recognition.current) { recognition.current.abort(); recognition.current = null; return; }
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new Ctor();
    recognition.current = r;
    r.lang = "es-ES";
    r.continuous = false;
    r.interimResults = false;
    window.speechSynthesis?.cancel();
    setStatus("Escuchando…");
    r.onresult = (event: any) => {
      const text = event.results[0][0].transcript.toLowerCase();
      setStatus(`Te escuché: ${text}`);
      sonic.voiceEnabled = true; setVoice(true);
      if (/noche|nocturn/.test(text)) run("night");
      else if (/energ|autonom|bater|rango/.test(text)) run("range");
      else if (/sensor|ves|viendo|carretera/.test(text)) run("autonomous");
      else if (/relaj|calma|tranquil/.test(text)) run("relax");
      else { setStatus("Prueba: noche, autonomía, sensores o relajar."); sonic.speak("Puedes pedirme modo nocturno, autonomía, sensores o relajar la cabina."); }
    };
    r.onerror = () => setStatus("No pude escuchar. Usa los botones o revisa el permiso del micrófono.");
    r.onend = () => { recognition.current = null; setStatus(s => s === "Escuchando…" ? "Escucha terminada. Puedes intentarlo de nuevo." : s); };
    try { r.start(); } catch { recognition.current = null; setStatus("El micrófono no está disponible. Usa los botones."); }
  };
  return <div className="voice-panel max-w-lg">
    <div className="flex flex-wrap gap-2">
      <button aria-pressed={voice} onClick={() => { sonic.voiceEnabled = !voice; setVoice(!voice); if (!voice) sonic.speak("Hola, soy tu asistente AERION. Elige un comando para comenzar."); else window.speechSynthesis?.cancel(); }}>{voice ? "Silenciar voz" : "Activar voz"}</button>
      <button disabled={!supported} onClick={listen}>{supported ? "Hablar con AERION" : "Usa los comandos de abajo"}</button>
    </div>
    <p className="mt-2 text-sm text-white/80" role="status">{status}</p>
  </div>;
}

