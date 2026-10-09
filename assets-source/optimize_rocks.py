import bpy
from pathlib import Path
root=Path('C:/Users/pabli/Documents/Codex/2026-10-06/us/work/aerion')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root/'public/environment/boulder_01.glb'))
for o in list(bpy.context.scene.objects):
 if o.type!='MESH':continue
 bpy.context.view_layer.objects.active=o
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.00001);bpy.ops.object.mode_set(mode='OBJECT')
 before=len(o.data.polygons)
 modifier=o.modifiers.new('Distant rock LOD','DECIMATE');modifier.ratio=.12
 bpy.ops.object.modifier_apply(modifier=modifier.name)
 print('ROCK_FACES',before,len(o.data.polygons))
bpy.ops.export_scene.gltf(filepath=str(root/'public/environment/boulder-light.glb'),export_format='GLB',export_yup=True,export_apply=True)
