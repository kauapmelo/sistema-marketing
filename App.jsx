import React, { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDQtM1C2qNhGUdoBsZMFYEs8ZFuODOAok4",
  authDomain: "marketing-4ce98.firebaseapp.com",
  projectId: "marketing-4ce98",
  storageBucket: "marketing-4ce98.firebasestorage.app",
  messagingSenderId: "516792766193",
  appId: "1:516792766193:web:8f71aff22b871515f96350"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

const GLOBAL_STYLE = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { background: #0a0a0f; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #111118; }
  ::-webkit-scrollbar-thumb { background: #2e2e3a; border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: #44445a; }
  input[type="date"], input[type="date"]::-webkit-calendar-picker-indicator {
    color-scheme: dark; background: #22222c; border-color: #2e2e3a;
  }
  input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }
  input[type="checkbox"] { accent-color: #7c6af7; }
  select option { background: #22222c; color: #f0f0f5; }

  @keyframes toastIn {
    from { opacity: 0; transform: translateY(20px) scale(.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes toastOut {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to   { opacity: 0; transform: translateY(20px) scale(.95); }
  }
  @keyframes completePop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.06); }
    100% { transform: scale(1); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  @media (max-width: 600px) {
    .nav-label { display: none; }
    .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .analytics-grid { grid-template-columns: 1fr !important; }
    .pri-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .board-toolbar { flex-direction: column !important; align-items: stretch !important; }
    .board-toolbar input,
    .board-toolbar select { max-width: 100% !important; width: 100% !important; }
    .card-modal-body { flex-direction: column !important; }
    .card-modal-right { width: 100% !important; border-right: none !important; border-top: 1px solid #2e2e3a; }
    .users-grid { grid-template-columns: 1fr !important; }
    .social-kpi { grid-template-columns: repeat(2, 1fr) !important; }
    .top-bottom-grid { grid-template-columns: 1fr !important; }
  }
`;

const T = {
  bg0: "#0a0a0f", bg1: "#111118", bg2: "#18181f", bg3: "#22222c",
  bg4: "#2a2a36", border: "#2e2e3a", borderHover: "#44445a",
  text: "#f0f0f5", textSub: "#8888aa", textMuted: "#55556a",
  accent: "#7c6af7", accentHover: "#9b8fff", accentDim: "#7c6af722",
  green: "#22c55e", greenDim: "#22c55e22",
  amber: "#f59e0b", amberDim: "#f59e0b22",
  red: "#ef4444", redDim: "#ef444422",
  blue: "#3b82f6", blueDim: "#3b82f622",
  pink: "#ec4899", pinkDim: "#ec489922",
  teal: "#14b8a6", tealDim: "#14b8a622",
};

const MEMBER_COLORS = ["#7c6af7","#22c55e","#f59e0b","#3b82f6","#ec4899","#14b8a6","#ef4444","#a855f7","#06b6d4","#84cc16"];

const PRIORITIES = [
  { id: "facil",    label: "Fácil",    points: 50,  color: "#22c55e" },
  { id: "medio",    label: "Médio",    points: 100, color: "#3b82f6" },
  { id: "dificil",  label: "Difícil",  points: 150, color: "#f59e0b" },
  { id: "complexo", label: "Complexo", points: 200, color: "#ef4444" },
];
const getPriority = (id) => PRIORITIES.find(p => p.id === id) || PRIORITIES[0];

const DEFAULT_TASK_TYPES = ["Post","Story","Reels","E-mail","Blog","Anúncio","Relatório","Reunião","Design","Vídeo"];

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const initials = n => n.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
const fmtDate = d => d ? d.slice(5).replace("-", "/") : "";
const fmtNum = n => n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
const hashPwd = (pwd) => btoa(encodeURIComponent(pwd));
const REMEMBER_KEY = "mkt_remember_user";
const MY_CARDS_KEY = "mkt_my_cards_mode";
const ONLINE_KEY = "mkt_online_";

const toArr = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return Object.values(val);
};

const normalizeCard = (card) => ({
  ...card,
  members: toArr(card.members),
  mentions: toArr(card.mentions),
  comments: toArr(card.comments),
  checklist: toArr(card.checklist),
});

const normalizeCol = (col) => ({
  ...col,
  cards: toArr(col.cards).map(normalizeCard),
});

const normalizeCols = (val) => {
  if (!val) return [];
  return toArr(val).map(normalizeCol);
};

const INIT_MEMBERS = [
  { id: "m1", name: "Ana Silva",    avatar: "AS", color: "#7c6af7", role: "Designer",    passwordHash: hashPwd("1234"), photo: null },
  { id: "m2", name: "Bruno Costa",  avatar: "BC", color: "#22c55e", role: "Copywriter",  passwordHash: hashPwd("1234"), photo: null },
  { id: "m3", name: "Carla Mendes", avatar: "CM", color: "#f59e0b", role: "Social Media", passwordHash: hashPwd("1234"), photo: null },
  { id: "m4", name: "Diego Ramos",  avatar: "DR", color: "#3b82f6", role: "Gestor",       passwordHash: hashPwd("1234"), photo: null },
];

const INIT_COLUMNS = [
  { id: "backlog", title: "Backlog",      color: T.textMuted, order: 0, cards: [
    { id: "c101", title: "Criar calendário de conteúdo junho", type: "Blog",   points: 100, members: ["m1","m2"], priority: "medio",   due: "2026-05-20", desc: "", mentions: [], comments: [], checklist: [], completed: false },
    { id: "c102", title: "Design banner campanha verão",       type: "Design", points: 150, members: ["m1"],      priority: "dificil", due: "2026-05-22", desc: "", mentions: [], comments: [], checklist: [], completed: false },
  ]},
  { id: "doing",  title: "Em Andamento", color: T.blue,      order: 1, cards: [
    { id: "c103", title: "Reels produto novo – gravação", type: "Reels",   points: 150, members: ["m3"], priority: "dificil", due: "2026-05-15", desc: "", mentions: [], comments: [], checklist: [], completed: false },
    { id: "c104", title: "Anúncios Google Ads maio",      type: "Anúncio", points: 100, members: ["m4"], priority: "medio",   due: "2026-05-16", desc: "", mentions: [], comments: [], checklist: [], completed: false },
  ]},
  { id: "review", title: "Revisão",      color: T.amber,     order: 2, cards: [
    { id: "c105", title: "E-mail marketing semanal", type: "E-mail", points: 100, members: ["m2","m4"], priority: "medio", due: "2026-05-14", desc: "", mentions: [], comments: [], checklist: [], completed: false },
  ]},
  { id: "done",   title: "Concluído",    color: T.green,     order: 3, cards: [
    { id: "c106", title: "Post Instagram produto A", type: "Post",      points: 50,  members: ["m3"], priority: "facil",   due: "2026-05-10", desc: "", mentions: [], comments: [], checklist: [], completed: true },
    { id: "c107", title: "Relatório mensal abril",   type: "Relatório", points: 150, members: ["m4"], priority: "dificil", due: "2026-05-12", desc: "", mentions: [], comments: [], checklist: [], completed: true },
  ]},
];

const INIT_EVENTS = [
  { id: "e1", date:"2026-05-14", title:"E-mail marketing",  type:"E-mail",  memberId:"m2" },
  { id: "e2", date:"2026-05-15", title:"Reels produto novo", type:"Reels",   memberId:"m3" },
  { id: "e3", date:"2026-05-18", title:"Reunião estratégia", type:"Reunião", memberId:"m4" },
  { id: "e4", date:"2026-05-20", title:"Calendário jun",     type:"Blog",    memberId:"m1" },
  { id: "e5", date:"2026-05-25", title:"Post campanha",      type:"Post",    memberId:"m3" },
];

const INIT_SOCIAL = {
  instagram:[
    { id:"s1",title:"Lançamento Produto X",thumbnail:"🎨",likes:4320,comments:218,shares:891,views:28400,saves:1200,date:"2026-05-10",type:"Reels" },
    { id:"s2",title:"Campanha Verão 2026",thumbnail:"☀️",likes:2870,comments:143,shares:412,views:15600,saves:540,date:"2026-05-07",type:"Post" },
  ],
  tiktok:[
    { id:"s3",title:"Tutorial rápido 60s",thumbnail:"⚡",likes:18200,comments:934,shares:4210,views:142000,saves:3200,date:"2026-05-09",type:"Vídeo" },
    { id:"s4",title:"Trend da semana",thumbnail:"🔥",likes:31400,comments:1620,shares:8900,views:287000,saves:6700,date:"2026-05-06",type:"Vídeo" },
  ],
  youtube:[
    { id:"s5",title:"Como usar Produto X completo",thumbnail:"📹",likes:3420,comments:287,shares:541,views:48200,saves:0,date:"2026-05-08",type:"Vídeo" },
    { id:"s6",title:"Podcast Ep.12 – Marketing",thumbnail:"🎙️",likes:2100,comments:198,shares:412,views:31500,saves:0,date:"2026-04-28",type:"Podcast" },
  ],
};

const s = {
  card: (extra = {}) => ({ background: T.bg2, borderRadius: 12, border: `1px solid ${T.border}`, ...extra }),
  btn: (bg = T.accent, extra = {}) => ({
    background: bg, color: "#fff", border: "none", borderRadius: 8,
    padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13,
    fontFamily: "inherit", transition: "opacity .15s", ...extra
  }),
  input: (extra = {}) => ({
    background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8,
    color: T.text, padding: "8px 12px", fontSize: 14, width: "100%",
    boxSizing: "border-box", fontFamily: "inherit", outline: "none",
    colorScheme: "dark", WebkitAppearance: "none", appearance: "none", ...extra
  }),
  select: (extra = {}) => ({
    background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8,
    color: T.text, padding: "8px 32px 8px 12px", fontSize: 14, width: "100%",
    boxSizing: "border-box", fontFamily: "inherit", outline: "none",
    colorScheme: "dark", WebkitAppearance: "none", appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2355556a' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", cursor: "pointer", ...extra
  }),
  label: { fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 },
  badge: (color) => ({ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: color + "22", color, letterSpacing: .5 }),
};

function GlobalStyles() {
  return <style>{GLOBAL_STYLE}</style>;
}

/* ─── ONLINE PRESENCE ────────────────────────────────────── */
function useOnlinePresence(userId) {
  useEffect(() => {
    if (!userId) return;
    const key = ONLINE_KEY + userId;
    localStorage.setItem(key, Date.now());
    const interval = setInterval(() => localStorage.setItem(key, Date.now()), 15000);
    return () => {
      clearInterval(interval);
      localStorage.removeItem(key);
    };
  }, [userId]);
}

function isOnline(userId) {
  const ts = localStorage.getItem(ONLINE_KEY + userId);
  if (!ts) return false;
  return Date.now() - parseInt(ts) < 30000;
}

/* ─── AVATAR ─────────────────────────────────────────────── */
function Avatar({ member, size = 28, style = {}, showOnline = false }) {
  const online = showOnline ? isOnline(member.id) : false;
  return member.photo ? (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2px solid ${T.bg1}`, boxSizing: "border-box", position: "relative", ...style }}>
      <img src={member.photo} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {showOnline && <div style={{ position: "absolute", bottom: 0, right: 0, width: size * 0.28, height: size * 0.28, borderRadius: "50%", background: online ? T.green : T.textMuted, border: `2px solid ${T.bg1}` }} />}
    </div>
  ) : (
    <div style={{ width: size, height: size, borderRadius: "50%", background: member.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * .36, fontWeight: 700, flexShrink: 0, border: `2px solid ${T.bg1}`, boxSizing: "border-box", position: "relative", ...style }}>
      {member.avatar || initials(member.name)}
      {showOnline && <div style={{ position: "absolute", bottom: 0, right: 0, width: size * 0.28, height: size * 0.28, borderRadius: "50%", background: online ? T.green : T.textMuted, border: `2px solid ${T.bg1}` }} />}
    </div>
  );
}

function Pill({ label, color }) {
  return <span style={s.badge(color)}>{label}</span>;
}

/* ─── SPARKLINE ──────────────────────────────────────────── */
function Sparkline({ data, color = T.accent, width = 80, height = 28 }) {
  if (!data || data.length < 2) return <span style={{ fontSize: 11, color: T.textMuted }}>—</span>;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => {
        if (i !== data.length - 1) return null;
        const x = (i / (data.length - 1)) * width;
        const y = height - (v / max) * (height - 4) - 2;
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
    </svg>
  );
}

/* ─── TOAST ──────────────────────────────────────────────── */
function Toast({ toast }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 3200);
    return () => clearTimeout(t1);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: T.bg2, border: `1px solid ${T.green}55`, borderRadius: 14, padding: "14px 20px", boxShadow: "0 8px 32px #00000099", animation: `${leaving ? "toastOut" : "toastIn"} .35s ease forwards`, minWidth: 260, maxWidth: 340 }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.green + "22", border: `2px solid ${T.green}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>✅</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: T.text }}>Tarefa concluída!</p>
        <p style={{ margin: "0 0 4px", fontSize: 12, color: T.textSub, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{toast.title}</p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: T.amber + "22", border: `1px solid ${T.amber}44`, borderRadius: 20, padding: "2px 10px" }}>
          <span style={{ fontSize: 13 }}>⭐</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: T.amber }}>+{toast.points} pts</span>
        </div>
      </div>
    </div>
  );
}

function ToastContainer({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 20, right: 16, left: 16, display: "flex", flexDirection: "column", gap: 10, zIndex: 9999, pointerEvents: "none", alignItems: "flex-end" }}>
      {toasts.map(t => <Toast key={t.id} toast={t} />)}
    </div>
  );
}

/* ─── NOTIFICATION BELL ──────────────────────────────────── */
function NotifBell({ notifs, onClear }) {
  const [open, setOpen] = useState(false);
  const unread = notifs.filter(n => !n.read).length;
  const bellRef = useRef();
  useEffect(() => {
    const fn = e => { if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  return (
    <div ref={bellRef} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 4 }}>
        <span style={{ fontSize: 20 }}>🔔</span>
        {unread > 0 && <span style={{ position: "absolute", top: 0, right: 0, background: T.red, color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{unread}</span>}
      </button>
      {open && (
        <div style={{ position: "fixed", right: 12, top: 60, width: "calc(100vw - 24px)", maxWidth: 300, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: `0 8px 32px #00000088`, zIndex: 999, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>Notificações</span>
            {notifs.length > 0 && <button onClick={onClear} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 12 }}>Limpar</button>}
          </div>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {notifs.length === 0
              ? <p style={{ padding: "20px 16px", color: T.textMuted, fontSize: 13, textAlign: "center" }}>Sem notificações</p>
              : notifs.map(n => (
                <div key={n.id} style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, background: n.read ? "transparent" : T.accentDim }}>
                  <p style={{ margin: 0, fontSize: 13, color: T.text }}>{n.text}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: T.textMuted }}>{n.time}</p>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── PHOTO CROP MODAL ───────────────────────────────────── */
