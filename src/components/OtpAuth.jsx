import { useEffect, useRef, useState } from 'react';

const OTP_LEN = 6;
const RESEND_SECS = 30;

export default function OtpAuth({ onVerified }) {
  const [step, setStep] = useState('phone'); // phone | otp
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [mockOtp, setMockOtp] = useState('');
  const [otp, setOtp] = useState(Array(OTP_LEN).fill(''));
  const [secs, setSecs] = useState(RESEND_SECS);
  const [shake, setShake] = useState(false);
  const inputsRef = useRef([]);

  // resend countdown
  useEffect(() => {
    if (step !== 'otp' || secs <= 0) return;
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, secs]);

  useEffect(() => {
    if (step === 'otp') {
      // autofocus first box
      setTimeout(() => inputsRef.current[0]?.focus(), 80);
    }
  }, [step]);

  const validPhone = /^[6-9]\d{9}$/.test(phone.trim());

  const sendOtp = () => {
    if (!validPhone) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setSending(true);
    // simulate network + SMS delay
    setTimeout(() => {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setMockOtp(code);
      setOtp(Array(OTP_LEN).fill(''));
      setSecs(RESEND_SECS);
      setStep('otp');
      setSending(false);
    }, 900);
  };

  const handleOtpChange = (i, val) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = d;
    setOtp(next);
    setError('');
    if (d && i < OTP_LEN - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
    if (e.key === 'Enter') verify();
  };

  const handlePaste = (e) => {
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, OTP_LEN);
    if (!text) return;
    e.preventDefault();
    const next = Array(OTP_LEN).fill('');
    text.split('').forEach((ch, i) => (next[i] = ch));
    setOtp(next);
    inputsRef.current[Math.min(text.length, OTP_LEN - 1)]?.focus();
  };

  const verify = () => {
    const code = otp.join('');
    if (code.length !== OTP_LEN) {
      setError(`Enter the ${OTP_LEN}-digit OTP`);
      return;
    }
    setVerifying(true);
    setError('');
    setTimeout(() => {
      setVerifying(false);
      if (code === mockOtp) {
        try {
          localStorage.setItem('cs_auth', JSON.stringify({ phone, ts: Date.now() }));
        } catch {}
        onVerified(phone);
      } else {
        setError('Wrong OTP. Try again (hint shown in demo box).');
        setShake(true);
        setTimeout(() => setShake(false), 450);
      }
    }, 800);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-bg" aria-hidden="true" />
      <div className={`auth-card glass ${shake ? 'shake' : ''}`}>
        <div className="brand" style={{ justifyContent: 'center' }}>
          <div className="brand-mark">C</div>
          <div style={{ textAlign: 'left' }}>
            <b className="font-display" style={{ fontSize: 18 }}>ComplianceScore</b>
            <small>like CIBIL, for vehicles</small>
          </div>
        </div>

        {step === 'phone' ? (
          <>
            <h1 className="font-display auth-title">Check your vehicle score</h1>
            <p className="muted" style={{ textAlign: 'center' }}>
              Enter your mobile number to get OTP.<br />Secure login • No password needed.
            </p>

            <label className="auth-label">MOBILE NUMBER</label>
            <div className="phone-row">
              <span className="prefix">+91</span>
              <input
                className="auth-input"
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button className="btn btn-primary auth-btn" onClick={sendOtp} disabled={sending}>
              {sending ? <span className="spinner" /> : null}
              {sending ? 'Sending OTP…' : 'Get OTP →'}
            </button>
            <p className="muted" style={{ textAlign: 'center', fontSize: 12 }}>
              By continuing you agree to Terms & Privacy Policy
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display auth-title">Enter OTP</h1>
            <p className="muted" style={{ textAlign: 'center' }}>
              Sent to <b style={{ color: '#0f172a' }}>+91 {phone}</b>{' '}
              <button className="link" onClick={() => { setStep('phone'); setError(''); }}>Change</button>
            </p>

            {/* demo hint — remove when real SMS API is wired */}
            <div className="demo-otp">📩 Demo OTP: <b>{mockOtp}</b> <span>(connect SMS API to go live)</span></div>

            <div className="otp-row" onPaste={handlePaste}>
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  className="otp-box"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKey(i, e)}
                />
              ))}
            </div>

            {error && <p className="auth-error" style={{ textAlign: 'center' }}>{error}</p>}

            <button className="btn btn-primary auth-btn" onClick={verify} disabled={verifying}>
              {verifying ? <span className="spinner" /> : null}
              {verifying ? 'Verifying…' : 'Verify & Continue →'}
            </button>

            <p className="muted" style={{ textAlign: 'center', fontSize: 13 }}>
              {secs > 0 ? (
                <>Resend OTP in <b style={{ color: '#ffbe45' }}>00:{String(secs).padStart(2, '0')}</b></>
              ) : (
                <button className="link" onClick={sendOtp}>↻ Resend OTP</button>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
