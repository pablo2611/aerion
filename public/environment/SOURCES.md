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
