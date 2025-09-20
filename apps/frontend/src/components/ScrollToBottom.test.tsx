import { render, screen, fireEvent } from '@testing-library/react';
import { ScrollToBottom } from './ScrollToBottom';

describe('ScrollToBottom', () => {
  it('renders when visible and calls onClick', () => {
    const onClick = vi.fn();
    render(<ScrollToBottom visible onClick={onClick} />);
    fireEvent.click(screen.getByLabelText(/scroll to bottom/i));
    expect(onClick).toHaveBeenCalled();
  });
});

