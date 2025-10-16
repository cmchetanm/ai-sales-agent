import { render, screen, fireEvent } from '@testing-library/react';
import { ChatBubble } from './ChatBubble';

describe('ChatBubble', () => {
  it('renders content and timestamp', () => {
    render(<ChatBubble role="assistant" content="Hello" timestamp="now" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('now')).toBeInTheDocument();
  });
  it('renders user bubble and copy action', () => {
    const writeText = vi.fn();
    (global as any).navigator = { clipboard: { writeText } } as any;
    render(<ChatBubble role="user" content="Copy me" />);
    fireEvent.click(screen.getByRole('button'));
    expect(writeText).toHaveBeenCalledWith('Copy me');
  });
});
