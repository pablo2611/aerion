# AERION

### The air, engineered.

Una experiencia de gran turismo eléctrico, diseñada para explorar un vehículo en 3D y verlo en carretera.

[**Abrir la experiencia →**](https://pablo2611.github.io/aerion/)

<a href="https://pablo2611.github.io/aerion/"><img src="docs/project-card.svg" alt="AERION — abrir la experiencia de conducción" width="380" /></a>

## Explora

- **Puertas articuladas:** apertura y cierre sobre las bisagras del modelo. Las llantas se detienen al abrirlas y las puertas se cierran al salir a carretera.
- **Cabina sin volante:** pantalla panorámica, consola integrada y luz ambiental. Usa **Entrar a cabina** en el concesionario o **Cabina IA** en carretera para viajar desde dentro. El piloto y los datos de las pantallas son una simulación local.
- **Calidad automática:** límite de píxeles y de fotogramas, reducción de calidad cuando baja el rendimiento y pausa del 3D y los vídeos cuando no se ven. Si falla WebGL, la página conserva sus contenidos y ofrece reintentar.
- **Carretera en movimiento:** cámara 360° con arrastre, scroll y teclado; ruedas animadas, velocidad gradual y pausa.
- **Nitro de concepto:** impulso de 4,5 segundos, toma automática de los dos escapes con llamas 3D y regreso a tu cámara anterior. Es un paquete deportivo ficticio de la simulación.
- **Tu color:** ocho pinturas, acabados, interiores y firmas luminosas en vivo.
- **Llantas intercambiables:** AeroBlade de cinco brazos, Turbine, Monolith perforada y Vector RS de radios dobles. Cambian la geometría real conservando el mismo diámetro, ancho y neumático.
- **Sonido:** dos modos que responden a velocidad y nitro: Carrera usa una grabación de motor y Eléctrico usa sonido digital. En carretera, la música baja al 8% y tiene control independiente de 0 a 30%; recupera su volumen al salir. El sonido se activa con un botón.
- **Asistente de cabina:** preguntas por voz o texto sobre velocidad, batería, autonomía, temperaturas, motor, llantas y recorrido. Comparte datos con la pantalla del coche y permite ajustar velocidad, faros, volumen y piloto. Prueba «¿cómo está el motor?», «¿cuánta batería queda?» o «pon la velocidad a 80». La música y el motor bajan mientras escuchas una respuesta o usas el micrófono.
- **Trasera integrada:** difusor continuo, salidas ovaladas empotradas, reflectores y placa AERION; las llamas salen de las nuevas boquillas.
- **Atmósfera:** humo con turbulencia y disipación, faros con iluminación sobre la carretera, pintura más limpia y recorrido por nueve capítulos con scroll nativo y progreso visible.

La asistencia interpreta consultas y comandos locales sobre la simulación; no está conectada a un modelo de IA generativa. El reconocimiento de voz depende del navegador y requiere permiso de micrófono; algunos navegadores procesan esa voz mediante su servicio en línea. La entrada escrita y los botones funcionan sin micrófono. Las prestaciones, precios y sensores son ficticios. El concepto es eléctrico y no utiliza gasolina.

## Controles de carretera

1. Pulsa **Ver en carretera** y **Activar motor**.
2. Arrastra para girar 360°, usa la rueda del mouse para acercar o las flechas del teclado para cambiar la vista.
3. Abre **Velocidad, sonido y color** para alternar **Carrera / Eléctrico**, ajustar velocidad y volumen, o bajar la música a cero.
4. Pulsa **NITRO** para ver los escapes con fuego y escuchar el impulso. Tras 4,5 segundos vuelve a tu vista; el botón se recarga durante dos segundos más.
5. **Pausar** detiene la conducción. **Volver a la web** o Escape sale del modo carretera.

Si no escuchas el motor, comprueba que la pestaña no esté silenciada y que el volumen del motor sea mayor que cero. La música se carga aparte para no bloquear el motor.

## Desarrollo

```sh
npm ci
npm run dev
npx tsc --noEmit
npm run test:cabin
npm run build
```

React 19 · TypeScript · Three.js · React Three Fiber · GSAP · Web Audio · Web Speech.

El modelo comprimido Draco/KTX2 y sus texturas se sirven desde este repositorio. Los decodificadores se cargan desde sus CDN originales. El render limita la densidad de píxeles, adapta partículas al dispositivo, comparte materiales y se suspende cuando la pestaña está oculta. Los postes de carretera utilizan instancias y el código 3D se entrega en un archivo independiente con caché.

## Créditos

Car Concept © 2024 Darmstadt Graphics Group GmbH, por Eric Chadwick — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). [Modelo original](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept). Se modificaron materiales, luces, cámaras y movimiento; los logotipos de Khronos y 3D Commerce no se muestran. Detalles en [CREDITS](public/models/CREDITS.md).

Imágenes de concepto incluidas en el proyecto original. Referencias y video: Pexels, acreditados en la web. Música ambiental original sintetizada para estos proyectos.

Motor grabado: [racing car engine sound loops](https://opengameart.org/content/racing-car-engine-sound-loops), por domasx2, CC0. Normalizado y adaptado para repetición continua y respuesta a velocidad. [Créditos del audio](public/audio/ENGINE-CREDITS.md).
