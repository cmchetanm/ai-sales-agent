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
    const btn = screen.getByRole('button', { name: /sign in/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
  });
});
