// FILE: tests/hooks/employer/useApplicantKeyboardNav.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useApplicantKeyboardNav } from '../../../src/hooks/employer/useApplicantKeyboardNav';

function press(key: string, init: KeyboardEventInit = {}, target?: EventTarget) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  if (target) target.dispatchEvent(event);
  else window.dispatchEvent(event);
  return event;
}

afterEach(() => { document.body.innerHTML = ''; });

describe('useApplicantKeyboardNav', () => {
  it('ArrowLeft fires onPrev, ArrowRight fires onNext, Escape fires onEscape', () => {
    const onPrev = vi.fn(); const onNext = vi.fn(); const onEscape = vi.fn();
    renderHook(() => useApplicantKeyboardNav({ onPrev, onNext, onEscape }));
    press('ArrowLeft'); press('ArrowRight'); press('Escape');
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('a null handler makes its key a no-op', () => {
    const onNext = vi.fn();
    renderHook(() => useApplicantKeyboardNav({ onPrev: null, onNext }));
    press('ArrowLeft'); // onPrev is null
    expect(onNext).not.toHaveBeenCalled();
  });

  it('modifier chords are ignored (Ctrl+ArrowLeft, Meta+ArrowRight)', () => {
    const onPrev = vi.fn(); const onNext = vi.fn();
    renderHook(() => useApplicantKeyboardNav({ onPrev, onNext }));
    press('ArrowLeft', { ctrlKey: true });
    press('ArrowRight', { metaKey: true });
    expect(onPrev).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('ignores shortcuts while typing in input / textarea / contentEditable', () => {
    const onPrev = vi.fn(); const onNext = vi.fn();
    renderHook(() => useApplicantKeyboardNav({ onPrev, onNext }));

    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    document.body.append(input, textarea, editable);

    press('ArrowLeft', {}, input);
    press('ArrowRight', {}, textarea);
    press('ArrowLeft', {}, editable);
    expect(onPrev).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('removes its listener on unmount', () => {
    const onNext = vi.fn();
    const { unmount } = renderHook(() => useApplicantKeyboardNav({ onPrev: null, onNext }));
    unmount();
    press('ArrowRight');
    expect(onNext).not.toHaveBeenCalled();
  });
});
