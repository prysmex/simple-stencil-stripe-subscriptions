import { describe, expect, it } from 'vitest';
import { parseJsonAttribute } from './utils';

describe('parseJsonAttribute', () => {
  it('parses JSON strings', () => {
    expect(parseJsonAttribute('[{"id":"prod_1"}]')).toEqual([{ id: 'prod_1' }]);
  });

  it('passes through values that were set as properties', () => {
    const products = [{ id: 'prod_1' }];
    expect(parseJsonAttribute(products)).toBe(products);
    expect(parseJsonAttribute(undefined)).toBeUndefined();
  });

  it('treats an empty attribute as unset', () => {
    expect(parseJsonAttribute('')).toBeUndefined();
    expect(parseJsonAttribute('  ')).toBeUndefined();
  });
});
