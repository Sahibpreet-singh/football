import { useState, useRef, useCallback, useEffect } from "react";

// ⚠️ Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = "273668627967-ge1j5lp5ohkqca4i8b95cn4qrc1fhl44.apps.googleusercontent.com";
const API = "http://localhost:8000";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --black: #080808;
    --dark: #111111;
    --card: #161616;
    --border: #242424;
    --green: #CAFF33;
    --green-dim: #CAFF3322;
    --white: #F5F5F5;
    --muted: #666;
    --red: #FF4444;
    --blue: #4488FF;
  }

  html, body, #root { height: 100%; background: var(--black); color: var(--white); font-family: 'Outfit', sans-serif; }
  ::selection { background: var(--green); color: var(--black); }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--dark); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes spin   { to { transform:rotate(360deg); } }

  .fade-up   { animation: fadeUp 0.5s ease both; }
  .fade-up-1 { animation-delay:.05s; }
  .fade-up-2 { animation-delay:.1s;  }
  .fade-up-3 { animation-delay:.15s; }
  .fade-up-4 { animation-delay:.2s;  }
  .fade-up-5 { animation-delay:.25s; }

  input, button { font-family:'Outfit',sans-serif; }

  input {
    width:100%; background:var(--dark); border:1px solid var(--border);
    color:var(--white); padding:13px 16px; border-radius:10px;
    font-size:14px; outline:none; transition:border-color .2s;
  }
  input:focus { border-color:var(--green); }
  input::placeholder { color:var(--muted); }

  .btn {
    padding:13px 24px; border-radius:10px; border:1px solid var(--border);
    background:var(--card); color:var(--white); font-size:14px; font-weight:500;
    cursor:pointer; transition:all .15s; white-space:nowrap; display:inline-flex;
    align-items:center; justify-content:center; gap:8px;
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

  /* Google button */
  .btn-google {
    width:100%; background:#fff; color:#1f1f1f; border:1px solid #e0e0e0;
    padding:13px 24px; border-radius:10px; font-size:14px; font-weight:500;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    gap:10px; transition:all .15s; font-family:'Outfit',sans-serif;
  }
  .btn-google:hover { background:#f7f7f7; box-shadow:0 2px 8px #00000020; }
  .btn-google:disabled { opacity:.5; cursor:not-allowed; }
  .google-icon { width:18px; height:18px; flex-shrink:0; }

  .label { display:block; font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin-bottom:7px; }
  .field { margin-bottom:16px; }

  /* Auth layout */
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
  .auth-hero-title  { font-family:'Bebas Neue',sans-serif; font-size:52px; letter-spacing:1px; line-height:1; color:var(--white); }
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

  /* Camera */
  .camera-wrap     { border:1px solid var(--border); border-radius:12px; overflow:hidden; background:var(--dark); margin-bottom:16px; position:relative; }
  .camera-video    { width:100%; display:block; }
  .camera-empty    { height:180px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:var(--muted); font-size:13px; }
  .camera-icon     { width:48px; height:48px; border-radius:50%; background:var(--border); display:flex; align-items:center; justify-content:center; font-size:20px; }
  .camera-controls { padding:10px 12px; border-top:1px solid var(--border); display:flex; gap:8px; }
  .camera-captured { background:#CAFF3318; color:var(--green); font-size:12px; font-weight:600; letter-spacing:.05em; text-align:center; padding:8px; }
  .camera-active   { position:relative; }
  .camera-active::after { content:''; position:absolute; inset:0; background:linear-gradient(transparent 50%,#CAFF3308 50%); background-size:100% 4px; pointer-events:none; }

  .toast          { padding:12px 16px; border-radius:10px; font-size:13px; font-weight:500; margin-bottom:16px; border:1px solid; }
  .toast-error    { background:#ff444410; border-color:#ff444430; color:#ff8080; }
  .toast-success  { background:#CAFF3310; border-color:#CAFF3330; color:var(--green); }

  .auth-switch { text-align:center; font-size:13px; color:var(--muted); margin-top:24px; }
  .auth-switch span { color:var(--green); cursor:pointer; font-weight:500; }

  /* Dashboard */
  .dash-layout { min-height:100vh; display:flex; flex-direction:column; }
  .topbar { height:60px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; padding:0 28px; background:var(--black); position:sticky; top:0; z-index:100; }
  .topbar-logo { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:2px; color:var(--white); display:flex; align-items:center; gap:10px; }
  .topbar-logo-dot { width:8px; height:8px; background:var(--green); border-radius:50%; }
  .topbar-right { display:flex; align-items:center; gap:12px; }
  .topbar-user { font-size:13px; color:var(--muted); padding:6px 14px; border:1px solid var(--border); border-radius:8px; }

  .dash-body   { flex:1; padding:32px 28px; }
  .dash-header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:28px; flex-wrap:wrap; gap:16px; }
  .dash-title  { font-family:'Bebas Neue',sans-serif; font-size:42px; letter-spacing:1px; line-height:1; }
  .dash-title span { color:var(--green); }
  .dash-count  { font-size:13px; color:var(--muted); margin-top:4px; }

  .match-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; }
  .match-card { background:var(--card); border:1px solid var(--border); border-radius:14px; padding:22px; transition:border-color .2s, transform .2s; animation:fadeUp .4s ease both; }
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

  /* Create */
  .create-layout { min-height:100vh; display:flex; flex-direction:column; }
  .create-body   { flex:1; display:flex; align-items:flex-start; justify-content:center; padding:48px 24px; }
  .create-card   { width:100%; max-width:520px; background:var(--card); border:1px solid var(--border); border-radius:16px; padding:36px; }
  .create-title  { font-family:'Bebas Neue',sans-serif; font-size:36px; letter-spacing:1px; margin-bottom:6px; }
  .create-sub    { font-size:14px; color:var(--muted); margin-bottom:32px; }
  .form-row      { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

  .spinner { width:16px; height:16px; border:2px solid #00000030; border-top-color:var(--black); border-radius:50%; animation:spin .6s linear infinite; display:inline-block; vertical-align:middle; }
  .spinner-muted { border-color:#333; border-top-color:var(--green); }

  .empty-state       { text-align:center; padding:80px 24px; color:var(--muted); }
  .empty-state-icon  { font-size:56px; margin-bottom:16px; display:block; opacity:.4; }
  .empty-state-title { font-family:'Bebas Neue',sans-serif; font-size:28px; color:var(--white); margin-bottom:8px; letter-spacing:1px; }

  .tabs-filter { display:flex; gap:6px; }

  @media(max-width:768px){
    .auth-layout { grid-template-columns:1fr; }
    .auth-hero   { display:none; }
    .form-row    { grid-template-columns:1fr; }
    .dash-body   { padding:20px 16px; }
    .topbar      { padding:0 16px; }
    .tabs-filter { flex-wrap:wrap; }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem("token"); }
function getUser()  { return JSON.parse(localStorage.getItem("user") || "null"); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

// ── Google Sign-In Script Loader ──────────────────────────────────────────────
function useGoogleScript() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.google) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
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
      {webcam.error && <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--red)" }}>{webcam.error}</div>}
      <div className="camera-controls">
        {!webcam.active
          ? <button className="btn btn-full" onClick={webcam.start}>Start Camera</button>
          : <>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={onCapture}>Capture Face</button>
              <button className="btn" onClick={webcam.stop}>Stop</button>
            </>
        }
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="google-icon" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

// ── Auth Page ─────────────────────────────────────────────────────────────────
function AuthPage({ onNav }) {
  const [mode, setMode]       = useState("login");
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [blob, setBlob]       = useState(null);
  const [msg, setMsg]         = useState(null);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const webcam    = useWebcam();
  const googleReady = useGoogleScript();
  const googleBtnRef = useRef(null);

  // Render Google button once script is ready
  useEffect(() => {
    if (!googleReady || !googleBtnRef.current) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      width: 380,
      text: mode === "register" ? "signup_with" : "signin_with",
    });
  }, [googleReady, mode]);

  const handleGoogleResponse = async (response) => {
    setGLoading(true); setMsg(null);
    try {
      const data = await apiFetch("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify({ id: data.id, name: data.name }));
      onNav("dashboard");
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally { setGLoading(false); }
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const capture = async () => {
    const b = await webcam.capture();
    setBlob(b); webcam.stop();
  };

  const submitFace = async () => {
    if (!blob) return setMsg({ type: "error", text: "Capture your face first" });
    if (mode === "register" && (!form.name || !form.email || !form.password))
      return setMsg({ type: "error", text: "Fill in all fields" });
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
        { method: "POST", body: fd }
      );
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify({ id: data.id, name: data.name }));
      onNav("dashboard");
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally { setLoading(false); }
  };

  const switchMode = (m) => {
    setMode(m); setMsg(null); setBlob(null);
    setForm({ name: "", email: "", password: "" });
    webcam.stop();
  };

  return (
    <div className="auth-layout">
      <div className="auth-hero">
        <div className="auth-hero-bg" />
        <div className="auth-hero-number">10</div>
        <div className="auth-hero-text">
          <div className="auth-hero-title">Find Your<br />Next Match</div>
          <div className="auth-hero-sub">AI face recognition login. Real matches. Real players. No passwords needed.</div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-form">
          <div className="auth-tag fade-up">
            <span className="auth-tag-dot" />
            Kickoff
          </div>

          <div className="tabs fade-up fade-up-1">
            <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")}>Login</button>
            <button className={`tab ${mode === "register" ? "active" : ""}`} onClick={() => switchMode("register")}>Register</button>
          </div>

          <Toast msg={msg?.text} type={msg?.type} />

          {/* Google Sign-In */}
          <div className="fade-up fade-up-2" style={{ marginBottom: 4 }}>
            {gLoading
              ? <div style={{ textAlign: "center", padding: "13px 0", color: "var(--muted)", fontSize: 13 }}>
                  <span className="spinner spinner-muted" style={{ marginRight: 8 }} />
                  Signing in with Google...
                </div>
              : <div ref={googleBtnRef} style={{ display: "flex", justifyContent: "center" }} />
            }
          </div>

          <div className="divider fade-up fade-up-3">or use face recognition</div>

          {mode === "register" && (
            <>
              <div className="field fade-up fade-up-3">
                <label className="label">Full Name</label>
                <input value={form.name} onChange={set("name")} placeholder="Your name" />
              </div>
              <div className="field fade-up fade-up-3">
                <label className="label">Email</label>
                <input value={form.email} onChange={set("email")} placeholder="email@example.com" type="email" />
              </div>
              <div className="field fade-up fade-up-3">
                <label className="label">Password</label>
                <input value={form.password} onChange={set("password")} placeholder="••••••••" type="password" />
              </div>
            </>
          )}

          {mode === "login" && (
            <p className="fade-up fade-up-3" style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>
              Look at the camera and capture your face to log in instantly.
            </p>
          )}

          <div className="fade-up fade-up-4">
            <label className="label">Face {mode === "register" ? "Photo" : "Scan"}</label>
            <CameraBox webcam={webcam} onCapture={capture} captured={!!blob} />
          </div>

          <button className="btn btn-primary btn-full fade-up fade-up-5" onClick={submitFace} disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? "Processing..." : mode === "register" ? "Create Account" : "Login with Face"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ onNav }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState(null);
  const [filter, setFilter]   = useState("all");
  const user = getUser();

  const load = () => {
    setLoading(true);
    apiFetch("/matches/all")
      .then(setMatches)
      .catch(e => setMsg({ type: "error", text: e.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const join = async (id) => {
    try {
      await apiFetch(`/matches/${id}/join`, { method: "POST" });
      setMsg({ type: "success", text: "You joined the match!" });
      load();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  const cancel = async (id) => {
    try {
      await apiFetch(`/matches/${id}`, { method: "DELETE" });
      setMsg({ type: "success", text: "Match cancelled" });
      load();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  const filtered = filter === "all" ? matches : matches.filter(m => m.status === filter);

  return (
    <div className="dash-layout">
      <nav className="topbar">
        <div className="topbar-logo">
          <div className="topbar-logo-dot" />
          KICKOFF
        </div>
        <div className="topbar-right">
          <div className="topbar-user">👤 {user?.name}</div>
          <button className="btn btn-primary" onClick={() => onNav("create")}>+ New Match</button>
          <button className="btn btn-ghost" onClick={() => { localStorage.clear(); onNav("auth"); }}>Logout</button>
        </div>
      </nav>

      <div className="dash-body">
        <div className="dash-header fade-up">
          <div>
            <div className="dash-title">OPEN <span>MATCHES</span></div>
            <div className="dash-count">{filtered.length} match{filtered.length !== 1 ? "es" : ""}</div>
          </div>
          <div className="tabs-filter">
            {["all","open","full","done"].map(f => (
              <button key={f} className={`btn ${filter === f ? "btn-primary" : ""}`}
                style={{ padding: "8px 16px", fontSize: 12 }} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {msg && <Toast msg={msg.text} type={msg.type} />}

        {loading && (
          <div style={{ textAlign: "center", padding: 80, color: "var(--muted)" }}>
            <span className="spinner spinner-muted" style={{ marginRight: 8 }} />
            Loading matches...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">🏟️</span>
            <div className="empty-state-title">No Matches Found</div>
            <p style={{ fontSize: 14, marginBottom: 24 }}>Be the first to create one.</p>
            <button className="btn btn-primary" onClick={() => onNav("create")}>Create Match</button>
          </div>
        )}

        <div className="match-grid">
          {filtered.map((m, i) => (
            <div key={m.id} className="match-card" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="match-card-top">
                <div className="match-card-title">{m.title}</div>
                <StatusBadge status={m.status} />
              </div>
              <div className="match-meta">
                <div className="match-meta-row"><span className="match-meta-icon">📍</span><span>{m.location}</span></div>
                <div className="match-meta-row"><span className="match-meta-icon">🗓</span><span>{new Date(m.scheduled_at).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"})}</span></div>
                <div className="match-meta-row"><span className="match-meta-icon">👥</span><span>{m.slots} players</span></div>
              </div>
              <div className="match-card-footer">
                {m.creator_id === user?.id ? <span className="match-owner-tag">Your match</span> : <span />}
                <div style={{ display: "flex", gap: 8 }}>
                  {m.status === "open" && m.creator_id !== user?.id && (
                    <button className="btn btn-primary" style={{ padding: "8px 18px", fontSize: 13 }} onClick={() => join(m.id)}>Join</button>
                  )}
                  {m.creator_id === user?.id && m.status === "open" && (
                    <button className="btn btn-danger" style={{ padding: "8px 18px", fontSize: 13 }} onClick={() => cancel(m.id)}>Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Create Match ──────────────────────────────────────────────────────────────
function CreateMatch({ onNav }) {
  const [form, setForm]       = useState({ title: "", location: "", scheduled_at: "", slots: "10" });
  const [msg, setMsg]         = useState(null);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title || !form.location || !form.scheduled_at)
      return setMsg({ type: "error", text: "Fill in all fields" });
    setLoading(true); setMsg(null);
    try {
      await apiFetch("/matches/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slots: Number(form.slots) }),
      });
      onNav("dashboard");
    } catch (e) {
      setMsg({ type: "error", text: e.message });
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
          <div className="create-title">New Match</div>
          <div className="create-sub">Set up your match and wait for a team to join.</div>
          <Toast msg={msg?.text} type={msg?.type} />
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
          <button className="btn btn-primary btn-full" onClick={submit} disabled={loading} style={{ marginTop: 8 }}>
            {loading && <span className="spinner" />}
            {loading ? "Creating..." : "Create Match"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState(getToken() ? "dashboard" : "auth");
  return (
    <>
      <style>{css}</style>
      {page === "auth"      && <AuthPage    onNav={setPage} />}
      {page === "dashboard" && <Dashboard   onNav={setPage} />}
      {page === "create"    && <CreateMatch onNav={setPage} />}
    </>
  );
}
