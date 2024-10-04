import 'tailwindcss/tailwind.css';
import NavBar from '../components/NavBar';
import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  const [darkMode, setDarkMode] = useState<Boolean>(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      const isDarkMode = JSON.parse(savedDarkMode);
      setDarkMode(isDarkMode);
      document.documentElement.classList.toggle('dark', isDarkMode);
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
  };

  return (
    <>
      <NavBar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Component {...pageProps} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
    </>
  );
}

export default MyApp;
