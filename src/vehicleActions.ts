import { runtime, useExperience } from './store';
import { detectedActors } from './traffic';
import { sonic } from './audio';

/** Shared by voice and buttons so neither can bypass traffic or boost limits. */
export function changeVehicleLane(direction:'left'|'right'):string {
  if(!runtime.driving||useExperience.getState().drivingPaused)return 'Reanuda el recorrido antes de cambiar de carril.';
  if(performance.now()<runtime.nitroUntil)return 'Espera a que termine el nitro para cambiar de carril.';
  const next=Math.max(-3.2,Math.min(3.2,runtime.targetLane+(direction==='left'?-3.2:3.2)));
  if(next===runtime.targetLane)return 'Ya estás en el carril exterior.';
  if(detectedActors(next).some(actor=>Math.abs(actor.relativeLane)<1&&actor.x<25))return 'Carril ocupado. Espera a que el vehículo se aleje.';
  runtime.turn=direction;runtime.targetLane=next;
  return direction==='left'?'Cambio al carril izquierdo con direccional activa.':'Cambio al carril derecho con direccional activa.';
}
export function startVehicleNitro():string {
  const state=useExperience.getState(),now=performance.now();
  if(!runtime.driving||state.drivingPaused||state.engineView)return 'Reanuda el recorrido antes de activar el nitro.';
  if(now<runtime.nitroCooldownUntil)return 'El nitro se está recargando. Espera unos segundos.';
  runtime.nitroUntil=now+7000;runtime.nitroCooldownUntil=now+9500;
  const until=runtime.nitroUntil;
  const play=()=>{if(runtime.driving&&runtime.nitroUntil===until&&performance.now()<until)sonic.nitro();};
  if(state.audioOn)play();
  else void sonic.toggle().then(on=>{useExperience.setState({audioOn:on});if(on)play();}).catch(()=>useExperience.setState({audioError:'Reactiva el motor para escuchar el nitro.'}));
  return 'Nitro activado durante siete segundos. Velocidad máxima simulada: 460 kilómetros por hora.';
}
