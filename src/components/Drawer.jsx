import React from 'react';
import { AgentIcon } from './icons.jsx';
import { haptic } from '../lib/tg.js';

const ACCENTS = { chat: '#7C8CF8', lawyer: '#C9A227', marketer: '#34D399', designer: '#F472B6', copywriter: '#38BDF8' };

function accentFor(agentId) {
  return ACCENTS[agentId] ?? '#7C8CF8';
}

function formatTime(ms) {
  if (!ms) return '—';
  const d = new Date(ms);
  const now = new Date();
  const sameDay = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return sameDay ? `${hh}:${mm}` : `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Drawer({ open, conversations, currentId, onOpen, onDelete, onFork, onNewChat, onClose }) {
  if (!open) return null;
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="drawer-title">Мои чаты</div>
          <button className="drawer-new" onClick={() => { haptic(); onNewChat(); }}>+ Новый</button>
        </div>
        <div className="drawer-list">
          {conversations.length === 0 && (
            <div className="drawer-empty">Пока нет диалогов</div>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              className={'conv-item' + (c.id === currentId ? ' active' : '')}
              onClick={() => { haptic(); onOpen(c.id); }}
            >
              <div className="conv-avatar">
                <AgentIcon agentId={c.agentId ?? 'chat'} color={accentFor(c.agentId)} size={34} idp={`d-${c.id}`} />
              </div>
              <div className="conv-body">
                <div className="conv-top">
                  <span className="conv-title">{c.title ?? 'Без названия'}</span>
                  <span className="conv-time">{formatTime(c.updatedAt)}</span>
                </div>
                <div className="conv-preview">{c.previewRole === 'user' ? 'Вы: ' : ''}{c.preview ?? '—'}</div>
              </div>
              <div className="conv-actions">
                <button
                  className="conv-act"
                  title="Продолжить в новом чате"
                  onClick={(e) => { e.stopPropagation(); haptic(); onFork(c.id); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="9" y="9" width="12" height="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 15V5a2 2 0 012-2h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  className="conv-act danger"
                  title="Удалить"
                  onClick={(e) => { e.stopPropagation(); haptic(); onDelete(c.id); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </button>
          ))}
        </div>
        <button className="drawer-close" onClick={onClose}>Закрыть</button>
      </div>
    </div>
  );
}
