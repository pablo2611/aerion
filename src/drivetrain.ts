/** Sport sound package: virtual gears over the electric concept drivetrain. */
const LIMITS = [0,55,110,175,240,320,390,470];
export function drivetrainAt(speed:number) {
  const safe=Math.max(0,Math.min(470,speed));
  let gear=1;
  while(gear<7 && safe>=LIMITS[gear])gear++;
  const fraction=(safe-LIMITS[gear-1])/(LIMITS[gear]-LIMITS[gear-1]);
  return {gear,rpm:safe<1?950:Math.round(2700+fraction*4900)};
}
export function nextRoadSpeed(speed:number,target:number,dt:number,boost:boolean) {
  const desired=Math.min(460,Math.max(0,target));
  const rate=desired<speed?85:boost?85:34;
  const step=rate*Math.min(.05,Math.max(0,dt));
  return Math.abs(desired-speed)<=step?desired:speed+Math.sign(desired-speed)*step;
}
