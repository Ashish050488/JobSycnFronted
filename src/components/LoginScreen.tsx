import { useUser } from '../context/UserContext';
import { GoogleLogin } from '@react-oauth/google';
import { useState, useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';
import { BRAND } from '../theme/brand';

/* ── Falling tech keywords (matrix rain) ───────────────────────── */
const TECH_WORDS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'AWS', 'Docker', 'Kubernetes',
  'MongoDB', 'GraphQL', 'Go', 'Rust', 'Vue', 'Angular', 'Redis', 'PostgreSQL',
  'Next.js', 'Django', 'Flutter', 'Swift', 'Kafka', 'Terraform', 'Jenkins',
  'Figma', 'Git', 'Linux', 'Java', 'C++', 'Scala', 'Elixir', 'Firebase',
  'Nginx', 'Svelte', 'Remix', 'Prisma', 'Tailwind', 'Webpack', 'Vite',
  'Express', 'FastAPI', 'Spring', 'Laravel', 'Rails', 'Deno', 'Bun',
  'Solidity', 'WASM', 'gRPC', 'RabbitMQ', 'Elasticsearch', 'Cassandra',
];

const COLUMNS = 14;

function FallingColumns() {
  const cols = Array.from({ length: COLUMNS }, (_, i) => {
    const words: string[] = [];
    for (let j = 0; j < 12; j++) {
      words.push(TECH_WORDS[Math.floor(Math.random() * TECH_WORDS.length)]);
    }
    return { id: i, words, left: `${(i / COLUMNS) * 100}%`, delay: `${-(Math.random() * 20).toFixed(1)}s`, dur: `${18 + Math.random() * 14}s`, opacity: 0.04 + Math.random() * 0.06 };
  });

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {cols.map(col => (
        <div key={col.id} style={{
          position: 'absolute',
          left: col.left,
          top: 0,
          width: `${100 / COLUMNS}%`,
          animation: `ls-rain ${col.dur} linear ${col.delay} infinite`,
          opacity: col.opacity,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          paddingTop: 10,
          whiteSpace: 'nowrap',
        }}>
          {col.words.map((w, j) => (
            <span key={j} style={{
              fontSize: '0.68rem',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              color: 'var(--primary)',
              letterSpacing: '0.03em',
              textAlign: 'center',
              lineHeight: 1.8,
            }}>{w}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Animated counter ──────────────────────────────────────────── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const duration = 2000;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    }
    const timer = setTimeout(() => {
      ref.current = requestAnimationFrame(tick);
    }, 800);
    return () => { clearTimeout(timer); if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target]);

  return <>{count}{suffix}</>;
}

/* ── Typing effect ─────────────────────────────────────────────── */
const ROLES = ['Frontend Developer', 'Backend Engineer', 'Data Scientist', 'DevOps Engineer', 'ML Engineer', 'Full Stack Dev', 'Mobile Developer', 'Cloud Architect'];

function TypingRoles() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const currentRole = ROLES[roleIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charIndex < currentRole.length) {
      timeout = setTimeout(() => setCharIndex(c => c + 1), 70 + Math.random() * 40);
    } else if (!deleting && charIndex === currentRole.length) {
      timeout = setTimeout(() => setDeleting(true), 2000);
    } else if (deleting && charIndex > 0) {
      timeout = setTimeout(() => setCharIndex(c => c - 1), 35);
    } else if (deleting && charIndex === 0) {
      setDeleting(false);
      setRoleIndex(i => (i + 1) % ROLES.length);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, deleting, roleIndex]);

  return (
    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
      {ROLES[roleIndex].slice(0, charIndex)}
      <span style={{ animation: 'ls-blink 0.8s step-end infinite', color: 'var(--primary)', fontWeight: 300 }}>|</span>
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/* ── Main Component ────────────────────────────────────────────── */
/* ══════════════════════════════════════════════════════════════════ */
export default function LoginScreen() {
  const { login } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    setMousePos({ x, y });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

        @keyframes ls-rain {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes ls-fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ls-scaleIn {
          from { opacity: 0; transform: scale(0.88) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ls-blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0; }
        }
        @keyframes ls-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ls-morphBlob {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          25%      { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          50%      { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; }
          75%      { border-radius: 60% 30% 60% 40% / 70% 40% 50% 60%; }
        }
        @keyframes ls-pulseRing {
          0%   { transform: translate(-50%, -50%) scale(0.8); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
        @keyframes ls-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes ls-dash {
          to { stroke-dashoffset: 0; }
        }
        @keyframes ls-orbit1 {
          0%   { transform: rotate(0deg) translateX(180px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(180px) rotate(-360deg); }
        }
        @keyframes ls-orbit2 {
          0%   { transform: rotate(120deg) translateX(220px) rotate(-120deg); }
          100% { transform: rotate(480deg) translateX(220px) rotate(-480deg); }
        }
        @keyframes ls-orbit3 {
          0%   { transform: rotate(240deg) translateX(160px) rotate(-240deg); }
          100% { transform: rotate(600deg) translateX(160px) rotate(-600deg); }
        }
        @keyframes ls-glitch {
          0%, 90%, 100% { transform: translate(0); }
          92% { transform: translate(-2px, 1px); }
          94% { transform: translate(2px, -1px); }
          96% { transform: translate(-1px, -1px); }
          98% { transform: translate(1px, 2px); }
        }
        @keyframes ls-scanline {
          0%   { top: -4px; }
          100% { top: 100%; }
        }
        @keyframes ls-borderGlow {
          0%, 100% { border-color: var(--border); box-shadow: var(--shadow-lg); }
          50%      { border-color: var(--primary); box-shadow: var(--shadow-lg), 0 0 30px var(--primary-soft), 0 0 60px rgba(45,106,79,0.08); }
        }

        .ls-feature-pill:hover {
          border-color: var(--primary) !important;
          color: var(--primary) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--primary-soft);
        }
        .ls-google-wrap:hover {
          transform: scale(1.02);
        }
      `}</style>

      {/* ── Full viewport, NO scroll ───────────────────────── */}
      <div
        onMouseMove={handleMouseMove}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}
      >

        {/* ── Matrix rain ──────────────────────────────────── */}
        <FallingColumns />

        {/* ── Mouse-following orb ──────────────────────────── */}
        <div style={{
          position: 'absolute',
          width: 600, height: 600,
          left: `${mousePos.x}%`, top: `${mousePos.y}%`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, var(--primary-soft) 0%, transparent 65%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          transition: 'left 0.8s ease, top 0.8s ease',
          opacity: 0.7,
        }} />

        {/* ── Morphing blobs ───────────────────────────────── */}
        <div style={{
          position: 'absolute', width: 300, height: 300,
          top: '15%', right: '10%',
          background: 'linear-gradient(135deg, var(--primary-soft), var(--info-soft))',
          animation: 'ls-morphBlob 12s ease-in-out infinite',
          filter: 'blur(50px)', opacity: 0.4, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: 250, height: 250,
          bottom: '10%', left: '8%',
          background: 'linear-gradient(135deg, var(--success-soft), var(--primary-soft))',
          animation: 'ls-morphBlob 15s ease-in-out 3s infinite',
          filter: 'blur(45px)', opacity: 0.35, pointerEvents: 'none',
        }} />

        {/* ── Orbiting dots ────────────────────────────────── */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', opacity: 0.3, animation: 'ls-orbit1 25s linear infinite' }} />
          <div style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', background: 'var(--success)', opacity: 0.25, animation: 'ls-orbit2 30s linear infinite' }} />
          <div style={{ position: 'absolute', width: 5, height: 5, borderRadius: '50%', background: 'var(--info)', opacity: 0.2, animation: 'ls-orbit3 20s linear infinite' }} />
        </div>

        {/* ── Pulse rings ──────────────────────────────────── */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 200, height: 200,
            border: '1px solid var(--primary)', borderRadius: '50%',
            opacity: 0, pointerEvents: 'none',
            animation: `ls-pulseRing 4s ease-out ${i * 1.3}s infinite`,
          }} />
        ))}

        {/* ── Corner SVG brackets (draw-in) ────────────────── */}
        <svg style={{ position: 'absolute', top: 24, left: 24, opacity: 0.15, pointerEvents: 'none' }} width="80" height="80" viewBox="0 0 80 80">
          <path d="M 0 40 L 0 0 L 40 0" fill="none" stroke="var(--primary)" strokeWidth="1.5"
            strokeDasharray="120" strokeDashoffset="120"
            style={{ animation: 'ls-dash 1.5s ease 0.5s forwards' }} />
        </svg>
        <svg style={{ position: 'absolute', top: 24, right: 24, opacity: 0.15, pointerEvents: 'none' }} width="80" height="80" viewBox="0 0 80 80">
          <path d="M 40 0 L 80 0 L 80 40" fill="none" stroke="var(--primary)" strokeWidth="1.5"
            strokeDasharray="120" strokeDashoffset="120"
            style={{ animation: 'ls-dash 1.5s ease 0.7s forwards' }} />
        </svg>
        <svg style={{ position: 'absolute', bottom: 24, left: 24, opacity: 0.15, pointerEvents: 'none' }} width="80" height="80" viewBox="0 0 80 80">
          <path d="M 0 40 L 0 80 L 40 80" fill="none" stroke="var(--primary)" strokeWidth="1.5"
            strokeDasharray="120" strokeDashoffset="120"
            style={{ animation: 'ls-dash 1.5s ease 0.9s forwards' }} />
        </svg>
        <svg style={{ position: 'absolute', bottom: 24, right: 24, opacity: 0.15, pointerEvents: 'none' }} width="80" height="80" viewBox="0 0 80 80">
          <path d="M 40 80 L 80 80 L 80 40" fill="none" stroke="var(--primary)" strokeWidth="1.5"
            strokeDasharray="120" strokeDashoffset="120"
            style={{ animation: 'ls-dash 1.5s ease 1.1s forwards' }} />
        </svg>

        {/* ── Horizontal scanline ──────────────────────────── */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, var(--primary-soft), transparent)',
          opacity: 0.3, pointerEvents: 'none',
          animation: 'ls-scanline 6s linear infinite',
        }} />

        {/* ═══════════════════════════════════════════════════ */}
        {/* ── CARD ────────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════ */}
        <div style={{
          position: 'relative', zIndex: 2,
          width: 'min(460px, calc(100vw - 32px))',
          animation: 'ls-scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{
            background: 'var(--surface-solid)',
            border: '1.5px solid var(--border)',
            borderRadius: 22,
            padding: '48px 40px 40px',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            animation: 'ls-borderGlow 4s ease-in-out 2s infinite',
          }}>

            {/* CRT scanlines overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(45,106,79,0.015) 2px, rgba(45,106,79,0.015) 4px)',
              pointerEvents: 'none', borderRadius: 22,
            }} />

            {/* ── Logo ─────────────────────────────────────── */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              marginBottom: 28,
              animation: 'ls-fadeUp 0.6s ease 0.15s both',
            }}>
              <div style={{
                position: 'relative',
                width: 50, height: 50, borderRadius: 14,
                background: 'linear-gradient(135deg, var(--primary-soft), var(--primary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px var(--primary-soft)',
              }}>
                <Zap size={22} color="#fff" fill="#fff" />
                <svg style={{
                  position: 'absolute', inset: -6,
                  animation: 'ls-spin 8s linear infinite', opacity: 0.3,
                }} viewBox="0 0 62 62">
                  <circle cx="31" cy="31" r="28" fill="none" stroke="var(--primary)"
                    strokeWidth="0.8" strokeDasharray="8 12" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.65rem', fontWeight: 700,
                  color: 'var(--ink)', letterSpacing: '-0.03em',
                  display: 'block', lineHeight: 1,
                }}>
                  {BRAND.appName.replace('Jobs', '')}
                  <span style={{ color: 'var(--primary)' }}>Jobs</span>
                </span>
                <span style={{
                  fontSize: '0.65rem', color: 'var(--subtle-ink)',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  marginTop: 3, display: 'block',
                }}>
                  India's Tech Job Tracker
                </span>
              </div>
            </div>

            {/* ── Typing headline ──────────────────────────── */}
            <div style={{ animation: 'ls-fadeUp 0.6s ease 0.25s both', marginBottom: 8 }}>
              <h1 style={{
                fontSize: 'clamp(1.1rem, 3.5vw, 1.35rem)',
                fontWeight: 600, color: 'var(--ink)',
                lineHeight: 1.4, letterSpacing: '-0.01em',
              }}>
                Your next role as
              </h1>
              <div style={{
                fontSize: 'clamp(1.3rem, 4vw, 1.65rem)',
                fontWeight: 700, minHeight: '2rem',
                letterSpacing: '-0.02em',
                animation: 'ls-glitch 8s ease infinite',
              }}>
                <TypingRoles />
              </div>
            </div>

            <p style={{
              fontSize: '0.88rem', color: 'var(--muted-ink)',
              lineHeight: 1.6, maxWidth: 320,
              margin: '0 auto 30px',
              animation: 'ls-fadeUp 0.6s ease 0.35s both',
            }}>
              Apply smarter. Track everything. Land the job.
            </p>

            {/* ── Google button ─────────────────────────────── */}
            <div style={{
              display: 'flex', justifyContent: 'center',
              marginBottom: 24,
              animation: 'ls-fadeUp 0.6s ease 0.42s both',
            }}>
              <div className="ls-google-wrap" style={{
                padding: 4, borderRadius: 12,
                background: loading
                  ? 'linear-gradient(90deg, var(--primary-soft), var(--primary), var(--primary-soft))'
                  : 'linear-gradient(135deg, var(--border), var(--primary-soft), var(--border))',
                backgroundSize: loading ? '200% 100%' : '100% 100%',
                animation: loading ? 'ls-shimmer 1.2s linear infinite' : 'none',
                transition: 'all 0.3s, transform 0.2s',
              }}>
                <div style={{ background: 'var(--surface-solid)', borderRadius: 10, padding: 2 }}>
                  <GoogleLogin
                    onSuccess={async cr => {
                      if (cr.credential) {
                        try { setLoading(true); setError(null); await login(cr.credential); }
                        catch { setError('Sign-in failed. Please try again.'); }
                        finally { setLoading(false); }
                      } else { setError('Sign-in failed. Please try again.'); }
                    }}
                    onError={() => setError('Sign-in failed. Please try again.')}
                    useOneTap={false}
                    shape="rectangular"
                    size="large"
                    width={280}
                    text="signin_with"
                    theme="outline"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                fontSize: '0.82rem', color: 'var(--danger)',
                background: 'var(--danger-soft)', border: '1px solid var(--danger)',
                borderRadius: 10, padding: '8px 16px', marginBottom: 20,
                animation: 'ls-fadeUp 0.3s ease',
              }}>{error}</div>
            )}

            {/* ── Divider ──────────────────────────────────── */}
            <div style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, var(--border), var(--primary-soft), var(--border), transparent)',
              margin: '0 -40px 22px',
              animation: 'ls-fadeUp 0.6s ease 0.48s both',
            }} />

            {/* ── Counting stats ────────────────────────────── */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 36,
              animation: 'ls-fadeUp 0.6s ease 0.52s both',
            }}>
              {[
                { target: 50, suffix: '+', label: 'Companies' },
                { target: 1000, suffix: '+', label: 'Tech Roles' },
                { target: 6, suffix: 'x', label: 'Daily Sync' },
              ].map((stat, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div className="font-sketch" style={{
                    fontSize: '1.5rem', fontWeight: 700,
                    color: 'var(--primary)', lineHeight: 1,
                  }}>
                    <Counter target={stat.target} suffix={stat.suffix} />
                  </div>
                  <div style={{
                    fontSize: '0.68rem', color: 'var(--subtle-ink)',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4,
                  }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feature pills ──────────────────────────────── */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 10,
            marginTop: 18, flexWrap: 'wrap',
            animation: 'ls-fadeUp 0.6s ease 0.6s both',
          }}>
            {[
              { icon: '✶', text: 'Skill matching' },
              { icon: '🔥', text: 'Daily streaks' },
              { icon: '📋', text: 'Track applies' },
              { icon: '🏷️', text: 'Auto-tagging' },
            ].map((feat, i) => (
              <div key={i} className="ls-feature-pill" style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 13px',
                background: 'var(--surface-solid)',
                border: '1px solid var(--border)',
                borderRadius: 999,
                fontSize: '0.73rem', color: 'var(--muted-ink)', fontWeight: 500,
                cursor: 'default',
                transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}>
                <span style={{ fontSize: '0.8rem' }}>{feat.icon}</span>
                {feat.text}
              </div>
            ))}
          </div>

          <p style={{
            textAlign: 'center', fontSize: '0.7rem',
            color: 'var(--subtle-ink)', marginTop: 16,
            animation: 'ls-fadeUp 0.6s ease 0.68s both', opacity: 0.6,
          }}>
            🔒 We only use Google to identify you. No data is shared.
          </p>
        </div>
      </div>
    </>
  );
}