import { describe, it, expect } from 'vitest';
import { sortBy } from './sort';

describe('sortBy', () => {
  const data = [
    { id: 2, name: 'Bravo' },
    { id: 1, name: 'Alpha' },
    { id: 3, name: 'Charlie' },
  ];
  it('sorts ascending by name', () => {
    const out = sortBy(data, 'name', 'asc');
    expect(out.map((d) => d.name)).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });
  it('sorts descending by id', () => {
    const out = sortBy(data, 'id', 'desc');
    expect(out.map((d) => d.id)).toEqual([3, 2, 1]);
  });
  it('hits greater-than branch in comparator for asc', () => {
    const out = sortBy([{ x: 2 }, { x: 1 }], 'x', 'asc' as any);
    expect(out.map((d: any) => d.x)).toEqual([1, 2]);
  });
  it('handles null/undefined values deterministically', () => {
    const mixed = [
      { id: 1, name: undefined as any },
      { id: 2, name: 'Alpha' },
      { id: 3, name: null as any },
    ];
    const asc = sortBy(mixed, 'name', 'asc');
    expect(asc.map((d) => d.id)).toEqual([1,3,2]);
    const desc = sortBy(mixed, 'name', 'desc');
    expect(desc.map((d) => d.id)).toEqual([2,1,3]);
  });
});
