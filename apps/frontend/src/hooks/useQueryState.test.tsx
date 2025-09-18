import { describe, it, expect } from 'vitest';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { useQueryState } from './useQueryState';

function Demo() {
  const [q, setQ] = useQueryState('q', '');
  const [page, setPage] = useQueryState('page', 1 as any, 'number');
  const [, setParams] = useSearchParams();
  return (
    <div>
      <button onClick={() => setQ('hello')}>setq</button>
      <button onClick={() => setPage((page as number) + 1)}>setp</button>
      <span data-testid="q">{q}</span>
      <span data-testid="page">{String(page)}</span>
    </div>
  );
}

describe('useQueryState', () => {
  it('reads and writes to query string', async () => {
    const ui = render(
      <MemoryRouter initialEntries={[{ pathname: '/', search: '?q=init&page=2' }]}>
        <Demo />
      </MemoryRouter>
    );
    expect(screen.getByTestId('q').textContent).toBe('init');
    expect(screen.getByTestId('page').textContent).toBe('2');
    fireEvent.click(screen.getByText('setq'));
    fireEvent.click(screen.getByText('setp'));
    // allow router state to flush
    await new Promise((r) => setTimeout(r, 0));
    const loc = (ui as any).container.ownerDocument.defaultView!.location as Location;
    expect(loc.search.includes('q=hello')).toBe(true);
    expect(loc.search.includes('page=3')).toBe(true);
  });
});
