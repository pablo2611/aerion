/* ------------------------------------------------------------------ */
/*  AERION — GLSL shader library. Every shader is purpose-bound:      */
/*  floor stage, airflow, energy flow, cells, holo UI, radar, glow.   */
/* ------------------------------------------------------------------ */

export const FLOOR = {
  vertex: /* glsl */ `
    varying vec2 vWorld;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorld = wp.xz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,
  fragment: /* glsl */ `
    precision highp float;
    varying vec2 vWorld;
    uniform vec3 uColor;
    uniform vec3 uAccent;
    uniform vec3 uFog;
    uniform float uPool;
    uniform float uGrid;
    uniform float uContact;
    uniform float uTime;
    uniform float uRoad;
    uniform float uDistance;
    void main() {
      float r = length(vWorld);
      float pool = exp(-r * r * 0.085) * uPool;
      vec2 gv = vWorld * 0.5;
      vec2 g = abs(fract(gv) - 0.5) / fwidth(gv);
      float grid = 1.0 - min(min(g.x, g.y), 1.0);
      float gf = exp(-r * 0.17);
      vec2 c = vec2(vWorld.x * 0.55, vWorld.y * 1.5);
      float contact = exp(-dot(c, c) * 0.5) * uContact;
      float streak = exp(-abs(vWorld.y) * 1.3) * exp(-abs(vWorld.x - 1.5) * 0.1) * 0.12;
      float breathe = 0.9 + 0.1 * sin(uTime * 0.6);
      vec3 col = uColor;
      col += uAccent * pool * 0.30 * breathe;
      col += uAccent * grid * gf * 0.09 * uGrid;
      col += uAccent * streak * uPool;
      col = mix(col, vec3(0.0), contact * 0.85);
      col = mix(col, uFog, smoothstep(11.0, 30.0, r));
      float asphalt = 0.045 + fract(sin(dot(floor(vWorld*85.0),vec2(12.9898,78.233)))*43758.5453)*0.016;
      vec3 road = abs(vWorld.y)<4.8 ? vec3(asphalt) : vec3(0.16,0.21,0.18);
      float dash = step(0.45,fract((vWorld.x+uDistance)/7.0));
      float lanes = (1.0-smoothstep(0.035,0.07,abs(abs(vWorld.y)-2.5)))*dash;
      float edges = 1.0-smoothstep(0.035,0.075,abs(abs(vWorld.y)-4.55));
      road = mix(road,vec3(0.75,0.8,0.75),max(lanes,edges));
      road *= 1.0-contact*0.7;
      road = mix(road,uFog,smoothstep(35.0,70.0,r));
      col = mix(col,road,uRoad);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export const AERO = {
  vertex: /* glsl */ `
    uniform float uTime;
    uniform float uActive;
    uniform float uDrive;
    attribute float aSeed;
    attribute vec4 aRand;
    varying float vA;
    varying float vMix;
    void main() {
      float t = fract(aSeed * 7.31 + uTime * (0.09 + 0.10 * aRand.x));
      float x = mix(8.5, -8.5, t);
      float dome = exp(-x * x * 0.20);
      float y = 0.42 + (0.5 + 1.6 * aRand.y) * dome + aRand.y * 0.85;
      float z = (aRand.z - 0.5) * (1.7 + 2.4 * exp(-x * x * 0.34));
      y += sin(x * 1.7 + aSeed * 31.0) * 0.06;
      z += cos(x * 1.3 + aSeed * 43.0) * 0.05;
      if (uDrive > 0.5) {
        x = -2.3-t*7.0;
        y = 0.15+t*0.6+aRand.y*0.3+sin(t*12.0+aSeed*40.0)*t*0.16;
        z = (aRand.z>0.5 ? 1.0 : -1.0)*(0.85+t*0.5)+sin(t*14.0+aSeed*30.0)*t*0.3;
      }
      vA = uActive * smoothstep(8.5, 6.0, abs(x)) * (0.2 + 0.8 * (1.0 - exp(-abs(z) * 0.55)));
      vMix = exp(-x * x * 0.12);
      vec4 mv = modelViewMatrix * vec4(x, y, z, 1.0);
      gl_PointSize = min(95.0,(8.0 + 15.0 * aRand.w) * (100.0 / max(0.1, -mv.z)));
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragment: /* glsl */ `
    precision highp float;
    uniform vec3 uColor;
    varying float vA;
    varying float vMix;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = exp(-d*d*18.0) * smoothstep(0.5,0.3,d) * vA;
      vec3 col = mix(uColor * 0.7, vec3(0.9, 0.98, 1.0), 0.4 + 0.6 * (1.0 - vMix));
      gl_FragColor = vec4(col, a * 0.065);
    }
  `,
};

export const ENERGY = {
  vertex: /* glsl */ `
    uniform float uTime;
    uniform float uActive;
    attribute float aSeed;
    attribute vec3 aRand;
    varying float vA;
    void main() {
      float t = fract(aSeed + uTime * 0.11);
      vec2 p;
      if (t < 0.25)      p = vec2(mix(2.15, -2.15, t * 4.0), -0.85);
      else if (t < 0.5)  p = vec2(-2.15, mix(-0.85, 0.85, (t - 0.25) * 4.0));
      else if (t < 0.75) p = vec2(mix(-2.15, 2.15, (t - 0.5) * 4.0), 0.85);
      else               p = vec2(2.15, mix(0.85, -0.85, (t - 0.75) * 4.0));
      float head = smoothstep(0.10, 0.0, t);
      vA = uActive * (0.30 + 0.70 * head);
      vec4 mv = modelViewMatrix * vec4(p.x, 0.17 + aRand.y * 0.06, p.y, 1.0);
      gl_PointSize = (2.0 + 5.0 * head * aRand.z) * (240.0 / max(0.1, -mv.z));
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragment: /* glsl */ `
    precision highp float;
    uniform vec3 uColor;
    varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.05, d) * vA;
      gl_FragColor = vec4(uColor, a * 0.8);
    }
  `,
};

export const CELLS = {
  vertex: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    uniform float uTime;
    uniform float uIntensity;
    uniform vec3 uColor;
    float gridline(vec2 uv, vec2 n) {
      vec2 f = abs(fract(uv * n - 0.5) - 0.5) / fwidth(uv * n);
      return 1.0 - min(min(f.x, f.y), 1.0);
    }
    void main() {
      vec2 uv = vUv;
      float lines = gridline(uv, vec2(26.0, 10.0));
      float wave = 0.5 + 0.5 * sin(uv.x * 20.0 - uTime * 3.2);
      float charge = smoothstep(0.42, 1.0, wave);
      float edge = smoothstep(0.0, 0.08, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
      vec3 base = vec3(0.015, 0.02, 0.03);
      vec3 col = base
        + uColor * (lines * 0.55 + charge * 0.5) * uIntensity
        + uColor * pow(charge, 4.0) * 1.6 * uIntensity;
      col += uColor * (1.0 - edge) * 0.35 * uIntensity;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export const GLOW = {
  vertex: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    uniform vec3 uColor;
    uniform float uOpacity;
    void main() {
      float d = distance(vUv, vec2(0.5)) * 2.0;
      float a = pow(max(0.0, 1.0 - d), 3.0) * uOpacity;
      gl_FragColor = vec4(uColor, a);
    }
  `,
};

export const HOLO = {
  vertex: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uOpacity;
    void main() {
      vec2 uv = vUv;
      vec2 e = min(uv, 1.0 - uv);
      float frame = 1.0 - smoothstep(0.0, 0.025, min(e.x, e.y));
      float scan = 0.5 + 0.5 * sin(uv.y * 90.0 - uTime * 5.0);
      float rows = step(0.82, fract(uv.y * 11.0)) * (0.35 + 0.65 * step(0.3, fract(uv.x * 6.0 + floor(uv.y * 11.0) * 0.37)));
      float flick = 0.9 + 0.1 * sin(uTime * 21.0 + uv.x * 7.0);
      vec3 col = uColor * (frame * 1.1 + scan * 0.05 + rows * 0.30) * flick;
      gl_FragColor = vec4(col, uOpacity * (0.15 + frame * 0.85));
    }
  `,
};

export const RADAR = {
  vertex: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uOpacity;
    void main() {
      vec2 p = vUv * 2.0 - 1.0;
      float r = length(p);
      if (r > 1.0) discard;
      float a = atan(p.y, p.x);
      float ang = mod(a - uTime * 2.0, 6.28318);
      float trail = exp(-ang * 1.4) * (1.0 - r * 0.85);
      float rings = smoothstep(0.04, 0.0, abs(fract(r * 3.0 - uTime * 0.4) - 0.5) - 0.46);
      float cross = smoothstep(0.03, 0.0, abs(p.x) + abs(p.y));
      float dotp = pow(max(0.0, 1.0 - length(p - vec2(0.42, 0.18)) * 3.2), 2.0);
      vec3 col = uColor * (trail * 1.5 + rings * 0.22 + cross * 0.10 + dotp * 1.4);
      float aOut = (trail * 0.8 + rings * 0.3 + cross * 0.2 + dotp) * uOpacity;
      gl_FragColor = vec4(col, aOut);
    }
  `,
};
