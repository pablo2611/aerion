import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { runtime } from "../store";

const skyVertex=`varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const skyFragment=`varying vec3 vDirection;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void main(){vec3 d=normalize(vDirection);float h=max(0.,d.y);vec3 col=mix(vec3(.73,.82,.87),vec3(.22,.48,.70),pow(h,.45));
vec2 p=d.xz/max(.09,d.y)*1.7;float cloud=noise(p)*.55+noise(p*2.1)*.3+noise(p*4.3)*.15;
float a=smoothstep(.54,.72,cloud)*smoothstep(.04,.20,h);col=mix(col,vec3(.95,.96,.95),a*.72);
float sun=pow(max(0.,dot(d,normalize(vec3(.38,.55,-.73)))),900.);col+=vec3(.30,.25,.15)*sun;gl_FragColor=vec4(col,1.);}`;
const waterVertex=`varying vec2 vWorld;void main(){vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xz;gl_Position=projectionMatrix*viewMatrix*p;}`;
const waterFragment=`varying vec2 vWorld;uniform float uTime;
void main(){float wave=sin(vWorld.x*.65+vWorld.y*1.8+uTime*.8)*sin(vWorld.y*3.5-vWorld.x*.3+uTime*.6);float light=pow(max(0.,wave),12.);vec3 color=mix(vec3(.035,.23,.29),vec3(.17,.40,.46),wave*.5+.5);color+=light*.07;float shore=exp(-abs(vWorld.y+12.)*.5);color=mix(color,vec3(.68,.80,.78),shore*.65);gl_FragColor=vec4(color,1.);}`;

/** Rounded terrain and instanced vegetation, with a strict fixed geometry budget. */
export default function RoadLandscape() {
  const trees=useRef<THREE.InstancedMesh>(null);
  const trunks=useRef<THREE.InstancedMesh>(null);
  const water=useRef<THREE.ShaderMaterial>(null);
  const object=useMemo(()=>new THREE.Object3D(),[]);
  const terrain=useMemo(()=>{
    const g=new THREE.PlaneGeometry(260,110,110,46);g.rotateX(-Math.PI/2);g.translate(0,0,61);
    const p=g.getAttribute("position");const colors=new Float32Array(p.count*3);const c=new THREE.Color();
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),z=p.getZ(i);const rise=THREE.MathUtils.smoothstep(z,9,38);
      const ridge=12+Math.sin(x*.026)*6+Math.sin(x*.063+2)*3.4;
      const mountains=21*Math.exp(-(((x-35)/38)**2))+13*Math.exp(-(((x+57)/30)**2));
      const height=rise*(ridge+mountains)*(0.55+0.45*Math.sin(z*.022)**2)+Math.sin(x*.32)*Math.sin(z*.21)*rise*.4;
      p.setY(i,height-.12);
      const rock=THREE.MathUtils.smoothstep(height,18,30);
      c.set("#456342").lerp(new THREE.Color("#8b9280"),rock).multiplyScalar(.83+Math.sin(x*.11+z*.13)*.12);c.toArray(colors,i*3);
    }
    g.setAttribute("color",new THREE.BufferAttribute(colors,3));g.computeVertexNormals();return g;
  },[]);
  const vegetation=useMemo(()=>Array.from({length:100},(_,i)=>({x:(i*37.73%220)-110,z:8+(i*17.23%16),size:.65+(i*1.17%1.4)})),[]);
  const waterUniforms=useMemo(()=>({uTime:{value:0}}),[]);
  useEffect(()=>()=>terrain.dispose(),[terrain]);
  useFrame(({clock})=>{
    if(!runtime.driving)return;
    if(water.current)water.current.uniforms.uTime.value=runtime.reduced?0:clock.elapsedTime;
    const distance=runtime.reduced?0:runtime.telemetry.distanceKm*1000;
    vegetation.forEach((tree,i)=>{
      const x=((tree.x-distance)%220+220)%220-110;
      object.position.set(x,1.35*tree.size,tree.z);object.scale.set(tree.size,tree.size*1.6,tree.size);object.updateMatrix();trees.current?.setMatrixAt(i,object.matrix);
      object.position.set(x,.68*tree.size,tree.z);object.scale.set(.13*tree.size,1.35*tree.size,.13*tree.size);object.updateMatrix();trunks.current?.setMatrixAt(i,object.matrix);
    });
    if(trees.current)trees.current.instanceMatrix.needsUpdate=true;
    if(trunks.current)trunks.current.instanceMatrix.needsUpdate=true;
  });
  return <group name="CoastalLandscape">
    <mesh><sphereGeometry args={[215,32,20]}/><shaderMaterial vertexShader={skyVertex} fragmentShader={skyFragment} side={THREE.BackSide} depthWrite={false} toneMapped={false}/></mesh>
    <mesh geometry={terrain} receiveShadow><meshStandardMaterial vertexColors roughness={1}/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.06,-60]}><planeGeometry args={[260,96]}/><shaderMaterial ref={water} uniforms={waterUniforms} vertexShader={waterVertex} fragmentShader={waterFragment}/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.025,-9]}><planeGeometry args={[260,6]}/><meshStandardMaterial color="#acaa88" roughness={1}/></mesh>
    <instancedMesh ref={trees} args={[undefined,undefined,100]} frustumCulled={false}><sphereGeometry args={[1,7,6]}/><meshStandardMaterial color="#385737" roughness={1}/></instancedMesh>
    <instancedMesh ref={trunks} args={[undefined,undefined,100]} frustumCulled={false}><cylinderGeometry args={[.7,1,1,5]}/><meshStandardMaterial color="#605346" roughness={1}/></instancedMesh>
  </group>;
}
