# AERION

### The air, engineered.

Una experiencia de gran turismo eléctrico, diseñada para explorar un vehículo en 3D y verlo en carretera.

[**Abrir la experiencia →**](https://pablo2611.github.io/aerion/)

<a href="https://pablo2611.github.io/aerion/"><img src="docs/project-card.svg" alt="AERION — abrir la experiencia de conducción" width="380" /></a>

## Explora

- **Carretera en movimiento:** cámara 360° con arrastre, scroll y teclado; ruedas animadas, velocidad gradual y pausa.
- **Nitro de concepto:** impulso de 4,5 segundos, toma automática de los dos escapes con llamas 3D y regreso a tu cámara anterior. Es un paquete deportivo ficticio de la simulación.
- **Tu color:** ocho pinturas, acabados, llantas, interiores y firmas luminosas en vivo.
- **Sonido:** motor deportivo sintetizado que responde a velocidad y nitro. En carretera, la música baja al 8% y tiene control independiente de 0 a 30%; recupera su volumen al salir. El sonido se activa con un botón.
- **Voz en español:** respuestas habladas y comandos como «noche», «autonomía», «sensores» o «relajar».
- **Atmósfera:** humo de flujo suave, iluminación de estudio y recorrido por nueve capítulos.

La asistencia es una demo local con comandos predefinidos; no conecta con Claude ni con un servicio de IA. El reconocimiento de voz depende del navegador y requiere permiso de micrófono. Los botones funcionan sin micrófono. Las prestaciones, precios y sensores son ficticios.

## Desarrollo

```sh
npm ci
npm run dev
npx tsc --noEmit
npm run build
```

React 19 · TypeScript · Three.js · React Three Fiber · GSAP · Web Audio · Web Speech.

El modelo comprimido Draco/KTX2 y sus texturas se sirven desde este repositorio. Los decodificadores se cargan desde sus CDN originales. El render limita la densidad de píxeles, adapta partículas al dispositivo, comparte materiales y se suspende cuando la pestaña está oculta. Los postes de carretera utilizan instancias y el código 3D se entrega en un archivo independiente con caché.

## Créditos

Car Concept © 2024 Darmstadt Graphics Group GmbH, por Eric Chadwick — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). [Modelo original](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept). Se modificaron materiales, luces, cámaras y movimiento; los logotipos de Khronos y 3D Commerce no se muestran. Detalles en [CREDITS](public/models/CREDITS.md).

Imágenes de concepto incluidas en el proyecto original. Referencias y video: Pexels, acreditados en la web. Música ambiental original sintetizada para estos proyectos.
