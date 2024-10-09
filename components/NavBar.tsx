import Image from 'next/image';
import Link from 'next/link';
import { IoSunnyOutline, IoMoon } from 'react-icons/io5';
import { MdArrowOutward } from 'react-icons/md';

const NavBar = ({
  darkMode,
  toggleDarkMode,
}: {
  darkMode: boolean;
  toggleDarkMode: () => void;
}) => {
  return (
    <nav
      className={`bg-white p-6 shadow-md ${darkMode ? 'dark:bg-gray-800' : ''}`}
    >
      <div className='container mx-auto flex flex-wrap items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <Image
            src='/hachiko-logo.svg'
            alt='CivKit Logo'
            width={40}
            height={64}
          />
          <Link
            href='/'
            className={`text-xl font-bold ${darkMode ? 'text-green-400' : 'text-green-500'} rounded px-2 py-1 hover:text-green-600`}
          >
            CivKit
          </Link>
        </div>

        <ul className='flex items-center space-x-4'>
          <li>
            <Link
              href='/'
              className={`px-2 py-1 hover:border-b-2 hover:border-orange-500 ${darkMode ? 'text-white' : 'text-gray-800'}`}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href='/login'
              className={`px-2 py-1 hover:border-b-2 hover:border-orange-500 ${darkMode ? 'text-white' : 'text-gray-800'}`}
            >
              Login
            </Link>
          </li>
          <li>
            <Link
              href='/register'
              className={`flex items-center px-2 py-1 hover:border-b-2 hover:border-orange-500 ${darkMode ? 'text-white' : 'text-gray-800'}`}
            >
              Get Started
              <MdArrowOutward className='ml-2' />
            </Link>
          </li>
        </ul>

        <div className='flex items-center space-x-4'>
          <button
            onClick={toggleDarkMode}
            className={`hover:text-orange-500 ${darkMode ? 'text-yellow-300' : 'text-gray-800'}`}
          >
            {darkMode ? <IoSunnyOutline /> : <IoMoon />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
