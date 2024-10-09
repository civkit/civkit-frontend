import Head from 'next/head';
import Link from 'next/link';
import { MdArrowOutward } from 'react-icons/md';
import { FaTelegramPlane, FaGithub } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import NavBar from '../components/NavBar';

export default function Home({
  darkMode,
  toggleDarkMode,
}: {
  darkMode: boolean;
  toggleDarkMode: () => void;
}) {
  return (
    <>
      <Head>
        <title>CivKit - Home</title>
      </Head>
      <NavBar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <div
        className={`flex min-h-screen items-center justify-center ${darkMode ? 'dark:bg-gray-900' : 'bg-white'}`}
      >
        <div className='text-center'>
          <h1
            className={`mb-2 text-3xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}
          >
            CivKit is powered by Nostr and the Lightning Network
          </h1>
          <p
            className={`mb-4 inline-block rounded-full border-2 border-orange-500 px-3 py-1 text-sm ${darkMode ? 'text-white' : 'text-black'}`}
          >
            Welcome to the future of P2P
          </p>
          <div className='flex justify-center space-x-4'>
            <Link href='/register' legacyBehavior>
              <a className='flex items-center rounded-3xl bg-orange-500 px-3 py-1 text-sm text-white hover:bg-orange-600'>
                Get Started
                <MdArrowOutward className='ml-1' />
              </a>
            </Link>
            <Link href='https://civkit.github.io/' legacyBehavior>
              <a className='rounded-3xl bg-orange-500 px-3 py-1 text-sm text-white hover:bg-orange-600'>
                Learn More
              </a>
            </Link>
          </div>
        </div>
      </div>
      <footer
        className={`mt-1 p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'}`}
      >
        <div className='flex justify-center space-x-4'>
          <a
            href='https://t.me/civkittv'
            target='_blank'
            rel='noopener noreferrer'
          >
            <FaTelegramPlane size={20} />
          </a>
          <a
            href='https://x.com/thecivkit'
            target='_blank'
            rel='noopener noreferrer'
          >
            <FaXTwitter size={20} />
          </a>
          <a
            href='https://github.com/civkit'
            target='_blank'
            rel='noopener noreferrer'
          >
            <FaGithub size={20} />
          </a>
        </div>
        <p className='mt-2 text-center text-sm'>
          &copy; {new Date().getFullYear()} CivKit. All rights reserved.
        </p>
      </footer>
    </>
  );
}
