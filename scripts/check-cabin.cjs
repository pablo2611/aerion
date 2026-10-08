const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript');
const wav=fs.readFileSync(require('node:path').join(__dirname,'../public/audio/engine-race.wav'));
let pcm;
for(let offset=12;offset+8<wav.length;){const size=wav.readUInt32LE(offset+4);if(wav.toString('ascii',offset,offset+4)==='data'){pcm=wav.subarray(offset+8,offset+8+size);break;}offset+=8+size+(size%2);}
assert.ok(pcm,'WAV contains audio data');
const seam=Math.abs(pcm.readInt16LE(0)-pcm.readInt16LE(pcm.length-2))/32768;
assert.ok(seam<.005,`Engine loop has an audible discontinuity: ${seam}`);
let peak=0;for(let i=0;i<pcm.length;i+=2)peak=Math.max(peak,Math.abs(pcm.readInt16LE(i))/32768);
assert.ok(peak<=.701,'Engine sample needs headroom');
console.log('PASS: engine loop boundary and recording headroom');
function moduleAt(file,imports={}){const exports={};const source=fs.readFileSync(require('node:path').join(__dirname,'../src/')+file,'utf8');new Function('require','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>imports[id],exports);return exports;}
const runtime={driving:true,speed:80,telemetry:{battery:84,motorTemp:32,batteryTemp:27,distanceKm:0,elapsedSeconds:0}};
const state={drivingPaused:false,autonomous:true,doorsOpen:false,headlightsOn:true,engineMode:'race',audioVolume:80};
const telemetry=moduleAt('telemetry.ts',{'./store':{runtime,useExperience:{getState:()=>state}}});
const {answerVehicle:ask}=moduleAt('vehicleAssistant.ts');
const {drivetrainAt,nextRoadSpeed}=moduleAt('drivetrain.ts');
let boosted=80;for(let i=0;i<140;i++)boosted=nextRoadSpeed(boosted,460,.05,true);
assert.equal(boosted,460);assert.equal(drivetrainAt(boosted).gear,7);
assert.ok(drivetrainAt(54).rpm>drivetrainAt(56).rpm,'Upshifting drops RPM');
let stopped=460;for(let i=0;i<140;i++)stopped=nextRoadSpeed(stopped,0,.05,false);assert.equal(stopped,0);
assert.deepEqual(ask('Pon la velocidad a 420',telemetry.readTelemetry()).command,{type:'speed',value:420});
let t=telemetry.readTelemetry();
assert.match(ask('¿A qué velocidad vamos y cuánta batería queda?',t).text,/80 kilómetros.*84 por ciento/);
assert.match(ask('¿Cómo va la gasolina?',t).text,/no utiliza gasolina/);
assert.match(ask('¿Y la temperatura?',t,'battery').text,/batería.*27 grados/);
assert.deepEqual(ask('Pon la velocidad a ciento veinte',t).command,{type:'speed',value:120});
assert.equal(ask('Pon la velocidad a 900',t).command,undefined);
assert.equal(ask('No pongas la velocidad a 120',t).command,undefined);
assert.equal(ask('¿Para qué sirven los sensores?',t).command,undefined);
assert.equal(ask('para',t).command.type,'pause');
assert.equal(ask('para el coche',t).command.type,'pause');
assert.equal(ask('continúa',t).command.type,'resume');
assert.equal(ask('Abre las puertas',t).command,undefined);
assert.equal(ask('Apaga los faros',t).command.value,false);
assert.equal(ask('Silencia el motor',t).command.value,0);
assert.match(ask('¿Cómo está el motor?',t).text,/32 grados/);
assert.equal(ask('Enciende las luces',t).command.value,true);
for(let i=0;i<3600;i++)telemetry.advanceTelemetry(1,80,false);
t=telemetry.readTelemetry();assert.equal(t.distanceKm,80);assert.ok(t.battery<84 && t.battery>65);assert.ok(t.motorTemp<70);assert.equal(t.minutes,60);
runtime.driving=false;assert.equal(telemetry.readTelemetry().speed,0);assert.equal(telemetry.readTelemetry().autonomous,false);
assert.equal(ask('Pon velocidad a 80',telemetry.readTelemetry()).command,undefined);
console.log('PASS: assistant commands, compound questions, context, negations, limits and shared telemetry');

const code=fs.readFileSync(require('node:path').join(__dirname,'../src/audio.ts'),'utf8').replace(/^import .*store.*;$/m,'const useExperience={setState(s){Object.assign(globalThis.audioState,s)}};').replace(/^import .*drivetrain.*;$/m,'const drivetrainAt=globalThis.driveAt;').replaceAll('import.meta.env.BASE_URL','"./"').replace('export const sonic','const sonic')+'\nglobalThis.engine=sonic;';
class Param{constructor(){this.value=0;}setTargetAtTime(v){this.value=v;}setValueAtTime(v){this.value=v;}exponentialRampToValueAtTime(v){this.value=v;}cancelScheduledValues(){}}
class Node{constructor(){for(const key of ['gain','frequency','detune','Q','threshold','ratio','playbackRate'])this[key]=new Param;}connect(){}disconnect(){}start(){}stop(){}}
class Context{constructor(){this.currentTime=0;this.sampleRate=44100;this.destination={};this.state='suspended';}createGain(){return new Node}createBiquadFilter(){return new Node}createOscillator(){return new Node}createDynamicsCompressor(){return new Node}createBuffer(c,n){return {getChannelData(){return new Float32Array(n)}}}createBufferSource(){return new Node}async decodeAudioData(){return {duration:.814}}async resume(){this.state='running'}async suspend(){this.state='suspended'}}
class Audio{constructor(){this.volume=1;this.paused=true;}async play(){this.paused=false;}pause(){this.paused=true;}}
class Utterance{constructor(text){this.text=text}}
let lastSpeech;
const c={window:{AudioContext:Context,setTimeout,speechSynthesis:{cancel(){},getVoices(){return[]},speak(u){lastSpeech=u}}},performance,driveAt:drivetrainAt,audioState:{},Audio,SpeechSynthesisUtterance:Utterance,clearTimeout,AbortSignal,document:{body:{appendChild(){}},addEventListener(){}},Math,Float32Array,fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(10)})};
vm.runInNewContext(ts.transpile(code,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}),c);
(async()=>{
 const e=c.engine;e.setDrivingMix(true);assert.equal(await e.toggle(),true);await e.engineLoad;assert.equal(e.ctx.state,'running');assert.ok(e.engineSource.loop);assert.ok(Math.abs(e.music.volume-.064)<1e-8);
 e.hum(1);const normal=e.engineSource.playbackRate.value;e.hum(1,true);assert.ok(e.engineSource.playbackRate.value>normal);assert.ok(e.engineGain.gain.value<.5);
 e.hum(0);assert.ok(e.engineGain.gain.value>.08,'Stopped car retains audible idle, including shift attenuation');assert.equal(e.windGain.gain.value,0);
 e.hum(460/180,true);assert.ok(e.engineGain.gain.value<=.46);assert.ok(e.engineSource.playbackRate.value<2.3);
 e.setEngineMode('electric');e.hum(.8);assert.ok(e.droneGain.gain.value>0);assert.equal(e.engineGain.gain.value,0);
 e.setEngineMode('race');assert.equal(e.droneGain.gain.value,0);
 e.voiceEnabled=true;let completed=0;e.speak('Estado del motor',()=>completed++);const first=lastSpeech;assert.ok(e.music.volume<.064);assert.ok(e.master.gain.value<.8);
 e.speak('Batería');const second=lastSpeech;first.onend();assert.ok(e.master.gain.value<.8);second.onend();second.onerror();assert.equal(completed,0);assert.equal(e.master.gain.value,.8);
 e.speak('Velocidad',()=>completed++);lastSpeech.onend();lastSpeech.onerror();assert.equal(completed,1);
 e.setListening(true);assert.equal(e.music.volume,0);assert.ok(e.master.gain.value<.04);e.setListening(false);assert.ok(Math.abs(e.music.volume-.064)<1e-8);
 e.setDriveMusic(0);e.speak('Nada de música');assert.equal(e.music.volume,0);e.cancelSpeech();assert.equal(e.music.volume,0);
 assert.equal(await e.toggle(),false);assert.equal(e.master.gain.value,0);e.music.play=async()=>{throw Error('blocked')};assert.equal(await e.toggle(),true);assert.equal(e.master.gain.value,.8);
 e.engineLoad=null;c.fetch=async()=>{throw Error('offline')};await e.loadEngine();assert.equal(e.engineMode,'electric');assert.match(c.audioState.audioError,/eléctrico/);await e.toggle();e.cancelSpeech();
 console.log('PASS: audio loading, bounded gains, stop, mode switching, speech interruption/ducking, microphone mix, mute and download fallback');
})().catch(err=>{console.error(err);process.exitCode=1});

