import { useState, useRef, useCallback, useEffect } from "react";

const GOOGLE_CLIENT_ID = "273668627967-ge1j5lp5ohkqca4i8b95cn4qrc1fhl44.apps.googleusercontent.com";
const API = "http://localhost:8000";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --black: #080808; --dark: #111111; --card: #161616; --border: #242424;
    --green: #CAFF33; --green-dim: #CAFF3322; --white: #F5F5F5;
    --muted: #666; --red: #FF4444; --blue: #4488FF; --orange: #FF9500;
  }

  html, body, #root { height: 100%; background: var(--black); color: var(--white); font-family: 'Outfit', sans-serif; }
  ::selection { background: var(--green); color: var(--black); }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--dark); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes spin   { to { transform:rotate(360deg); } }
  @keyframes slideUp { from { opacity:0; transform:translateY(40px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }

  .fade-up   { animation: fadeUp 0.5s ease both; }
  .fade-up-1 { animation-delay:.05s; }
  .fade-up-2 { animation-delay:.1s; }
  .fade-up-3 { animation-delay:.15s; }
  .fade-up-4 { animation-delay:.2s; }
  .fade-up-5 { animation-delay:.25s; }

  input, button, select { font-family:'Outfit',sans-serif; }

  input, select {
    width:100%; background:var(--dark); border:1px solid var(--border);
    color:var(--white); padding:13px 16px; border-radius:10px;
    font-size:14px; outline:none; transition:border-color .2s;
  }
  input:focus, select:focus { border-color:var(--green); }
  input::placeholder { color:var(--muted); }
  select option { background:var(--dark); }

  .btn {
    padding:13px 24px; border-radius:10px; border:1px solid var(--border);
    background:var(--card); color:var(--white); font-size:14px; font-weight:500;
    cursor:pointer; transition:all .15s; white-space:nowrap;
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
  }
  .btn:hover   { border-color:#444; background:#1e1e1e; }
  .btn:active  { transform:scale(.98); }
  .btn:disabled{ opacity:.4; cursor:not-allowed; transform:none; }
  .btn-primary { background:var(--green); color:var(--black); border-color:var(--green); font-weight:600; }
  .btn-primary:hover { background:#d4ff44; border-color:#d4ff44; }
  .btn-danger  { background:transparent; color:var(--red); border-color:#ff444433; }
  .btn-danger:hover { background:#ff44440d; border-color:var(--red); }
  .btn-ghost   { background:transparent; border-color:transparent; color:var(--muted); }
  .btn-ghost:hover { color:var(--white); }
  .btn-full    { width:100%; }
  .btn-orange  { background:var(--orange); color:#000; border-color:var(--orange); font-weight:600; }
  .btn-orange:hover { background:#ffaa20; border-color:#ffaa20; }

  .label { display:block; font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin-bottom:7px; }
  .field { margin-bottom:16px; }

  /* ── Auth ── */
  .auth-layout { min-height:100vh; display:grid; grid-template-columns:1fr 1fr; }
  .auth-hero {
    background:var(--dark); position:relative; overflow:hidden;
    display:flex; flex-direction:column; justify-content:flex-end; padding:48px;
  }
  .auth-hero-bg {
    position:absolute; inset:0;
    background: radial-gradient(ellipse 80% 60% at 50% 120%,#CAFF3318 0%,transparent 70%),
      repeating-linear-gradient(0deg,transparent,transparent 39px,#ffffff04 39px,#ffffff04 40px),
      repeating-linear-gradient(90deg,transparent,transparent 39px,#ffffff04 39px,#ffffff04 40px);
  }
  .auth-hero-number { font-family:'Bebas Neue',sans-serif; font-size:clamp(120px,18vw,220px); line-height:.85; color:transparent; -webkit-text-stroke:1px #CAFF3330; letter-spacing:-2px; position:relative; user-select:none; }
  .auth-hero-text   { position:relative; margin-top:32px; }
  .auth-hero-title  { font-family:'Bebas Neue',sans-serif; font-size:52px; letter-spacing:1px; line-height:1; }
  .auth-hero-sub    { font-size:14px; color:var(--muted); margin-top:10px; max-width:280px; line-height:1.6; }
  .auth-panel { display:flex; align-items:center; justify-content:center; padding:48px 40px; background:var(--black); overflow-y:auto; }
  .auth-form  { width:100%; max-width:380px; }
  .auth-tag { display:inline-flex; align-items:center; gap:6px; background:var(--green-dim); color:var(--green); font-size:11px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; padding:5px 12px; border-radius:20px; margin-bottom:24px; }
  .auth-tag-dot { width:6px; height:6px; background:var(--green); border-radius:50%; animation:pulse 2s infinite; }
  .tabs { display:flex; gap:4px; background:var(--dark); border:1px solid var(--border); border-radius:10px; padding:4px; margin-bottom:20px; }
  .tab  { flex:1; padding:8px; border-radius:7px; border:none; background:transparent; color:var(--muted); font-size:13px; font-weight:500; cursor:pointer; transition:all .15s; font-family:'Outfit',sans-serif; }
  .tab.active { background:var(--card); color:var(--white); border:1px solid var(--border); }
  .divider { display:flex; align-items:center; gap:12px; margin:20px 0; color:var(--muted); font-size:12px; }
  .divider::before,.divider::after { content:''; flex:1; height:1px; background:var(--border); }

  /* ── Camera ── */
  .camera-wrap     { border:1px solid var(--border); border-radius:12px; overflow:hidden; background:var(--dark); margin-bottom:16px; position:relative; }
  .camera-video    { width:100%; display:block; }
  .camera-empty    { height:180px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:var(--muted); font-size:13px; }
  .camera-icon     { width:48px; height:48px; border-radius:50%; background:var(--border); display:flex; align-items:center; justify-content:center; font-size:20px; }
  .camera-controls { padding:10px 12px; border-top:1px solid var(--border); display:flex; gap:8px; }
  .camera-captured { background:#CAFF3318; color:var(--green); font-size:12px; font-weight:600; letter-spacing:.05em; text-align:center; padding:8px; }
  .camera-active   { position:relative; }
  .camera-active::after { content:''; position:absolute; inset:0; background:linear-gradient(transparent 50%,#CAFF3308 50%); background-size:100% 4px; pointer-events:none; }

  .toast         { padding:12px 16px; border-radius:10px; font-size:13px; font-weight:500; margin-bottom:16px; border:1px solid; }
  .toast-error   { background:#ff444410; border-color:#ff444430; color:#ff8080; }
  .toast-success { background:#CAFF3310; border-color:#CAFF3330; color:var(--green); }

  /* ── Face Setup Banner ── */
  .face-banner {
    background: linear-gradient(135deg, #FF950015, #FF950008);
    border: 1px solid #FF950030;
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
    animation: fadeUp .4s ease both;
  }
  .face-banner-left { display:flex; align-items:center; gap:12px; }
  .face-banner-icon { font-size:24px; flex-shrink:0; }
  .face-banner-title { font-size:14px; font-weight:600; color:var(--white); margin-bottom:2px; }
  .face-banner-sub   { font-size:12px; color:var(--muted); }

  /* ── Modal ── */
  .modal-backdrop {
    position:fixed; inset:0; background:#00000090;
    display:flex; align-items:center; justify-content:center;
    z-index:1000; padding:24px;
    animation: fadeIn .2s ease both;
  }
  .modal {
    background:var(--card); border:1px solid var(--border);
    border-radius:16px; padding:32px; width:100%; max-width:420px;
    animation: slideUp .3s ease both;
  }
  .modal-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
  .modal-title  { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:1px; }
  .modal-close  { background:none; border:none; color:var(--muted); font-size:20px; cursor:pointer; padding:0; line-height:1; }
  .modal-close:hover { color:var(--white); }
  .modal-sub    { font-size:13px; color:var(--muted); margin-bottom:24px; line-height:1.5; }

  /* ── Dashboard ── */
  .dash-layout { min-height:100vh; display:flex; flex-direction:column; }
  .topbar { height:60px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; padding:0 28px; background:var(--black); position:sticky; top:0; z-index:100; }
  .topbar-logo { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:2px; color:var(--white); display:flex; align-items:center; gap:10px; }
  .topbar-logo-dot { width:8px; height:8px; background:var(--green); border-radius:50%; }
  .topbar-right { display:flex; align-items:center; gap:12px; }
  .topbar-user  { font-size:13px; color:var(--muted); padding:6px 14px; border:1px solid var(--border); border-radius:8px; }
  .topbar-nav   { display:flex; gap:4px; }
  .topbar-nav-btn { padding:7px 16px; border-radius:8px; border:none; background:transparent; color:var(--muted); font-size:13px; font-weight:500; cursor:pointer; transition:all .15s; font-family:'Outfit',sans-serif; }
  .topbar-nav-btn:hover { color:var(--white); }
  .topbar-nav-btn.active { background:var(--card); color:var(--white); border:1px solid var(--border); }
  .dash-body    { flex:1; padding:32px 28px; }
  .dash-header  { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:28px; flex-wrap:wrap; gap:16px; }
  .dash-title   { font-family:'Bebas Neue',sans-serif; font-size:42px; letter-spacing:1px; line-height:1; }
  .dash-title span { color:var(--green); }
  .dash-count   { font-size:13px; color:var(--muted); margin-top:4px; }
  .tabs-filter  { display:flex; gap:6px; flex-wrap:wrap; }

  .match-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; }
  .match-card { background:var(--card); border:1px solid var(--border); border-radius:14px; padding:22px; transition:border-color .2s,transform .2s; animation:fadeUp .4s ease both; }
  .match-card:hover { border-color:#333; transform:translateY(-2px); }
  .match-card-top   { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; gap:10px; }
  .match-card-title { font-size:16px; font-weight:600; color:var(--white); line-height:1.3; }
  .badge      { font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:4px 10px; border-radius:20px; white-space:nowrap; flex-shrink:0; }
  .badge-open { background:#CAFF3318; color:var(--green); border:1px solid #CAFF3330; }
  .badge-full { background:#4488ff18; color:var(--blue);  border:1px solid #4488ff30; }
  .badge-done { background:#ffffff08; color:var(--muted); border:1px solid var(--border); }
  .match-meta        { display:flex; flex-direction:column; gap:7px; margin-bottom:18px; }
  .match-meta-row    { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--muted); }
  .match-meta-icon   { font-size:14px; width:18px; text-align:center; }
  .match-card-footer { display:flex; align-items:center; justify-content:space-between; padding-top:16px; border-top:1px solid var(--border); gap:8px; }
  .match-owner-tag   { font-size:11px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--green); }

  /* ── VS row ── */
  .vs-row { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
  .team-chip { display:flex; align-items:center; gap:6px; padding:5px 10px; border-radius:8px; border:1px solid var(--border); font-size:12px; font-weight:600; }
  .team-chip-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .vs-label { font-size:10px; font-weight:700; color:var(--muted); letter-spacing:.1em; }
  .team-chip-empty { border-style:dashed; color:var(--muted); }

  /* ── Teams page ── */
  .teams-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; }
  .team-card { background:var(--card); border:1px solid var(--border); border-radius:14px; padding:22px; transition:border-color .2s,transform .2s; animation:fadeUp .4s ease both; }
  .team-card:hover { border-color:#333; transform:translateY(-2px); }
  .team-card-header { display:flex; align-items:center; gap:14px; margin-bottom:16px; }
  .team-avatar { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-family:'Bebas Neue',sans-serif; font-size:16px; font-weight:700; flex-shrink:0; }
  .team-name { font-size:16px; font-weight:600; }
  .team-tag  { font-size:11px; color:var(--muted); margin-top:2px; font-family:'Bebas Neue',sans-serif; letter-spacing:2px; }
  .team-members-count { font-size:13px; color:var(--muted); margin-bottom:16px; }
  .team-role-badge { display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:4px 10px; border-radius:20px; margin-bottom:12px; }
  .role-admin   { background:#CAFF3318; color:var(--green); border:1px solid #CAFF3330; }
  .role-member  { background:#4488ff18; color:var(--blue);  border:1px solid #4488ff30; }
  .role-pending { background:#FF950018; color:var(--orange);border:1px solid #FF950030; }

  /* ── Create ── */
  .create-layout { min-height:100vh; display:flex; flex-direction:column; }
  .create-body   { flex:1; display:flex; align-items:flex-start; justify-content:center; padding:48px 24px; }
  .create-card   { width:100%; max-width:520px; background:var(--card); border:1px solid var(--border); border-radius:16px; padding:36px; }
  .create-title  { font-family:'Bebas Neue',sans-serif; font-size:36px; letter-spacing:1px; margin-bottom:6px; }
  .create-sub    { font-size:14px; color:var(--muted); margin-bottom:32px; }
  .form-row      { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

  .spinner       { width:16px; height:16px; border:2px solid #00000030; border-top-color:var(--black); border-radius:50%; animation:spin .6s linear infinite; display:inline-block; vertical-align:middle; }
  .spinner-muted { border-color:#333; border-top-color:var(--green); }

  .empty-state       { text-align:center; padding:80px 24px; color:var(--muted); }
  .empty-state-icon  { font-size:56px; margin-bottom:16px; display:block; opacity:.4; }
  .empty-state-title { font-family:'Bebas Neue',sans-serif; font-size:28px; color:var(--white); margin-bottom:8px; letter-spacing:1px; }

  /* ── Join match modal ── */
  .modal-lg { max-width:480px; }
  .select-team-list { display:flex; flex-direction:column; gap:8px; margin-bottom:20px; }
  .select-team-item { display:flex; align-items:center; gap:12px; padding:12px 16px; border:1px solid var(--border); border-radius:10px; background:var(--dark); cursor:pointer; transition:border-color .15s; }
  .select-team-item:hover { border-color:#444; }
  .select-team-item.selected { border-color:var(--green); background:var(--green-dim); }
  .select-team-item-name { font-size:14px; font-weight:600; }
  .select-team-item-tag  { font-size:11px; color:var(--muted); font-family:'Bebas Neue',sans-serif; letter-spacing:2px; }

  /* ── Team Detail Page ── */
  .team-detail-layout { min-height:100vh; display:flex; flex-direction:column; }
  .team-detail-hero {
    background:var(--card); border-bottom:1px solid var(--border);
    padding:36px 28px 28px; display:flex; align-items:center; gap:24px; flex-wrap:wrap;
  }
  .team-detail-avatar {
    width:72px; height:72px; border-radius:16px;
    display:flex; align-items:center; justify-content:center;
    font-family:'Bebas Neue',sans-serif; font-size:22px; flex-shrink:0;
  }
  .team-detail-name { font-family:'Bebas Neue',sans-serif; font-size:38px; letter-spacing:1px; line-height:1; }
  .team-detail-tag  { font-family:'Bebas Neue',sans-serif; font-size:14px; letter-spacing:4px; color:var(--muted); margin-top:4px; }
  .team-detail-body { flex:1; padding:28px; display:flex; flex-direction:column; gap:28px; }

  .section-card { background:var(--card); border:1px solid var(--border); border-radius:14px; overflow:hidden; }
  .section-header { padding:18px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .section-title  { font-size:13px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); }
  .section-badge  { background:#FF950018; color:var(--orange); border:1px solid #FF950030; font-size:10px; font-weight:700; padding:3px 9px; border-radius:20px; letter-spacing:.06em; }

  .member-row { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-bottom:1px solid var(--border); gap:12px; }
  .member-row:last-child { border-bottom:none; }
  .member-row-left { display:flex; align-items:center; gap:12px; }
  .member-avatar { width:34px; height:34px; border-radius:10px; background:var(--border); display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:var(--muted); flex-shrink:0; }
  .member-name { font-size:14px; font-weight:500; }
  .member-sub  { font-size:11px; color:var(--muted); margin-top:1px; }

  /* ── Pending requests notification dot ── */
  .notif-dot { width:8px; height:8px; background:var(--orange); border-radius:50%; flex-shrink:0; animation:pulse 2s infinite; }
  .pending-count { display:inline-flex; align-items:center; justify-content:center; background:var(--orange); color:#000; font-size:10px; font-weight:800; min-width:18px; height:18px; border-radius:9px; padding:0 5px; }

  /* ── Chat placeholder ── */
  .chat-placeholder { padding:48px 20px; text-align:center; color:var(--muted); }
  .chat-placeholder-icon { font-size:40px; margin-bottom:12px; opacity:.4; }
  .chat-placeholder-text { font-size:13px; line-height:1.6; }

  /* ── Detail tabs ── */
  .detail-tabs { display:flex; gap:2px; padding:4px; background:var(--dark); border:1px solid var(--border); border-radius:10px; margin-bottom:20px; }
  .detail-tab  { flex:1; padding:8px 12px; border-radius:7px; border:none; background:transparent; color:var(--muted); font-size:13px; font-weight:500; cursor:pointer; transition:all .15s; font-family:'Outfit',sans-serif; display:flex; align-items:center; justify-content:center; gap:6px; }
  .detail-tab.active { background:var(--card); color:var(--white); border:1px solid var(--border); }

  @media(max-width:768px){
    .auth-layout { grid-template-columns:1fr; }
    .auth-hero   { display:none; }
    .form-row    { grid-template-columns:1fr; }
    .dash-body   { padding:20px 16px; }
    .topbar      { padding:0 16px; }
    .face-banner { flex-direction:column; align-items:flex-start; }
    .topbar-nav-btn span { display:none; }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem("token"); }
function getUser()  { return JSON.parse(localStorage.getItem("user") || "null"); }
function setUser(u) { localStorage.setItem("user", JSON.stringify(u)); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

// ── Google ────────────────────────────────────────────────────────────────────
function useGoogleScript() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.google) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true;
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);
  return ready;
}

// ── Webcam ────────────────────────────────────────────────────────────────────
function useWebcam() {
  const videoRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError]   = useState(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setActive(true); setError(null);
    } catch { setError("Camera access denied"); }
  }, []);

  const stop = useCallback(() => {
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    setActive(false);
  }, []);

  const capture = useCallback(async () => {
    const c = document.createElement("canvas");
    c.width = videoRef.current.videoWidth;
    c.height = videoRef.current.videoHeight;
    c.getContext("2d").drawImage(videoRef.current, 0, 0);
    return new Promise(r => c.toBlob(r, "image/jpeg", 0.9));
  }, []);

  return { videoRef, active, error, start, stop, capture };
}

// ── Components ────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  return <div className={`toast toast-${type}`}>{msg}</div>;
}

function CameraBox({ webcam, onCapture, captured }) {
  return (
    <div className="camera-wrap">
      <div className={webcam.active ? "camera-active" : ""}>
        <video ref={webcam.videoRef} className="camera-video"
          style={{ display: webcam.active ? "block" : "none" }} muted playsInline />
        {!webcam.active && (
          <div className="camera-empty">
            <div className="camera-icon">📷</div>
            <span>Camera inactive</span>
          </div>
        )}
      </div>
      {captured && <div className="camera-captured">✓ Face captured</div>}
      {webcam.error && <div style={{ padding:"8px 12px", fontSize:12, color:"var(--red)" }}>{webcam.error}</div>}
      <div className="camera-controls">
        {!webcam.active
          ? <button className="btn btn-full" onClick={webcam.start}>Start Camera</button>
          : <>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={onCapture}>Capture Face</button>
              <button className="btn" onClick={webcam.stop}>Stop</button>
            </>
        }
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

function TeamChip({ name, color, empty }) {
  if (empty) return <div className="team-chip team-chip-empty">No opponent yet</div>;
  return (
    <div className="team-chip">
      <div className="team-chip-dot" style={{ background: color || "#666" }} />
      <span>{name}</span>
    </div>
  );
}

// ── Face Setup Modal ──────────────────────────────────────────────────────────
function FaceSetupModal({ onClose, onSuccess }) {
  const webcam = useWebcam();
  const [blob, setBlob]       = useState(null);
  const [msg, setMsg]         = useState(null);
  const [loading, setLoading] = useState(false);

  const capture = async () => { const b = await webcam.capture(); setBlob(b); webcam.stop(); };

  const submit = async () => {
    if (!blob) return setMsg({ type:"error", text:"Capture your face first" });
    setLoading(true); setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", blob, "face.jpg");
      await apiFetch("/users/add-face", { method:"POST", body:fd });
      const u = getUser();
      setUser({ ...u, hasFace: true });
      onSuccess();
    } catch(e) {
      setMsg({ type:"error", text: e.message });
    } finally { setLoading(false); }
  };

  const close = () => { webcam.stop(); onClose(); };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && close()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Add Face Login</div>
          <button className="modal-close" onClick={close}>×</button>
        </div>
        <p className="modal-sub">Set up face recognition so you can log in instantly next time.</p>
        <Toast msg={msg?.text} type={msg?.type} />
        <label className="label">Your Face</label>
        <CameraBox webcam={webcam} onCapture={capture} captured={!!blob} />
        <button className="btn btn-primary btn-full" onClick={submit} disabled={loading}>
          {loading && <span className="spinner" />}
          {loading ? "Saving..." : "Enable Face Login"}
        </button>
      </div>
    </div>
  );
}

// ── Join Match Modal ──────────────────────────────────────────────────────────
function JoinMatchModal({ match, adminTeams, onClose, onJoined }) {
  const [selected, setSelected] = useState(null);
  const [msg, setMsg]           = useState(null);
  const [loading, setLoading]   = useState(false);

  // filter out the requesting team
  const eligible = adminTeams.filter(t => t.id !== match.requesting_team_id);

  const submit = async () => {
    if (!selected) return setMsg({ type:"error", text:"Select a team to join with" });
    setLoading(true); setMsg(null);
    try {
      await apiFetch(`/matches/${match.id}/join`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ team_id: selected }),
      });
      onJoined();
      onClose();
    } catch(e) {
      setMsg({ type:"error", text:e.message });
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">Join Match</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p className="modal-sub">Select which of your teams will join <strong style={{color:"var(--white)"}}>{match.title}</strong>.</p>
        <Toast msg={msg?.text} type={msg?.type} />
        {eligible.length === 0 ? (
          <p style={{ color:"var(--muted)", fontSize:13, marginBottom:20 }}>
            None of your teams are eligible to join this match.
          </p>
        ) : (
          <div className="select-team-list">
            {eligible.map(t => (
              <div key={t.id} className={`select-team-item ${selected===t.id?"selected":""}`} onClick={() => setSelected(t.id)}>
                <div className="team-chip-dot" style={{ background:t.color, width:12, height:12, borderRadius:"50%", flexShrink:0 }} />
                <div>
                  <div className="select-team-item-name">{t.name}</div>
                  <div className="select-team-item-tag">{t.tag}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <button className="btn btn-primary btn-full" onClick={submit} disabled={loading || eligible.length===0}>
          {loading && <span className="spinner" />}
          {loading ? "Joining..." : "Confirm Join"}
        </button>
      </div>
    </div>
  );
}

// ── Auth Page ─────────────────────────────────────────────────────────────────
function AuthPage({ onNav }) {
  const [mode, setMode]         = useState("login");
  const [form, setForm]         = useState({ name:"", email:"", password:"" });
  const [blob, setBlob]         = useState(null);
  const [msg, setMsg]           = useState(null);
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const webcam                  = useWebcam();
  const googleReady             = useGoogleScript();
  const googleBtnRef            = useRef(null);

  useEffect(() => {
    if (!googleReady || !googleBtnRef.current) return;
    window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogle });
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      type:"standard", theme:"outline", size:"large", width:380,
      text: mode === "register" ? "signup_with" : "signin_with",
    });
  }, [googleReady, mode]);

  const handleGoogle = async (response) => {
    setGLoading(true); setMsg(null);
    try {
      const data = await apiFetch("/auth/google", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ token: response.credential }),
      });
      localStorage.setItem("token", data.access_token);
      setUser({ id:data.id, name:data.name, hasFace: !data.is_new_user });
      onNav("dashboard");
    } catch(e) {
      setMsg({ type:"error", text: e.message });
    } finally { setGLoading(false); }
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const capture = async () => { const b = await webcam.capture(); setBlob(b); webcam.stop(); };

  const submitFace = async () => {
    if (!blob) return setMsg({ type:"error", text:"Capture your face first" });
    if (mode === "register" && (!form.name || !form.email || !form.password))
      return setMsg({ type:"error", text:"Fill in all fields" });
    setLoading(true); setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", blob, "face.jpg");
      if (mode === "register") {
        fd.append("name", form.name);
        fd.append("email", form.email);
        fd.append("password", form.password);
      }
      const data = await apiFetch(
        mode === "register" ? "/users/register" : "/users/login",
        { method:"POST", body:fd }
      );
      localStorage.setItem("token", data.access_token);
      setUser({ id:data.id, name:data.name, hasFace:true });
      onNav("dashboard");
    } catch(e) {
      setMsg({ type:"error", text: e.message });
    } finally { setLoading(false); }
  };

  const switchMode = (m) => {
    setMode(m); setMsg(null); setBlob(null);
    setForm({ name:"", email:"", password:"" });
    webcam.stop();
  };

  return (
    <div className="auth-layout">
      <div className="auth-hero">
        <div className="auth-hero-bg" />
        <div className="auth-hero-number">10</div>
        <div className="auth-hero-text">
          <div className="auth-hero-title">Find Your<br />Next Match</div>
          <div className="auth-hero-sub">Clan-based football. Join a team, challenge others.</div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-form">
          <div className="auth-tag fade-up"><span className="auth-tag-dot" />Kickoff</div>

          <div className="tabs fade-up fade-up-1">
            <button className={`tab ${mode==="login"?"active":""}`} onClick={()=>switchMode("login")}>Login</button>
            <button className={`tab ${mode==="register"?"active":""}`} onClick={()=>switchMode("register")}>Register</button>
          </div>

          <Toast msg={msg?.text} type={msg?.type} />

          <div className="fade-up fade-up-2" style={{ marginBottom:4 }}>
            {gLoading
              ? <div style={{ textAlign:"center", padding:"13px 0", color:"var(--muted)", fontSize:13 }}>
                  <span className="spinner spinner-muted" style={{ marginRight:8 }} />
                  Signing in with Google...
                </div>
              : <div ref={googleBtnRef} style={{ display:"flex", justifyContent:"center" }} />
            }
          </div>

          <div className="divider fade-up fade-up-3">or use face recognition</div>

          {mode === "register" && (
            <>
              <div className="field fade-up fade-up-3">
                <label className="label">Full Name</label>
                <input value={form.name} onChange={set("name")} placeholder="John Doe" />
              </div>
              <div className="field fade-up fade-up-3">
                <label className="label">Email</label>
                <input value={form.email} onChange={set("email")} placeholder="you@example.com" type="email" />
              </div>
              <div className="field fade-up fade-up-3">
                <label className="label">Password</label>
                <input value={form.password} onChange={set("password")} placeholder="••••••••" type="password" />
              </div>
            </>
          )}

          {mode === "login" && (
            <p className="fade-up fade-up-3" style={{ fontSize:13, color:"var(--muted)", marginBottom:16, lineHeight:1.6 }}>
              Look at the camera and capture your face to log in instantly.
            </p>
          )}

          <div className="fade-up fade-up-4">
            <label className="label">Face {mode==="register"?"Photo":"Scan"}</label>
            <CameraBox webcam={webcam} onCapture={capture} captured={!!blob} />
          </div>

          <button className="btn btn-primary btn-full fade-up fade-up-5" onClick={submitFace} disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? "Processing..." : mode==="register" ? "Create Account" : "Login with Face"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Teams Page ────────────────────────────────────────────────────────────────
function TeamsPage({ onNav }) {
  const [teams, setTeams]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState(null);

  const load = () => {
    setLoading(true);
    apiFetch("/teams/")
      .then(setTeams)
      .catch(e => setMsg({ type:"error", text:e.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const requestJoin = async (teamId) => {
    try {
      const data = await apiFetch(`/teams/${teamId}/request-join`, { method:"POST" });
      setMsg({ type:"success", text: data.message });
      load();
    } catch(e) {
      setMsg({ type:"error", text:e.message });
    }
  };

  const roleBadge = (role) => {
    if (!role) return null;
    if (role === "pending") return <span className="team-role-badge role-pending">⏳ Pending</span>;
    if (role === "admin")   return <span className="team-role-badge role-admin">⭐ Admin</span>;
    return <span className="team-role-badge role-member">✓ Member</span>;
  };

  const user = getUser();

  return (
    <div className="dash-layout">
      <nav className="topbar">
        <div className="topbar-logo"><div className="topbar-logo-dot" />KICKOFF</div>
        <div className="topbar-right">
          <div className="topbar-nav">
            <button className="topbar-nav-btn" onClick={() => onNav("dashboard")}>🏟 <span>Matches</span></button>
            <button className="topbar-nav-btn active">👥 <span>Teams</span></button>
          </div>
          <div className="topbar-user">👤 {user?.name}</div>
          <button className="btn btn-ghost" onClick={() => { localStorage.clear(); onNav("auth"); }}>Logout</button>
        </div>
      </nav>

      <div className="dash-body">
        <div className="dash-header fade-up">
          <div>
            <div className="dash-title">ALL <span>TEAMS</span></div>
            <div className="dash-count">{teams.length} team{teams.length !== 1 ? "s" : ""} · request to join and wait for admin approval</div>
          </div>
        </div>

        {msg && <Toast msg={msg.text} type={msg.type} />}

        {loading && (
          <div style={{ textAlign:"center", padding:80, color:"var(--muted)" }}>
            <span className="spinner spinner-muted" style={{ marginRight:8 }} />
            Loading teams...
          </div>
        )}

        <div className="teams-grid">
          {teams.map((t, i) => (
            <div key={t.id} className="team-card" style={{ animationDelay:`${i*0.05}s`, cursor:"pointer" }}
              onClick={() => onNav("team", { teamId: t.id })}>
              <div className="team-card-header">
                <div className="team-avatar" style={{ background: t.color + "22", color: t.color }}>
                  {t.tag || t.name.slice(0,3).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div className="team-name">{t.name}</div>
                  {t.tag && <div className="team-tag">{t.tag}</div>}
                </div>
                {/* pending requests dot for admins */}
                {t.my_role === "admin" && t.pending_count > 0 && (
                  <span className="notif-dot" title="Pending join requests" />
                )}
              </div>
              <div className="team-members-count">👥 {t.member_count} member{t.member_count !== 1 ? "s" : ""}</div>
              {t.my_role && roleBadge(t.my_role)}
              {!t.my_role && (
                <button className="btn btn-primary" style={{ width:"100%", padding:"10px 0", fontSize:13 }}
                  onClick={e => { e.stopPropagation(); requestJoin(t.id); }}>
                  Request to Join
                </button>
              )}
              {t.my_role === "pending" && (
                <p style={{ fontSize:12, color:"var(--muted)", marginTop:8 }}>Waiting for admin to approve your request.</p>
              )}
              <div style={{ marginTop:12, fontSize:12, color:"var(--muted)", display:"flex", alignItems:"center", gap:4 }}>
                View team →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ onNav }) {
  const [matches, setMatches]       = useState([]);
  const [adminTeams, setAdminTeams] = useState([]); // teams where current user is admin
  const [loading, setLoading]       = useState(true);
  const [msg, setMsg]               = useState(null);
  const [filter, setFilter]         = useState("all");
  const [showFaceModal, setShowFaceModal]   = useState(false);
  const [joinModal, setJoinModal]           = useState(null); // match obj or null
  const user = getUser();

  const needsFaceSetup = user && user.hasFace === false;

  const load = () => {
    setLoading(true);
    Promise.all([
      apiFetch("/matches/all"),
      apiFetch("/teams/mine"),
    ])
      .then(([ms, myTeams]) => {
        setMatches(ms);
        // mine endpoint returns approved teams; filter to ones where user is admin
        // We need to refetch with role info — use /teams/ for that
        return apiFetch("/teams/").then(allTeams => {
          setAdminTeams(allTeams.filter(t => t.my_role === "admin"));
        });
      })
      .catch(e => setMsg({ type:"error", text:e.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const adminTeamIds = new Set(adminTeams.map(t => t.id));

  const leave = async (matchId) => {
    try {
      await apiFetch(`/matches/${matchId}/leave`, { method:"POST" });
      setMsg({ type:"success", text:"Your team left the match" });
      load();
    } catch(e) { setMsg({ type:"error", text:e.message }); }
  };

  const cancel = async (matchId) => {
    if (!window.confirm("Cancel this match?")) return;
    try {
      await apiFetch(`/matches/${matchId}`, { method:"DELETE" });
      setMsg({ type:"success", text:"Match cancelled" });
      load();
    } catch(e) { setMsg({ type:"error", text:e.message }); }
  };

  const filtered = filter === "all" ? matches : matches.filter(m => m.status === filter);

  // Can the current user join this match?
  const canJoin = (m) => m.status === "open" && !adminTeamIds.has(m.requesting_team_id);
  // Can the current user leave this match?
  const canLeave = (m) => m.status === "full" && m.opponent_team_id && adminTeamIds.has(m.opponent_team_id);
  // Can the current user cancel this match?
  const canCancel = (m) => m.status !== "done" && adminTeamIds.has(m.requesting_team_id);
  // Is this match posted by a team the user admins?
  const isMyMatch = (m) => adminTeamIds.has(m.requesting_team_id);

  return (
    <div className="dash-layout">
      <nav className="topbar">
        <div className="topbar-logo"><div className="topbar-logo-dot" />KICKOFF</div>
        <div className="topbar-right">
          <div className="topbar-nav">
            <button className="topbar-nav-btn active">🏟 <span>Matches</span></button>
            <button className="topbar-nav-btn" onClick={() => onNav("teams")}>👥 <span>Teams</span></button>
          </div>
          <div className="topbar-user">👤 {user?.name}</div>
          {adminTeams.length > 0 && (
            <button className="btn btn-primary" onClick={() => onNav("create")}>+ New Match</button>
          )}
          <button className="btn btn-ghost" onClick={() => { localStorage.clear(); onNav("auth"); }}>Logout</button>
        </div>
      </nav>

      <div className="dash-body">
        {needsFaceSetup && (
          <div className="face-banner">
            <div className="face-banner-left">
              <div className="face-banner-icon">👤</div>
              <div>
                <div className="face-banner-title">Enable Face Login</div>
                <div className="face-banner-sub">Add face recognition for instant login next time</div>
              </div>
            </div>
            <button className="btn btn-orange" onClick={() => setShowFaceModal(true)}>Set Up</button>
          </div>
        )}

        <div className="dash-header fade-up">
          <div>
            <div className="dash-title">OPEN <span>MATCHES</span></div>
            <div className="dash-count">{filtered.length} match{filtered.length !== 1 ? "es" : ""}</div>
          </div>
          <div className="tabs-filter">
            {["all","open","full","done"].map(f => (
              <button key={f} className={`btn ${filter===f?"btn-primary":""}`}
                style={{ padding:"8px 16px", fontSize:12 }} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {msg && <Toast msg={msg.text} type={msg.type} />}

        {loading && (
          <div style={{ textAlign:"center", padding:80, color:"var(--muted)" }}>
            <span className="spinner spinner-muted" style={{ marginRight:8 }} />
            Loading...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">🏟️</span>
            <div className="empty-state-title">No Matches Found</div>
            <p style={{ fontSize:14, marginBottom:24 }}>
              {adminTeams.length > 0 ? "Be the first to post a match." : "Join a team first to post matches."}
            </p>
            {adminTeams.length > 0
              ? <button className="btn btn-primary" onClick={() => onNav("create")}>Post Match Request</button>
              : <button className="btn btn-primary" onClick={() => onNav("teams")}>Browse Teams</button>
            }
          </div>
        )}

        <div className="match-grid">
          {filtered.map((m, i) => (
            <div key={m.id} className="match-card" style={{ animationDelay:`${i*0.05}s` }}>
              <div className="match-card-top">
                <div className="match-card-title">{m.title}</div>
                <StatusBadge status={m.status} />
              </div>

              {/* Teams VS row */}
              <div className="vs-row">
                <TeamChip name={m.requesting_team_name} color={m.requesting_team_color} />
                <span className="vs-label">VS</span>
                {m.opponent_team_id
                  ? <TeamChip name={m.opponent_team_name} color={m.opponent_team_color} />
                  : <TeamChip empty />
                }
              </div>

              <div className="match-meta">
                <div className="match-meta-row"><span className="match-meta-icon">📍</span><span>{m.location}</span></div>
                <div className="match-meta-row"><span className="match-meta-icon">🗓</span><span>{new Date(m.scheduled_at).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"})}</span></div>
                <div className="match-meta-row"><span className="match-meta-icon">👥</span><span>{m.slots} players</span></div>
              </div>

              <div className="match-card-footer">
                {isMyMatch(m) ? <span className="match-owner-tag">Your match</span> : <span />}
                <div style={{ display:"flex", gap:8 }}>
                  {canJoin(m) && adminTeams.length > 0 && (
                    <button className="btn btn-primary" style={{ padding:"8px 18px", fontSize:13 }}
                      onClick={() => setJoinModal(m)}>Join</button>
                  )}
                  {canLeave(m) && (
                    <button className="btn btn-danger" style={{ padding:"8px 18px", fontSize:13 }}
                      onClick={() => leave(m.id)}>Leave</button>
                  )}
                  {canCancel(m) && (
                    <button className="btn btn-danger" style={{ padding:"8px 18px", fontSize:13 }}
                      onClick={() => cancel(m.id)}>Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showFaceModal && (
        <FaceSetupModal
          onClose={() => setShowFaceModal(false)}
          onSuccess={() => { setShowFaceModal(false); setMsg({ type:"success", text:"Face login enabled!" }); }}
        />
      )}

      {joinModal && (
        <JoinMatchModal
          match={joinModal}
          adminTeams={adminTeams}
          onClose={() => setJoinModal(null)}
          onJoined={() => { load(); setMsg({ type:"success", text:"Your team joined the match!" }); }}
        />
      )}
    </div>
  );
}

// ── Create Match ──────────────────────────────────────────────────────────────
function CreateMatch({ onNav }) {
  const [form, setForm]       = useState({ title:"", location:"", scheduled_at:"", slots:"10", requesting_team_id:"" });
  const [adminTeams, setAdminTeams] = useState([]);
  const [msg, setMsg]         = useState(null);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    // Load teams where user is admin
    apiFetch("/teams/")
      .then(teams => {
        const mine = teams.filter(t => t.my_role === "admin");
        setAdminTeams(mine);
        if (mine.length === 1) setForm(f => ({ ...f, requesting_team_id: String(mine[0].id) }));
      })
      .catch(() => {});
  }, []);

  const submit = async () => {
    if (!form.title || !form.location || !form.scheduled_at || !form.requesting_team_id)
      return setMsg({ type:"error", text:"Fill in all fields and select your team" });
    setLoading(true); setMsg(null);
    try {
      await apiFetch("/matches/", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ ...form, slots: Number(form.slots), requesting_team_id: Number(form.requesting_team_id) }),
      });
      onNav("dashboard");
    } catch(e) {
      setMsg({ type:"error", text:e.message });
    } finally { setLoading(false); }
  };

  return (
    <div className="create-layout">
      <nav className="topbar">
        <div className="topbar-logo"><div className="topbar-logo-dot" />KICKOFF</div>
        <button className="btn btn-ghost" onClick={() => onNav("dashboard")}>← Back</button>
      </nav>
      <div className="create-body">
        <div className="create-card fade-up">
          <div className="create-title">Post Match Request</div>
          <div className="create-sub">Your team is looking for an opponent. Other team admins can join.</div>
          <Toast msg={msg?.text} type={msg?.type} />

          <div className="field">
            <label className="label">Posting as Team</label>
            {adminTeams.length === 0 ? (
              <p style={{ fontSize:13, color:"var(--muted)" }}>You're not an admin of any team. Join a team first.</p>
            ) : (
              <select value={form.requesting_team_id} onChange={set("requesting_team_id")}>
                <option value="">Select your team…</option>
                {adminTeams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="field">
            <label className="label">Match Title</label>
            <input value={form.title} onChange={set("title")} placeholder="Sunday 5v5 · Central Park" />
          </div>
          <div className="field">
            <label className="label">Location</label>
            <input value={form.location} onChange={set("location")} placeholder="Central Park, NYC" />
          </div>
          <div className="form-row">
            <div className="field">
              <label className="label">Date & Time</label>
              <input value={form.scheduled_at} onChange={set("scheduled_at")} type="datetime-local" style={{ colorScheme:"dark" }} />
            </div>
            <div className="field">
              <label className="label">Players Needed</label>
              <input value={form.slots} onChange={set("slots")} type="number" min={2} max={22} />
            </div>
          </div>
          <button className="btn btn-primary btn-full" onClick={submit} disabled={loading || adminTeams.length===0} style={{ marginTop:8 }}>
            {loading && <span className="spinner" />}
            {loading ? "Posting..." : "Post Match Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Team Detail Page ──────────────────────────────────────────────────────────
function TeamDetail({ teamId, onNav }) {
  const [team, setTeam]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]       = useState(null);
  const [tab, setTab]       = useState("members"); // members | chat
  const user = getUser();

  const load = () => {
    setLoading(true);
    apiFetch(`/teams/${teamId}`)
      .then(setTeam)
      .catch(e => setMsg({ type:"error", text:e.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [teamId]);

  const approve = async (userId) => {
    try {
      await apiFetch(`/teams/${teamId}/approve/${userId}`, { method:"POST" });
      setMsg({ type:"success", text:"Member approved!" });
      load();
    } catch(e) { setMsg({ type:"error", text:e.message }); }
  };

  const kick = async (userId) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      await apiFetch(`/teams/${teamId}/kick/${userId}`, { method:"DELETE" });
      setMsg({ type:"success", text:"Member removed." });
      load();
    } catch(e) { setMsg({ type:"error", text:e.message }); }
  };

  const isAdmin = team?.my_role === "admin";
  const pendingCount = team?.pending_requests?.length || 0;

  return (
    <div className="team-detail-layout">
      <nav className="topbar">
        <div className="topbar-logo"><div className="topbar-logo-dot" />KICKOFF</div>
        <div className="topbar-right">
          <div className="topbar-nav">
            <button className="topbar-nav-btn" onClick={() => onNav("dashboard")}>🏟 <span>Matches</span></button>
            <button className="topbar-nav-btn" onClick={() => onNav("teams")}>👥 <span>Teams</span></button>
          </div>
          <div className="topbar-user">👤 {user?.name}</div>
          <button className="btn btn-ghost" onClick={() => { localStorage.clear(); onNav("auth"); }}>Logout</button>
        </div>
      </nav>

      {loading && (
        <div style={{ textAlign:"center", padding:80, color:"var(--muted)" }}>
          <span className="spinner spinner-muted" style={{ marginRight:8 }} />
          Loading team...
        </div>
      )}

      {!loading && team && (
        <>
          {/* Hero */}
          <div className="team-detail-hero fade-up">
            <div className="team-detail-avatar"
              style={{ background: team.color + "22", color: team.color }}>
              {team.tag || team.name.slice(0,3).toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div className="team-detail-name">{team.name}</div>
              {team.tag && <div className="team-detail-tag">{team.tag}</div>}
              <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
                <span style={{ fontSize:13, color:"var(--muted)" }}>👥 {team.member_count} member{team.member_count!==1?"s":""}</span>
                {team.my_role && (
                  <span className={`team-role-badge ${
                    team.my_role==="admin" ? "role-admin" :
                    team.my_role==="pending" ? "role-pending" : "role-member"
                  }`} style={{ margin:0 }}>
                    {team.my_role==="admin" ? "⭐ Admin" : team.my_role==="pending" ? "⏳ Pending" : "✓ Member"}
                  </span>
                )}
                {isAdmin && pendingCount > 0 && (
                  <span style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:13, color:"var(--orange)" }}>
                    <span className="notif-dot" />
                    {pendingCount} pending request{pendingCount!==1?"s":""}
                  </span>
                )}
              </div>
            </div>
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => onNav("create")}>+ Post Match</button>
            )}
          </div>

          <div className="team-detail-body">
            {msg && <Toast msg={msg.text} type={msg.type} />}

            {/* Pending Requests — admin only, always shown at top if any */}
            {isAdmin && pendingCount > 0 && (
              <div className="section-card fade-up">
                <div className="section-header">
                  <span className="section-title">Join Requests</span>
                  <span className="section-badge">{pendingCount} pending</span>
                </div>
                {team.pending_requests.map(r => (
                  <div key={r.id} className="member-row">
                    <div className="member-row-left">
                      <div className="member-avatar">{r.user_name[0].toUpperCase()}</div>
                      <div>
                        <div className="member-name">{r.user_name}</div>
                        <div className="member-sub">Wants to join</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button className="btn btn-primary" style={{ padding:"7px 16px", fontSize:12 }}
                        onClick={() => approve(r.user_id)}>Approve</button>
                      <button className="btn btn-danger" style={{ padding:"7px 16px", fontSize:12 }}
                        onClick={() => kick(r.user_id)}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tabs: Members | Chat */}
            <div>
              <div className="detail-tabs">
                <button className={`detail-tab ${tab==="members"?"active":""}`} onClick={() => setTab("members")}>
                  👥 Members <span style={{ fontSize:11, color:"var(--muted)" }}>({team.member_count})</span>
                </button>
                <button className={`detail-tab ${tab==="chat"?"active":""}`} onClick={() => setTab("chat")}>
                  💬 Team Chat
                </button>
              </div>

              {tab === "members" && (
                <div className="section-card">
                  {team.members.length === 0 && (
                    <div style={{ padding:"32px 20px", textAlign:"center", color:"var(--muted)", fontSize:13 }}>
                      No approved members yet.
                    </div>
                  )}
                  {team.members.map(m => (
                    <div key={m.id} className="member-row">
                      <div className="member-row-left">
                        <div className="member-avatar">{m.user_name[0].toUpperCase()}</div>
                        <div>
                          <div className="member-name">{m.user_name}</div>
                          <div className="member-sub">{m.role === "admin" ? "⭐ Admin" : "Member"}</div>
                        </div>
                      </div>
                      {isAdmin && m.user_id !== user.id && (
                        <button className="btn btn-danger" style={{ padding:"6px 14px", fontSize:12 }}
                          onClick={() => kick(m.user_id)}>Remove</button>
                      )}
                      {m.user_id === user.id && (
                        <span style={{ fontSize:11, color:"var(--muted)" }}>You</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {tab === "chat" && (
                <div className="section-card">
                  <div className="chat-placeholder">
                    <div className="chat-placeholder-icon">💬</div>
                    <div style={{ fontSize:15, fontWeight:600, color:"var(--white)", marginBottom:8 }}>Team Chat Coming Soon</div>
                    <div className="chat-placeholder-text">
                      Real-time team chat will be available here.<br />
                      Members will be able to coordinate matches and strategy.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]       = useState(getToken() ? "dashboard" : "auth");
  const [teamId, setTeamId]   = useState(null);

  const navigate = (p, extra) => {
    if (p === "team" && extra?.teamId) setTeamId(extra.teamId);
    setPage(p);
  };

  return (
    <>
      <style>{css}</style>
      {page === "auth"       && <AuthPage    onNav={navigate} />}
      {page === "dashboard"  && <Dashboard   onNav={navigate} />}
      {page === "create"     && <CreateMatch onNav={navigate} />}
      {page === "teams"      && <TeamsPage   onNav={navigate} />}
      {page === "team"       && <TeamDetail  teamId={teamId} onNav={navigate} />}
    </>
  );
}
