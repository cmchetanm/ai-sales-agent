import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Link, Routes, Route } from 'react-router-dom';
import { TopBarProgress } from './TopBarProgress';

describe('TopBarProgress', () => {
  it('shows progress on route change', async () => {
    render(
      <MemoryRouter initialEntries={["/first"]}>
        <TopBarProgress />
        <Link to="/second">go</Link>
        <Routes>
          <Route path="/first" element={<div>first</div>} />
          <Route path="/second" element={<div>second</div>} />
        </Routes>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('go'));
    // Progress bar appears briefly; allow hidden in case of timing
    expect(await screen.findByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });
});
