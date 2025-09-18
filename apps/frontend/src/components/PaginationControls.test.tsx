import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaginationControls } from './PaginationControls';

describe('PaginationControls', () => {
  it('renders and handles next/prev', () => {
    let page = 1;
    const onPageChange = (p: number) => { page = p; };
    render(<PaginationControls page={1} pages={3} onPageChange={onPageChange} />);
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(page).toBe(2);
  });
});

