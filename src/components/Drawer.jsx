import { AgentIcon } from './icons.jsx';
import { haptic } from '../lib/tg.js';

export default function Drawer({ open, conversations, currentId, onOpen, onDelete, onFork, onNewChat, onClose }) {
  if (!open) return null;
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6l-6 6M6 6l6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="drawer-title">Мои чаты</div>
          <button className="primary" onClick={() => { haptic(); onNewChat(); }}>+ Новый чат</button>
        </div>
        <div className="drawer-list">
          {conversations.length === 0 ? (
            <div className="drawer-empty">Пока нет диалогов. Напишите первому агенту.</div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                className={'conv-item' + (c.id === currentId ? ' active' : '')}
                style={{ '--accent': c.agentId ? accentFor(c.agentId) : '#7C8CF8' }}
                onClick={() => { haptic(); onOpen(c.id); }}
              >
                <div className="conv-left">
                  <div className="conv-avatar"><AgentIcon agentId={c.agentId ?? 'chat'} color={accentFor(c.agentId)} size={36} idp={`drawer-${c.id}`} /></div>
                  <div className="conv-body">
                    <div className="conv-title">{c.title}</div>
                    <div className="conv-preview">{c.previewRole === 'user' ? 'Вы: ' : ''}{c.preview ?? '—'}</div>
                  </div>
                  <div className="conv-time">{formatTime(c.updatedAt)}</div>
                </div>
                <div className="conv-actions">
                  <button className="icon-btn" onClick={(e) => { e.stopPropagation(); haptic(); onFork(c.id); }} title="Продолжить в новом чате">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M13 2l6 6M7 22l-6-6M13 22l6-6M7 2l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                    </svg>
                  </button>
                  <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); haptic(); onDelete(c.id); }} title="Удалить">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M10 11l6 6M16 11l-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                    </svg>
                  </button>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function accentFor(agentId) {
  const map = { chat: '#7C8CF8', lawyer: '#C9A227', marketer: '#34D399', designer: '#F472B6', copywriter: '#38BDF8' };
  return map[agentId] ?? '#7C8CF8';
}

function formatTime(ms) {
  if (!ms) return '—';
  const d = new Date(ms);
  const now = new Date();
  const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return isToday ? `${hh}:${mm}` : `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}`;
}