function PhotoCropModal({ imageSrc, onConfirm, onClose }) {
  const canvasRef = useRef();
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef(new window.Image());
  const SIZE = 280;

  useEffect(() => {
    const img = imgRef.current;
    img.onload = () => draw();
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => { draw(); }, [scale, offset]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const img = imgRef.current;
    if (!img.complete || !img.naturalWidth) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    const baseScale = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight);
    const s2 = baseScale * scale;
    const w = img.naturalWidth * s2;
    const h = img.naturalHeight * s2;
    const x = (SIZE - w) / 2 + offset.x;
    const y = (SIZE - h) / 2 + offset.y;
    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
    ctx.strokeStyle = "#7c6af7";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  };

  const onMouseDown = (e) => {
    setDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setOffset({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };
  const onMouseUp = () => setDragging(false);

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const out = document.createElement("canvas");
    out.width = 200; out.height = 200;
    const ctx = out.getContext("2d");
    ctx.drawImage(canvas, 0, 0, SIZE, SIZE, 0, 0, 200, 200);
    onConfirm(out.toDataURL("image/jpeg", 0.85));
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 16 }}>
      <div style={s.card({ padding: 28, maxWidth: 360, width: "100%", boxShadow: "0 24px 64px #000000cc", textAlign: "center" })}>
        <h3 style={{ margin: "0 0 6px", fontWeight: 800, color: T.text, fontSize: 17 }}>Ajustar foto</h3>
        <p style={{ margin: "0 0 20px", color: T.textMuted, fontSize: 13 }}>Arraste para posicionar · Zoom para aproximar</p>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <canvas ref={canvasRef} width={SIZE} height={SIZE}
            style={{ borderRadius: "50%", cursor: dragging ? "grabbing" : "grab", userSelect: "none", touchAction: "none", border: `3px solid ${T.accent}` }}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            onTouchStart={onMouseDown} onTouchMove={onMouseMove} onTouchEnd={onMouseUp} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ ...s.label, marginBottom: 0 }}>🔍 Zoom</label>
            <span style={{ fontSize: 12, color: T.textSub }}>{Math.round(scale * 100)}%</span>
          </div>
          <input type="range" min="0.5" max="3" step="0.05" value={scale} onChange={e => setScale(parseFloat(e.target.value))} style={{ width: "100%", accentColor: T.accent, cursor: "pointer" }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={s.btn(T.bg4, { flex: 1, color: T.text })}>Cancelar</button>
          <button onClick={handleConfirm} style={s.btn(T.accent, { flex: 1 })}>Usar foto ✓</button>
        </div>
      </div>
    </div>
  );
}

/* ─── PHOTO UPLOADER ─────────────────────────────────────── */
function PhotoUploader({ currentPhoto, color, name, onUpload }) {
  const inputRef = useRef();
  const [cropSrc, setCropSrc] = useState(null);
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Foto muito grande! Máximo 5MB."); return; }
    const reader = new FileReader();
    reader.onload = ev => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div onClick={() => inputRef.current.click()} style={{ width: 90, height: 90, borderRadius: "50%", overflow: "hidden", cursor: "pointer", position: "relative", border: `3px solid ${T.accent}`, flexShrink: 0 }}>
          {currentPhoto
            ? <img src={currentPhoto} alt="foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#fff" }}>{initials(name || "?")}</div>
          }
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
            <span style={{ fontSize: 22 }}>📷</span>
            <span style={{ fontSize: 10, color: "#fff", fontWeight: 700, marginTop: 2 }}>Alterar</span>
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" onClick={() => inputRef.current.click()} style={s.btn(T.bg4, { color: T.text, fontSize: 11, padding: "5px 12px" })}>{currentPhoto ? "Trocar foto" : "Adicionar foto"}</button>
          {currentPhoto && <button type="button" onClick={() => onUpload(null)} style={s.btn(T.redDim, { color: T.red, fontSize: 11, padding: "5px 12px" })}>Remover</button>}
        </div>
      </div>
      {cropSrc && <PhotoCropModal imageSrc={cropSrc} onConfirm={data => { onUpload(data); setCropSrc(null); }} onClose={() => setCropSrc(null)} />}
    </>
  );
}

