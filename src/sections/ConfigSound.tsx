import { useState } from "react";
import { useExperience } from "../store";
import { sonic } from "../audio";

export default function ConfigSound() {
  const on = useExperience(s => s.audioOn);
  const error = useExperience(s => s.audioError);
  const [volume,setVolume] = useState(Math.round(sonic.volume*100));
  const [busy,setBusy] = useState(false);
  return <div className="mt-5 border-t border-ink/20 pt-4">
    <button disabled={busy} aria-pressed={on} className="w-full border border-ink px-3 py-3 text-sm font-semibold" onClick={async () => {setBusy(true); try {useExperience.setState({audioOn:await sonic.toggle()});} finally {setBusy(false);} }}>{busy ? "Iniciando sonido…" : on ? "Silenciar música y motor" : "Activar música y motor"}</button>
    <label className="mt-3 flex items-center justify-between text-sm" htmlFor="config-volume"><span>Volumen</span><span>{volume}%</span></label>
    <input className="mt-2 w-full accent-[#08768a]" id="config-volume" type="range" min="0" max="100" value={volume} onChange={e=>{const v=Number(e.target.value);setVolume(v);sonic.setVolume(v/100);}}/>
    <p role="status" className="mt-2 text-xs leading-relaxed text-ink/80">{error || (on ? "Música y motor activos" : "Activa el sonido para escuchar la experiencia.")}</p>
  </div>;
}
