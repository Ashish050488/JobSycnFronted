// FILE: tests/pages/employer/ranked-bulk-helpers.test.ts
import { describe, it, expect } from 'vitest';
import { summarizeBulkResult, resolveBulkErrorMessage } from '../../../src/pages/employer/Jobs/ranked-bulk-helpers';
import { EmployerApplicantsApiError } from '../../../src/api/employer-applicants-api';
import type { BulkArchiveResult } from '../../../src/types/employer-applicants';

const current = new Set(['a1', 'a2', 'a3']);

describe('summarizeBulkResult', () => {
  it('all succeeded → success toast, selection cleared', () => {
    const result: BulkArchiveResult = { succeeded: [{ id: 'a1' }, { id: 'a2' }], failed: [], total: 2, successCount: 2, failureCount: 0 };
    const out = summarizeBulkResult(result, current);
    expect(out.variant).toBe('success');
    expect(out.message).toMatch(/Archived 2/);
    expect(out.nextSelection.size).toBe(0);
  });

  it('partial → info toast, selection reduced to the failed ids', () => {
    const result: BulkArchiveResult = {
      succeeded: [{ id: 'a1' }], failed: [{ id: 'a2', code: 'ALREADY_ARCHIVED', message: 'x' }],
      total: 2, successCount: 1, failureCount: 1,
    };
    const out = summarizeBulkResult(result, current);
    expect(out.variant).toBe('info');
    expect(out.message).toMatch(/Archived 1 of 2\. 1 failed/);
    expect([...out.nextSelection]).toEqual(['a2']);
  });

  it('all failed → error toast, selection kept intact', () => {
    const result: BulkArchiveResult = {
      succeeded: [], failed: [{ id: 'a1', code: 'INTERNAL_ERROR', message: 'x' }],
      total: 1, successCount: 0, failureCount: 1,
    };
    const out = summarizeBulkResult(result, current);
    expect(out.variant).toBe('error');
    expect(out.nextSelection).toBe(current);
  });
});

describe('resolveBulkErrorMessage', () => {
  it('maps known codes to friendly copy', () => {
    const err = new EmployerApplicantsApiError(400, 'BULK_LIMIT_EXCEEDED', 'raw');
    expect(resolveBulkErrorMessage(err)).toMatch(/up to 50/);
  });

  it('falls back to the raw message for unknown API codes', () => {
    const err = new EmployerApplicantsApiError(403, 'FORBIDDEN', 'Not allowed');
    expect(resolveBulkErrorMessage(err)).toBe('Not allowed');
  });

  it('non-API errors get a generic message', () => {
    expect(resolveBulkErrorMessage(new Error('boom'))).toBe('Could not archive.');
  });
});
