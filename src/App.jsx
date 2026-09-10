import { useEffect, useState } from 'react';
import Speedometer from './components/Speedometer.jsx';
import OtpAuth from './components/OtpAuth.jsx';

const ITEMS = [
  { title: 'RC & Registration', desc: 'Single owner • Valid till 2036', pct: 98 },
  { title: 'Insurance', desc: 'Comprehensive • Till Jan 2027', pct: 95 },
  { title: 'Challans & Traffic', desc: '0 pending • 2 historic (paid)', pct: 82 },
  { title: 'PUC & Emission', desc: 'Valid • Expires in 18 days', pct: 68 },
  { title: 'Tax & Permit', desc: 'Road tax paid • No violations', pct: 100 },
  { title: 'Fitness & Service', desc: '3 services • No accidents', pct: 90 },
];

function loadAuth() {
  try {
    const raw = localStorage.getItem('cs_auth');
    if (!raw) return null;
    const a = JSON.parse(raw);
    return a?.phone ? a : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [auth, setAuth] = useState(null);
  const [ready, setReady] = useState(false);
  const [score, setScore] = useState(76);
  const [plate, setPlate] = useState('MH 12 AB 1234');

  useEffect(() => {
    setAuth(loadAuth());
    setReady(true);
  }, []);

  const logout = () => {
    try {
      localStorage.removeItem('cs_auth');
    } catch {}
    setAuth(null);
  };

  const recheck = () => {
    // replay from 0 -> new score for perfect 0-100% sweep demo
    setScore(0);
    requestAnimationFrame(() =>
      setTimeout(() => setScore(70 + Math.floor(Math.random() * 26)), 60)
    );
  };

  if (!ready) return <div className="auth-wrap"><span className="spinner" /></div>;
  if (!auth) return <OtpAuth onVerified={(phone) => setAuth({ phone, ts: Date.now() })} />;

  return (
    <div className="page">
      <header className="topbar glass">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <b className="font-display">ComplianceScore</b>
            <small>like CIBIL, for vehicles • dark speedo edition</small>
          </div>
        </div>
        <div className="top-actions">
          <span className="user-pill" title="Logged in">● +91 {auth.phone}</span>
          <button className="btn btn-ghost" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="searchbar glass">
        <span className="search-ico">🚗</span>
        <input
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase().slice(0, 15))}
          placeholder="MH 12 AB 1234"
        />
        <button className="btn btn-primary" onClick={recheck}>Check Score →</button>
      </div>

      <div className="grid2">
        <section className="card glass">
          <h1 className="font-display">Vehicle Compliance Score</h1>
          <p className="muted">0–100 score • POOR → EXCELLENT dial • smooth needle, zero-glitch rendering</p>

          <Speedometer value={score} duration={2000} />

          <div className="controls">
            <span className="muted"><b>0</b></span>
            <input
              type="range" min="0" max="100" value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              aria-label="Preview score"
            />
            <span className="muted"><b>100</b></span>
            <span className="preview-pill">{score} / 100</span>
          </div>
          <div className="preset-row">
            <span className="preset-label">QUICK CHECK — TAP A BAND</span>
            {[
              { l: 'Poor', v: 10 },
              { l: 'Fair', v: 30 },
              { l: 'Good', v: 50 },
              { l: 'Very Good', v: 70 },
              { l: 'Excellent', v: 90 },
            ].map((p) => (
              <button key={p.l} className="chip" onClick={() => setScore(p.v)}>{p.l} • {p.v}</button>
            ))}
            <button className="chip chip-hot" onClick={() => { setScore(0); setTimeout(() => setScore(100), 80); }}>▶ Play 0→100</button>
          </div>
        </section>

        <section className="card glass">
          <span className="muted">REGISTERED VEHICLE • <span className="ok">● RC ACTIVE</span></span>
          <div><span className="plate">{plate.toUpperCase() || '—'}</span></div>
          <h2 className="font-display vehicle-title">Hyundai Creta SX(O) • 2021 • Diesel</h2>
          <p className="muted">Pune RTO (MH-12) • White • SUV • Chassis *****4821</p>
          <div className="kv">
            <div><span>OWNER</span><b>R***esh S***</b></div>
            <div><span>REGISTRATION</span><b>Till Mar 2036</b></div>
            <div><span>INSURANCE</span><b className="ok">Valid till Jan 2027 ✓</b></div>
            <div><span>PUC</span><b className="warn">Expires in 18 days ⚠</b></div>
          </div>
          <div className="break">
            {ITEMS.map((b) => (
              <div className="bitem" key={b.title}>
                <div>
                  <b style={{ fontSize: 13 }}>{b.title}</b>
                  <div className="muted" style={{ fontSize: 12 }}>{b.desc}</div>
                </div>
                <span className="bnum">{b.pct}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="foot muted">Logged in as +91 {auth.phone} • Demo build — wire SMS gateway (MSG91/Firebase) to go live</footer>
    </div>
  );
}
