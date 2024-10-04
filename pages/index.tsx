import Link from 'next/link';
import { MdArrowOutward } from "react-icons/md";

export default function Home({ darkMode, toggleDarkMode }: { darkMode: boolean, toggleDarkMode: () => void }) {
  return (
    <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'dark:bg-gray-900' : 'bg-white'}`}>
      <div className="text-center">
        <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>CivKit + Nostr + LN</h1>
        <p className={`text-l mb-6 border-2 border-orange-500 py-2 px-4 rounded-full inline-block ${darkMode ? 'text-white' : 'text-black'}`}>
          Welcome to the future of P2P
        </p>
        <div className="flex justify-center space-x-8">
          <Link href="/create-order" legacyBehavior>
            <a className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-3xl text-lg flex items-center">
              Get Started
              <MdArrowOutward className="ml-2" />
            </a>
          </Link>
          <Link href="/learn-more" legacyBehavior>
            <a className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-3xl text-lg">Learn More</a>
          </Link>
        </div>
      </div>
    </div>
  );
}
