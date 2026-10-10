import { useMemo, useRef } from 'react';
import VoiceControls from './VoiceControls';
import AIEcosystem from '../components/AIEcosystem';
import { CHAPTERS } from '../data/content';
import { INTELLIGENCE_DEMOS } from '../data/intelligence';
import { SectionShell } from '../components/ui';
import { useAIDemo } from '../hooks/useAIDemo';
import { useCampaignMotion } from '../hooks/useCampaignMotion';
import { setVehicleView, useExperience } from '../store';

const STAGE_LABELS = { ready: 'Ready', listening: 'Listening', processing: 'Processing', responding: 'Responding' };

export default function Interior() {
  const root = useRef<HTMLDivElement>(null);
  useCampaignMotion(root);
  const aiAction = useExperience(state => state.aiAction);
  const aiStage = useExperience(state => state.aiStage);
  const config = useExperience(state => state.config);
  const runAI = useAIDemo();
  const active = useMemo(() => INTELLIGENCE_DEMOS.find(demo => demo.id === aiAction) ?? INTELLIGENCE_DEMOS[0], [aiAction]);
  const responded = aiStage === 'responding';

  return (
    <SectionShell id="interior" chapter="interior" height={CHAPTERS[4].height} flow>
      <div ref={root} className={`campaign-section ai-theme-${config.uiTheme}`}>
        <div className="campaign-heading" data-motion-enter>
          <div>
            <h2 className="font-display">TALK TO<br />THE DRIVE.</h2>
            <p>Local voice assistant · concept demo</p>
          </div>
          <AIEcosystem />
        </div>
        <div className="campaign-layout">
          <div className="campaign-story" data-motion-enter data-motion-order="1">
            <figure className="campaign-figure">
              <img
                src={`${import.meta.env.BASE_URL}images/aerion-cabin-1280.webp`}
                srcSet={`${import.meta.env.BASE_URL}images/aerion-cabin-640.webp 640w, ${import.meta.env.BASE_URL}images/aerion-cabin-1280.webp 1280w`}
                sizes="(min-width: 1600px) 880px, (min-width: 1000px) 58vw, 100vw"
                width={1280} height={720} loading="lazy" decoding="async"
                alt="A driver inside AERION ONE speaking with the integrated AERION intelligence"
              />
              <figcaption>Una cabina sin volante. La conversación forma parte del viaje.</figcaption>
            </figure>
            <div className="cabin-features">
              <div><span>Voz</span><p>Pregunta, escucha y ajusta la experiencia.</p></div>
              <div><span>Contexto</span><p>Autonomía y sensores de la simulación.</p></div>
              <div><span>Ambiente</span><p>Iluminación y perfiles de cabina a tu alcance.</p></div>
            </div>
          </div>
          <div className="campaign-controls" data-motion-enter data-motion-order="2">
            <VoiceControls />
            <button className="campaign-cabin-link" onClick={() => { useExperience.getState().setExplore(true); setVehicleView('interior'); }}>
              Entrar a la cabina 3D · sin volante <span aria-hidden="true">↗</span>
            </button>
            <div className="campaign-commands" role="group" aria-label="Comandos de AERION">
              {INTELLIGENCE_DEMOS.map(demo => <button key={demo.id} onClick={() => runAI(demo.id)} aria-pressed={aiAction === demo.id}>{demo.short}</button>)}
            </div>
            <div className="campaign-hmi" data-stage={aiStage}>
              <div className="campaign-hmi-status">
                <span><i className={`ai-status-dot ai-status-${aiStage}`} aria-hidden="true" />{STAGE_LABELS[aiStage]}</span>
                <span>AERION / CABIN</span>
              </div>
              <div data-motion-loop className={`ai-waveform campaign-waveform ${aiStage === 'listening' || aiStage === 'responding' ? 'is-listening' : ''}`} aria-hidden="true">
                {Array.from({ length: 28 }, (_, i) => <span key={i} style={{ animationDelay: `${i * 42}ms`, height: `${18 + ((i * 13) % 70)}%` }} />)}
              </div>
              <p className="campaign-prompt font-display">“{active.prompt}”</p>
              <div className="campaign-response" data-ready={responded} aria-hidden={!responded}><div><p>{active.response}</p></div></div>
              <dl className="campaign-telemetry">
                {active.telemetry.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{responded ? item.value : '—'}</dd></div>)}
              </dl>
              {responded && <p className="campaign-effect">{active.effect}</p>}
            </div>
            <p className="campaign-note">Comandos y datos de una experiencia simulada. Puedes probarlos con los botones o con tu voz.</p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
