export default function SensorPreview({ active }: { active: boolean }) {
  return <div data-motion-loop className="sensor-preview" data-active={active}>
    <div className="sensor-preview-heading"><span>Neural Path</span><span>{active ? 'Detección activa' : 'En espera'}</span></div>
    <svg viewBox="0 0 720 180" role="img" aria-label={active ? 'Demostración de fusión de sensores: siete vehículos y dos ciclistas' : 'Vista previa de sensores en espera'}>
      <path d="M0 38H720M0 142H720" stroke="#3b6878" fill="none" />
      <path className="sensor-lane" d="M0 72H720M0 108H720" stroke="#8dd6e3" strokeDasharray="16 22" opacity=".5" />
      <g fill="none" stroke="#5fe8ff" opacity=".3"><ellipse cx="132" cy="91" rx="90" ry="48" /><ellipse cx="132" cy="91" rx="190" ry="69" /><ellipse cx="132" cy="91" rx="290" ry="80" /></g>
      <rect x="107" y="79" width="50" height="24" rx="6" fill="#5fe8ff" />
      <path d="M120 80V102M146 80V102" stroke="#123745" />
      <g className="sensor-actors">
        {[[267,43],[354,115],[430,79],[526,43],[581,115],[655,79],[57,115]].map(([x,y], i) => <g key={i} className="sensor-actor" style={{animationDelay: `${i * 120}ms`}}><rect x={x} y={y} width="34" height="20" rx="4" fill="#223c48" stroke="#a5dbe5" /><path d={`M${x-4} ${y+10}H${x-13}`} stroke="#5fe8ff" /></g>)}
        <circle cx="378" cy="26" r="5" fill="#e4ab79" /><circle cx="614" cy="155" r="5" fill="#e4ab79" />
      </g>
      <rect className="sensor-scan" x="183" y="20" width="2" height="140" fill="#5fe8ff" opacity=".6" />
    </svg>
    <p>Visualización conceptual · 7 vehículos · 2 ciclistas · límites de carril</p>
  </div>;
}
