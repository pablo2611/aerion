"""Editable Blender assembly. Scanned Poly Haven rocks/trees are instanced by RoadLandscape.
The stage supplies real beach/ocean geometry and roadside engineering, not a sky photograph.
Run Blender --background --factory-startup --python assets-source/build_coast.py.
"""
import bpy, math, random, os
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def material(name,color,roughness=1):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Roughness'].default_value=roughness
 return m
sand=material('Coastal sand',(0.39,.34,.23)); grass=material('Coastal ground',(.15,.22,.12)); water=material('Ocean',(.025,.20,.25),.32); foam=material('Wave crests',(.45,.65,.65)); steel=material('Brushed crash barrier',(.26,.30,.31),.6); stone=material('Concrete posts',(.43,.45,.39))
def mesh(name,verts,faces,mat):
 m=bpy.data.meshes.new(name); m.from_pydata(verts,[],faces); m.update(); o=bpy.data.objects.new(name,m); bpy.context.collection.objects.link(o); o.data.materials.append(mat); return o
# World in Three.js uses X forward and Z lateral; Blender export maps Y to -Z and Z to Y.
def strip(name,zs,height,mat):
 verts=[]; random.seed(9)
 for x in range(-180,181,6):
  for z in zs:
   y=height(x,z)
   verts.append((x,-z,y))
 faces=[]; n=len(zs)
 for i in range(60):
  for j in range(n-1):
   a=i*n+j; faces.append((a,a+1,a+n+1,a+n))
 return mesh(name,verts,faces,mat)
strip('Sculpted shoreline',[-5.7,-9,-14,-22,-35],lambda x,z: -.16+(z+5.7)*.065+.22*math.sin(x*.06)*min(1,abs(z+5.7)/7),sand)
strip('Roadside terrain',[5.8,9,15,25,45,90],lambda x,z: -.17+ max(0,z-10)*.045+.25*math.sin(x*.045)*min(1,(z-5.8)/12),grass)
strip('Three dimensional ocean',[-20,-30,-45,-70,-110,-180],lambda x,z:-1.5+.12*math.sin(x*.09+z*.18)+.07*math.sin(x*.2-z*.25),water)
for z in [-26,-32,-40]:
 strip('Surf ridge', [z,z-.35,z-.9],lambda x,t:-1.34+.09*math.sin(x*.09+t*.18),foam)
def cube(name,loc,scale,mat):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.name=name; o.scale=scale; o.data.materials.append(mat)
for side in [-1,1]:
 for x in range(-168,169,12):
  cube('Safety barrier support',(x,-side*5.9,.25),(.12,.12,.9),stone)
 for h in [.43,.68]:cube('Continuous steel guardrail',(0,-side*5.9,h),(360,.08,.13),steel)
# Merge structures by material: five stage draws instead of dozens of posts.
for mat in [sand,grass,water,foam,steel,stone]:
 bpy.ops.object.select_all(action='DESELECT')
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials and o.data.materials[0]==mat]
 if objects:
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0]; bpy.ops.object.join()
bpy.ops.object.select_all(action='SELECT')
bpy.ops.wm.save_as_mainfile(filepath=str(root/'assets-source/coastal-stage.blend'))
bpy.ops.export_scene.gltf(filepath=str(root/'public/environment/coastal-stage.glb'),export_format='GLB',export_yup=True,export_apply=True)

# Include the actual CC0 scanned assets in the editable Blender composition.
# Web rendering instances these separately to recycle them along the moving road.
for asset,count,spacing,z,scale in [('coastal_cliff_01',3,100,23,1),('pine_sapling_small',8,36,10,2.7),('boulder_01',2,120,-8.5,2.5)]:
 bpy.ops.object.select_all(action='DESELECT')
 bpy.ops.import_scene.gltf(filepath=str(root/'public/environment'/f'{asset}.glb'))
 originals=list(bpy.context.selected_objects)
 for o in originals:
  if o.parent is None:
   o.location.x-=100; o.location.y-=z; o.scale*=scale
 for i in range(1,count):
  mapping={}
  for source in originals:
   clone=source.copy(); bpy.context.collection.objects.link(clone);mapping[source]=clone
  for source,clone in mapping.items():
   if source.parent in mapping:clone.parent=mapping[source.parent]
   elif source.parent is None:clone.location.x+=i*spacing
bpy.ops.wm.save_as_mainfile(filepath=str(root/'assets-source/coastal-stage.blend'))
