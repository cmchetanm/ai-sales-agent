import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';
import { AuthProvider } from '../auth/AuthContext';
import { ThemeModeProvider } from '../theme';

describe('CommandPalette', () => {
  it('renders and filters commands', () => {
    render(
      <MemoryRouter>
        <ThemeModeProvider>
          <AuthProvider>
            <CommandPalette open={true} onClose={() => {}} />
          </AuthProvider>
        </ThemeModeProvider>
      </MemoryRouter>
    );
    // Should list some default commands
    expect(screen.getByText(/Go to Leads/i)).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/Type a command/i);
    fireEvent.change(input, { target: { value: 'Account' } });
    expect(screen.getByText(/Go to Account/i)).toBeInTheDocument();
  });
});