/* ─── LOGIN SCREEN ───────────────────────────────────────── */
function LoginScreen({ members, onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Social Media");
  const [color, setColor] = useState(MEMBER_COLORS[0]);
  const [photo, setPhoto] = useState(null);
  const [selId, setSelId] = useState(null);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const handleLogin = () => {
    setError("");
    const member = members.find(m => m.id === selId);
    if (!member) { setError("Selecione um perfil."); return; }
    if (member.passwordHash && hashPwd(password) !== member.passwordHash) { setError("Senha incorreta."); return; }
    if (remember) localStorage.setItem(REMEMBER_KEY, String(member.id));
    else localStorage.removeItem(REMEMBER_KEY);
    onLogin(member);
  };

  const handleRegister = () => {
    if (!name.trim()) { setError("Digite seu nome."); return; }
    if (!newPassword.trim()) { setError("Defina uma senha."); return; }
    const newMember = { id: uid(), name: name.trim(), avatar: initials(name.trim()), color, photo: photo || null, role: role.trim() || "Membro", passwordHash: hashPwd(newPassword) };
    onRegister(newMember);
    setMode("login"); setName(""); setNewPassword(""); setPhoto(null); setError("");
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',system-ui,sans-serif", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420, ...s.card({ padding: 28, boxShadow: "0 24px 64px #00000099" }) }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: T.text, letterSpacing: -1 }}>Sistema Marketing</h1>
          <p style={{ margin: "6px 0 0", color: T.textSub, fontSize: 13 }}>Plataforma de gestão de conteúdo</p>
        </div>
        <div style={{ display: "flex", background: T.bg3, borderRadius: 10, padding: 4, marginBottom: 20, gap: 4 }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit", background: mode === m ? T.accent : "transparent", color: mode === m ? "#fff" : T.textMuted, transition: "all .2s" }}>
              {m === "login" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>
        {error && <div style={{ background: T.redDim, border: `1px solid ${T.red}33`, borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 13, color: T.red }}>{error}</div>}
        {mode === "login" ? (
          <div>
            <label style={s.label}>Selecione seu perfil</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, maxHeight: 220, overflowY: "auto" }}>
              {members.length === 0 && <p style={{ color: T.textMuted, fontSize: 13, textAlign: "center" }}>Carregando...</p>}
              {members.map(m => (
                <div key={m.id} onClick={() => { setSelId(m.id); setPassword(""); setError(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${selId === m.id ? T.accent : T.border}`, cursor: "pointer", background: selId === m.id ? T.accentDim : T.bg3, transition: "all .15s" }}>
                  <Avatar member={m} size={36} showOnline />
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: T.text }}>{m.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>{m.role}</p>
                  </div>
                  {selId === m.id && <span style={{ marginLeft: "auto", color: T.accent }}>✓</span>}
                </div>
              ))}
            </div>
            {selId && (
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Senha</label>
                <div style={{ position: "relative" }}>
                  <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Digite sua senha" style={{ ...s.input(), paddingRight: 40 }} />
                  <button onClick={() => setShowPwd(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 16 }}>{showPwd ? "🙈" : "👁️"}</button>
                </div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <input type="checkbox" id="remember" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: T.accent, width: 15, height: 15, cursor: "pointer" }} />
              <label htmlFor="remember" style={{ fontSize: 13, color: T.textSub, cursor: "pointer" }}>Lembrar neste dispositivo</label>
            </div>
            <button onClick={handleLogin} disabled={!selId} style={s.btn(T.accent, { width: "100%", padding: "12px", fontSize: 15, opacity: selId ? 1 : .4 })}>Entrar</button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Foto de perfil (opcional)</label>
              <PhotoUploader currentPhoto={photo} color={color} name={name} onUpload={setPhoto} />
            </div>
            <label style={s.label}>Nome completo</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Maria Souza" style={{ ...s.input(), marginBottom: 14 }} />
            <label style={s.label}>Cargo / Função</label>
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="Ex: Designer" style={{ ...s.input(), marginBottom: 14 }} />
            <label style={s.label}>Senha</label>
            <div style={{ position: "relative", marginBottom: 14 }}>
              <input type={showNewPwd ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Crie uma senha" style={{ ...s.input(), paddingRight: 40 }} />
              <button onClick={() => setShowNewPwd(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 16 }}>{showNewPwd ? "🙈" : "👁️"}</button>
            </div>
            <label style={s.label}>Cor do perfil</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
              {MEMBER_COLORS.map(c => <div key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: color === c ? `3px solid ${T.text}` : "3px solid transparent", transition: "border .15s" }} />)}
            </div>
            <button onClick={handleRegister} style={s.btn(T.accent, { width: "100%", padding: "12px", fontSize: 15 })}>Criar conta</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── MANAGE TYPES MODAL ─────────────────────────────────── */
function ManageTypesModal({ types, onSave, onClose }) {
  const [list, setList] = useState([...types]);
  const [newType, setNewType] = useState("");
  const add = () => { const t = newType.trim(); if (t && !list.includes(t)) { setList([...list, t]); setNewType(""); } };
  const remove = t => setList(list.filter(x => x !== t));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.card({ padding: 24, width: "100%", maxWidth: 380, boxShadow: "0 24px 64px #000000cc" })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontWeight: 800, color: T.text }}>Gerenciar Tipos</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 22 }}>×</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16, maxHeight: 200, overflowY: "auto" }}>
          {list.map(t => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 4, background: T.accentDim, border: `1px solid ${T.accent}44`, borderRadius: 20, padding: "4px 10px" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.accent }}>{t}</span>
              <button onClick={() => remove(t)} style={{ background: "none", border: "none", cursor: "pointer", color: T.accent, fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input value={newType} onChange={e => setNewType(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Novo tipo..." style={s.input({ flex: 1 })} />
          <button onClick={add} style={s.btn(T.accent)}>+</button>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={s.btn(T.bg4, { color: T.text })}>Cancelar</button>
          <button onClick={() => onSave(list)} style={s.btn(T.accent)}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

/* ─── CARD MODAL ─────────────────────────────────────────── */
function CardModal({ card, colId, members, currentUser, taskTypes, onSave, onClose, onNotify, onManageTypes }) {
  const isNew = !card?.id;
  const defP = PRIORITIES[0];
  const [form, setForm] = useState(() => {
    if (card) return { ...card, members: toArr(card.members), mentions: toArr(card.mentions), comments: toArr(card.comments), checklist: toArr(card.checklist) };
    return { title: "", type: taskTypes[0] || "Post", points: defP.points, members: [], priority: defP.id, due: "", desc: "", mentions: [], comments: [], checklist: [], completed: false };
  });
  const [mention, setMention] = useState("");
  const [comment, setComment] = useState("");
  const [checkText, setCheckText] = useState("");
  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const handlePriorityChange = pid => { const p = getPriority(pid); setForm(f => ({ ...f, priority: pid, points: p.points })); };
  const toggleMember = id => setF("members", form.members.includes(id) ? form.members.filter(x => x !== id) : [...form.members, id]);
  const addMention = () => {
    const m = mention.trim(); if (!m) return;
    const tag = m.startsWith("@") ? m : "@" + m;
    const mb = members.find(x => x.name.toLowerCase().includes(m.replace("@", "").toLowerCase()));
    setF("mentions", [...form.mentions, tag]);
    if (mb && mb.id !== currentUser?.id) onNotify(mb.id, `Você foi mencionado em "${form.title || "card"}" por ${currentUser?.name}`);
    setMention("");
  };
  const addComment = () => {
    if (!comment.trim()) return;
    const c = { id: uid(), text: comment.trim(), author: currentUser?.name || "Anônimo", time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) };
    setF("comments", [...form.comments, c]);
    setComment("");
    form.members.forEach(mid => {
      if (mid !== currentUser?.id) { const mb = members.find(m => m.id === mid); if (mb) onNotify(mb.id, `${currentUser?.name} comentou em "${form.title}"`); }
    });
  };
  const addCheck = () => { if (!checkText.trim()) return; setF("checklist", [...form.checklist, { id: uid(), text: checkText.trim(), done: false }]); setCheckText(""); };
  const toggleCheck = id => setF("checklist", form.checklist.map(c => c.id === id ? { ...c, done: !c.done } : c));
  const removeCheck = id => setF("checklist", form.checklist.filter(c => c.id !== id));
  const doneChecks = form.checklist.filter(c => c.done).length;
  const handleSave = () => { if (!form.title.trim()) return; onSave(form, colId); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, overflowY: "auto", padding: "16px" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 680, ...s.card({ padding: 0, boxShadow: "0 24px 64px #000000cc", overflow: "hidden", marginBottom: 16 }) }}>
        <div style={{ padding: "16px 20px 14px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <input value={form.title} onChange={e => setF("title", e.target.value)} placeholder="Título do card..." style={s.input({ fontSize: 16, fontWeight: 700, background: "transparent", border: "none", padding: 0, flex: 1, width: "auto" })} autoFocus />
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 22, padding: 0, flexShrink: 0 }}>×</button>
          </div>
        </div>
        <div className="card-modal-body" style={{ display: "flex", flexDirection: "row" }}>
          <div style={{ flex: 1, padding: "16px 20px", borderRight: `1px solid ${T.border}`, minWidth: 0 }}>
            <label style={s.label}>📝 Descrição</label>
            <textarea value={form.desc} onChange={e => setF("desc", e.target.value)} placeholder="Descrição..." rows={3} style={{ ...s.input({ resize: "vertical", marginBottom: 16, fontFamily: "inherit", lineHeight: 1.5 }), WebkitAppearance: "none", appearance: "auto" }} />
            <label style={s.label}>☑️ Checklist {form.checklist.length > 0 && `(${doneChecks}/${form.checklist.length})`}</label>
            {form.checklist.length > 0 && <div style={{ background: T.bg3, borderRadius: 6, height: 6, marginBottom: 10 }}><div style={{ background: T.green, borderRadius: 6, height: 6, width: `${(doneChecks / form.checklist.length) * 100}%`, transition: "width .3s" }} /></div>}
            {form.checklist.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                <input type="checkbox" checked={c.done} onChange={() => toggleCheck(c.id)} style={{ accentColor: T.accent, width: 16, height: 16 }} />
                <span style={{ flex: 1, fontSize: 13, color: c.done ? T.textMuted : T.text, textDecoration: c.done ? "line-through" : "none" }}>{c.text}</span>
                <button onClick={() => removeCheck(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 16, padding: 0 }}>×</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 16 }}>
              <input value={checkText} onChange={e => setCheckText(e.target.value)} onKeyDown={e => e.key === "Enter" && addCheck()} placeholder="Novo item..." style={s.input({ flex: 1, width: "auto" })} />
              <button onClick={addCheck} style={s.btn(T.bg4, { color: T.text })}>+</button>
            </div>
            <label style={s.label}>💬 Comentários</label>
            <div style={{ marginBottom: 12 }}>
              {form.comments.map(c => (
                <div key={c.id} style={{ padding: "10px 12px", background: T.bg3, borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{c.author}</span>
                    <span style={{ fontSize: 11, color: T.textMuted }}>{c.time}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: T.text, lineHeight: 1.5 }}>{c.text}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === "Enter" && addComment()} placeholder="Comentário..." style={s.input({ flex: 1, width: "auto" })} />
              <button onClick={addComment} style={s.btn(T.accent)}>Enviar</button>
            </div>
          </div>
          <div className="card-modal-right" style={{ width: 200, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 14, background: T.bg2, flexShrink: 0 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ ...s.label, marginBottom: 0 }}>Tipo</label>
                <button onClick={onManageTypes} style={{ background: "none", border: "none", cursor: "pointer", color: T.accent, fontSize: 11, fontWeight: 700, padding: 0 }}>+ Gerenciar</button>
              </div>
              <select value={form.type} onChange={e => setF("type", e.target.value)} style={s.select({ padding: "6px 32px 6px 10px", fontSize: 13 })}>
                {taskTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Prioridade & Pontos</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {PRIORITIES.map(p => (
                  <div key={p.id} onClick={() => handlePriorityChange(p.id)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, border: `1.5px solid ${form.priority === p.id ? p.color : T.border}`, cursor: "pointer", background: form.priority === p.id ? p.color + "18" : "transparent", transition: "all .15s" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: form.priority === p.id ? p.color : T.textSub }}>{p.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: p.color }}>⭐{p.points}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label style={s.label}>Prazo</label>
              <input type="date" value={form.due} onChange={e => setF("due", e.target.value)} style={s.input({ padding: "6px 10px", fontSize: 13, colorScheme: "dark", width: "100%" })} />
            </div>
            <div>
              <label style={s.label}>Integrantes</label>
              {members.map(m => (
                <div key={m.id} onClick={() => toggleMember(m.id)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 8, cursor: "pointer", background: form.members.includes(m.id) ? T.accentDim : "transparent", marginBottom: 4, transition: "background .15s" }}>
                  <Avatar member={m} size={22} showOnline />
                  <span style={{ fontSize: 12, color: T.text }}>{m.name.split(" ")[0]}</span>
                  {form.members.includes(m.id) && <span style={{ marginLeft: "auto", color: T.accent, fontSize: 12 }}>✓</span>}
                </div>
              ))}
            </div>
            <div>
              <label style={s.label}>Menções</label>
              <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                <input value={mention} onChange={e => setMention(e.target.value)} onKeyDown={e => e.key === "Enter" && addMention()} placeholder="@nome" style={s.input({ flex: 1, padding: "5px 8px", fontSize: 12, width: "auto" })} />
                <button onClick={addMention} style={s.btn(T.bg4, { color: T.text, padding: "5px 10px" })}>+</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {form.mentions.map((m, i) => (
                  <span key={i} style={{ ...s.badge(T.accent), display: "flex", alignItems: "center", gap: 4 }}>
                    {m}
                    <button onClick={() => setF("mentions", form.mentions.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <button onClick={handleSave} style={s.btn(T.accent, { width: "100%", marginTop: "auto" })}>{isNew ? "Criar card" : "Salvar"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── KANBAN CARD ────────────────────────────────────────── */
function KanbanCard({ card, colId, members, onOpen, onDelete, onComplete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [drag, setDrag] = useState(false);
  const [completing, setCompleting] = useState(false);
  const cardMembers = members.filter(m => toArr(card.members).includes(m.id));
  const checklist = toArr(card.checklist);
  const done = checklist.filter(c => c.done).length;
  const pri = getPriority(card.priority);
  const today = new Date().toISOString().slice(0, 10);
  const isCompleted = !!card.completed;
  const isOverdue = card.due && card.due < today && !isCompleted;

  const handleComplete = (e) => {
    e.stopPropagation();
    if (completing || isCompleted) return;
    setCompleting(true);
    setTimeout(() => { onComplete(card, colId); setCompleting(false); }, 320);
  };

  return (
    <div
      draggable
      onDragStart={e => { setDrag(true); e.dataTransfer.setData("card", JSON.stringify({ card, fromCol: colId })); }}
      onDragEnd={() => setDrag(false)}
      style={{
        background: isCompleted ? "#22c55e08" : T.bg3, borderRadius: 10, padding: "12px 12px",
        border: `1.5px solid ${completing ? T.green : isCompleted ? T.green : drag ? T.accent : isOverdue ? T.red + "77" : T.border}`,
        cursor: "grab", opacity: drag ? .5 : 1, marginBottom: 8,
        transition: "border .3s, background .3s",
        animation: completing ? "completePop .32s ease" : "none",
        position: "relative", overflow: "hidden",
      }}>
      {isCompleted && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.green}, #16a34a)`, borderRadius: "10px 10px 0 0" }} />}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: isCompleted ? T.textSub : T.text, lineHeight: 1.4, flex: 1, textDecoration: isCompleted ? "line-through" : "none" }}>{card.title}</span>
        <div style={{ display: "flex", gap: 2, alignItems: "center", flexShrink: 0 }}>
          <button title="Mover para cima" onClick={e => { e.stopPropagation(); onMoveUp(card.id, colId); }} disabled={isFirst}
            style={{ background: "none", border: "none", cursor: isFirst ? "default" : "pointer", color: isFirst ? T.textMuted + "44" : T.textMuted, fontSize: 11, padding: "0 1px", lineHeight: 1 }}>▲</button>
          <button title="Mover para baixo" onClick={e => { e.stopPropagation(); onMoveDown(card.id, colId); }} disabled={isLast}
            style={{ background: "none", border: "none", cursor: isLast ? "default" : "pointer", color: isLast ? T.textMuted + "44" : T.textMuted, fontSize: 11, padding: "0 1px", lineHeight: 1 }}>▼</button>
          <button title={isCompleted ? "Já concluído" : "Marcar como concluído"} onClick={handleComplete} disabled={completing || isCompleted}
            style={{ background: isCompleted ? T.green + "33" : completing ? T.green + "40" : T.green + "18", border: `1px solid ${isCompleted ? T.green + "88" : T.green + "44"}`, borderRadius: 6, cursor: isCompleted ? "default" : "pointer", color: T.green, fontSize: 12, padding: "2px 5px", fontFamily: "inherit", fontWeight: 700, lineHeight: 1.4, transition: "background .15s" }}>✅</button>
          <button onClick={() => onOpen(card, colId)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 14, padding: "0 2px" }}>✏️</button>
          <button onClick={() => onDelete(card.id, colId)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 14, padding: "0 2px" }}>🗑️</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        <Pill label={card.type} color={T.accent} />
        <Pill label={pri.label} color={pri.color} />
        {isCompleted && <Pill label="✅ Concluído" color={T.green} />}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex" }}>
          {cardMembers.map((m, i) => <div key={m.id} style={{ marginLeft: i ? -8 : 0 }}><Avatar member={m} size={22} showOnline /></div>)}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {checklist.length > 0 && <span style={{ fontSize: 10, color: T.textMuted }}>☑️ {done}/{checklist.length}</span>}
          {toArr(card.comments).length > 0 && <span style={{ fontSize: 10, color: T.textMuted }}>💬 {toArr(card.comments).length}</span>}
          {card.due && <span style={{ fontSize: 10, color: isOverdue ? T.red : T.textMuted }}>📅 {fmtDate(card.due)}</span>}
          <span style={{ fontSize: 10, fontWeight: 700, color: pri.color }}>⭐{card.points}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── COLUMN MODAL ───────────────────────────────────────── */
function ColumnModal({ col, onSave, onClose }) {
  const COL_COLORS = [T.textMuted, T.blue, T.amber, T.green, T.red, T.pink, T.teal, T.accent];
  const [title, setTitle] = useState(col?.title || "");
  const [color, setColor] = useState(col?.color || T.textMuted);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.card({ padding: 24, width: "100%", maxWidth: 360, boxShadow: "0 24px 64px #000000cc" })}>
        <h3 style={{ margin: "0 0 20px", fontWeight: 800, color: T.text }}>{col && col.id ? "Editar coluna" : "Nova coluna"}</h3>
        <label style={s.label}>Nome</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Em Revisão" style={{ ...s.input(), marginBottom: 14 }} autoFocus />
        <label style={s.label}>Cor</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {COL_COLORS.map(c => <div key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: color === c ? `3px solid ${T.text}` : "3px solid transparent", transition: "border .15s" }} />)}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={s.btn(T.bg4, { color: T.text })}>Cancelar</button>
          <button onClick={() => { if (!title.trim()) return; onSave({ id: col?.id || `col_${uid()}`, title: title.trim(), color, cards: col?.cards || [], order: col?.order ?? 999 }); }} style={s.btn(T.accent)}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

/* ─── QUICK ADD INLINE ───────────────────────────────────── */
function QuickAdd({ colId, taskTypes, currentUser, onAdd }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef();

  const handleAdd = () => {
    if (!text.trim()) return;
    const pri = PRIORITIES[0];
    const newCard = {
      id: uid(), title: text.trim(), type: taskTypes[0] || "Post",
      points: pri.points, members: currentUser ? [currentUser.id] : [],
      priority: pri.id, due: "", desc: "", mentions: [], comments: [], checklist: [], completed: false
    };
    onAdd(newCard, colId);
    setText("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        style={{ width: "100%", background: "transparent", border: `1.5px dashed ${T.border}`, borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: T.textMuted, fontSize: 12, fontFamily: "inherit", fontWeight: 600, textAlign: "left", transition: "all .15s", display: "flex", alignItems: "center", gap: 6 }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}>
        <span style={{ fontSize: 14 }}>+</span> Adicionar card rápido
      </button>
    );
  }

  return (
    <div style={{ background: T.bg3, borderRadius: 8, border: `1.5px solid ${T.accent}`, padding: "8px" }}>
      <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setOpen(false); }}
        placeholder="Título do card... (Enter para criar)" style={s.input({ fontSize: 13, background: T.bg2, marginBottom: 8 })} />
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={handleAdd} style={s.btn(T.accent, { flex: 1, fontSize: 12, padding: "5px 0" })}>Criar</button>
        <button onClick={() => setOpen(false)} style={s.btn(T.bg4, { color: T.text, fontSize: 12, padding: "5px 10px" })}>✕</button>
      </div>
    </div>
  );
}

