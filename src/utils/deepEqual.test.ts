import { describe, it, expect } from 'vitest';
import { deepEqual } from './deepEqual';

describe('deepEqual', () => {
  describe('primitives', () => {
    it('same numbers are equal', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual(0, 0)).toBe(true);
      expect(deepEqual(-1, -1)).toBe(true);
    });

    it('different numbers are not equal', () => {
      expect(deepEqual(1, 2)).toBe(false);
    });

    it('same strings are equal', () => {
      expect(deepEqual('hello', 'hello')).toBe(true);
    });

    it('different strings are not equal', () => {
      expect(deepEqual('hello', 'world')).toBe(false);
    });

    it('same booleans are equal', () => {
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(false, false)).toBe(true);
    });

    it('different booleans are not equal', () => {
      expect(deepEqual(true, false)).toBe(false);
    });
  });

  describe('objects', () => {
    it('same structure objects are equal', () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it('different value objects are not equal', () => {
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('different key objects are not equal', () => {
      expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
    });

    it('different length objects are not equal', () => {
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('nested objects are equal', () => {
      expect(
        deepEqual(
          { a: { b: { c: 3 } } },
          { a: { b: { c: 3 } } },
        ),
      ).toBe(true);
    });

    it('nested objects with different values are not equal', () => {
      expect(
        deepEqual(
          { a: { b: { c: 3 } } },
          { a: { b: { c: 4 } } },
        ),
      ).toBe(false);
    });
  });

  describe('arrays', () => {
    it('same arrays are equal', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    it('different arrays are not equal', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    it('different length arrays are not equal', () => {
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('arrays and objects are not equal', () => {
      expect(deepEqual([1, 2], { 0: 1, 1: 2 })).toBe(false);
    });
  });

  describe('null/undefined', () => {
    it('null equals null', () => {
      expect(deepEqual(null, null)).toBe(true);
    });

    it('undefined equals undefined', () => {
      expect(deepEqual(undefined, undefined)).toBe(true);
    });

    it('null does not equal undefined', () => {
      expect(deepEqual(null, undefined)).toBe(false);
    });

    it('null does not equal object', () => {
      expect(deepEqual(null, {})).toBe(false);
    });

    it('object does not equal null', () => {
      expect(deepEqual({}, null)).toBe(false);
    });
  });

  describe('mixed types', () => {
    it('number does not equal string', () => {
      expect(deepEqual(1, '1')).toBe(false);
    });

    it('number does not equal boolean', () => {
      expect(deepEqual(0, false)).toBe(false);
    });

    it('string does not equal object', () => {
      expect(deepEqual('hello', { value: 'hello' })).toBe(false);
    });
  });
});
