import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { nip19 } from 'nostr-tools';
import { GiOstrich } from 'react-icons/gi';
import { generatePassword } from '../utils';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Head from 'next/head';
import { Spinner, Tooltip } from '../components';
import NavBar from '../components/NavBar';

const LoginForm = ({
  darkMode,
  toggleDarkMode,
}: {
  darkMode: boolean;
  toggleDarkMode: () => void;
}) => {
  const [username, setUsername] = useState('');
  const [extensionError, setExtensionError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserName = async () => {
      if (window.nostr) {
        setIsLoading(true);
        try {
          const publicKey = await window.nostr.getPublicKey();
          const npub = nip19.npubEncode(publicKey);
          setUsername(npub);
          setIsLoading(false);
          console.log('Username: ', username);
        } catch (error) {
          setIsLoading(false);
          console.error('Error fetching public key:', error);
        }
      }
    };

    fetchUserName();
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    if (!window.nostr) {
      setExtensionError('Nostr extension is not installed.');
      setIsLoading(false);
      return;
    }

    const password = await generatePassword(username);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/login`,
        {
          username,
          password,
        }
      );
      console.log(response);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('npub', username);
      localStorage.setItem('customer_id', response.data.userId.toString());
      setIsLoading(false);
      toast.success('Login successful!', {
        position: 'bottom-center',
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      router.push('/dashboard');
      // window.location.reload();
    } catch (error) {
      console.error('Error logging in:', error);
      setIsLoading(false);
      const errorMessage =
        error.response?.data?.message || 'Login failed. Please try again.';
      setExtensionError(errorMessage);
      toast.error(errorMessage, {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  return (
    <>
      <Head>
        <title>CivKit - Login</title>
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
              <span>Login</span>
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
                      {' '}
                      Nos2x
                    </a>
                    . Ensure you have the extension installed and enabled in
                    your browser.
                  </span>
                }
              />
            </div>
          </h2>
          <form onSubmit={handleLogin}>
            <div className='flex flex-col items-center'>
              <button
                className='focus:shadow-outline flex w-full items-center justify-center space-x-2 rounded bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600 focus:outline-none'
                type='submit'
                disabled={isLoading}
              >
                <span>{isLoading ? 'Logging you in...' : 'Login'}</span>
                {isLoading ? <Spinner /> : <GiOstrich />}
              </button>
              <Link href='/register' legacyBehavior>
                <a
                  className={`mt-4 inline-block align-baseline text-sm font-bold ${darkMode ? 'text-white hover:text-white' : 'text-gray-400 hover:text-gray-500'}`}
                >
                  Yet to register?
                </a>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
export default LoginForm;
