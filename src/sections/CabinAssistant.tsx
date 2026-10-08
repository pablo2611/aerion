import { useEffect, useRef, useState, type FormEvent } from "react";
import { sonic } from "../audio";
import { runtime, useExperience } from "../store";
import { readTelemetry } from "../telemetry";
import { answerVehicle, type VehicleCommand } from "../vehicleAssistant";

export function applyVehicleCommand(command?:VehicleCommand){
  if(!command)return;
  const store=useExperience.getState();
  switch(command.type){
    case "speed":useExperience.setState({cruiseSpeed:command.value,drivingPaused:false,autonomous:true,engineView:false});break;
    case "pause":runtime.nitroUntil=0;useExperience.setState({drivingPaused:true,autonomous:false});break;
    case "resume":useExperience.setState({drivingPaused:false,autonomous:true,engineView:false});break;
    case "lights":useExperience.setState({headlightsOn:command.value});break;
    case "doors":useExperience.setState({doorsOpen:command.value});break;
    case "volume":sonic.setVolume(command.value/100);break;
    case "sound":sonic.setEngineMode(command.value);break;
    case "night":runtime.lightState.ambient=.24;useExperience.setState({headlightsOn:true});store.setConfig({signature:"ion"});break;
    case "relax":runtime.lightState.ambient=.45;store.setConfig({signature:"solar"});break;
  }
}
export default function CabinAssistant(){
  const [input,setInput]=useState("");
  const [status,setStatus]=useState("Pregúntame por el coche");
  const [listening,setListening]=useState(false);
  const [speaking,setSpeaking]=useState(false);
  const previousTopic=useRef("");
  const recognition=useRef<any>(null);
  const mounted=useRef(true);
  const supported="SpeechRecognition" in window || "webkitSpeechRecognition" in window;
  const speechSupported="speechSynthesis" in window;
  const stopListening=()=>{
    const r=recognition.current;recognition.current=null;
    if(r){r.onend=null;r.onerror=null;r.onresult=null;r.abort();}
    sonic.setListening(false);setListening(false);
  };
  useEffect(()=>{
    mounted.current=true;
    return()=>{mounted.current=false;const r=recognition.current;if(r){r.onend=null;r.onerror=null;r.onresult=null;r.abort();}sonic.setListening(false);sonic.cancelSpeech();};
  },[]);
  const ask=(text:string)=>{
    const trimmed=text.trim().slice(0,400);if(!trimmed)return;
    stopListening();
    if(!speechSupported){setStatus("Voz no disponible en este navegador");return;}
    const result=answerVehicle(trimmed,readTelemetry(),previousTopic.current);
    previousTopic.current=result.topic;applyVehicleCommand(result.command);setInput("");
    sonic.voiceEnabled=true;useExperience.setState({voiceOn:true});setSpeaking(true);setStatus("AERION está hablando");
    sonic.speak(result.text,()=>{if(mounted.current){setSpeaking(false);setStatus("Listo para otra pregunta");}});
  };
  const listen=()=>{
    if(recognition.current){stopListening();setStatus("Escucha detenida");return;}
    const Ctor=(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;if(!Ctor)return;
    sonic.cancelSpeech();setSpeaking(false);sonic.setListening(true);
    const r=new Ctor();recognition.current=r;r.lang="es-ES";r.continuous=false;r.interimResults=false;
    setListening(true);setStatus("Escuchando… habla ahora");
    r.onresult=(event:any)=>{const text=event.results?.[0]?.[0]?.transcript;if(text)ask(text);};
    r.onerror=(event:any)=>{if(!mounted.current)return;stopListening();setStatus(event.error==="not-allowed"?"Permite el micrófono o escribe abajo":"No pude escuchar. Puedes escribir abajo");};
    r.onend=()=>{if(recognition.current!==r)return;recognition.current=null;sonic.setListening(false);if(mounted.current){setListening(false);setStatus("Pulsa Hablar para preguntar");}};
    try{r.start();}catch{stopListening();setStatus("Micrófono no disponible. Escribe abajo");}
  };
  const submit=(e:FormEvent)=>{e.preventDefault();ask(input);};
  return <section className="cabin-screen-ai" aria-label="Asistente de voz en la pantalla del coche" onPointerDown={e=>e.stopPropagation()} onWheel={e=>e.stopPropagation()}>
    <div className="screen-ai-heading"><strong>Habla con AERION</strong><button onClick={()=>{stopListening();sonic.cancelSpeech();setSpeaking(false);setStatus("Respuesta detenida");}} aria-label="Detener respuesta">Detener</button></div>
    <div className={`screen-voice-wave ${speaking||listening?"is-active":""}`} aria-hidden="true">{Array.from({length:13},(_,i)=><i key={i} style={{animationDelay:`${i*-.09}s`}}/>)}</div>
    <div className="screen-ai-suggestions">{["Velocidad","Motor","Batería"].map(q=><button key={q} disabled={!speechSupported} onClick={()=>ask(`¿Cómo va ${q.toLowerCase()}?`)}>{q}</button>)}</div>
    <button className="screen-ai-talk" disabled={!supported||!speechSupported} aria-pressed={listening} onClick={listen}>{listening?"Dejar de escuchar":"Hablar"}</button>
    <form onSubmit={submit}><label className="sr-only" htmlFor="screen-question">Pregunta al coche</label><input id="screen-question" value={input} maxLength={400} onChange={e=>setInput(e.target.value)} placeholder="Pregunta o pide un ajuste…"/><button disabled={!input.trim()||!speechSupported}>Enviar</button></form>
    <p className="screen-ai-status" role="status">{!speechSupported?"Este navegador no dispone de voz":status}</p>
  </section>;
}
