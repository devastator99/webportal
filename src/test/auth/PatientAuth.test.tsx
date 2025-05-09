
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { BrowserRouter } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuthHandlers } from '@/hooks/useAuthHandlers';
import { useToast } from '@/hooks/use-toast';

// Mock the useAuthHandlers hook
vi.mock('@/hooks/useAuthHandlers', () => ({
  useAuthHandlers: vi.fn(() => ({
    loading: false,
    error: null,
    handleLogin: vi.fn(),
    handleTestLogin: vi.fn(),
    setError: vi.fn(),
  })),
}));

// Mock the useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe('Patient Authentication', () => {
  const mockHandleLogin = vi.fn().mockImplementation(() => Promise.resolve());
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthHandlers as any).mockImplementation(() => ({
      loading: false,
      error: null,
      handleLogin: mockHandleLogin,
      handleTestLogin: vi.fn(),
      setError: vi.fn(),
    }));
    (useToast as any).mockImplementation(() => ({
      toast: mockToast,
    }));
  });

  it('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <AuthForm 
          type="login" 
          onSubmit={async () => Promise.resolve()} 
          error={null} 
          loading={false} 
        />
      </BrowserRouter>
    );
    
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('handles patient login with ram.naresh@example.com', async () => {
    render(
      <BrowserRouter>
        <AuthForm type="login" onSubmit={mockHandleLogin} error={null} loading={false} />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'ram.naresh@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'testpassword123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHandleLogin).toHaveBeenCalledWith(
        'ram.naresh@example.com',
        'testpassword123'
      );
    });
  });

  it('shows loading state during authentication', () => {
    (useAuthHandlers as any).mockImplementation(() => ({
      loading: true,
      error: null,
      handleLogin: mockHandleLogin,
      handleTestLogin: vi.fn(),
      setError: vi.fn(),
    }));

    render(
      <BrowserRouter>
        <AuthForm type="login" onSubmit={mockHandleLogin} error={null} loading={true} />
      </BrowserRouter>
    );

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
  });

  it('displays error message when login fails', () => {
    const errorMessage = 'Invalid email or password';
    
    render(
      <BrowserRouter>
        <AuthForm type="login" onSubmit={mockHandleLogin} error={errorMessage} loading={false} />
      </BrowserRouter>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(
      <BrowserRouter>
        <AuthForm type="login" onSubmit={mockHandleLogin} error={null} loading={false} />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('Email');
    const submitButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    expect(mockHandleLogin).not.toHaveBeenCalled();
  });

  it('prevents submission with empty fields', async () => {
    render(
      <BrowserRouter>
        <AuthForm type="login" onSubmit={mockHandleLogin} error={null} loading={false} />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);

    expect(mockHandleLogin).not.toHaveBeenCalled();
  });
});