/* ─── BOARD TAB ──────────────────────────────────────────── */
function BoardTab({ columns, updateColumns, members, currentUser, onNotify, taskTypes, updateTaskTypes, myCardsMode, setMyCardsMode }) {
  const [modal, setModal] = useState(null);
  const [colModal, setColModal] = useState(null);
  const [typesModal, setTypesModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterMember, setFilterMember] = useState("all");
  const [toasts, setToasts] = useState([]);
  const [colSortMap, setColSortMap] = useState({});

  const addToast = useCallback((title, points) => {
    const id = uid();
    setToasts(ts => [...ts, { id, title, points }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 3600);
  }, []);

  const sortedCols = [...columns].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const effectiveFilter = myCardsMode ? currentUser?.id : filterMember;

  const filterCard = card => {
    if (search && !card.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (effectiveFilter && effectiveFilter !== "all" && !toArr(card.members).includes(effectiveFilter)) return false;
    return true;
  };

  const getSortedCards = (col) => {
    const sortBy = colSortMap[col.id];
    const cards = [...col.cards];
    if (!sortBy || sortBy === "manual") return cards;
    if (sortBy === "due") return cards.sort((a, b) => (a.due || "9999") < (b.due || "9999") ? -1 : 1);
    if (sortBy === "points") return cards.sort((a, b) => (b.points || 0) - (a.points || 0));
    if (sortBy === "priority") {
      const order = { complexo: 0, dificil: 1, medio: 2, facil: 3 };
      return cards.sort((a, b) => (order[a.priority] ?? 4) - (order[b.priority] ?? 4));
    }
    return cards;
  };

  const visibleCols = (effectiveFilter && effectiveFilter !== "all") || search
    ? sortedCols.filter(col => col.cards.some(filterCard))
    : sortedCols;

  const totalVisible = sortedCols.reduce((a, col) => a + col.cards.filter(filterCard).length, 0);

  const handleMoveUp = useCallback((cardId, colId) => {
    const newCols = columns.map(col => {
      if (col.id !== colId) return col;
      const idx = col.cards.findIndex(c => c.id === cardId);
      if (idx <= 0) return col;
      const cards = [...col.cards];
      [cards[idx - 1], cards[idx]] = [cards[idx], cards[idx - 1]];
      return { ...col, cards };
    });
    updateColumns(newCols);
  }, [columns, updateColumns]);

  const handleMoveDown = useCallback((cardId, colId) => {
    const newCols = columns.map(col => {
      if (col.id !== colId) return col;
      const idx = col.cards.findIndex(c => c.id === cardId);
      if (idx < 0 || idx >= col.cards.length - 1) return col;
      const cards = [...col.cards];
      [cards[idx], cards[idx + 1]] = [cards[idx + 1], cards[idx]];
      return { ...col, cards };
    });
    updateColumns(newCols);
  }, [columns, updateColumns]);

  const handleComplete = useCallback((card, fromColId) => {
    if (card.completed) return;
    const newCols = columns.map(col => {
      if (col.id !== fromColId) return col;
      return { ...col, cards: col.cards.map(c => c.id === card.id ? { ...c, completed: true } : c) };
    });
    updateColumns(newCols);
    toArr(card.members).forEach(mid => {
      if (mid !== currentUser?.id) { const mb = members.find(m => m.id === mid); if (mb) onNotify(mb.id, `"${card.title}" foi concluído!`); }
    });
    addToast(card.title, card.points || getPriority(card.priority).points);
  }, [columns, updateColumns, members, currentUser, onNotify, addToast]);

  const handleDrop = (e, toColId) => {
    try {
      const { card, fromCol } = JSON.parse(e.dataTransfer.getData("card"));
      if (fromCol === toColId) return;
      const newCols = columns.map(col => {
        if (col.id === fromCol) return { ...col, cards: col.cards.filter(c => c.id !== card.id) };
        if (col.id === toColId) return { ...col, cards: [...col.cards, card] };
        return col;
      });
      updateColumns(newCols);
    } catch (err) { console.error("Drop error:", err); }
  };

  const handleSave = (form, colId) => {
    const newCols = columns.map(col => {
      if (col.id !== colId) return col;
      if (form.id) return { ...col, cards: col.cards.map(c => c.id === form.id ? { ...form } : c) };
      const newCard = { ...form, id: uid() };
      toArr(newCard.members).forEach(mid => {
        if (mid !== currentUser?.id) { const mb = members.find(m => m.id === mid); if (mb) onNotify(mb.id, `Você foi adicionado ao card "${newCard.title}"`); }
      });
      return { ...col, cards: [...col.cards, newCard] };
    });
    updateColumns(newCols);
    setModal(null);
  };

  const handleQuickAdd = (newCard, colId) => {
    const newCols = columns.map(col => col.id === colId ? { ...col, cards: [...col.cards, newCard] } : col);
    updateColumns(newCols);
  };

  const handleDelete = (cid, colId) => {
    if (!window.confirm("Excluir este card?")) return;
    updateColumns(columns.map(col => col.id === colId ? { ...col, cards: col.cards.filter(c => c.id !== cid) } : col));
  };

  const handleSaveCol = colData => {
    const exists = columns.find(c => c.id === colData.id);
    if (exists) updateColumns(columns.map(c => c.id === colData.id ? { ...colData, cards: c.cards } : c));
    else updateColumns([...columns, { ...colData, cards: [] }]);
    setColModal(null);
  };

  const handleDeleteCol = colId => {
    if (!window.confirm("Excluir coluna e todos os cards dela?")) return;
    updateColumns(columns.filter(c => c.id !== colId));
  };

  const activeFilterName = myCardsMode
    ? currentUser?.name?.split(" ")[0]
    : filterMember !== "all"
      ? members.find(m => m.id === filterMember)?.name?.split(" ")[0]
      : null;

  const clearFilters = () => { setSearch(""); setFilterMember("all"); setMyCardsMode(false); };

  return (
    <div>
      <div className="board-toolbar" style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap", background: T.bg1, borderRadius: 14, padding: "10px 14px", border: `1px solid ${T.border}` }}>
        <div style={{ position: "relative", flex: 1, minWidth: 130, maxWidth: 210 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, pointerEvents: "none", color: T.textMuted }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." style={s.input({ paddingLeft: 30, background: T.bg2, fontSize: 13 })} />
        </div>
        {!myCardsMode && (
          <select value={filterMember} onChange={e => setFilterMember(e.target.value)} style={s.select({ maxWidth: 170, background: T.bg2, fontSize: 13 })}>
            <option value="all">👥 Todos</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name.split(" ")[0]}</option>)}
          </select>
        )}
        {(activeFilterName || search) && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.accentDim, border: `1px solid ${T.accent}44`, borderRadius: 20, padding: "4px 10px", animation: "fadeIn .2s ease" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: T.accent }}>
              {activeFilterName ? `${activeFilterName}` : ""}{activeFilterName && search ? " · " : ""}{search ? `"${search}"` : ""}{" · "}{totalVisible} card{totalVisible !== 1 ? "s" : ""}
            </span>
            <button onClick={clearFilters} style={{ background: "none", border: "none", cursor: "pointer", color: T.accent, fontSize: 14, padding: 0, lineHeight: 1, marginLeft: 2 }}>×</button>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center" }}>
          <button onClick={() => { const firstColId = visibleCols[0]?.id || sortedCols[0]?.id; if (!firstColId) return; setModal({ card: null, colId: firstColId }); }} style={s.btn(T.accent, { fontSize: 13 })}>+ Card</button>
          <button onClick={() => setColModal({})} style={s.btn(T.bg4, { color: T.text, fontSize: 13 })}>+ Coluna</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16, alignItems: "flex-start" }}>
        {visibleCols.length === 0 && (effectiveFilter && effectiveFilter !== "all" || search) && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 12, background: T.bg1, borderRadius: 16, border: `1px dashed ${T.border}`, flex: 1, minWidth: 300 }}>
            <span style={{ fontSize: 36 }}>🔍</span>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: T.text }}>Nenhum card encontrado</p>
            <p style={{ margin: 0, fontSize: 13, color: T.textMuted, textAlign: "center" }}>{activeFilterName ? `${activeFilterName} não tem cards atribuídos.` : "Nenhum card corresponde à busca."}</p>
            <button onClick={clearFilters} style={s.btn(T.bg3, { color: T.textSub, fontSize: 12, marginTop: 4 })}>Ver todos →</button>
          </div>
        )}
        {visibleCols.map(col => {
          const sortBy = colSortMap[col.id] || "manual";
          const sortedCards = getSortedCards(col);
          const visibleCards = sortedCards.filter(filterCard);
          const colPts = col.cards.reduce((a, c) => a + (c.points || 0), 0);
          return (
            <div key={col.id} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, col.id)}
              style={{ minWidth: 256, maxWidth: 256, background: T.bg1, borderRadius: 12, border: `1px solid ${T.border}`, padding: 10, flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{col.title}</span>
                  <span style={{ background: col.color + "22", color: col.color, borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "1px 6px", flexShrink: 0 }}>{visibleCards.length}</span>
                </div>
                <div style={{ display: "flex", gap: 2, flexShrink: 0, alignItems: "center" }}>
                  <button onClick={() => setColModal(col)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 12, padding: "2px 3px" }}>✏️</button>
                  <button onClick={() => handleDeleteCol(col.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 12, padding: "2px 3px" }}>🗑️</button>
                  <button onClick={() => setModal({ card: null, colId: col.id })} style={{ background: col.color + "22", color: col.color, border: "none", borderRadius: 6, width: 22, height: 22, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>+</button>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 2px" }}>
                <span style={{ fontSize: 10, color: T.amber, fontWeight: 700 }}>⭐ {colPts} pts</span>
                <select value={sortBy} onChange={e => setColSortMap(m => ({ ...m, [col.id]: e.target.value }))}
                  style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textMuted, fontSize: 10, fontFamily: "inherit", padding: "2px 18px 2px 6px", cursor: "pointer", outline: "none", colorScheme: "dark", WebkitAppearance: "none", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%2355556a' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 5px center" }}>
                  <option value="manual">Manual</option>
                  <option value="due">Prazo</option>
                  <option value="points">Pontos</option>
                  <option value="priority">Prioridade</option>
                </select>
              </div>
              {visibleCards.map((card, idx) => (
                <KanbanCard key={card.id} card={card} colId={col.id} members={members}
                  onOpen={(c, cid) => setModal({ card: c, colId: cid })}
                  onDelete={handleDelete} onComplete={handleComplete}
                  onMoveUp={handleMoveUp} onMoveDown={handleMoveDown}
                  isFirst={idx === 0} isLast={idx === visibleCards.length - 1} />
              ))}
              {visibleCards.length === 0 && <div style={{ textAlign: "center", padding: "12px 0 8px", color: T.textMuted, fontSize: 12 }}>Arraste um card aqui</div>}
              <div style={{ marginTop: 4 }}>
                <QuickAdd colId={col.id} taskTypes={taskTypes} currentUser={currentUser} onAdd={handleQuickAdd} />
              </div>
            </div>
          );
        })}
        <div style={{ minWidth: 180, flexShrink: 0, paddingTop: 2 }}>
          <button onClick={() => setColModal({})}
            style={{ background: T.bg3, border: `2px dashed ${T.border}`, borderRadius: 12, padding: "12px 20px", cursor: "pointer", color: T.textMuted, fontSize: 13, fontWeight: 700, fontFamily: "inherit", width: "100%", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}>
            + Adicionar coluna
          </button>
        </div>
      </div>

      {modal && (
        <CardModal card={modal.card} colId={modal.colId} members={members} currentUser={currentUser}
          taskTypes={taskTypes} onSave={handleSave} onClose={() => setModal(null)}
          onNotify={onNotify} onManageTypes={() => setTypesModal(true)} />
      )}
      {colModal !== null && (
        <ColumnModal col={colModal && Object.keys(colModal).length > 0 ? colModal : null} onSave={handleSaveCol} onClose={() => setColModal(null)} />
      )}
      {typesModal && (
        <ManageTypesModal types={taskTypes} onSave={list => { updateTaskTypes(list); setTypesModal(false); }} onClose={() => setTypesModal(false)} />
      )}
      <ToastContainer toasts={toasts} />
    </div>
  );
}

