import { useRef } from 'react';
import { CHAPTERS } from '../data/content';
import { INTELLIGENCE_DEMOS } from '../data/intelligence';
import { SectionShell } from '../components/ui';
import SensorPreview from '../components/SensorPreview';
import { useAIDemo } from '../hooks/useAIDemo';
import { useCampaignMotion } from '../hooks/useCampaignMotion';
import { useExperience } from '../store';

export default function Intelligence() {
  const root = useRef<HTMLDivElement>(null);
  useCampaignMotion(root);
  const runAI = useAIDemo();
  const action = useExperience(state => state.aiAction);
  const stage = useExperience(state => state.aiStage);
  const demo = INTELLIGENCE_DEMOS.find(item => item.id === 'autonomous')!;
  const active = action === 'autonomous';
  const ready = active && stage === 'responding';

  return (
    <SectionShell id="intelligence" chapter="intelligence" height={CHAPTERS[5].height} flow>
      <div ref={root} className="campaign-section campaign-vision">
        <div className="campaign-heading" data-motion-enter>
          <div><h2 className="font-display">WHAT THE<br />CAR SEES.</h2><p>Halomind · Neural Path</p></div>
          <p className="campaign-intro">The driver remains responsible. Halomind fuses cameras, radar and LiDAR, then AERION explains that model in direct language.</p>
        </div>
        <div className="campaign-layout">
          <div className="campaign-story" data-motion-enter data-motion-order="1">
            <figure className="campaign-figure">
              <img
                src={`${import.meta.env.BASE_URL}images/aerion-road-ai-1280.webp`}
                srcSet={`${import.meta.env.BASE_URL}images/aerion-road-ai-640.webp 640w, ${import.meta.env.BASE_URL}images/aerion-road-ai-1280.webp 1280w`}
                sizes="(min-width: 1600px) 880px, (min-width: 1000px) 58vw, 100vw"
                width={1280} height={720} decoding="async" loading="lazy"
                alt="Over the shoulder view of the AERION ONE driver and cockpit with autonomous assistance active"
              />
              <figcaption>Carretera, cabina y entorno. Un encuadre completo de la experiencia.</figcaption>
            </figure>
            <SensorPreview active={ready} />
          </div>
          <div className="campaign-controls" data-motion-enter data-motion-order="2">
            <button onClick={() => runAI('autonomous')} className="campaign-sensor-button" aria-pressed={ready}>
              {active && stage === 'listening' ? 'LISTENING…' : active && stage === 'processing' ? 'FUSING SENSOR DATA…' : ready ? '✓ SENSOR VIEW ACTIVE' : 'ASK AERION WHAT IT SEES'}
            </button>
            <div className="campaign-hmi" data-stage={active ? stage : 'ready'}>
              <div className="campaign-hmi-status"><span><i className="ai-status-dot" aria-hidden="true" />AERION INTELLIGENCE</span><span>{active ? stage.toUpperCase() : 'READY'}</span></div>
              <p className="campaign-prompt font-display">“{demo.prompt}”</p>
              <div className="campaign-response" data-ready={ready} aria-hidden={!ready}><div><p>{demo.response}</p></div></div>
              <dl className="campaign-telemetry">
                {demo.telemetry.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{ready ? item.value : '—'}</dd></div>)}
              </dl>
            </div>
            <div className="campaign-system-facts"><p>Assistance <strong>L2+</strong></p><p>Driver <strong>Attentive</strong></p><p>Fusion <strong>30 Hz</strong></p></div>
            <p className="campaign-note">Concept demonstration · driver attention required · capability and availability subject to regulatory approval.</p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
