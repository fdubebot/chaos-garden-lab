import { describe, expect, it } from 'vitest';
import { asciiTrend } from '../src/reporting.js';

describe('reporting', () => {
  it('creates sparkline-like output', () => {
    const out = asciiTrend([0.1, 0.2, 0.8, 0.3]);
    expect(out.length).toBe(4);
    expect(out[0]).not.toBe(out[2]);
  });
});
