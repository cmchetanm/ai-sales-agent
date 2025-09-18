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
});

