import React from 'react';
import type { GoogleApp } from '@/types';

export const GOOGLE_APPS: GoogleApp[] = [
  { id: 'gmail',       label: 'Gmail',       url: 'https://mail.google.com/',              bg: '#EA4335', type: 'solid' },
  { id: 'calendar',    label: 'Calendar',    url: 'https://calendar.google.com/',          bg: '#1A73E8', type: 'solid' },
  { id: 'drive',       label: 'Drive',       url: 'https://drive.google.com/',             bg: '#2196F3', type: 'solid' },
  { id: 'docs',        label: 'Docs',        url: 'https://docs.google.com/',              bg: '#4285F4', type: 'solid' },
  { id: 'sheets',      label: 'Sheets',      url: 'https://sheets.google.com/',            bg: '#0F9D58', type: 'solid' },
  { id: 'slides',      label: 'Slides',      url: 'https://slides.google.com/',            bg: '#F4B400', type: 'solid' },
  { id: 'meet',        label: 'Meet',        url: 'https://meet.google.com/',              bg: '#00897B', type: 'solid' },
  { id: 'keep',        label: 'Keep',        url: 'https://keep.google.com/',              bg: '#FBBC04', type: 'solid' },
  { id: 'ai-search',   label: 'AI Search',   url: 'https://www.google.com/search?udm=50', bg: null,      type: 'google' },
  { id: 'gemini',      label: 'Gemini',      url: 'https://gemini.google.com/',            bg: null,      type: 'gemini' },
  { id: 'notebooklm',  label: 'NotebookLM',  url: 'https://notebooklm.google.com/',       bg: '#5F6368', type: 'solid' },
  { id: 'youtube',     label: 'YouTube',     url: 'https://www.youtube.com/',              bg: '#FF0000', type: 'solid' },
];

export const ALL_APP_IDS = GOOGLE_APPS.map(a => a.id);

const SOLID_ICONS: Record<string, React.ReactElement> = {
  gmail:      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>,
  calendar:   <path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.89 3 3.01 3.9 3.01 5L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>,
  drive:      <path d="M7.71 3.5L1.15 15l3.43 6 6.56-11.5zm.57 1L14.41 15H7.57l-3.42-6zM16.5 3.5h-6l6 10.5H23zm-.54 1.07L21.79 14.5H17l-3-5.25zM1.15 15L4.58 21h14.84l3.43-6z"/>,
  docs:       <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-5 9v-2h8v2H8zm0-4v-2h8v2H8zm0-4V8h3v2H8z"/>,
  sheets:     <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H5v-2h7v2zm5-4H5v-2h12v2zm0-4H5V7h12v2z"/>,
  slides:     <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 12H7v-2h5v2zm5-4H7V9h10v2z"/>,
  meet:       <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>,
  keep:       <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"/>,
  notebooklm: <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 14H8v-2h8v2zm0-4H8v-2h8v2zm0-4H8V6h8v2z"/>,
  youtube:    <path d="M21.58 7.19c-.23-.86-.9-1.54-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.82.42c-.86.23-1.53.91-1.76 1.77C2 8.76 2 12 2 12s0 3.24.42 4.81c.23.86.9 1.54 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.82-.42c.86-.23 1.53-.91 1.76-1.77C22 15.24 22 12 22 12s0-3.24-.42-4.81zM10 15V9l5.2 3-5.2 3z"/>,
};

export function AppIcon({ app }: { app: GoogleApp }): React.ReactElement {
  if (app.type === 'google') {
    return (
      <div className="gam-icon gam-icon-multi">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      </div>
    );
  }
  if (app.type === 'gemini') {
    return (
      <div className="gam-icon gam-icon-gemini">
        <svg viewBox="0 0 28 28" fill="none" width="22" height="22">
          <path d="M14 2C14 2 9 9 2 14C9 14 14 9 14 2Z" fill="url(#g1)"/>
          <path d="M14 2C14 2 19 9 26 14C19 14 14 9 14 2Z" fill="url(#g2)"/>
          <path d="M14 26C14 26 9 19 2 14C9 14 14 19 14 26Z" fill="url(#g3)"/>
          <path d="M14 26C14 26 19 19 26 14C19 14 14 19 14 26Z" fill="url(#g4)"/>
          <defs>
            <linearGradient id="g1" x1="14" y1="2" x2="2" y2="14"><stop stopColor="#4285F4"/><stop offset="1" stopColor="#9334E6"/></linearGradient>
            <linearGradient id="g2" x1="14" y1="2" x2="26" y2="14"><stop stopColor="#9334E6"/><stop offset="1" stopColor="#4285F4"/></linearGradient>
            <linearGradient id="g3" x1="14" y1="26" x2="2" y2="14"><stop stopColor="#4285F4"/><stop offset="1" stopColor="#34A853"/></linearGradient>
            <linearGradient id="g4" x1="14" y1="26" x2="26" y2="14"><stop stopColor="#34A853"/><stop offset="1" stopColor="#4285F4"/></linearGradient>
          </defs>
        </svg>
      </div>
    );
  }
  const icon = SOLID_ICONS[app.id] ?? SOLID_ICONS.docs;
  return (
    <div className="gam-icon" style={{ background: app.bg ?? '#5F6368' }}>
      <svg viewBox="0 0 24 24" fill="white">{icon}</svg>
    </div>
  );
}
