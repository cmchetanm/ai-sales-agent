import { describe, it, expect } from 'vitest';
import { __chartsTestProbe, SimpleBarChart, SimpleLineChart, SimplePieChart } from './SimpleCharts';
import { render } from '@testing-library/react';

describe('SimpleCharts helpers', () => {
  it('probe clamps to non-negative integer', () => {
    expect(__chartsTestProbe(3.7)).toBe(3);
    expect(__chartsTestProbe(-2)).toBe(0);
  });
  it('renders bar chart svg', () => {
    const { container } = render(<SimpleBarChart data={[{ label: 'A', value: 1 }]} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
  it('renders line and pie charts', () => {
    const { container } = render(<>
      <SimpleLineChart points={[{ x: '2025-01-01', y: 2 }]} />
      <SimplePieChart data={[{ label: 'X', value: 3 }]} />
    </>);
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
  });
});
