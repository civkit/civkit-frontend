import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegisterPayment from '../pages/registerPayment';
import { useRouter } from 'next/router';
import axios from 'axios';

// Mocking useRouter
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mocking axios
jest.mock('axios');

describe('RegisterPayment', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders the registration payment form', () => {
    render(<RegisterPayment darkMode={false} toggleDarkMode={jest.fn()} />);
    expect(screen.getByText(/Register Payment/i)).toBeInTheDocument();
  });

  it('displays error when Nostr extension is not installed', async () => {
    render(<RegisterPayment darkMode={false} toggleDarkMode={jest.fn()} />);
    fireEvent.click(screen.getByText(/Register Payment/i));
    await waitFor(() => {
      expect(screen.getByText(/Nostr extension is not installed/i)).toBeInTheDocument();
    });
  });

  it('submits the form and redirects on success', async () => {
    (axios.post as jest.Mock).mockResolvedValueOnce({
      data: { invoice: 'test-invoice' },
    });

    render(<RegisterPayment darkMode={false} toggleDarkMode={jest.fn()} />);
    fireEvent.click(screen.getByText(/Register Payment/i));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/registerPayment?username=');
    });
  });

  it('displays error on registration failure', async () => {
    (axios.post as jest.Mock).mockRejectedValueOnce(new Error('Registration failed'));

    render(<RegisterPayment darkMode={false} toggleDarkMode={jest.fn()} />);
    fireEvent.click(screen.getByText(/Register Payment/i));

    await waitFor(() => {
      expect(screen.getByText(/Registration failed. Please try again./i)).toBeInTheDocument();
    });
  });
});
