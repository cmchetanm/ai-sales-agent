import { render, screen } from '@testing-library/react';
import { TableSkeleton, TableSkeletonRows } from './TableSkeleton';

describe('TableSkeleton', () => {
  it('renders full table skeleton with custom rows/cols', () => {
    const { container } = render(<TableSkeleton rows={2} cols={2} />);
    // two header cells present
    expect(container.querySelectorAll('thead th, thead td').length).toBeGreaterThan(0);
  });
  it('renders row-only skeletons', () => {
    const { container } = render(<table><tbody><TableSkeletonRows rows={2} cols={2} /></tbody></table> as any);
    expect(container.querySelectorAll('tbody tr').length).toBeGreaterThan(0);
  });
});

