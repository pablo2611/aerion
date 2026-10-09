# AERION imported environment

All four source assets are published by Poly Haven under CC0 1.0:
https://polyhaven.com/license

| Local asset | Original asset | Creator |
| --- | --- | --- |
| umhlanga-sunrise-2k.hdr | https://polyhaven.com/a/umhlanga_sunrise | Greg Zaal |
| coastal_cliff_01.glb | https://polyhaven.com/a/coastal_cliff_01 | Poly Haven contributors; see original asset credits |
| boulder_01.glb | https://polyhaven.com/a/boulder_01 | Rico Cilliers |
| pine_sapling_small.glb | https://polyhaven.com/a/pine_sapling_small | Rico Cilliers / Rob Tuytel |

The environment uses existing photographed/scanned assets. No generated sky,
sun, cliff or tree meshes are used. Instances change placement, rotation and scale.

The HDRI uses the original 2K download. Models were downloaded from the official
Poly Haven files API at 1K texture resolution, then processed with glTF Transform
4.5.1: deduplication, flattening, joining, welding, mesh simplification (target
ratio 0.06, error 0.025) and 512px WebP textures. Geometry is uncompressed GLB
to avoid additional decoder downloads. The renderer shares model textures and
uses instancing with fewer objects at lower quality settings.

Assets are loaded only when entering the road view and are hosted with the site.
The original full-resolution model downloads are not distributed with this repo.

## Blender stage (2026-10-08)
The road backdrop no longer uses the Umhlanga HDR panorama. It uses volumetric
shore geometry and barriers assembled with Blender 4.5.14 LTS, a physical Sky
shader, and the existing CC0 scanned cliffs, boulders and trees above.
Editable source: assets-source/coastal-stage.blend (includes imported models).
Rebuild: blender --background --factory-startup --python assets-source/build_coast.py
The 181 KB stage GLB has six material draws. Scanned assets remain separate,
shared GPU instances for distance recycling and adaptive quality.
