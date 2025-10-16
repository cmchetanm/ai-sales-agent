import { render, screen, waitFor } from '@testing-library/react';
import { PipelineBoard } from './PipelineBoard';
import { AuthProvider } from '../auth/AuthContext';
import { ThemeModeProvider } from '../theme';

// Minimal smoke test to keep coverage and ensure it renders columns
describe('PipelineBoard', () => {
  it('renders columns for statuses', async () => {
    render(
      <ThemeModeProvider>
        <AuthProvider>
          <PipelineBoard pipelineId={1} />
        </AuthProvider>
      </ThemeModeProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/NEW/i)).toBeInTheDocument();
    });
  });
});

