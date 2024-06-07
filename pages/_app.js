import NavBar from '../components/NavBar.js';
import '/home/dave/civkit-frontend/styles/global.css';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <NavBar />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
