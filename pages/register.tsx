import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { nip19 } from 'nostr-tools';
import { generatePassword } from '../utils/generatePassword';
import { GiOstrich } from 'react-icons/gi';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';
import Tooltip from '../components/Tooltip';
import NavBar from '../components/NavBar';

const RegisterForm = ({
  darkMode,
  toggleDarkMode,
}: {
  darkMode: boolean;
  toggleDarkMode: () => void;
}) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [invoice, setInvoice] = useState('');
  const [hasNostrExtension, setHasNostrExtension] = useState<Boolean>();
  const [extensionError, setExtensionError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchUsername = async () => {
      if (window.nostr) {
        try {
          const publicKey = await window.nostr.getPublicKey();
          const npub = nip19.npubEncode(publicKey);
          console.log(publicKey);
          console.log(npub);
          setUsername(npub);
          setHasNostrExtension(!!window.nostr);
        } catch (error) {
          toast.error('Error fetching public key', {
            position: 'bottom-center',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
          console.error('Error fetching public key:', error);
        }
      }
    };

    fetchUsername();
  }, []);

  useEffect(() => {
    const handleGeneratePassword = async () => {
      if (username) {
        const userPassword = await generatePassword(username);
        setPassword(userPassword);
        console.log('Username: ', username);
        console.log('Password: ', userPassword);
      }
    };

    handleGeneratePassword();
  }, [username]);

  const handleRegister = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    if (!username || !password) {
      toast.error('Username and password are required.', {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }

    setIsLoading(true);
    setExtensionError('');

    if (!hasNostrExtension) {
      setExtensionError('Nostr extension is not installed.');
      toast.error(extensionError, {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/register`,
        { username, password },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setInvoice(response.data.invoice);
      router.push(`/registerPayment?username=${username}`);
    } catch (error) {
      console.error('Error registering:', error);
      setExtensionError('Registration failed. Please try again.');
      toast.error('Registration failed. Please try again.', {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setIsLoading(false);
    }
  }, [username, password, hasNostrExtension, router]);

  return (
    <>
      <Head>
        <title>CivKit - Register</title>
      </Head>
      <NavBar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <div
        className={`flex min-h-screen items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}
      >
        <div
          className={`w-full max-w-md rounded-lg p-8 shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
        >
          <h2
            className={`mb-6 text-center text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}
          >
            <div className='flex flex-row items-center justify-center gap-2'>
              <span>Register for CivKit</span>
              <Tooltip
                message={
                  <span>
                    To authenticate, you need a Nostr signer like
                    <a
                      href='https://chromewebstore.google.com/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp'
                      target='_blank'
                      rel='noopener noreferrer'
                      style={{ color: 'inherit', textDecoration: 'underline' }}
                    >
                      {''} Nos2x
                    </a>
                    . Ensure you have the extension installed and enabled in
                    your browser.
                  </span>
                }
              />
            </div>
          </h2>
          <form onSubmit={handleRegister}>
            <div className='flex flex-col items-center'>
              <button
                className='focus:shadow-outline flex w-full items-center justify-center space-x-2 rounded bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600 focus:outline-none'
                type='submit'
                disabled={!hasNostrExtension || isLoading}
              >
                <span>{isLoading ? 'Registering...' : 'Register'}</span>
                {isLoading ? <Spinner /> : <GiOstrich />}
              </button>
              <Link href='/login' legacyBehavior>
                <a
                  className={`mt-4 inline-block align-baseline text-sm font-bold ${darkMode ? 'text-white hover:text-white' : 'text-gray-400 hover:text-gray-500'}`}
                >
                  Proceed to login?
                </a>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RegisterForm;
