import { render, screen } from '@testing-library/react';
import { BusyOverlay } from './BusyOverlay';

describe('BusyOverlay', () => {
  it('renders a spinner when loading', () => {
    render(
      <BusyOverlay loading={true}>
        <div>content</div>
      </BusyOverlay>
    );
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });
});
