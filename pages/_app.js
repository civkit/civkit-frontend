import dynamic from 'next/dynamic'

const Layout = dynamic(() => import('@/components/Layout'), { ssr: false })
function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