/* ─── USERS TAB ──────────────────────────────────────────── */
function UsersTab({ members, updateMembers, columns }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const allCards = columns.flatMap(c => c.cards);
  const stats = m => {
    const total = allCards.filter(c => toArr(c.members).includes(m.id)).length;
    const done  = allCards.filter(c => toArr(c.members).includes(m.id) && c.completed).length;
    const pts   = allCards.filter(c => toArr(c.members).includes(m.id) && c.completed).reduce((a, c) => a + (c.points || 0), 0);
    return { total, done, pts };
  };
  const ranked = [...members].sort((a, b) => stats(b).pts - stats(a).pts);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>Controle de Usuários</h2>
        <button onClick={() => { setEditing("new"); setForm({ name: "", role: "", color: MEMBER_COLORS[0], newPassword: "", photo: null }); }} style={s.btn(T.accent)}>+ Novo Membro</button>
      </div>
      <div className="users-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
        {ranked.map((m, i) => {
          const { total, done, pts } = stats(m);
          const online = isOnline(m.id);
          return (
            <div key={m.id} style={s.card({ padding: 18, position: "relative" })}>
              <div style={{ position: "absolute", top: 12, right: 14, fontWeight: 900, fontSize: 22, color: i === 0 ? T.amber : T.textMuted }}>{i === 0 ? "🏆" : `#${i + 1}`}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ position: "relative" }}>
                  <Avatar member={m} size={44} />
                  <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: "50%", background: online ? T.green : T.textMuted, border: `2px solid ${T.bg2}`, animation: online ? "pulse 2s infinite" : "none" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: T.text }}>{m.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>{m.role}</p>
                  <span style={{ fontSize: 10, fontWeight: 700, color: online ? T.green : T.textMuted }}>{online ? "● Online agora" : "● Offline"}</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[["Tarefas", total, T.blue], ["Feitas", done, T.green], ["Pontos", pts, T.amber]].map(([l, v, c]) => (
                  <div key={l} style={{ background: c + "18", borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: c }}>{v}</p>
                    <p style={{ margin: 0, fontSize: 10, color: T.textMuted, fontWeight: 600 }}>{l}</p>
                  </div>
                ))}
              </div>
              <div style={{ background: T.bg3, borderRadius: 99, height: 5, marginBottom: 12 }}>
                <div style={{ background: m.color, borderRadius: 99, height: 5, width: `${total > 0 ? (done / total) * 100 : 0}%`, transition: "width .5s" }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setEditing(m.id); setForm({ ...m, newPassword: "" }); }} style={s.btn(T.bg4, { flex: 1, color: T.text })}>Editar</button>
                <button onClick={() => { if (window.confirm(`Remover ${m.name}?`)) updateMembers(members.filter(x => x.id !== m.id)); }} style={s.btn(T.redDim, { flex: 1, color: T.red })}>Remover</button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }} onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div style={s.card({ padding: 24, width: "100%", maxWidth: 400, boxShadow: "0 24px 64px #000000cc", maxHeight: "92vh", overflowY: "auto" })}>
            <h3 style={{ margin: "0 0 20px", fontWeight: 800, color: T.text }}>{editing === "new" ? "Novo Membro" : "Editar Perfil"}</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Foto de perfil</label>
              <PhotoUploader currentPhoto={form.photo || null} color={form.color || MEMBER_COLORS[0]} name={form.name || "?"} onUpload={photo => setForm(f => ({ ...f, photo }))} />
            </div>
            {[["Nome", "name"], ["Cargo", "role"]].map(([l, k]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <label style={s.label}>{l}</label>
                <input value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={s.input()} />
              </div>
            ))}
            <label style={s.label}>{editing === "new" ? "Senha" : "Nova senha (deixe em branco p/ manter)"}</label>
            <input type="password" value={form.newPassword || ""} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} placeholder={editing === "new" ? "Defina uma senha" : "••••••"} style={{ ...s.input(), marginBottom: 12 }} />
            <label style={s.label}>Cor</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {MEMBER_COLORS.map(c => <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: form.color === c ? `3px solid ${T.text}` : "3px solid transparent", transition: "border .15s" }} />)}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(null)} style={s.btn(T.bg4, { color: T.text })}>Cancelar</button>
              <button onClick={() => {
                if (!form.name?.trim()) return;
                const pwdHash = form.newPassword ? hashPwd(form.newPassword) : (members.find(m => m.id === editing)?.passwordHash || hashPwd("1234"));
                const data = { ...form, avatar: initials(form.name || "?"), passwordHash: pwdHash };
                delete data.newPassword;
                if (editing === "new") updateMembers([...members, { ...data, id: uid() }]);
                else updateMembers(members.map(m => m.id === editing ? { ...m, ...data } : m));
                setEditing(null);
              }} style={s.btn(T.accent)}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── ANALYTICS TAB ──────────────────────────────────────── */
