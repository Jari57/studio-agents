import React, { lazy, Suspense, useState } from 'react';
import { ArrowRight, ChevronDown, FileText, FolderOpen, Headphones, Layers, Music2, Radio, SlidersHorizontal, Sparkles } from 'lucide-react';
import './StudioHomeIntro.css';

const HeroProductDemo = lazy(() => import('./HeroProductDemo'));
const SingleAgentDemo = lazy(() => import('./SingleAgentDemo'));
const MultiAgentDemo = lazy(() => import('./MultiAgentDemo'));

const PATHS = [
  { tab: 'orchestrator', icon: Sparkles, number: '01', title: 'Build from an idea', text: 'Choose the lyrics, sound, artwork or video you want to create. Review each result as you go.', action: 'Open AI Orchestrator', tone: 'peach' },
  { tab: 'project_canvas', icon: SlidersHorizontal, number: '02', title: 'Bring your own sound', text: 'Organize uploads and generations in a project. Arrange audio, shape a mix and export a version.', action: 'Open project canvas', tone: 'lilac' },
  { tab: 'agents', icon: Layers, number: '03', title: 'Find your specialist', text: 'Need one thing, not a full production? Choose an agent for a focused creative task.', action: 'Browse agents', tone: 'mint' },
];

// Keep previews opt-in: opening this disclosure is the only point at which
// the animated demo components mount and their timers/network work can start.
function StudioPreview({ onStart }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState('workflow');
  return (
    <details className="studio-home-disclosure" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>
        <span><span className="studio-home-eyebrow">A closer look</span><strong>Explore the workflow &amp; agent demos</strong></span>
        <ChevronDown size={20} aria-hidden="true" />
      </summary>
      {open ? (
        <div className="studio-home-disclosure-body studio-home-preview">
          <p className="studio-home-note">Illustrative demos, not a live generation or a guarantee of output. Your results and generation time depend on the prompt and provider.</p>
          <div className="studio-home-preview-tabs" aria-label="Choose a demo">
            {[
              ['workflow', 'Workflow walkthrough'], ['single', 'Try an Agent'], ['team', 'Multi-agent demo'],
            ].map(([value, label]) => (
              <button key={value} type="button" aria-pressed={preview === value} onClick={() => setPreview(value)}>{label}</button>
            ))}
          </div>
          <Suspense fallback={<p role="status">Loading the selected demo…</p>}>
            {preview === 'workflow' ? <HeroProductDemo onTryIt={onStart} /> : preview === 'single' ? <SingleAgentDemo /> : <MultiAgentDemo />}
          </Suspense>
        </div>
      ) : null}
    </details>
  );
}

function AgentCard({ agent, onAgent, onWhitepaper }) {
  return (
    <article className="studio-home-agent">
      <span className="studio-home-agent-category">{agent.category}</span>
      <h3>{agent.name}</h3>
      <p>{agent.description || agent.capabilities?.[0] || 'Explore this creative specialist and its workflow.'}</p>
      <div className="studio-home-agent-actions">
        <button type="button" onClick={() => onAgent(agent.id)} aria-label={`Open ${agent.name}`}>Open agent <ArrowRight size={15} aria-hidden="true" /></button>
        <button type="button" onClick={() => onWhitepaper(agent)} aria-label={`Read ${agent.name} whitepaper`}><FileText size={14} aria-hidden="true" /> Whitepaper</button>
      </div>
    </article>
  );
}

