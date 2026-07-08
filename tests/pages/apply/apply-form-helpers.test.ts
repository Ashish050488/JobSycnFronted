// FILE: tests/pages/apply/apply-form-helpers.test.ts
import { describe, it, expect } from 'vitest';
import { validateApplyForm, fieldError, mapServerError } from '../../../src/pages/apply/apply-form-helpers';
import type { ApplyFormData } from '../../../src/types/public-apply';

function pdf(): File {
  const file = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: 1000 });
  return file;
}

function valid(overrides: Partial<ApplyFormData> = {}): ApplyFormData {
  return {
    firstName: 'Asha', lastName: 'Rao', email: 'asha@x.com', phone: '',
    coverNote: '', consent_dpdp: true, consent_futureOpportunities: false,
    resume: pdf(), honeypot: '', ...overrides,
  };
}

describe('apply-form-helpers', () => {
  it('a complete form passes validation with no errors', () => {
    expect(validateApplyForm(valid())).toEqual({});
  });

  it('flags each remaining required field', () => {
    const errors = validateApplyForm(valid({ firstName: '', email: 'bad', resume: null, consent_dpdp: false }));
    expect(errors.firstName).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.resume).toBeTruthy();
    expect(errors.consent_dpdp).toBeTruthy();
  });

  it('does not validate a removed years-of-experience field (P9)', () => {
    // The key no longer exists on ApplyFormData; fieldError has no case for it.
    // Cast through unknown so the test can prove the runtime is a safe no-op.
    const field = 'yearsExperience' as unknown as keyof ApplyFormData;
    expect(fieldError(field, valid())).toBeUndefined();
  });

  it('maps known server error codes to fields, but INVALID_YEARS_EXPERIENCE is no longer a field (P9)', () => {
    expect(mapServerError('INVALID_EMAIL', 'bad email')).toEqual({ email: 'bad email' });
    // The removed code falls through to the generic form-level error, not a field.
    expect(mapServerError('INVALID_YEARS_EXPERIENCE', 'nope')).toEqual({ _form: 'nope' });
  });
});
