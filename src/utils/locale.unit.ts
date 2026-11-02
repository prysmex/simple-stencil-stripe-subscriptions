import { describe, expect, it } from 'vitest';
import { replaceSubstringsWithObject } from './locale';

describe('replaceSubstringsWithObject', () => {
  it('replaces every placeholder', () => {
    expect(replaceSubstringsWithObject('{a} and {b}, again {a}', { a: '1', b: '2' })).toBe('1 and 2, again 1');
  });

  it('leaves unknown placeholders alone', () => {
    expect(replaceSubstringsWithObject('Start your {numberOfDays}-day {plan}', { numberOfDays: '14' })).toBe('Start your 14-day {plan}');
  });
});
