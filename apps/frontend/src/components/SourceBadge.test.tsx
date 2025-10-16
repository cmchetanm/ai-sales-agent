import { render, screen } from '@testing-library/react';
import { SourceBadge } from './SourceBadge';

describe('SourceBadge', () => {
  it('shows mapped label and color', () => {
    const { rerender } = render(<SourceBadge source="apollo" />);
    expect(screen.getByText('Apollo')).toBeInTheDocument();
    rerender(<SourceBadge source="unknownVendor" />);
    expect(screen.getByText('unknownVendor')).toBeInTheDocument();
    rerender(<SourceBadge /> as any);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

