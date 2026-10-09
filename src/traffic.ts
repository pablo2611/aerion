export type RoadActor = { id: string; kind: 'car' | 'motorcycle'; x: number; lane: number; speed: number; color: string };
export const roadActors: RoadActor[] = [
  {id:'C01',kind:'car',x:32,lane:0,speed:94,color:'#bdc5ce'},
  {id:'M02',kind:'motorcycle',x:48,lane:-3.2,speed:108,color:'#df7636'},
  {id:'C03',kind:'car',x:72,lane:3.2,speed:82,color:'#275b89'},
];
export function advanceActor(actor: RoadActor, speed: number, dt: number) {
  actor.x += (actor.speed-speed)/3.6*Math.min(.15,Math.max(0,dt));
  if(actor.x < -20) actor.x=110;
  if(actor.x > 140) actor.x=24;
}
export function detectedActors(lane: number) {
  return roadActors.filter(actor=>actor.x>0&&actor.x<100).map(actor=>({...actor,relativeLane:actor.lane-lane}));
}
