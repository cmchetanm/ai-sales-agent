import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Login } from './Login';

vi.mock('../auth/AuthContext', () => {
  return {
    useAuth: () => ({ signIn: vi.fn().mockResolvedValue(true) })
  };
});

describe('Login page', () => {
  it('renders and submits', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  });
});

