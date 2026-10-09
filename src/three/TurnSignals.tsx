import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { runtime } from '../store';
export default function TurnSignals(){
  const left=useRef<THREE.Group>(null),right=useRef<THREE.Group>(null);
  useFrame(()=>{
    const blink=runtime.driving&&Math.floor(performance.now()/400)%2===0;
    if(left.current)left.current.visible=blink&&runtime.turn==='left';
    if(right.current)right.current.visible=blink&&runtime.turn==='right';
  });
  return <>{[-1,1].map(side=><group key={side} ref={side<0?left:right} visible={false}>
    {[2.25,-2.49].map(x=><mesh key={x} position={[x,.84,side*.82]}><boxGeometry args={[.045,.07,.22]}/><meshBasicMaterial color="#ffad32" toneMapped={false}/></mesh>)}
  </group>)}</>;
}
