// FILE: src/components/SkillsEditor.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useUser } from '../context/UserContext';

const SUGGESTIONS = [
  'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Go',
  'Rust', 'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'GraphQL',
  'Next.js', 'Vue', 'Angular', 'Django', 'Spring Boot', 'Flutter',
  'React Native', 'Figma', 'System Design', 'DSA', 'Machine Learning',
];

interface Props {
  onClose: () => void;
}

export default function SkillsEditor({ onClose }: Props) {
  const { userSkills, saveSkills } = useUser();
  const [skills, setSkills] = useState<string[]>(userSkills);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when modal opens
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const addSkill = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > 50) return;
    setSkills(prev => {
      if (prev.some(s => s.toLowerCase() === trimmed.toLowerCase())) return prev;
      if (prev.length >= 30) return prev;
      return [...prev, trimmed];
    });
    setInput('');
  }, []);

  const removeSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(input);
    } else if (e.key === 'Backspace' && !input && skills.length > 0) {
      setSkills(prev => prev.slice(0, -1));
    }
  };

  const handleSave = async () => {
    // Commit any pending input before saving
    const finalSkills = input.trim()
      ? [...skills, ...(skills.some(s => s.toLowerCase() === input.trim().toLowerCase()) ? [] : [input.trim()])]
      : skills;
    setSaving(true);
    await saveSkills(finalSkills.slice(0, 30));
    setSaving(false);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.5)',
          animation: 'sheetFadeIn 0.18s ease',
        }}
      />
      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          zIndex: 501,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(560px, calc(100vw - 24px))',
          maxHeight: 'calc(100vh - 40px)',
          background: 'var(--surface-solid)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>
              My Skills
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted-ink)', marginTop: 3, marginBottom: 0 }}>
              We'll highlight these in every job description you view
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted-ink)', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="thin-scroll" style={{ overflow: 'auto', flex: 1, padding: '16px 20px 4px' }}>
          {/* Skills input area */}
          <div
            onClick={() => inputRef.current?.focus()}
            style={{
              border: '1.25px solid var(--border)', borderRadius: 10,
              padding: '8px 10px', background: 'var(--paper)',
              display: 'flex', flexWrap: 'wrap', gap: 6, cursor: 'text',
              marginBottom: 6, minHeight: 42,
              transition: 'border-color 0.18s',
            }}
            onFocus={() => {}}
          >
            {skills.map(skill => (
              <span
                key={skill}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'var(--primary)', color: '#fff',
                  borderRadius: 999, padding: '3px 10px 3px 12px',
                  fontSize: '0.82rem', fontWeight: 600,
                }}
              >
                {skill}
                <button
                  onClick={e => { e.stopPropagation(); removeSkill(skill); }}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ffffffcc', padding: 0, display: 'flex', alignItems: 'center', lineHeight: 1 }}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={skills.length === 0 ? 'Type a skill, press Enter to add…' : ''}
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                fontSize: '0.88rem', color: 'var(--ink)', fontFamily: 'inherit',
                minWidth: 160, flex: 1, padding: '2px 4px',
              }}
            />
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--muted-ink)', marginBottom: 18 }}>
            Press Enter or comma to add · Backspace to remove last · Max 30 skills
          </p>

          {/* Suggestions */}
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--subtle-ink)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Suggestions
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, paddingBottom: 20 }}>
            {SUGGESTIONS.map(s => {
              const added = skills.some(x => x.toLowerCase() === s.toLowerCase());
              const actualSkill = added ? skills.find(x => x.toLowerCase() === s.toLowerCase())! : s;
              return (
                <button
                  key={s}
                  onClick={() => added ? removeSkill(actualSkill) : addSkill(s)}
                  style={{
                    padding: '4px 12px', borderRadius: 999,
                    border: added
                      ? '1.5px solid var(--primary)'
                      : '1.25px solid var(--border)',
                    background: added ? 'var(--primary-soft)' : 'transparent',
                    color: added ? 'var(--primary)' : 'var(--muted-ink)',
                    cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit',
                    transition: 'all 0.15s', fontWeight: added ? 600 : 400,
                  }}
                >
                  {added ? '✓ ' : ''}{s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, background: 'var(--paper2)',
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted-ink)' }}>
            {skills.length} / 30 skills
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 18px', borderRadius: 9,
                border: '1.25px solid var(--border)', background: 'transparent',
                color: 'var(--muted-ink)', cursor: 'pointer',
                fontSize: '0.88rem', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '8px 22px', borderRadius: 9, border: 'none',
                background: saving ? 'var(--primary-soft)' : 'var(--primary)',
                color: saving ? 'var(--primary)' : '#fff',
                cursor: saving ? 'default' : 'pointer',
                fontSize: '0.88rem', fontFamily: 'inherit', fontWeight: 600,
                transition: 'all 0.15s',
              }}
            >
              {saving ? 'Saving…' : 'Save Skills'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
