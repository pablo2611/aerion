import { readTelemetry } from "./telemetry";

export type VehicleCommand =
  | { type: "speed"; value: number }
  | { type: "pause" | "resume" | "night" | "relax" }
  | { type: "lights" | "doors"; value: boolean }
  | { type: "volume"; value: number }
  | { type: "sound"; value: "electric" | "race" };
export type VehicleAnswer = { text: string; topic: string; command?: VehicleCommand };
type Telemetry = ReturnType<typeof readTelemetry>;
const normalize = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const spokenNumbers: Record<string, number> = { veinte:20, treinta:30, cuarenta:40, cincuenta:50, sesenta:60, setenta:70, ochenta:80, noventa:90, cien:100, ciento:100 };

function getNumber(text: string): number | undefined {
  const numeric = text.match(/-?\d+(?:[.,]\d+)?/);
  if (numeric) return Number(numeric[0].replace(",", "."));
  const words = text.split(/\s+/);
  const values = words.filter(word => spokenNumbers[word] !== undefined).map(word => spokenNumbers[word]);
  return values.length ? values.reduce((sum,value) => sum+value, 0) : undefined;
}

/** Local language rules, deliberately grounded in the same simulated telemetry as the dash. */
export function answerVehicle(question: string, t: Telemetry, previousTopic = ""): VehicleAnswer {
  const q = normalize(question);
  const n = getNumber(q);
  const off = /apaga|apagar|desactiva|desactivar|silencia|cerrar|cierra/.test(q);
  const action = /pon(?:me|lo)?|poner|ajusta|ajustar|sube|subir|baja|bajar|acelera|acelerar|cambia|cambiar|activa|activar|enciende|encender|apaga|apagar|desactiva|silencia|abre|abrir|cierra|cerrar|deten|detener|pausa|pausar|frena|frenar|continua|continuar|reanuda|reanudar|vamos a/.test(q);
  const answer = (text: string, topic: string, command?: VehicleCommand): VehicleAnswer => ({ text, topic, command });

  if (/\bno\s+(?:me\s+)?(?:lo\s+)?(?:pong|pon|ajust|sub|baj|aceler|cambi|activ|enciend|apag|desactiv|silenci|abr|cierr|deteng|deten|par|fren|continu|reanud)/.test(q)) return answer("Mantengo los ajustes actuales. Dime qué dato del coche quieres consultar.", previousTopic);

  if (action && /velocidad|km|kilometros|acelera|vamos a/.test(q) && n !== undefined) {
    if (!t.driving) return answer("Abre Ver en carretera para ajustar la velocidad del coche.", "speed");
    if (n < 20 || n > 180) return answer("La velocidad de crucero de esta experiencia admite entre 20 y 180 km/h. Puedes pedirme que pare para detenernos.", "speed");
    return answer(`Ajusto la velocidad a ${Math.round(n)} kilómetros por hora.`, "speed", {type:"speed", value:Math.round(n)});
  }
  if (action && /volumen|sonido|musica/.test(q) && n !== undefined) {
    const value = Math.min(100,Math.max(0,Math.round(n)));
    return answer(`Volumen al ${value} por ciento.`, "sound", {type:"volume",value});
  }
  if (/silencia|silenciar/.test(q) && /motor|audio|sonido/.test(q)) return answer("Sonido del coche silenciado.", "sound", {type:"volume",value:0});
  if (action && /electrico|carrera|deportivo/.test(q) && /sonido|motor|modo/.test(q)) {
    const value = /electrico/.test(q) ? "electric" : "race";
    return answer(`Sonido ${value === "electric" ? "eléctrico" : "de carrera"} seleccionado. La propulsión del concepto sigue siendo eléctrica.`, "sound", {type:"sound",value});
  }
  if (action && /faros|luces/.test(q)) return answer(off ? "Faros apagados." : "Faros encendidos.", "lights", {type:"lights",value:!off});
  if (action && /puertas/.test(q)) {
    if (!off && t.driving) return answer("Las puertas se abren en el concesionario. Sal de carretera y pulsa Abrir puertas.", "doors");
    return answer(off ? "Cierro las puertas." : "Abro las puertas.", "doors", {type:"doors",value:!off});
  }
  if (/^(?:por favor[, ]+)?(?:para(?:te)?(?:\s+(?:el coche|el carro|ahora|por favor))?[.!]?$|(?:deten|detener|pausa|pausar|frena|frenar)\b)/.test(q) || (off && /piloto/.test(q))) {
    return answer("Detengo el coche de forma gradual y pongo el piloto en espera.", "drive", {type:"pause"});
  }
  if (/continua|continuar|reanuda|reanudar/.test(q) || (action && !off && /piloto|conduccion autonoma/.test(q))) {
    if (!t.driving) return answer("Abre Ver en carretera para iniciar el recorrido.", "drive");
    return answer("Reanudo el recorrido con el piloto de la simulación.", "drive", {type:"resume"});
  }
  if (action && /noche|nocturno/.test(q)) return answer("Iluminación nocturna preparada: faros encendidos y luz ambiental suave.", "lights", {type:"night"});
  if (/relaja|relajar|calma|tranquil/.test(q)) return answer("He seleccionado una luz cálida para la cabina.", "cabin", {type:"relax"});

  const parts: string[] = [];
  let topic = previousTopic;
  if (/velocidad|rapido|a cuanto|cuanto vamos/.test(q)) { parts.push(`Vamos a ${t.speed} kilómetros por hora${t.paused ? "; estamos deteniéndonos o en pausa" : ""}.`); topic="speed"; }
  if (/gasolina|combustible|diesel|tanque/.test(q)) { parts.push(`AERION es eléctrico: no utiliza gasolina. La batería está al ${t.battery} por ciento y la autonomía estimada es de ${t.rangeKm} kilómetros.`); topic="battery"; }
  else if (/bateria|carga|energia|autonomia|rango|cuanto queda/.test(q) && !/temperatura/.test(q)) { parts.push(`Batería al ${t.battery} por ciento. Autonomía estimada: ${t.rangeKm} kilómetros, calculada según el consumo actual.${t.batteryLow ? " El nivel de batería es bajo." : ""}`); topic="battery"; }
  if (/motor|propulsion|mecanica/.test(q) && !/sonido/.test(q)) { parts.push(`Motor ${t.motorStatus}, a ${t.motorTemp} grados. Potencia estimada: ${t.powerKw} kilovatios; régimen simulado: ${t.rpm} revoluciones por minuto.`); topic="motor"; }
  else if (/temperatura|caliente|calor/.test(q)) {
    const battery = /bateria/.test(q) || previousTopic === "battery";
    parts.push(`${battery ? "La batería" : "El motor"} está a ${battery ? t.batteryTemp : t.motorTemp} grados.`); topic=battery?"battery":"motor";
  }
  if (/consumo|eficiencia/.test(q)) { parts.push(`El consumo estimado es de ${t.consumption} kilovatios hora cada cien kilómetros.`); topic="consumption"; }
  if (/ruedas|neumaticos|llantas|presion/.test(q)) { parts.push(`La presión simulada de las llantas es de ${t.tireBar} bares. Los cuatro neumáticos comparten el mismo modelo térmico.`); topic="tires"; }
  if (/distancia|recorrido|cuanto llevamos/.test(q)) { parts.push(`Hemos recorrido ${t.distanceKm.toFixed(2)} kilómetros durante esta sesión, en ${t.minutes} minutos.`); topic="trip"; }
  if (/ruta|destino|llegamos|navegacion/.test(q)) { parts.push("Estamos en un circuito costero virtual sin destino final. El mapa y los objetos detectados son ilustrativos; no hay navegación GPS real."); topic="route"; }
  if (/puertas/.test(q)) { parts.push(`Las puertas están ${t.doors}.`); topic="doors"; }
  if (/faros|luces/.test(q)) { parts.push(`Los faros están ${t.lights ? "encendidos" : "apagados"}.`); topic="lights"; }
  if (/piloto|autonomo|quien conduce|quien maneja|sensores/.test(q)) { parts.push(t.autonomous ? "El piloto de la simulación está activo. Mantiene el recorrido y la velocidad seleccionada." : "El piloto está en espera. Puedes pedirme que continúe cuando estés en carretera."); topic="drive"; }
  if (/sonido|audio|volumen/.test(q)) { parts.push(`Sonido ${t.soundMode === "race" ? "de carrera" : "eléctrico"}, volumen al ${t.volume} por ciento. Puedes cambiar el modo o el volumen por voz.`); topic="sound"; }
  if (/cargar|recargar|cargador/.test(q)) { parts.push("Esta demo no tiene estaciones de carga conectadas. La batería se reinicia al recargar la página."); topic="battery"; }
  if (parts.length) return answer(parts.slice(0,3).join(" "),topic);
  if (/estado|resumen|diagnostico|como va|todo bien/.test(q)) return answer(`Vamos a ${t.speed} kilómetros por hora. Batería al ${t.battery} por ciento; motor ${t.motorStatus}, a ${t.motorTemp} grados. Puertas ${t.doors}. Todos estos datos pertenecen a la simulación.`,"status");
  if (/hola|buenas|buenos/.test(q)) return answer("Hola, soy el asistente de AERION. Puedo consultar el coche y ajustar velocidad, faros, sonido o piloto. ¿Qué quieres saber?","help");
  if (/gracias/.test(q)) return answer("De nada. Puedes seguir preguntándome por el coche.",previousTopic);
  return answer("Puedo consultar velocidad, batería, autonomía, motor, temperatura, consumo, llantas, recorrido, puertas y faros. También puedes decir «pon la velocidad a 80», «para», «continúa» o «baja el volumen a 30». Trabajo con los datos de esta simulación; no respondo preguntas generales fuera del vehículo.","help");
}