function AnalyticsTab({ columns, members }) {
  const [filter, setFilter] = useState("all");
  const today = new Date().toISOString().slice(0, 10);

  const allCards = columns.flatMap(c => c.cards.map(card => ({ ...card, colId: c.id, colTitle: c.title })));
  const completedCards = allCards.filter(c => c.completed);
  const overdueCards = allCards.filter(card => !card.completed && card.due && card.due < today);

  const filtered = filter === "all" ? completedCards : completedCards.filter(c => toArr(c.members).includes(filter));

  const typeCounts = {};
  filtered.forEach(c => { typeCounts[c.type] = (typeCounts[c.type] || 0) + 1; });
  const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const maxT = Math.max(...topTypes.map(([, v]) => v), 1);

  const mStats = members.map(m => {
    const done = completedCards.filter(c => toArr(c.members).includes(m.id));
    const overdue = overdueCards.filter(c => toArr(c.members).includes(m.id)).length;
    return { ...m, done: done.length, pts: done.reduce((a, c) => a + (c.points || 0), 0), total: allCards.filter(c => toArr(c.members).includes(m.id)).length, overdue };
  }).sort((a, b) => b.pts - a.pts);
  const maxPts = Math.max(...mStats.map(m => m.pts), 1);

  const priCounts = { facil: 0, medio: 0, dificil: 0, complexo: 0 };
  filtered.forEach(c => { if (priCounts[c.priority] !== undefined) priCounts[c.priority]++; });

  const getWeekSparkline = (memberId) => {
    const weeks = 8;
    const now = new Date();
    const data = [];
    for (let w = weeks - 1; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (w + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - w * 7);
      const count = completedCards.filter(c => {
        if (memberId !== "all" && !toArr(c.members).includes(memberId)) return false;
        if (!c.due) return false;
        const d = new Date(c.due);
        return d >= weekStart && d < weekEnd;
      }).length;
      data.push(count);
    }
    return data;
  };

  const kpis = [
    ["Total", allCards.length, T.blue, "📋"],
    ["Concluídas", completedCards.length, T.green, "✅"],
    ["Taxa", `${Math.round((completedCards.length / (allCards.length || 1)) * 100)}%`, T.teal, "📈"],
    ["Pontos", filtered.reduce((a, c) => a + (c.points || 0), 0), T.amber, "⭐"],
  ];

  const daysDiff = (due) => {
    const d = new Date(due), t = new Date(today);
    return Math.floor((t - d) / (1000 * 60 * 60 * 24));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>Análise de Produção</h2>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={s.select({ maxWidth: 200 })}>
          <option value="all">Todos os membros</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {kpis.map(([l, v, c, icon]) => (
          <div key={l} style={s.card({ padding: "14px 16px" })}>
            <p style={{ margin: "0 0 4px", fontSize: 20 }}>{icon}</p>
            <p style={{ margin: "0 0 2px", fontSize: 24, fontWeight: 900, color: c }}>{v}</p>
            <p style={{ margin: 0, fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{l}</p>
          </div>
        ))}
      </div>

      <div style={s.card({ padding: 18, marginBottom: 16 })}>
        <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: T.text }}>📈 Ritmo de conclusão — últimas 8 semanas</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.accentDim, border: `2px solid ${T.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>👥</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.text, minWidth: 90 }}>Equipe</span>
            <Sparkline data={getWeekSparkline("all")} color={T.accent} width={120} height={28} />
            <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 4 }}>{getWeekSparkline("all").reduce((a, b) => a + b, 0)} concluídas</span>
          </div>
          {members.map(m => {
            const spark = getWeekSparkline(m.id);
            const total = spark.reduce((a, b) => a + b, 0);
            return (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar member={m} size={28} showOnline />
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text, minWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name.split(" ")[0]}</span>
                <Sparkline data={spark} color={m.color} width={120} height={28} />
                <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 4 }}>{total} concluídas</span>
              </div>
            );
          })}
        </div>
      </div>

      {overdueCards.length > 0 && (
        <div style={s.card({ padding: 18, marginBottom: 16, border: `1px solid ${T.red}44` })}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ background: T.redDim, borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: T.red }}>Tarefas Atrasadas</span>
              <span style={{ background: T.red, color: "#fff", borderRadius: "50%", width: 20, height: 20, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{overdueCards.length}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {overdueCards.map(card => {
              const cardMembers = members.filter(m => toArr(card.members).includes(m.id));
              const pri = getPriority(card.priority);
              const dias = daysDiff(card.due);
              return (
                <div key={card.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: T.redDim, borderRadius: 10, border: `1px solid ${T.red}33` }}>
                  <div style={{ width: 4, height: 36, borderRadius: 99, background: T.red, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.title}</p>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={s.badge(T.accent)}>{card.type}</span>
                      <span style={s.badge(pri.color)}>{pri.label}</span>
                      <span style={{ ...s.badge(T.red) }}>📅 {fmtDate(card.due)} · {dias}d atraso</span>
                      <span style={{ fontSize: 10, color: T.textMuted }}>📌 {card.colTitle}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexShrink: 0 }}>
                    {cardMembers.map((m, i) => <div key={m.id} style={{ marginLeft: i ? -6 : 0 }}><Avatar member={m} size={26} showOnline /></div>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {overdueCards.length === 0 && (
        <div style={s.card({ padding: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 })}>
          <span style={{ fontSize: 20 }}>✅</span>
          <span style={{ fontSize: 13, color: T.green, fontWeight: 600 }}>Nenhuma tarefa atrasada!</span>
        </div>
      )}

      <div className="analytics-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={s.card({ padding: 18 })}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: T.text }}>Tipos mais realizados</h3>
          {topTypes.length === 0
            ? <p style={{ color: T.textMuted, fontSize: 13 }}>Sem dados</p>
            : topTypes.map(([type, count]) => (
              <div key={type} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: T.text }}>{type}</span>
                  <span style={{ color: T.textMuted }}>{count}</span>
                </div>
                <div style={{ background: T.bg3, borderRadius: 99, height: 6 }}>
                  <div style={{ background: T.accent, borderRadius: 99, height: 6, width: `${(count / maxT) * 100}%`, transition: "width .5s" }} />
                </div>
              </div>
            ))}
        </div>
        <div style={s.card({ padding: 18 })}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: T.text }}>Pontuação por integrante</h3>
          {mStats.map((m, i) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: i < 3 ? [T.amber, T.textSub, "#cd7f32"][i] : T.textMuted, width: 18 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
              <Avatar member={m} size={24} showOnline />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3, gap: 4 }}>
                  <span style={{ fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name.split(" ")[0]}</span>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {m.overdue > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: T.red }}>⚠️{m.overdue}</span>}
                    <span style={{ color: T.amber, fontWeight: 700 }}>⭐ {m.pts}</span>
                  </div>
                </div>
                <div style={{ background: T.bg3, borderRadius: 99, height: 5 }}>
                  <div style={{ background: m.color, borderRadius: 99, height: 5, width: `${(m.pts / maxPts) * 100}%`, transition: "width .5s" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={s.card({ padding: 18 })}>
        <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: T.text }}>Distribuição por prioridade (concluídas)</h3>
        <div className="pri-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {PRIORITIES.map(p => (
            <div key={p.id} style={{ textAlign: "center", background: p.color + "18", borderRadius: 10, padding: "14px 10px", border: `1px solid ${p.color}33` }}>
              <p style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 900, color: p.color }}>{priCounts[p.id] || 0}</p>
              <p style={{ margin: "0 0 2px", fontSize: 12, color: T.text, fontWeight: 600 }}>{p.label}</p>
              <p style={{ margin: 0, fontSize: 10, color: p.color, fontWeight: 700 }}>⭐{p.points}pts</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── CSV GUIDE ──────────────────────────────────────────── */
function CSVGuide({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.card({ padding: 24, maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px #000000cc" })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontWeight: 800, color: T.text, fontSize: 17 }}>📖 Como exportar dados</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 22 }}>×</button>
        </div>
        {[
          { plat: "📸 Instagram", color: T.pink, steps: ["Acesse o Meta Business Suite (business.facebook.com)", "Vá em Insights → Conteúdo", "Clique em Exportar dados", "Selecione o período e formato CSV"] },
          { plat: "🎵 TikTok",    color: T.red,  steps: ["Acesse o TikTok Studio (studio.tiktok.com)", "Vá em Análises", "Selecione o período", "Clique em Exportar dados → CSV"] },
          { plat: "▶️ YouTube",   color: T.red,  steps: ["Acesse o YouTube Studio (studio.youtube.com)", "Vá em Análises", "Escolha o período", "3 pontos → Exportar relatório → CSV"] },
        ].map(({ plat, color, steps }) => (
          <div key={plat} style={{ marginBottom: 18 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color }}>{plat}</h3>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {steps.map((step, i) => <li key={i} style={{ fontSize: 13, color: T.textSub, marginBottom: 6, lineHeight: 1.5 }}>{step}</li>)}
            </ol>
          </div>
        ))}
        <button onClick={onClose} style={s.btn(T.accent, { width: "100%", marginTop: 16, padding: 12 })}>Entendido!</button>
      </div>
    </div>
  );
}

/* ─── SOCIAL TAB — HELPERS ───────────────────────────────── */
const PLATFORM_COLORS = { instagram: "#E1306C", tiktok: "#ff2d55", youtube: "#FF0000" };
const PLATFORM_ICONS  = { instagram: "📸", tiktok: "🎵", youtube: "▶️" };
const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ flex: 1, background: color + "22", borderRadius: 4, height: 6, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width .5s" }} />
    </div>
  );
}

function SocialSparkline({ data, color = "#7c6af7", width = 100, height = 36 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const lx = width;
  const ly = height - ((last - min) / range) * (height - 8) - 4;
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg${color.replace(/[^a-zA-Z0-9]/g,"")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#sg${color.replace(/[^a-zA-Z0-9]/g,"")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={lx} cy={ly} r={3} fill={color} />
    </svg>
  );
}

function TrendBadge({ current, previous }) {
  if (!previous && previous !== 0) return null;
  const pct = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const up = pct >= 0;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: up ? T.green : T.red, background: up ? T.green + "22" : T.red + "22", border: `1px solid ${up ? T.green : T.red}44`, borderRadius: 20, padding: "2px 7px", display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function GaugeRing({ value, max, color, size = 64, label }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color+"22"} strokeWidth={8}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray .6s ease" }}/>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: size > 60 ? 13 : 11, fontWeight: 900, color, lineHeight: 1 }}>{fmtNum(value)}</span>
        </div>
      </div>
      <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textAlign: "center" }}>{label}</span>
    </div>
  );
}

/* ─── SOCIAL TAB ─────────────────────────────────────────── */
function SocialTab({ data, updateData }) {
  const [platform, setPlatform] = useState("instagram");
  const [selMonth, setSelMonth] = useState(null);
  const [growthMetric, setGrowthMetric] = useState("views");
  const [sortBy, setSortBy] = useState("views");
  const [guide, setGuide] = useState(false);
  const [csvError, setCsvError] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);

  const pc = PLATFORM_COLORS[platform];

  const allPosts = React.useMemo(() => toArr(data[platform]), [data, platform]);

  const availableMonths = React.useMemo(() => {
    const set = new Set();
    allPosts.forEach(p => { if (p.date) set.add(p.date.slice(0, 7)); });
    return [...set].sort();
  }, [allPosts]);

  const monthPosts = React.useMemo(() => {
    if (!selMonth) return allPosts;
    return allPosts.filter(p => p.date && p.date.startsWith(selMonth));
  }, [allPosts, selMonth]);

  const sortedPosts = React.useMemo(
    () => [...monthPosts].sort((a, b) => b[sortBy] - a[sortBy]),
    [monthPosts, sortBy]
  );

  const totals = React.useMemo(() => monthPosts.reduce(
    (acc, p) => ({ views: acc.views + (p.views||0), likes: acc.likes + (p.likes||0), comments: acc.comments + (p.comments||0), shares: acc.shares + (p.shares||0), saves: acc.saves + (p.saves||0) }),
    { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
  ), [monthPosts]);

  const n = monthPosts.length || 1;
  const avgs = {
    views:    Math.round(totals.views    / n),
    likes:    Math.round(totals.likes    / n),
    comments: Math.round(totals.comments / n),
    shares:   Math.round(totals.shares   / n),
    saves:    Math.round(totals.saves    / n),
  };

  const avgEngRate = monthPosts.length > 0
    ? (monthPosts.reduce((a, p) => {
        const eng = (p.likes||0) + (p.comments||0) + (p.shares||0);
        return a + (p.views > 0 ? (eng / p.views) * 100 : 0);
      }, 0) / monthPosts.length).toFixed(1)
    : "0.0";

  const ranked = [...monthPosts].sort((a, b) => b[sortBy] - a[sortBy]);
  const top3    = ranked.slice(0, 3);
  const bottom3 = ranked.length > 3 ? ranked.slice(-3).reverse() : [];

  const growthSeries = React.useMemo(() => {
    return availableMonths.map(ym => {
      const ps = allPosts.filter(p => p.date && p.date.startsWith(ym));
      const sum = ps.reduce((a, p) => a + (p[growthMetric] || 0), 0);
      return { ym, value: ps.length > 0 ? Math.round(sum / ps.length) : 0, posts: ps.length };
    });
  }, [allPosts, growthMetric, availableMonths]);

  const maxGrowth = Math.max(...growthSeries.map(g => g.value), 1);
  const sparkData = growthSeries.map(g => g.value);

  const monthLabel = (ym) => {
    if (!ym) return null;
    const [yr, mo] = ym.split("-");
    return `${MONTHS_PT[parseInt(mo, 10) - 1]} ${yr}`;
  };

  const METRIC_OPTS = [
    { id: "views",    label: "Visualizações", icon: "👁️",  color: T.blue  },
    { id: "likes",    label: "Curtidas",      icon: "❤️",  color: pc      },
    { id: "comments", label: "Comentários",   icon: "💬",  color: T.teal  },
    { id: "shares",   label: "Compartilhados",icon: "📤",  color: T.green },
    { id: "saves",    label: "Salvamentos",   icon: "🔖",  color: T.amber },
  ];

  const metricColor = (id) => {
    if (id === "likes") return pc;
    return METRIC_OPTS.find(m => m.id === id)?.color || T.accent;
  };
  const metricIcon  = (id) => METRIC_OPTS.find(m => m.id === id)?.icon || "📊";

  // CSV parser
  const parseCSV = (text, plat) => {
    const raw = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const firstLine = raw.split("\n")[0] || "";
    let sc = 0, ss = 0, inQd = false;
    for (const ch of firstLine) {
      if (ch === '"') { inQd = !inQd; continue; }
      if (!inQd && ch === ",") sc++;
      if (!inQd && ch === ";") ss++;
    }
    const sep = ss > sc ? ";" : ",";
    const records = [];
    let cur = "", fields = [], inQuote = false;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (ch === '"') {
        if (inQuote && raw[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (!inQuote && ch === sep) {
        fields.push(cur); cur = "";
      } else if (!inQuote && ch === "\n") {
        fields.push(cur); cur = "";
        if (fields.some(f => f.trim())) records.push(fields);
        fields = [];
      } else { cur += ch; }
    }
    if (fields.length || cur) { fields.push(cur); if (fields.some(f => f.trim())) records.push(fields); }
    if (records.length < 2) return { rows: [], headers: [], sep, error: "Arquivo vazio ou sem dados suficientes." };
    const headers = records[0].map(h => h.trim().toLowerCase());
    const dataRows = records.slice(1);
    const findIdx = (exactTerms, partialTerms) => {
      const ei = headers.findIndex(h => exactTerms.some(k => h === k));
      if (ei >= 0) return ei;
      return headers.findIndex(h => (partialTerms || exactTerms).some(k => h.includes(k)));
    };
    const iDesc     = findIdx(["descrição","description","caption","legenda"], ["título","title","conteúdo"]);
    const iType     = findIdx(["tipo de post","post type","media type","tipo"], []);
    const iPubDate  = findIdx(["horário de publicação","data de publicação","published at","post date"], ["horário","publicado","created"]);
    const iDataCol  = findIdx(["data"], []);
    const iViews    = findIdx(["visualizações","views","plays","reproduções","video views"], ["visualiz","impres"]);
    const iReach    = findIdx(["alcance","reach"], []);
    const iLikes    = findIdx(["curtidas","likes","reações","reactions"], ["curtida","like","reação"]);
    const iShares   = findIdx(["compartilhamentos","shares"], ["compartilh","share"]);
    const iComments = findIdx(["comentários","comments"], ["comentar","comment"]);
    const iSaves    = findIdx(["salvamentos","saves","bookmarks"], ["salv","save"]);
    const get = (row, i) => (i >= 0 && i < row.length) ? row[i].trim() : "";
    const parseNum = (val) => {
      const s2 = String(val || "").trim().replace(/\s/g, "");
      if (!s2) return 0;
      if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(s2)) return Math.round(parseFloat(s2.replace(/\./g, "").replace(",", ".")) || 0);
      if (/^\d{1,3}(,\d{3})*(\.\d+)?$/.test(s2)) return Math.round(parseFloat(s2.replace(/,/g, "")) || 0);
      return Math.round(parseFloat(s2.replace(/[^\d.]/g, "")) || 0);
    };
    const hasTotalRows = iDataCol >= 0 && dataRows.some(r => get(r, iDataCol).toLowerCase() === "total");
    const filtered2 = hasTotalRows ? dataRows.filter(r => get(r, iDataCol).toLowerCase() === "total") : dataRows;
    const rows = filtered2.map((row, idx) => {
      let title = get(row, iDesc);
      if (!title) title = `Post ${idx + 1}`;
      title = title.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
      const hashIdx = title.indexOf(" #");
      if (hashIdx > 20) title = title.slice(0, hashIdx).trim();
      title = title.slice(0, 80) || `Post ${idx + 1}`;
      const views    = parseNum(get(row, iViews)) || parseNum(get(row, iReach));
      const likes    = parseNum(get(row, iLikes));
      const comments = parseNum(get(row, iComments));
      const shares   = parseNum(get(row, iShares));
      const saves    = parseNum(get(row, iSaves));
      let date = get(row, iPubDate) || new Date().toISOString().slice(0, 10);
      const mdy = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (mdy) date = `${mdy[3]}-${mdy[1].padStart(2,"0")}-${mdy[2].padStart(2,"0")}`;
      else date = date.slice(0, 10);
      const rawType = get(row, iType);
      const type = /reel/i.test(rawType) ? "Reels" : /story|storie/i.test(rawType) ? "Story" : /live/i.test(rawType) ? "Live" : /v[íi]deo|video/i.test(rawType) ? "Vídeo" : "Post";
      return { id: uid(), title, thumbnail: PLATFORM_ICONS[plat], views, likes, comments, shares, saves, date, type };
    }).filter(r => r.title.length > 0);
    return { rows, headers, sep, error: null };
  };

  const handleCSV = e => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvError(null); setCsvPreview(null);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const result = parseCSV(ev.target.result, platform);
        if (result.error) { setCsvError(result.error); return; }
        if (!result.rows.length) { setCsvError("Nenhuma linha válida encontrada."); return; }
        updateData({ ...data, [platform]: [...toArr(data[platform]), ...result.rows] });
        setCsvPreview({ count: result.rows.length, sample: result.rows[0]?.title?.slice(0,60) || "" });
        setTimeout(() => setCsvPreview(null), 7000);
      } catch (err) { setCsvError("Erro: " + err.message); }
    };
    reader.onerror = () => setCsvError("Não foi possível ler o arquivo.");
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>Análise de Conteúdo</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setGuide(true)} style={s.btn(T.bg4, { color: T.textSub, fontSize: 12 })}>📖 Exportar</button>
          <label style={{ ...s.btn(T.teal, { cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }), userSelect: "none" }}>
            📥 CSV <input type="file" accept=".csv,.txt" onChange={handleCSV} style={{ display: "none" }} />
          </label>
          {allPosts.length > 0 && (
            <button onClick={() => { if (window.confirm(`Excluir todos os posts de ${platform}?`)) { updateData({ ...data, [platform]: [] }); setSelMonth(null); }}}
              style={s.btn(T.redDim, { color: T.red, fontSize: 12 })}>🗑️ Limpar</button>
          )}
        </div>
      </div>

      {/* CSV FEEDBACK */}
      {csvError && (
        <div style={{ background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 13, color: T.red }}>Erro ao importar CSV</p>
            <p style={{ margin: 0, fontSize: 12, color: T.textSub }}>{csvError}</p>
          </div>
          <button onClick={() => setCsvError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 18, padding: 0 }}>×</button>
        </div>
      )}
      {csvPreview && (
        <div style={{ background: T.greenDim, border: `1px solid ${T.green}44`, borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>✅</span>
          <div>
            <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 13, color: T.green }}>{csvPreview.count} itens importados!</p>
            <p style={{ margin: 0, fontSize: 11, color: T.textMuted }}>Primeiro: <strong style={{ color: T.textSub }}>{csvPreview.sample}</strong></p>
          </div>
        </div>
      )}

      {/* PLATAFORMAS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {["instagram","tiktok","youtube"].map(p => (
          <button key={p} onClick={() => { setPlatform(p); setSelMonth(null); }}
            style={{ padding: "8px 20px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit", background: platform === p ? PLATFORM_COLORS[p] : T.bg3, color: platform === p ? "#fff" : T.textMuted, transition: "all .2s", boxShadow: platform === p ? `0 4px 16px ${PLATFORM_COLORS[p]}44` : "none" }}>
            {PLATFORM_ICONS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* CHIPS DE MÊS */}
      {availableMonths.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Filtrar por mês</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setSelMonth(null)}
              style={{ padding: "5px 16px", borderRadius: 20, border: `1.5px solid ${!selMonth ? pc : T.border}`, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit", background: !selMonth ? pc + "22" : T.bg3, color: !selMonth ? pc : T.textMuted, transition: "all .2s" }}>
              Todos
            </button>
            {availableMonths.map(ym => {
              const [yr, mo] = ym.split("-");
              const active = selMonth === ym;
              return (
                <button key={ym} onClick={() => setSelMonth(active ? null : ym)}
                  style={{ padding: "5px 16px", borderRadius: 20, border: `1.5px solid ${active ? pc : T.border}`, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit", background: active ? pc + "22" : T.bg3, color: active ? pc : T.textMuted, transition: "all .2s", boxShadow: active ? `0 2px 8px ${pc}33` : "none" }}>
                  {MONTHS_PT[parseInt(mo,10)-1]} {yr}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SEM DADOS */}
      {allPosts.length === 0 && (
        <div style={s.card({ padding: 48, textAlign: "center" })}>
          <p style={{ fontSize: 36, margin: "0 0 10px" }}>📂</p>
          <p style={{ color: T.textMuted, fontSize: 14, margin: "0 0 6px" }}>Nenhum dado para {platform}.</p>
          <p style={{ color: T.textMuted, fontSize: 12, margin: 0 }}>Importe um CSV para começar.</p>
        </div>
      )}

      {allPosts.length > 0 && (
        <>
          {/* KPI GAUGES — médias */}
          <div style={s.card({ padding: "18px 20px", marginBottom: 16 })}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>
                {selMonth ? `📊 ${monthLabel(selMonth)} — ${monthPosts.length} post${monthPosts.length !== 1 ? "s" : ""}` : `📊 Total — ${allPosts.length} posts`}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: pc, background: pc+"22", borderRadius: 20, padding: "4px 12px", border: `1px solid ${pc}44` }}>
                  Eng. médio: {avgEngRate}%
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.amber, background: T.amberDim, borderRadius: 20, padding: "4px 12px", border: `1px solid ${T.amber}44` }}>
                  👁️ {fmtNum(totals.views)} views totais
                </span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 20 }}>
              {[
                { id:"views",    label:"Média Views",    color: T.blue,  val: avgs.views    },
                { id:"likes",    label:"Média Curtidas", color: pc,       val: avgs.likes    },
                { id:"comments", label:"Média Coments.", color: T.teal,   val: avgs.comments },
                { id:"shares",   label:"Média Compart.", color: T.green,  val: avgs.shares   },
                { id:"saves",    label:"Média Salvam.",  color: T.amber,  val: avgs.saves    },
              ].map(({ id, label, color, val }) => (
                <GaugeRing key={id} value={val} max={Math.max(avgs.views, 1)} color={color} size={72} label={label} />
              ))}
            </div>
          </div>

          {/* GRÁFICO DE CRESCIMENTO */}
          {availableMonths.length > 1 && (
            <div style={s.card({ padding: 18, marginBottom: 16 })}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>📈 Crescimento por mês</h3>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {METRIC_OPTS.map(m => (
                    <button key={m.id} onClick={() => setGrowthMetric(m.id)}
                      style={{ padding: "4px 12px", borderRadius: 20, border: `1.5px solid ${growthMetric === m.id ? metricColor(m.id) : T.border}`, cursor: "pointer", fontWeight: 700, fontSize: 11, fontFamily: "inherit", background: growthMetric === m.id ? metricColor(m.id)+"22" : T.bg3, color: growthMetric === m.id ? metricColor(m.id) : T.textMuted, transition: "all .2s" }}>
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sparkline area */}
              <div style={{ marginBottom: 18, paddingLeft: 4 }}>
                <SocialSparkline data={sparkData} color={metricColor(growthMetric)} width={Math.min(window.innerWidth - 80, 700)} height={56} />
              </div>

              {/* Barras mensais */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {growthSeries.map((g, i) => {
                  const prev = growthSeries[i - 1];
                  const [yr, mo] = g.ym.split("-");
                  const isSel = selMonth === g.ym;
                  return (
                    <div key={g.ym} onClick={() => setSelMonth(isSel ? null : g.ym)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, cursor: "pointer", background: isSel ? metricColor(growthMetric)+"18" : "transparent", border: `1px solid ${isSel ? metricColor(growthMetric)+"55" : "transparent"}`, transition: "all .2s" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, minWidth: 36, flexShrink: 0 }}>{MONTHS_PT[parseInt(mo,10)-1]}</span>
                      <MiniBar value={g.value} max={maxGrowth} color={metricColor(growthMetric)} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.text, minWidth: 52, textAlign: "right", flexShrink: 0 }}>{fmtNum(g.value)}</span>
                      <span style={{ fontSize: 10, color: T.textMuted, minWidth: 28, flexShrink: 0 }}>({g.posts}p)</span>
                      {prev && <TrendBadge current={g.value} previous={prev.value} />}
                    </div>
                  );
                })}
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 11, color: T.textMuted }}>💡 Clique em um mês para filtrar todos os dados abaixo</p>
            </div>
          )}

          {/* TOP 3 / PIORES 3 */}
          {monthPosts.length >= 2 && (
            <div className="top-bottom-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              {/* TOP 3 */}
              <div style={s.card({ padding: 16 })}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.green }}>🏆 Top 3 {selMonth ? monthLabel(selMonth) : ""}</h3>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textMuted, fontSize: 10, fontFamily: "inherit", padding: "2px 20px 2px 6px", cursor: "pointer", outline: "none", colorScheme: "dark", WebkitAppearance: "none", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%2355556a' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 5px center" }}>
                    {METRIC_OPTS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>
                {top3.map((p, i) => {
                  const medals = ["🥇","🥈","🥉"];
                  const eng = (p.likes||0) + (p.comments||0) + (p.shares||0);
                  const engRate = p.views > 0 ? ((eng / p.views) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < 2 ? `1px solid ${T.border}` : "none" }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{medals[i]}</span>
                      <div style={{ width: 36, height: 34, borderRadius: 8, background: pc+"33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{p.thumbnail}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 10, color: T.textMuted }}>{metricIcon(sortBy)} {fmtNum(p[sortBy] || 0)}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: +engRate > 5 ? T.green : +engRate > 2 ? T.amber : T.red }}>{engRate}% eng</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PIORES 3 */}
              <div style={s.card({ padding: 16 })}>
                <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: T.red }}>📉 Piores 3 {selMonth ? monthLabel(selMonth) : ""}</h3>
                {bottom3.length === 0 && <p style={{ color: T.textMuted, fontSize: 12, textAlign: "center", padding: "20px 0" }}>Poucos posts para comparar.</p>}
                {bottom3.map((p, i) => {
                  const eng = (p.likes||0) + (p.comments||0) + (p.shares||0);
                  const engRate = p.views > 0 ? ((eng / p.views) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < 2 ? `1px solid ${T.border}` : "none" }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>🔻</span>
                      <div style={{ width: 36, height: 34, borderRadius: 8, background: T.red+"22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{p.thumbnail}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 10, color: T.textMuted }}>{metricIcon(sortBy)} {fmtNum(p[sortBy] || 0)}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: +engRate > 5 ? T.green : +engRate > 2 ? T.amber : T.red }}>{engRate}% eng</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LISTA COMPLETA */}
          <div style={{ ...s.card({ padding: "12px 16px", marginBottom: 10 }), display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>
              Todos os posts {selMonth ? `— ${monthLabel(selMonth)}` : ""} ({sortedPosts.length})
            </h3>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={s.select({ maxWidth: 160, fontSize: 12 })}>
              {METRIC_OPTS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sortedPosts.length === 0 && (
              <div style={s.card({ padding: 32, textAlign: "center" })}>
                <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>Nenhum post neste mês.</p>
              </div>
            )}
            {sortedPosts.map((post, rank) => {
              const eng = (post.likes||0) + (post.comments||0) + (post.shares||0);
              const engRate = post.views > 0 ? ((eng / post.views) * 100).toFixed(1) : "0.0";
              return (
                <div key={post.id} style={s.card({ padding: 14, display: "flex", gap: 12, alignItems: "flex-start" })}>
                  <div style={{ width: 52, height: 48, borderRadius: 10, background: `${pc}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, position: "relative" }}>
                    {post.thumbnail}
                    {rank === 0 && selMonth && <div style={{ position: "absolute", top: -8, right: -8, background: T.amber, color: "#000", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900 }}>🏆</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</p>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <Pill label={post.type} color={pc} />
                          <span style={{ fontSize: 11, color: T.textMuted }}>📅 {post.date}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: T.text }}>{fmtNum(post.views)}</p>
                        <p style={{ margin: 0, fontSize: 10, color: T.textMuted }}>views</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
                      {[["❤️",post.likes,"Curtidas"],["💬",post.comments,"Coments."],["📤",post.shares,"Compart."],["🔖",post.saves||0,"Salvam."]].map(([icon,val,label]) => (
                        <div key={label}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{fmtNum(val)} </span>
                          <span style={{ fontSize: 10, color: T.textMuted }}>{icon} {label}</span>
                        </div>
                      ))}
                      <div style={{ marginLeft: "auto" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: +engRate > 5 ? T.green : +engRate > 2 ? T.amber : T.red }}>{engRate}% </span>
                        <span style={{ fontSize: 10, color: T.textMuted }}>eng.</span>
                      </div>
                    </div>
                    <div style={{ background: T.bg3, borderRadius: 99, height: 4 }}>
                      <div style={{ background: pc, borderRadius: 99, height: 4, width: `${Math.min(+engRate / 15 * 100, 100)}%`, transition: "width .5s" }} />
                    </div>
                  </div>
                  <button onClick={() => updateData({ ...data, [platform]: toArr(data[platform]).filter(p => p.id !== post.id) })}
                    style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 16, padding: 0, flexShrink: 0 }}>🗑️</button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {guide && <CSVGuide onClose={() => setGuide(false)} />}
    </div>
  );
}

