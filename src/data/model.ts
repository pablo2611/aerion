export const AERION_MODEL = {
  /** Official Khronos compressed delivery: Draco geometry + KTX2/BasisU textures. */
  url: `${import.meta.env.BASE_URL}models/car/CarConcept.gltf`,
  fallback:
    "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/CarConcept/screenshot/screenshot_Large.jpg",
  interiorFallback:
    "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/CarConcept/screenshot/small_feature_removal.jpg",
  detailFallback:
    "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/CarConcept/screenshot/car_paint_closeup.jpg",
  dracoPath: "https://www.gstatic.com/draco/versioned/decoders/1.5.7/",
  basisPath: "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/libs/basis/",
  source: "https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept",
  creator: "Eric Chadwick / Darmstadt Graphics Group GmbH",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/legalcode",
  optimization: "Draco geometry + KTX2/BasisU textures; 10.3 MB download / 14.9 MB GPU memory",
} as const;

export const MODEL_CREDITS =
  "Car Concept model and textures © 2024 Darmstadt Graphics Group GmbH, by Eric Chadwick, licensed CC BY 4.0. Modified for AERION through materials, lighting and presentation. Khronos and 3D Commerce logo meshes are not displayed.";