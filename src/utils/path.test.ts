import { describe, it, expect } from 'vitest';
import { getByPath, setByPath } from './path';

describe('getByPath', () => {
  it('gets a simple path', () => {
    expect(getByPath({ name: 'Alice' }, 'name')).toBe('Alice');
  });

  it('gets a nested path', () => {
    const obj = { user: { address: { city: 'NYC' } } };
    expect(getByPath(obj, 'user.address.city')).toBe('NYC');
  });

  it('returns undefined for non-existent paths', () => {
    expect(getByPath({ a: 1 }, 'b')).toBeUndefined();
  });

  it('returns undefined for non-existent nested paths', () => {
    expect(getByPath({ a: { b: 1 } }, 'a.c.d')).toBeUndefined();
  });

  it('returns undefined when traversing through null', () => {
    expect(getByPath({ a: null }, 'a.b')).toBeUndefined();
  });

  it('returns undefined when traversing through undefined', () => {
    expect(getByPath({ a: undefined }, 'a.b')).toBeUndefined();
  });
});

describe('setByPath', () => {
  it('sets a simple path', () => {
    const obj = { name: 'Alice' };
    const result = setByPath(obj, 'name', 'Bob');
    expect(result.name).toBe('Bob');
  });

  it('sets a nested path', () => {
    const obj = { user: { address: { city: 'NYC' } } };
    const result = setByPath(obj, 'user.address.city', 'LA');
    expect(result.user.address.city).toBe('LA');
  });

  it('creates an immutable copy (does not mutate original)', () => {
    const obj = { a: { b: 1 } };
    const result = setByPath(obj, 'a.b', 2);

    // Original unchanged
    expect(obj.a.b).toBe(1);
    // Result has new value
    expect(result.a.b).toBe(2);
    // Different references
    expect(result).not.toBe(obj);
    expect(result.a).not.toBe(obj.a);
  });

  it('preserves sibling properties', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = setByPath(obj, 'b', 99);
    expect(result).toEqual({ a: 1, b: 99, c: 3 });
  });

  it('works with arrays at the top level', () => {
    const arr = [10, 20, 30];
    const result = setByPath(arr, '1', 99);
    expect(result).toEqual([10, 99, 30]);
    expect(result).not.toBe(arr);
  });
});
