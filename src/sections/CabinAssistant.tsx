import { useEffect, useRef, useState, type FormEvent } from "react";
import { sonic } from "../audio";
import { runtime, useExperience } from "../store";
import { readTelemetry } from "../telemetry";
import { answerVehicle, type VehicleCommand } from "../vehicleAssistant";

export function applyVehicleCommand(command?: VehicleCommand) {
  if (!command) return;
  const store = useExperience.getState();
  switch (command.type) {
    case "speed": useExperience.setState({cruiseSpeed:command.value, drivingPaused:false, autonomous:true}); break;
    case "pause": runtime.nitroUntil=0; useExperience.setState({drivingPaused:true,autonomous:false}); break;
    case "resume": useExperience.setState({drivingPaused:false,autonomous:true}); break;
    case "lights": useExperience.setState({headlightsOn:command.value}); break;
    case "doors": useExperience.setState({doorsOpen:command.value}); break;
    case "volume": sonic.setVolume(command.value/100); break;
    case "sound": sonic.setEngineMode(command.value); break;
    case "night":
      runtime.lightState.ambient=.24;
      useExperience.setState({headlightsOn:true}); store.setConfig({signature:"ion"}); break;
    case "relax": runtime.lightState.ambient=.45; store.setConfig({signature:"solar"}); break;
  }
}

export default function CabinAssistant() {
  const voice = useExperience(s=>s.voiceOn);
  const exploring = useExperience(s=>s.exploreOpen);
  const [expanded,setExpanded] = useState(true);
  const [input,setInput] = useState("");
  const [question,setQuestion] = useState("");
  const [reply,setReply] = useState("Pregúntame por la velocidad, la batería o el estado del motor.");
  const [status,setStatus] = useState("Listo");
  const [listening,setListening] = useState(false);
  const [telemetry,setTelemetry] = useState(readTelemetry);
  const previousTopic = useRef("");
  const recognition = useRef<any>(null);
  const mounted = useRef(true);
  const supported = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
  const speechSupported = "speechSynthesis" in window;

  useEffect(() => {
    mounted.current=true;
    const timer=window.setInterval(()=>setTelemetry(readTelemetry()),1000);
    return () => {
      mounted.current=false;
      window.clearInterval(timer);
      if(recognition.current) { recognition.current.onend=null; recognition.current.onerror=null; recognition.current.onresult=null; recognition.current.abort(); recognition.current=null; }
      sonic.setListening(false); sonic.cancelSpeech();
    };
  },[]);

  const ask = (text: string, spoken = false) => {
    const trimmed=text.trim().slice(0,400);
    if(!trimmed)return;
    if(recognition.current) { recognition.current.onend=null; recognition.current.onerror=null; recognition.current.onresult=null; recognition.current.abort(); recognition.current=null; }
    setListening(false); sonic.setListening(false);
    const answer=answerVehicle(trimmed,readTelemetry(),previousTopic.current);
    previousTopic.current=answer.topic;
    applyVehicleCommand(answer.command);
    setQuestion(trimmed); setReply(answer.text); setInput("");
    const shouldSpeak=(spoken || voice) && speechSupported;
    if(shouldSpeak) {
      sonic.voiceEnabled=true; useExperience.setState({voiceOn:true}); setStatus("Respondiendo");
      sonic.speak(answer.text,()=>{if(mounted.current)setStatus("Listo para otra pregunta");});
    } else setStatus("Respuesta escrita");
  };
  const listen = () => {
    if(recognition.current) { recognition.current.abort(); recognition.current=null; setListening(false); sonic.setListening(false); setStatus("Escucha detenida."); return; }
    const Ctor=(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if(!Ctor)return;
    sonic.cancelSpeech(); sonic.setListening(true);
    const r=new Ctor(); recognition.current=r;
    r.lang="es-ES"; r.continuous=false; r.interimResults=false;
    setListening(true); setStatus("Escuchando… habla ahora");
    r.onresult=(event:any)=>{ const text=event.results?.[0]?.[0]?.transcript; if(text)ask(text,true); };
    r.onerror=(event:any)=>{
      if(!mounted.current)return;
      const errors:Record<string,string>={"not-allowed":"Permite el micrófono o escribe tu pregunta.","audio-capture":"No se encontró un micrófono. Puedes escribir.",network:"El reconocimiento de voz no pudo conectarse. Escribe tu pregunta.","no-speech":"No escuché una pregunta. Inténtalo otra vez.",aborted:"Escucha detenida."};
      setStatus(errors[event.error] ?? "No pude escuchar. Puedes escribir abajo.");
    };
    r.onend=()=>{ if(recognition.current!==r)return; recognition.current=null; sonic.setListening(false); if(mounted.current){setListening(false);setStatus(s=>s.startsWith("Escuchando")?"No recibí una pregunta. Puedes volver a hablar.":s);} };
    try { r.start(); } catch { recognition.current=null; sonic.setListening(false); setListening(false); setStatus("Micrófono no disponible. Escribe tu pregunta."); }
  };
  const submit=(e:FormEvent)=>{e.preventDefault();ask(input);};

  return <aside className={`cabin-assistant ${expanded?"is-expanded":""} ${exploring?"in-showroom":""}`} aria-label="Asistente de cabina AERION">
    <div className="cabin-assistant-title">
      <div><strong>AERION contigo</strong><span>Asistente local · datos simulados</span></div>
      <button aria-expanded={expanded} aria-label={expanded?"Minimizar asistente":"Abrir asistente"} onClick={()=>setExpanded(!expanded)}>{expanded?"Ocultar":"Abrir"}</button>
    </div>
    {expanded && <div className="cabin-assistant-content">
      <dl className="cabin-telemetry">
        <div><dt>Velocidad</dt><dd>{telemetry.speed}<small> km/h</small></dd></div>
        <div><dt>Batería</dt><dd>{telemetry.battery}<small>%</small></dd></div>
        <div><dt>Motor</dt><dd>{telemetry.motorTemp}<small> °C</small></dd></div>
      </dl>
      {question && <p className="cabin-question">Tú: {question}</p>}
      <p className="cabin-answer" aria-live="polite">{reply}</p>
      <div className="cabin-suggestions" aria-label="Preguntas rápidas">
        {["¿A qué velocidad vamos?","¿Cómo está el motor?","¿Cuánta batería queda?","¿Qué puedes hacer?"].map(q=><button key={q} onClick={()=>ask(q)}>{q}</button>)}
      </div>
      <form onSubmit={submit} className="cabin-ask-form">
        <label className="sr-only" htmlFor="cabin-question">Pregunta a AERION</label>
        <input id="cabin-question" value={input} onChange={e=>setInput(e.target.value)} maxLength={400} placeholder="Pregunta o pide un ajuste…" autoComplete="off"/>
        <button type="submit" disabled={!input.trim()}>Enviar</button>
      </form>
      <div className="cabin-voice-actions">
        <button onClick={listen} disabled={!supported} aria-pressed={listening}>{listening?"Detener escucha":"Hablar con AERION"}</button>
        <button disabled={!speechSupported} aria-pressed={voice} onClick={()=>{sonic.voiceEnabled=!voice;useExperience.setState({voiceOn:!voice});if(voice)sonic.cancelSpeech();}}>{voice?"Silenciar voz":"Activar voz"}</button>
      </div>
      <p className="cabin-voice-status" role="status">{supported?status:"Este navegador no admite voz de entrada. Puedes escribir y usar las preguntas rápidas."}</p>
    </div>}
  </aside>;
}
