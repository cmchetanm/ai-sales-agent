import { render, screen } from '@testing-library/react';
import { ChatBubble } from './ChatBubble';

describe('ChatBubble', () => {
  it('renders content and timestamp', () => {
    render(<ChatBubble role="assistant" content="Hello" timestamp="now" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('now')).toBeInTheDocument();
  });
});

