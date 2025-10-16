import { render, screen } from '@testing-library/react';
import { ShortcutsDialog } from './ShortcutsDialog';

describe('ShortcutsDialog', () => {
  it('shows common shortcuts', () => {
    render(<ShortcutsDialog open={true} onClose={() => {}} />);
    expect(screen.getByText(/Keyboard Shortcuts/i)).toBeInTheDocument();
    expect(screen.getByText(/Ctrl\/Cmd \+ K/i)).toBeInTheDocument();
  });
});

