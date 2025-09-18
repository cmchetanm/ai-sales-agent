import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders and updates value', () => {
    let val = '';
    const onChange = (v: string) => { val = v; };
    render(<SearchBar value={val} onChange={onChange} placeholder="Search" />);
    const input = screen.getByPlaceholderText('Search') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(val).toBe('abc');
  });
});

