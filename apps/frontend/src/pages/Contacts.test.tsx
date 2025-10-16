import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Contacts } from './Contacts';

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ token: 't' }) }));
vi.mock('../api/client', () => ({
  api: {
    contactsIndex: () => Promise.resolve({ ok: true, data: { contacts: [{ id: 1, first_name: 'Ava', last_name: 'Lee', email: 'ava@example.com' }] } }),
    contactsDelete: () => Promise.resolve({ ok: true }),
    contactsCreate: () => Promise.resolve({ ok: true, data: { contact: { id: 2 } } })
  }
}));

describe('Contacts page', () => {
  it('renders contacts table', async () => {
    render(
      <MemoryRouter>
        <Contacts />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Contacts/i)).toBeInTheDocument();
    expect(await screen.findByText('ava@example.com')).toBeInTheDocument();
  });
});

