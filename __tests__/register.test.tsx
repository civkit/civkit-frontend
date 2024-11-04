import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegisterForm from '../pages/register';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';

// Mock the toast notifications
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
  },
}));

// Mocking useRouter
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mocking axios
jest.mock('axios');

// Mock crypto.subtle
const mockSubtle = {
  importKey: jest.fn().mockResolvedValue('mockKey'),
  sign: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
};

Object.defineProperty(window, 'crypto', {
  value: { subtle: mockSubtle },
  writable: true,
});

describe('RegisterForm', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
    
    // Mock window.nostr with a valid hex public key
    const mockNostr = {
      getPublicKey: jest.fn().mockResolvedValue('aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899'),
      signEvent: jest.fn().mockResolvedValue({ sig: 'mockSignature' }),
    };
    
    Object.defineProperty(window, 'nostr', {
      value: mockNostr,
      writable: true,
      configurable: true
    });
  });

  it('displays error on registration failure', async () => {
    // Mock the axios post to fail
    (axios.post as jest.Mock).mockRejectedValueOnce(new Error('Registration failed'));

    await act(async () => {
      render(<RegisterForm darkMode={false} toggleDarkMode={jest.fn()} />);
    });

    // Wait for initialization and password generation
    await waitFor(() => {
      expect(window.nostr?.getPublicKey).toHaveBeenCalled();
    });

    // Wait for the button to be enabled
    let registerButton: HTMLElement;
    await waitFor(() => {
      registerButton = screen.getByRole('button', { name: /Register/i });
      expect(registerButton).toBeEnabled();
    });

    // Submit the form
    await act(async () => {
      fireEvent.submit(registerButton!.closest('form')!);
    });

    // Verify the error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Registration failed. Please try again.',
        expect.any(Object)
      );
    });
  });
}); 