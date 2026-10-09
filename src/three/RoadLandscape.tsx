import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { runtime, useExperience } from '../store';

const base=import.meta.env.BASE_URL+'environment/';
type Placement={x:number;z:number;scale:number;rotation:number};

/** Imported Poly Haven meshes: shared textures and one draw per material. */
function ImportedInstances({asset,placements}:{asset:string;placements:Placement[]}){
  const {scene}=useGLTF(base+asset+'.glb');
  const meshes=useRef<(THREE.InstancedMesh|null)[]>([]);
  const object=useMemo(()=>new THREE.Object3D(),[]);
  const lastDistance=useRef(NaN);
  useEffect(()=>{lastDistance.current=NaN;},[placements]);
  const parts=useMemo(()=>{
    scene.updateMatrixWorld(true);
    const list:{geometry:THREE.BufferGeometry;material:THREE.Material|THREE.Material[]}[]=[];
    scene.traverse(node=>{
      if(!(node instanceof THREE.Mesh))return;
      list.push({geometry:node.geometry.clone().applyMatrix4(node.matrixWorld),material:node.material});
    });
    return list;
  },[scene]);
  useEffect(()=>()=>parts.forEach(part=>part.geometry.dispose()),[parts]);
  useFrame(()=>{
    const distance=runtime.reduced?0:runtime.telemetry.distanceKm*1000;
    if(Math.abs(distance-lastDistance.current)<.001)return;
    lastDistance.current=distance;
    placements.forEach((p,i)=>{
      object.position.set(((p.x-distance)%240+240)%240-120,-.1,p.z);
      object.rotation.set(0,p.rotation,0);object.scale.setScalar(p.scale);object.updateMatrix();
      meshes.current.forEach(mesh=>mesh?.setMatrixAt(i,object.matrix));
    });
    meshes.current.forEach(mesh=>{if(mesh)mesh.instanceMatrix.needsUpdate=true;});
  });
  return <group>{parts.map((part,i)=><instancedMesh key={i} ref={node=>{meshes.current[i]=node;}} args={[part.geometry,part.material,placements.length]} frustumCulled={false}/>)}</group>;
}

function BlenderCoast(){
  const {scene}=useGLTF(base+'coastal-stage.glb');
  const group=useRef<THREE.Group>(null);
  const wave=useMemo(()=>({value:0}),[]);
  const stage=useMemo(()=>{
    const clone=scene.clone(true);
    clone.traverse(node=>{
      if(!(node instanceof THREE.Mesh)||node.name!=='Three_dimensional_ocean')return;
      const mat=(node.material as THREE.MeshStandardMaterial).clone();
      mat.onBeforeCompile=shader=>{
        shader.uniforms.coastTime=wave;
        shader.vertexShader='uniform float coastTime;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.y += .12*sin(position.x*.11+coastTime*.65)+.06*sin(position.z*.24-coastTime*.45);');
      };
      node.material=mat;
    });
    return clone;
  },[scene,wave]);
  useEffect(()=>()=>stage.traverse(node=>{if(node instanceof THREE.Mesh&&node.name==='Three_dimensional_ocean')(node.material as THREE.Material).dispose();}),[stage]);
  useFrame(({clock})=>{wave.value=runtime.reduced?0:clock.elapsedTime;if(group.current)group.current.position.z=-runtime.lane;});
  return <group ref={group}><primitive object={stage}/></group>;
}

/** Volumetric Blender stage and imported scanned vegetation; no panoramic photograph. */
export default function RoadLandscape(){
  const quality=useExperience(s=>s.quality);
  const placements=useMemo(()=>{
    const n=quality==='LOW'?3:quality==='MEDIUM'?6:8;
    return {
      trees:Array.from({length:n},(_,i)=>({x:i*240/n,z:9+(i%3)*2,scale:2.2+(i%3)*.55,rotation:i*1.37})),
      cliffs:Array.from({length:quality==='LOW'?2:3},(_,i)=>({x:i*80,z:23,scale:1,rotation:0})),
      rocks:Array.from({length:2},(_,i)=>({x:55+i*120,z:-8.5,scale:2.2+i,rotation:i*2.3})),
    };
  },[quality]);
  useEffect(()=>{
    useExperience.setState({environmentReady:true});
    return()=>{useExperience.setState({environmentReady:false});};
  },[]);
  return <group name="PolyHavenCoastalEnvironment">
    <Sky distance={450000} sunPosition={[90,45,-130]} turbidity={3.5} rayleigh={1.5} mieCoefficient={.003} mieDirectionalG={.8}/>
    <BlenderCoast/>
    <ImportedInstances asset="coastal_cliff_01" placements={placements.cliffs}/>
    <ImportedInstances asset="pine-light" placements={placements.trees}/>
    <ImportedInstances asset="boulder-light" placements={placements.rocks}/>
  </group>;
}
