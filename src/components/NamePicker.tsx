// FILE: src/components/NamePicker.tsx
import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { useUser, type AppUser } from '../context/UserContext';
import { BRAND } from '../theme/brand';

export default function NamePicker() {
  const { selectUser } = useUser();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/users')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load users');
        return r.json();
      })
      .then((data: AppUser[]) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--paper)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--primary-soft)',
              border: '1px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={16} color="var(--primary)" />
          </div>
          <span
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
            }}
          >
            {BRAND.appName.replace('Jobs', '')}
            <span style={{ color: 'var(--primary)' }}>Jobs</span>
          </span>
        </div>

        <h1
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: 'var(--ink)',
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}
        >
          Who are you?
        </h1>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--muted-ink)',
            marginBottom: 32,
          }}
        >
          Pick your name to get started
        </p>

        {loading && (
          <p style={{ color: 'var(--muted-ink)', fontSize: '0.85rem' }}>Loading…</p>
        )}

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>
        )}

        {!loading && !error && users.length === 0 && (
          <p style={{ color: 'var(--muted-ink)', fontSize: '0.85rem' }}>
            No users yet. Ask the admin to add you.
          </p>
        )}

        {!loading && !error && users.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 12,
            }}
          >
            {users.map(u => (
              <button
                key={u.slug}
                onClick={() => selectUser(u)}
                style={{
                  padding: '18px 12px',
                  background: 'var(--surface-solid)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'border-color 0.18s, box-shadow 0.18s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-sm)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--primary-soft)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                  }}
                >
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <span
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--ink)',
                  }}
                >
                  {u.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
