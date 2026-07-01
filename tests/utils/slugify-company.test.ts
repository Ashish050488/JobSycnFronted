// FILE: tests/utils/slugify-company.test.ts
import { describe, it, expect } from 'vitest';
import { slugifyCompanyName } from '../../src/utils/slugify-company';

describe('slugifyCompanyName', () => {
  it('lowercases and hyphenates words', () => {
    expect(slugifyCompanyName('Acme Agency')).toBe('acme-agency');
  });

  it('strips diacritics via NFKD', () => {
    expect(slugifyCompanyName('Café Münchën')).toBe('cafe-munchen');
  });

  it('falls back to "your-company" for empty input', () => {
    expect(slugifyCompanyName('')).toBe('your-company');
  });

  it('falls back to "your-company" for whitespace/symbols only', () => {
    expect(slugifyCompanyName('   ')).toBe('your-company');
    expect(slugifyCompanyName('!!!')).toBe('your-company');
  });

  it('collapses consecutive separators and trims edge hyphens', () => {
    expect(slugifyCompanyName('  Hello   World!!  ')).toBe('hello-world');
    expect(slugifyCompanyName('--Acme--')).toBe('acme');
  });

  it('caps the slug at 60 characters with no trailing hyphen', () => {
    const longName = 'a'.repeat(80);
    const slug = slugifyCompanyName(longName);
    expect(slug.length).toBe(60);
    expect(slug.endsWith('-')).toBe(false);
  });
});