/* ─── CALENDAR TAB ───────────────────────────────────────── */
function CalendarTab({ members, columns, events, updateEvents, taskTypes }) {
  const [cur, setCur] = useState(new Date(2026, 4, 1));
  const [sel, setSel] = useState(null);
  const [addModal, setAddModal] = useState(null);
  const [form, setForm] = useState({ title: "", type: taskTypes[0] || "Post", memberId: "" });
  const [draggingEvent, setDraggingEvent] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);

  const year = cur.getFullYear(), month = cur.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const DAY_NAMES = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const today = new Date();
  const isToday = d => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  const dateStr = d => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const eventsFor = d => toArr(events).filter(e => e.date === dateStr(d));
  const allCards = columns.flatMap(c => c.cards);
  const memberColor = id => members.find(m => m.id === id)?.color || T.textMuted;

  const handleEventDragStart = (e, ev) => { e.stopPropagation(); setDraggingEvent(ev); };
  const handleDayDragOver = (e, day) => { e.preventDefault(); setDragOverDay(day); };
  const handleDayDrop = (e, day) => {
    e.preventDefault();
    if (!draggingEvent) return;
    const newDate = dateStr(day);
    const updatedEvents = toArr(events).map(ev => ev.id === draggingEvent.id ? { ...ev, date: newDate } : ev);
    updateEvents(updatedEvents);
    setDraggingEvent(null); setDragOverDay(null); setSel(day);
  };
  const handleDragEnd = () => { setDraggingEvent(null); setDragOverDay(null); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>Calendário</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setCur(new Date(year, month - 1))} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: T.text, fontSize: 16 }}>‹</button>
          <span style={{ fontWeight: 700, fontSize: 13, color: T.text, minWidth: 120, textAlign: "center" }}>{MONTHS[month].slice(0,3)} {year}</span>
          <button onClick={() => setCur(new Date(year, month + 1))} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: T.text, fontSize: 16 }}>›</button>
        </div>
      </div>

      {draggingEvent && (
        <div style={{ background: T.accentDim, border: `1px solid ${T.accent}44`, borderRadius: 8, padding: "6px 12px", marginBottom: 10, fontSize: 12, color: T.accent, display: "flex", alignItems: "center", gap: 6 }}>
          <span>📅</span> Arrastando: <strong>{draggingEvent.title}</strong> — solte em um dia para mover
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <div style={s.card({ overflow: "hidden", minWidth: 320 })}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: T.bg2, borderBottom: `1px solid ${T.border}` }}>
            {DAY_NAMES.map(d => <div key={d} style={{ padding: "8px 0", textAlign: "center", fontSize: 10, fontWeight: 700, color: T.textMuted }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
            {Array.from({ length: first }).map((_, i) => <div key={`e${i}`} style={{ minHeight: 70, borderBottom: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}`, background: T.bg1 }} />)}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const evs = eventsFor(day);
              const dueCards = allCards.filter(c => c.due === dateStr(day));
              const isSel = sel === day;
              const isDragOver = dragOverDay === day;
              return (
                <div key={day}
                  onClick={() => setSel(day === sel ? null : day)}
                  onDragOver={e => handleDayDragOver(e, day)}
                  onDrop={e => handleDayDrop(e, day)}
                  onDragLeave={() => setDragOverDay(null)}
                  style={{ minHeight: 70, borderBottom: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}`, padding: "6px 4px", cursor: "pointer", background: isDragOver ? T.accent + "22" : isSel ? T.accentDim : isToday(day) ? T.blueDim : T.bg2, border: isDragOver ? `2px solid ${T.accent}` : undefined, transition: "background .15s" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isToday(day) ? T.blue : "transparent", color: isToday(day) ? "#fff" : T.text, fontWeight: isToday(day) ? 700 : 500, fontSize: 11, marginBottom: 3 }}>{day}</div>
                  {evs.slice(0, 2).map(ev => (
                    <div key={ev.id} draggable onDragStart={e => handleEventDragStart(e, ev)} onDragEnd={handleDragEnd} onClick={e => e.stopPropagation()}
                      style={{ background: memberColor(ev.memberId) + "33", borderLeft: `2px solid ${memberColor(ev.memberId)}`, borderRadius: "0 3px 3px 0", padding: "1px 4px", marginBottom: 2, fontSize: 9, fontWeight: 600, color: memberColor(ev.memberId), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "grab", opacity: draggingEvent?.id === ev.id ? 0.4 : 1 }}>
                      {ev.title}
                    </div>
                  ))}
                  {dueCards.slice(0, 1).map(c => (
                    <div key={c.id} style={{ background: T.amber + "22", borderLeft: `2px solid ${T.amber}`, borderRadius: "0 3px 3px 0", padding: "1px 4px", marginBottom: 2, fontSize: 9, fontWeight: 600, color: T.amber, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>⭐ {c.title}</div>
                  ))}
                  {(evs.length + dueCards.length) > 3 && <div style={{ fontSize: 9, color: T.textMuted }}>+{evs.length + dueCards.length - 3}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {sel && (
        <div style={s.card({ marginTop: 14, padding: 14 })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>Dia {sel} de {MONTHS[month]}</h3>
            <button onClick={() => setAddModal(dateStr(sel))} style={s.btn(T.accent, { fontSize: 12, padding: "6px 12px" })}>+ Evento</button>
          </div>
          {eventsFor(sel).map(ev => {
            const mb = members.find(m => m.id === ev.memberId);
            return (
              <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 3, height: 36, borderRadius: 99, background: memberColor(ev.memberId) }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</p>
                  <p style={{ margin: 0, fontSize: 11, color: T.textMuted }}>{ev.type}</p>
                </div>
                {mb && <Avatar member={mb} size={26} showOnline />}
                <button onClick={() => updateEvents(toArr(events).filter(e => e.id !== ev.id))} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 16 }}>🗑️</button>
              </div>
            );
          })}
          {allCards.filter(c => c.due === dateStr(sel)).map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ width: 3, height: 36, borderRadius: 99, background: T.amber }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: T.text }}>{c.title}</p>
                <p style={{ margin: 0, fontSize: 11, color: T.amber }}>⭐ Prazo de card</p>
              </div>
            </div>
          ))}
          {eventsFor(sel).length === 0 && allCards.filter(c => c.due === dateStr(sel)).length === 0 && (
            <p style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: "14px 0" }}>Nenhum evento</p>
          )}
        </div>
      )}

      {addModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }} onClick={e => e.target === e.currentTarget && setAddModal(null)}>
          <div style={s.card({ padding: 24, width: "100%", maxWidth: 360, boxShadow: "0 24px 64px #000000cc" })}>
            <h3 style={{ margin: "0 0 20px", fontWeight: 800, color: T.text }}>Novo evento — {addModal}</h3>
            <label style={s.label}>Título</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ ...s.input(), marginBottom: 12 }} />
            <label style={s.label}>Tipo</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ ...s.select(), marginBottom: 12 }}>
              {taskTypes.map(t => <option key={t}>{t}</option>)}
            </select>
            <label style={s.label}>Responsável</label>
            <select value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))} style={{ ...s.select(), marginBottom: 20 }}>
              <option value="">Selecionar...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setAddModal(null)} style={s.btn(T.bg4, { color: T.text })}>Cancelar</button>
              <button onClick={() => {
                if (!form.title.trim()) return;
                updateEvents([...toArr(events), { id: uid(), date: addModal, title: form.title, type: form.type, memberId: form.memberId }]);
                setAddModal(null);
                setForm({ title: "", type: taskTypes[0] || "Post", memberId: "" });
              }} style={s.btn(T.accent)}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── APP ────────────────────────────────────────────────── */
