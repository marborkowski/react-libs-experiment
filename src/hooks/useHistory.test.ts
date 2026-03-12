import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory } from './useHistory';

describe('useHistory', () => {
  it('initial state is set', () => {
    const { result } = renderHook(() => useHistory('hello'));
    const [state] = result.current;
    expect(state).toBe('hello');
  });

  it('setState adds to history', () => {
    const { result } = renderHook(() => useHistory(0));

    act(() => {
      result.current[1](1);
    });

    expect(result.current[0]).toBe(1);
    expect(result.current[2].history).toEqual([0, 1]);
  });

  it('undo restores previous state', () => {
    const { result } = renderHook(() => useHistory('a'));

    act(() => {
      result.current[1]('b');
    });
    act(() => {
      result.current[1]('c');
    });

    act(() => {
      result.current[2].undo();
    });

    expect(result.current[0]).toBe('b');
  });

  it('redo restores next state', () => {
    const { result } = renderHook(() => useHistory('a'));

    act(() => {
      result.current[1]('b');
    });
    act(() => {
      result.current[1]('c');
    });
    act(() => {
      result.current[2].undo();
    });
    act(() => {
      result.current[2].undo();
    });

    act(() => {
      result.current[2].redo();
    });

    expect(result.current[0]).toBe('b');
  });

  it('canUndo/canRedo are correct', () => {
    const { result } = renderHook(() => useHistory(0));

    // Initially: no undo, no redo
    expect(result.current[2].canUndo).toBe(false);
    expect(result.current[2].canRedo).toBe(false);

    act(() => {
      result.current[1](1);
    });

    // After set: can undo, no redo
    expect(result.current[2].canUndo).toBe(true);
    expect(result.current[2].canRedo).toBe(false);

    act(() => {
      result.current[2].undo();
    });

    // After undo: no undo, can redo
    expect(result.current[2].canUndo).toBe(false);
    expect(result.current[2].canRedo).toBe(true);
  });

  it('undo at beginning does nothing', () => {
    const { result } = renderHook(() => useHistory('start'));

    act(() => {
      result.current[2].undo();
    });

    expect(result.current[0]).toBe('start');
    expect(result.current[2].pointer).toBe(0);
  });

  it('redo at end does nothing', () => {
    const { result } = renderHook(() => useHistory('start'));

    act(() => {
      result.current[1]('end');
    });

    act(() => {
      result.current[2].redo();
    });

    expect(result.current[0]).toBe('end');
    expect(result.current[2].pointer).toBe(1);
  });

  it('new setState after undo discards forward history', () => {
    const { result } = renderHook(() => useHistory(1));

    act(() => { result.current[1](2); });
    act(() => { result.current[1](3); });
    act(() => { result.current[1](4); });

    // Undo back to 2
    act(() => { result.current[2].undo(); });
    act(() => { result.current[2].undo(); });
    expect(result.current[0]).toBe(2);

    // Set new value, discarding 3 and 4
    act(() => { result.current[1](99); });

    expect(result.current[0]).toBe(99);
    expect(result.current[2].history).toEqual([1, 2, 99]);
    expect(result.current[2].canRedo).toBe(false);
  });

  it('maxSize option works', () => {
    const { result } = renderHook(() => useHistory(0, { maxSize: 3 }));

    act(() => { result.current[1](1); });
    act(() => { result.current[1](2); });
    act(() => { result.current[1](3); });
    act(() => { result.current[1](4); });

    // maxSize is 3, so only 3 most recent entries
    expect(result.current[2].history.length).toBe(3);
    expect(result.current[2].history).toEqual([2, 3, 4]);
    expect(result.current[0]).toBe(4);
  });

  it('clear resets to current value', () => {
    const { result } = renderHook(() => useHistory('a'));

    act(() => { result.current[1]('b'); });
    act(() => { result.current[1]('c'); });

    act(() => { result.current[2].clear(); });

    expect(result.current[0]).toBe('c');
    expect(result.current[2].history).toEqual(['c']);
    expect(result.current[2].pointer).toBe(0);
    expect(result.current[2].canUndo).toBe(false);
    expect(result.current[2].canRedo).toBe(false);
  });

  it('functional updates work', () => {
    const { result } = renderHook(() => useHistory(10));

    act(() => {
      result.current[1]((prev) => prev + 5);
    });

    expect(result.current[0]).toBe(15);

    act(() => {
      result.current[1]((prev) => prev * 2);
    });

    expect(result.current[0]).toBe(30);
    expect(result.current[2].history).toEqual([10, 15, 30]);
  });
});