export default function StudioHomeIntro({ isLoggedMember, agents, onNavigate, onAgent, onWhitepaper, onTour }) {
  return (
    <div className="studio-home-intro">
      <section className="studio-home-hero" aria-labelledby="studio-home-title">
        <div className="studio-home-hero-copy">
          <p className="studio-home-eyebrow"><span aria-hidden="true" /> Independent by design</p>
          <h1 id="studio-home-title">Your sound.<br />Your vision.<br /><em>Your studio.</em></h1>
          <p className="studio-home-lead">A creative workspace for the ideas only you could have. Make music, develop visuals and bring your next project together—with AI in your corner.</p>
          <div className="studio-home-hero-actions">
            <button type="button" className="studio-home-primary" onClick={() => onNavigate('project_canvas')}>
              {isLoggedMember ? 'Open your studio' : 'Get started'} <ArrowRight size={19} aria-hidden="true" />
            </button>
            <button type="button" className="studio-home-text-button" onClick={onTour}>Take a tour <ChevronDown size={16} aria-hidden="true" /></button>
          </div>
          <p className="studio-home-note">Start with one idea. Keep your own direction. Review before you release.</p>
        </div>

        <div className="studio-home-artboard" role="img" aria-label="Creative workflow illustration: start with an idea, layer your sound, then shape your visual identity. This is an illustration, not a generated project.">
          <div className="studio-home-artboard-heading"><span>THE CREATIVE PROCESS</span><span>VOL. 01</span></div>
          <div className="studio-home-record" aria-hidden="true"><span><Music2 size={34} /></span></div>
          <div className="studio-home-sound-label" aria-hidden="true">MAKE IT<br /><em>your own.</em></div>
          <div className="studio-home-track-strip" aria-hidden="true"><Headphones size={17} /><span>IDEA</span><i /><span>SOUND</span><i /><span>IDENTITY</span></div>
          <p>Less blank canvas.<br /><strong>More creative momentum.</strong></p>
          <span className="studio-home-artboard-stamp" aria-hidden="true">ARTIST<br />LED</span>
        </div>
      </section>

      <section className="studio-home-paths" id="studio-home-start" aria-labelledby="studio-home-paths-title">
        <div className="studio-home-section-heading">
          <div><p className="studio-home-eyebrow">Jump Into the Studio</p><h2 id="studio-home-paths-title">Where do you want to start?</h2></div>
          <p>Three ways in. One place to build.</p>
        </div>
        <div className="studio-home-path-grid">
          {PATHS.map(({ tab, icon: Icon, number, title, text, action, tone }) => (
            <button key={tab} type="button" className={`studio-home-path studio-home-path--${tone}`} onClick={() => onNavigate(tab)}>
              <span className="studio-home-path-top"><Icon size={23} aria-hidden="true" /><span>{number}</span></span>
              <strong>{title}</strong><span className="studio-home-path-description">{text}</span>
              <span className="studio-home-path-action">{action}<ArrowRight size={17} aria-hidden="true" /></span>
            </button>
          ))}
        </div>
        <nav className="studio-home-quicklinks" aria-label="More studio destinations">
          <button type="button" onClick={() => onNavigate('hub')}><FolderOpen size={17} aria-hidden="true" /> Your projects</button>
          <button type="button" onClick={() => onNavigate('resources')}><FileText size={17} aria-hidden="true" /> Resources</button>
          <button type="button" onClick={() => onNavigate('news')}><Radio size={17} aria-hidden="true" /> News &amp; Entertainment</button>
          <button type="button" onClick={() => document.getElementById('studio-home-pricing')?.scrollIntoView({ block: 'start' })}>Pricing <ArrowRight size={16} aria-hidden="true" /></button>
        </nav>
      </section>

      <section className="studio-home-agent-section" id="studio-home-agents" aria-labelledby="studio-home-agents-title">
        <div className="studio-home-section-heading">
          <div><p className="studio-home-eyebrow">Your creative toolkit</p><h2 id="studio-home-agents-title">Meet the Agents</h2></div>
          <p>Start with the core tools. Explore the specialists when you need them.</p>
        </div>
        <div className="studio-home-agent-grid">
          {agents.slice(0, 4).map((agent) => <AgentCard key={agent.id} agent={agent} onAgent={onAgent} onWhitepaper={onWhitepaper} />)}
        </div>
        <details className="studio-home-disclosure studio-home-specialists">
          <summary><span><strong>Explore all {agents.length} agents</strong><span className="studio-home-note">Vocals, instruments, engineering, visuals &amp; release planning</span></span><ChevronDown size={20} aria-hidden="true" /></summary>
          <div className="studio-home-agent-grid studio-home-disclosure-body">
            {agents.slice(4).map((agent) => <AgentCard key={agent.id} agent={agent} onAgent={onAgent} onWhitepaper={onWhitepaper} />)}
          </div>
        </details>
      </section>

      <section className="studio-home-explore" aria-label="Explore Studio Agents">
        <StudioPreview onStart={() => onNavigate('orchestrator')} />
        <details className="studio-home-disclosure">
          <summary><span><span className="studio-home-eyebrow">The story / Mission &amp; Vision</span><strong>Built for the independent creative</strong></span><ChevronDown size={20} aria-hidden="true" /></summary>
          <div className="studio-home-disclosure-body studio-home-story">
            <div><h3>The idea</h3><p>Independent artists need more time making things and less time wrestling with a blank page. Studio Agents brings creative starting points and production tools into one workspace.</p></div>
            <div><h3>The approach</h3><p>Generate, listen, adjust and save. Bring your own lyrics, recordings and direction. AI is part of the process—not a replacement for your judgment or a promise of a finished hit.</p></div>
            <div><h3>Your next chapter</h3><p>From a first draft to a project you can refine in your DAW, keep the work connected. Explore resources, release planning and the Whip Montez archive further down the page.</p></div>
          </div>
        </details>
      </section>
    </div>
  );
}