export default function App() {
  const [members, setMembers]       = useState([]);
  const [columns, setColumns]       = useState([]);
  const [events, setEvents]         = useState([]);
  const [socialData, setSocialData] = useState({});
  const [taskTypes, setTaskTypes]   = useState(DEFAULT_TASK_TYPES);
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab]               = useState("board");
  const [notifs, setNotifs]         = useState({});
  const [dbReady, setDbReady]       = useState(false);
  const [myCardsMode, setMyCardsModeState] = useState(() => localStorage.getItem(MY_CARDS_KEY) === "1");

  const setMyCardsMode = (val) => {
    setMyCardsModeState(val);
    localStorage.setItem(MY_CARDS_KEY, val ? "1" : "0");
  };

  useOnlinePresence(currentUser?.id);

  useEffect(() => {
    if (!dbReady || currentUser) return;
    const savedId = localStorage.getItem(REMEMBER_KEY);
    if (savedId && members.length > 0) {
      const found = members.find(m => String(m.id) === String(savedId));
      if (found) setCurrentUser(found);
    }
  }, [members, dbReady]);

  useEffect(() => {
    onValue(ref(db, '/'), snap => {
      if (!snap.exists()) {
        set(ref(db, '/'), { members: INIT_MEMBERS, columns: INIT_COLUMNS, events: INIT_EVENTS, social: INIT_SOCIAL, taskTypes: DEFAULT_TASK_TYPES });
      }
      setDbReady(true);
    }, { onlyOnce: true });

    const unsubs = [
      onValue(ref(db, 'members'),   snap => setMembers(toArr(snap.val()))),
      onValue(ref(db, 'columns'),   snap => setColumns(normalizeCols(snap.val()))),
      onValue(ref(db, 'events'),    snap => setEvents(toArr(snap.val()))),
      onValue(ref(db, 'social'),    snap => setSocialData(snap.val() || {})),
      onValue(ref(db, 'taskTypes'), snap => { if (snap.val()) setTaskTypes(toArr(snap.val())); }),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const updateMembers   = v => set(ref(db, 'members'), v);
  const updateColumns   = v => set(ref(db, 'columns'), v);
  const updateEvents    = v => set(ref(db, 'events'), v);
  const updateSocial    = v => set(ref(db, 'social'), v);
  const updateTaskTypes = v => set(ref(db, 'taskTypes'), v);

  const onLogin    = member => setCurrentUser(member);
  const onRegister = member => updateMembers([...members, member]);
  const onLogout   = () => { localStorage.removeItem(REMEMBER_KEY); setCurrentUser(null); };

  const onNotify = useCallback((memberId, text) => {
    const notif = { id: uid(), text, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), read: false };
    setNotifs(n => ({ ...n, [memberId]: [notif, ...(n[memberId] || [])] }));
  }, []);

  const myNotifs    = notifs[currentUser?.id] || [];
  const clearNotifs = () => setNotifs(n => ({ ...n, [currentUser.id]: (n[currentUser.id] || []).map(x => ({ ...x, read: true })) }));

  const TABS = [
    { id: "board",     label: "Board",    icon: "📋" },
    { id: "users",     label: "Usuários", icon: "👥" },
    { id: "analytics", label: "Análise",  icon: "📊" },
    { id: "social",    label: "Social",   icon: "📱" },
    { id: "calendar",  label: "Agenda",   icon: "📅" },
  ];

  if (!currentUser) {
    return (
      <>
        <GlobalStyles />
        <LoginScreen members={members} onLogin={onLogin} onRegister={onRegister} />
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", background: T.bg0, fontFamily: "'DM Sans',system-ui,sans-serif", color: T.text }}>

        {/* HEADER */}
        <div style={{ background: T.bg1, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1400, margin: "0 auto", padding: "0 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", flexShrink: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 13 }}>SM</div>
            </div>

            <nav style={{ display: "flex", flex: 1, justifyContent: "center" }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "12px 10px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit", background: "transparent", color: tab === t.id ? T.accent : T.textMuted, borderBottom: tab === t.id ? `2px solid ${T.accent}` : "2px solid transparent", transition: "all .15s", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 16 }}>{t.icon}</span>
                  <span className="nav-label">{t.label}</span>
                </button>
              ))}
            </nav>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <button onClick={() => setMyCardsMode(!myCardsMode)} title={myCardsMode ? "Ver todos" : "Filtrar meus cards"}
                style={{ background: myCardsMode ? T.accent : T.bg3, border: `1px solid ${myCardsMode ? T.accent : T.border}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: myCardsMode ? "#fff" : T.textMuted, fontSize: 11, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, transition: "all .2s" }}>
                <span style={{ fontSize: 14 }}>🎯</span>
                <span className="nav-label">Meus cards</span>
              </button>

              <NotifBell notifs={myNotifs} onClear={clearNotifs} />

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ position: "relative" }}>
                  <Avatar member={currentUser} size={32} />
                  <div style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, borderRadius: "50%", background: T.green, border: `2px solid ${T.bg1}`, animation: "pulse 2s infinite" }} />
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>{currentUser.name.split(" ")[0]}</p>
                  <p style={{ margin: 0, fontSize: 10, color: T.textMuted }}>{currentUser.role}</p>
                </div>
              </div>

              <button onClick={onLogout} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: T.textMuted, fontSize: 12, fontFamily: "inherit", transition: "border-color .15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.red}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 12px 48px" }}>
          {tab === "board"     && <BoardTab     columns={columns} updateColumns={updateColumns} members={members} currentUser={currentUser} onNotify={onNotify} taskTypes={taskTypes} updateTaskTypes={updateTaskTypes} myCardsMode={myCardsMode} setMyCardsMode={setMyCardsMode} />}
          {tab === "users"     && <UsersTab     members={members} updateMembers={updateMembers} columns={columns} />}
          {tab === "analytics" && <AnalyticsTab columns={columns} members={members} />}
          {tab === "social"    && <SocialTab    data={socialData} updateData={updateSocial} />}
          {tab === "calendar"  && <CalendarTab  members={members} columns={columns} events={events} updateEvents={updateEvents} taskTypes={taskTypes} />}
        </div>
      </div>
    </>
  );
}