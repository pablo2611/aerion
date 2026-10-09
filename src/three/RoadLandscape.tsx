import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useEnvironment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { runtime, useExperience } from '../store';

const base=import.meta.env.BASE_URL+'environment/';
type Placement={x:number;z:number;scale:number;rotation:number};

/** Imported Poly Haven meshes: shared textures and one draw per material. */
function ImportedInstances({asset,placements}:{asset:string;placements:Placement[]}){
  const {scene}=useGLTF(base+asset+'.glb');
  const meshes=useRef<(THREE.InstancedMesh|null)[]>([]);
  const object=useMemo(()=>new THREE.Object3D(),[]);
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
    placements.forEach((p,i)=>{
      object.position.set(((p.x-distance)%240+240)%240-120,-.1,p.z);
      object.rotation.set(0,p.rotation,0);object.scale.setScalar(p.scale);object.updateMatrix();
      meshes.current.forEach(mesh=>mesh?.setMatrixAt(i,object.matrix));
    });
    meshes.current.forEach(mesh=>{if(mesh)mesh.instanceMatrix.needsUpdate=true;});
  });
  return <group>{parts.map((part,i)=><instancedMesh key={i} ref={node=>{meshes.current[i]=node;}} args={[part.geometry,part.material,placements.length]} frustumCulled={false}/>)}</group>;
}

/** Photographed sun/sky/coast plus imported scanned rocks and vegetation. */
export default function RoadLandscape(){
  const sky=useEnvironment({files:base+'umhlanga-sunrise-2k.hdr'});
  const scene=useThree(s=>s.scene);
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
    const old=scene.environment;
    scene.environment=sky;
    useExperience.setState({environmentReady:true});
    return()=>{scene.environment=old;useExperience.setState({environmentReady:false});};
  },[scene,sky]);
  useFrame(()=>{if(runtime.driving&&scene.environment!==sky)scene.environment=sky;});
  return <group name="PolyHavenCoastalEnvironment">
    <mesh rotation={[0,1.9,0]}><sphereGeometry args={[215,48,24]}/><meshBasicMaterial map={sky} side={THREE.BackSide} depthWrite={false} fog={false}/></mesh>
    <ImportedInstances asset="coastal_cliff_01" placements={placements.cliffs}/>
    <ImportedInstances asset="pine_sapling_small" placements={placements.trees}/>
    <ImportedInstances asset="boulder_01" placements={placements.rocks}/>
  </group>;
}
