
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import Auth from '../Auth';
import { supabase } from '@/integrations/supabase/client';
import { AuthError } from '@supabase/supabase-js';

describe('Auth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form by default', () => {
    renderWithProviders(<Auth />);
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  });

  it('switches between login and register forms', async () => {
    renderWithProviders(<Auth />);
    const user = userEvent.setup();

    // Initially in login mode
    expect(screen.getByText('Welcome back')).toBeInTheDocument();

    // Click to switch to register mode
    await user.click(screen.getByText('Need an account? Sign up'));

    // Verify register form is shown
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();

    // Switch back to login
    await user.click(screen.getByText('Already have an account? Sign in'));
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const mockSignIn = vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00.000Z',
          role: 'authenticated',
          updated_at: '2024-01-01T00:00:00.000Z',
          phone: '',
          confirmed_at: '2024-01-01T00:00:00.000Z',
          last_sign_in_at: '2024-01-01T00:00:00.000Z',
          factors: null,
          identities: [],
        },
        session: {
          access_token: 'token',
          refresh_token: 'refresh_token',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: '123',
            email: 'test@example.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: '2024-01-01T00:00:00.000Z',
            role: 'authenticated',
            updated_at: '2024-01-01T00:00:00.000Z',
            phone: '',
            confirmed_at: '2024-01-01T00:00:00.000Z',
            last_sign_in_at: '2024-01-01T00:00:00.000Z',
            factors: null,
            identities: [],
          },
          expires_at: 1234567890,
        },
      },
      error: null,
    });

    renderWithProviders(<Auth />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('handles login error', async () => {
    const mockSignIn = vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
      data: { user: null, session: null },
      error: new AuthError('Invalid login credentials', 400),
    });

    renderWithProviders(<Auth />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
      expect(screen.getByText('Invalid email or password. Please try again.')).toBeInTheDocument();
    });
  });

  it('handles test user login', async () => {
    const mockSignIn = vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
      data: {
        user: {
          id: '123',
          email: 'doctor@test.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00.000Z',
          role: 'authenticated',
          updated_at: '2024-01-01T00:00:00.000Z',
          phone: '',
          confirmed_at: '2024-01-01T00:00:00.000Z',
          last_sign_in_at: '2024-01-01T00:00:00.000Z',
          factors: null,
          identities: [],
        },
        session: {
          access_token: 'token',
          refresh_token: 'refresh_token',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: '123',
            email: 'doctor@test.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: '2024-01-01T00:00:00.000Z',
            role: 'authenticated',
            updated_at: '2024-01-01T00:00:00.000Z',
            phone: '',
            confirmed_at: '2024-01-01T00:00:00.000Z',
            last_sign_in_at: '2024-01-01T00:00:00.000Z',
            factors: null,
            identities: [],
          },
          expires_at: 1234567890,
        },
      },
      error: null,
    });

    renderWithProviders(<Auth />);
    const user = userEvent.setup();

    await user.click(screen.getByText('Login as Test Doctor'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'doctor@test.com',
        password: 'test123',
      });
    });
  });
});

