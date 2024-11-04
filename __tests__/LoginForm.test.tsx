import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import LoginForm from '../components/LoginForm';
import { useRouter } from 'next/router';

jest.mock('axios');
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock localStorage with all required Storage interface methods
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  key: jest.fn(),
  length: 0
} as Storage;

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('LoginForm Component', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    jest.clearAllMocks();
  });

  it('should render login form', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: { token: 'fake-token' },
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'fake-token');
      expect(mockPush).toHaveBeenCalledWith('/take-order');
    });
  });

  it('should handle login error', async () => {
    (axios.post as jest.Mock).mockRejectedValue(new Error('Login failed'));

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
    });
  });
}); 