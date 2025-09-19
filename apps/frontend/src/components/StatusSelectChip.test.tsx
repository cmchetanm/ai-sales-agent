import { render, screen, fireEvent } from '@testing-library/react';
import { StatusSelectChip } from './StatusSelectChip';

describe('StatusSelectChip', () => {
  it('opens menu and selects item', () => {
    const onChange = vi.fn();
    render(<StatusSelectChip value="draft" options={["draft","running"]} onChange={onChange} />);
    fireEvent.click(screen.getByText(/Draft/i));
    fireEvent.click(screen.getByText(/running/i));
    expect(onChange).toHaveBeenCalledWith('running');
  });
});

