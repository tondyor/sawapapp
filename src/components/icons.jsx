import React from 'react';

export function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lg-logo" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B9BFF" />
          <stop offset="0.55" stopColor="#5F6DF6" />
          <stop offset="1" stopColor="#3D2ED6" />
        </linearGradient>
      </defs>
      <path
        d="M24 4C12.7 4 4 11.9 4 21.8c0 5.7 2.9 10.8 7.5 14.1-.3 2.6-1.3 5.4-3.4 7.4 3.9-.2 7.4-1.6 10-3.4 1.9.5 3.9.7 5.9.7 11.3 0 20-7.9 20-17.8S35.3 4 24 4z"
        fill="url(#lg-logo)"
      />
      <circle cx="16.5" cy="22" r="2.6" fill="#0A0D18" opacity="0.85" />
      <circle cx="24" cy="22" r="2.6" fill="#0A0D18" opacity="0.85" />
      <circle cx="31.5" cy="22" r="2.6" fill="#0A0D18" opacity="0.85" />
    </svg>
  );
}

function Emblem({ idp, c1, c2, children, size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${idp}-g`} x1="8" y1="6" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" fill={`url(#${idp}-g)`} opacity="0.16" />
      <circle cx="24" cy="24" r="21" stroke={`url(#${idp}-g)`} strokeOpacity="0.35" strokeWidth="1.4" />
      {children}
    </svg>
  );
}

export function AgentIcon({ agentId, color = '#7C8CF8', size = 44, idp = 'a' }) {
  const c = color;
  const c2 = '#FFFFFF';
  if (agentId === 'chat') {
    return (
      <Emblem idp={idp} c1={c} c2={c2} size={size}>
        <path
          d="M16 15.5h16a4.5 4.5 0 014.5 4.5v7a4.5 4.5 0 01-4.5 4.5h-6.2l-5.1 4.2a.8.8 0 01-1.3-.62V31.5H16A4.5 4.5 0 0111.5 27v-7a4.5 4.5 0 014.5-4.5z"
          fill={`url(#${idp}-g)`}
        />
        <circle cx="19.5" cy="23.5" r="1.7" fill="#0B0F1A" />
        <circle cx="24" cy="23.5" r="1.7" fill="#0B0F1A" />
        <circle cx="28.5" cy="23.5" r="1.7" fill="#0B0F1A" />
      </Emblem>
    );
  }
  if (agentId === 'lawyer') {
    return (
      <Emblem idp={idp} c1={c} c2={c2} size={size}>
        <path d="M24 10v26" stroke={`url(#${idp}-g)`} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M11 15h26" stroke={`url(#${idp}-g)`} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="24" cy="10" r="2.4" fill={`url(#${idp}-g)`} />
        <path d="M11 15l-4.4 9.2a4.8 4.8 0 008.8 0L11 15z" fill={`url(#${idp}-g)`} opacity="0.9" />
        <path d="M37 15l-4.4 9.2a4.8 4.8 0 008.8 0L37 15z" fill={`url(#${idp}-g)`} opacity="0.9" />
        <path d="M18.5 37.5h11" stroke={`url(#${idp}-g)`} strokeWidth="2.6" strokeLinecap="round" />
      </Emblem>
    );
  }
  if (agentId === 'marketer') {
    return (
      <Emblem idp={idp} c1={c} c2={c2} size={size}>
        <path d="M14 36V27" stroke={`url(#${idp}-g)`} strokeWidth="3.4" strokeLinecap="round" />
        <path d="M22 36v-13" stroke={`url(#${idp}-g)`} strokeWidth="3.4" strokeLinecap="round" />
        <path d="M30 36V18" stroke={`url(#${idp}-g)`} strokeWidth="3.4" strokeLinecap="round" />
        <path d="M12 20l8-6 6 4 10-9" stroke={`url(#${idp}-g)`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
        <path d="M31 9h5v5" stroke={`url(#${idp}-g)`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      </Emblem>
    );
  }
  if (agentId === 'designer') {
    return (
      <Emblem idp={idp} c1={c} c2={c2} size={size}>
        <path
          d="M24 9l12.5 9.8L24 39 11.5 18.8 24 9z"
          fill={`url(#${idp}-g)`}
          opacity="0.92"
        />
        <circle cx="24" cy="24" r="4.6" fill="#0B0F1A" opacity="0.9" />
        <path d="M24 19.4v9.2M19.4 24h9.2" stroke="#0B0F1A" strokeWidth="1.4" opacity="0.6" />
        <path d="M11.5 18.8L6 14m30.5 4.8L42 14" stroke={`url(#${idp}-g)`} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
      </Emblem>
    );
  }
  return (
    <Emblem idp={idp} c1={c} c2={c2} size={size}>
      <path
        d="M33.5 11.5c-7.5.6-13.6 4-16.6 9.3-2.2 4-2.5 8.6-1.2 13.2l-3.2 3.5 2.6 2.4 3.2-3.5c4.6.6 9.1-.4 12.6-3.2 4.6-3.7 6.6-9.9 6.3-17.9a3.4 3.4 0 00-3.7-3.8z"
        fill={`url(#${idp}-g)`}
        opacity="0.92"
      />
      <path d="M14.5 34.5c4-8 10-13.5 17-16.5" stroke="#0B0F1A" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
    </Emblem>
  );
}

export function IconSend({ color = 'currentColor', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.4 11.05L20.2 4.1c.8-.33 1.6.47 1.28 1.28l-6.96 16.8c-.35.85-1.6.78-1.86-.1l-2-6.87a1 1 0 00-.69-.69l-6.86-2c-.88-.26-.95-1.5-.11-1.86z" fill={color} />
    </svg>
  );
}

export function IconPlus({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconChevron({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STARS = Array.from({ length: 46 }, (_, i) => {
  const x = ((i * 137.508) % 100).toFixed(2);
  const y = ((i * 61.803) % 100).toFixed(2);
  const r = (0.5 + ((i * 7) % 10) / 12).toFixed(2);
  const o = (0.12 + ((i * 13) % 10) / 22).toFixed(2);
  return { x, y, r, o };
});

export function Background() {
  return (
    <svg className="bg-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="bg-orb1" cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#4D5BF5" stopOpacity="0.5" />
          <stop offset="1" stopColor="#4D5BF5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bg-orb2" cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#8A3FF0" stopOpacity="0.36" />
          <stop offset="1" stopColor="#8A3FF0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bg-orb3" cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#1E9E8A" stopOpacity="0.22" />
          <stop offset="1" stopColor="#1E9E8A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="#070A12" />
      <ellipse cx="18" cy="8" rx="42" ry="30" fill="url(#bg-orb1)" />
      <ellipse cx="92" cy="26" rx="40" ry="32" fill="url(#bg-orb2)" />
      <ellipse cx="70" cy="98" rx="46" ry="30" fill="url(#bg-orb3)" />
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.14} fill="#DDE4FF" opacity={s.o} />
      ))}
    </svg>
  );
}

export function TypingDots({ color = '#8B93FF' }) {
  return (
    <svg width="44" height="18" viewBox="0 0 44 18" fill="none" aria-hidden="true">
      <circle className="dot dot1" cx="8" cy="9" r="3.2" fill={color} />
      <circle className="dot dot2" cx="22" cy="9" r="3.2" fill={color} />
      <circle className="dot dot3" cx="36" cy="9" r="3.2" fill={color} />
    </svg>
  );
}
