import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegisterForm from '../pages/register';
import { useRouter } from 'next/router';
import axios from 'axios';

// Mocking useRouter
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mocking axios
jest.mock('axios');

describe('RegisterForm', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders the registration form', () => {
    render(<RegisterForm darkMode={false} toggleDarkMode={jest.fn()} />);
    expect(screen.getByText(/Register for CivKit/i)).toBeInTheDocument();
  });

  it('displays error when Nostr extension is not installed', async () => {
    render(<RegisterForm darkMode={false} toggleDarkMode={jest.fn()} />);
    fireEvent.click(screen.getByText(/Register/i));
    await waitFor(() => {
      expect(screen.getByText(/Nostr extension is not installed/i)).toBeInTheDocument();
    });
  });

  it('submits the form and redirects on success', async () => {
    (axios.post as jest.Mock).mockResolvedValueOnce({
      data: { invoice: 'test-invoice' },
    });

    render(<RegisterForm darkMode={false} toggleDarkMode={jest.fn()} />);
    fireEvent.click(screen.getByText(/Register/i));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/registerPayment?username=');
    });
  });

  it('displays error on registration failure', async () => {
    (axios.post as jest.Mock).mockRejectedValueOnce(new Error('Registration failed'));

    render(<RegisterForm darkMode={false} toggleDarkMode={jest.fn()} />);
    fireEvent.click(screen.getByText(/Register/i));

    await waitFor(() => {
      expect(screen.getByText(/Registration failed. Please try again./i)).toBeInTheDocument();
    });
  });
}); 