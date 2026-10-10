const assistants = [
  { name: 'Claude', icon: 'claude-color', url: 'https://claude.ai/' },
  { name: 'Codex', icon: 'codex-color', url: 'https://chatgpt.com/codex' },
  { name: 'ChatGPT', icon: 'openai', url: 'https://chatgpt.com/' },
  { name: 'Gemini', icon: 'gemini-color', url: 'https://gemini.google.com/' },
];

export default function AIEcosystem() {
  return <div className="ai-ecosystem">
    <p>Explora el ecosistema IA</p>
    <nav aria-label="Herramientas de inteligencia artificial">
      {assistants.map(ai => <a key={ai.name} href={ai.url} target="_blank" rel="noreferrer">
        <img src={`${import.meta.env.BASE_URL}icons/${ai.icon}.svg`} alt="" width="22" height="22" />
        <span>{ai.name}</span>
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4 12 12 4M5 4h7v7" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      </a>)}
    </nav>
    <small>Accesos a sus plataformas. El asistente del coche funciona con la simulación AERION.</small>
  </div>;
}
