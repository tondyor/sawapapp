import React from 'react';
import { AgentIcon } from './icons.jsx';
import { haptic } from '../lib/tg.js';

export default function AgentSheet({ open, agents, currentId, onSelect, onClose }) {
  if (!open) return null;
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">Выбери агента</div>
        <div className="sheet-sub">У каждого — своя специальность и характер</div>
        <div className="agent-list">
          {agents.map((a) => {
            const soon = a.active === false;
            return (
              <button
                key={a.id}
                className={'agent-card' + (a.id === currentId ? ' selected' : '') + (soon ? ' soon' : '')}
                style={{ '--accent': a.color }}
                aria-disabled={soon || undefined}
                onClick={() => { if (soon) return; haptic(); onSelect(a); }}
              >
                <div className="agent-card-icon">
                  <AgentIcon agentId={a.id} color={a.color} size={44} idp={`sheet-${a.id}`} />
                </div>
                <div className="agent-card-body">
                  <div className="agent-card-name">
                    {a.name}
                    {soon && <span className="agent-card-soon">скоро</span>}
                    {a.id === currentId && <span className="agent-card-badge">активен</span>}
                  </div>
                  <div className="agent-card-desc">{a.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
