import NavBar from '../components/NavBar.js';
import '../styles/global.css';
import dynamic from 'next/dynamic'

const Layout = dynamic(() => import('@/components/Layout'), { ssr: false })
function MyApp({ Component, pageProps }) {
  return (
    <>
      <NavBar />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
