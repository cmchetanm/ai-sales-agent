import { render, screen } from '@testing-library/react';
import { AuroraTestProbe } from './Aurora';

describe('Aurora', () => {
  it('renders probe', () => {
    render(<AuroraTestProbe />);
    expect(screen.getByTestId('aurora-probe')).toBeInTheDocument();
  });
});

