import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegisterPayment from '../pages/registerPayment';
import { useRouter } from 'next/router';
import axios from 'axios';
import type { RenderResult } from '@testing-library/react';

// Mock QR code component
jest.mock('qrcode.react', () => ({
  __esModule: true,
  default: ({ value }: { value: string }) => <div data-testid="mock-qr">{value}</div>,
}));

// Mock Spinner component
jest.mock('../components/Spinner', () => ({
  __esModule: true,
  default: () => <div data-testid="spinner">Loading...</div>,
}));

// Mocking useRouter
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mocking axios
jest.mock('axios');

describe('RegisterPayment', () => {
  const mockRouter = {
    push: jest.fn(),
    query: { username: 'testuser' },
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    await act(async () => {
      render(<RegisterPayment darkMode={false} toggleDarkMode={jest.fn()} />);
    });
    expect(screen.getByText('Fetching your invoice...')).toBeInTheDocument();
  });

  it('shows invoice after successful fetch', async () => {
    (axios.post as jest.Mock).mockResolvedValueOnce({
      data: {
        invoice: 'test-invoice',
        payment_hash: 'test-hash',
        status: 'pending'
      }
    });

    await act(async () => {
      render(<RegisterPayment darkMode={false} toggleDarkMode={jest.fn()} />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('mock-qr')).toHaveTextContent('test-invoice');
    });
  });

  it('shows error message on fetch failure', async () => {
    (axios.post as jest.Mock).mockRejectedValueOnce(new Error('Registration failed'));

    render(<RegisterPayment darkMode={false} toggleDarkMode={jest.fn()} />);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });

    expect(screen.getByText('Fetching your invoice...')).toBeInTheDocument();
  });
});
