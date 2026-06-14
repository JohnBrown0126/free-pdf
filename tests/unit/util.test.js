import { describe, it, expect } from 'vitest';
import { formatDate, todayIso } from '../../public/js/util.js';

describe('formatDate', () => {
  it('formats a date without time', () => {
    expect(formatDate('2026-06-14', false, '')).toBe('14 Jun 2026');
  });

  it('formats a date with time when includeTime is true', () => {
    expect(formatDate('2026-06-14', true, '14:30')).toBe('14 Jun 2026 14:30');
  });

  it('omits time when includeTime is false even if timeStr is provided', () => {
    expect(formatDate('2026-06-14', false, '09:00')).toBe('14 Jun 2026');
  });

  it('omits time when timeStr is empty', () => {
    expect(formatDate('2026-06-14', true, '')).toBe('14 Jun 2026');
  });

  it('returns empty string for empty dateStr', () => {
    expect(formatDate('', false, '')).toBe('');
    expect(formatDate(null, false, '')).toBe('');
    expect(formatDate(undefined, false, '')).toBe('');
  });

  it('formats every month with correct 3-letter abbreviation', () => {
    const expected = [
      'Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec',
    ];
    expected.forEach((abbr, i) => {
      const month = String(i + 1).padStart(2, '0');
      expect(formatDate(`2026-${month}-01`, false, '')).toBe(`1 ${abbr} 2026`);
    });
  });

  it('handles single-digit days without zero-padding', () => {
    expect(formatDate('2026-01-05', false, '')).toBe('5 Jan 2026');
  });

  it('returns raw string for out-of-range month', () => {
    expect(formatDate('2026-13-01', false, '')).toBe('2026-13-01');
  });

  it('returns raw string for invalid date parts', () => {
    expect(formatDate('abc-xx-yy', false, '')).toBe('abc-xx-yy');
  });
});

describe('todayIso', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns today\'s date', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(todayIso()).toBe(today);
  });
});
