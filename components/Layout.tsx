import React from 'react';
import Header from './Header';
import dynamic from 'next/dynamic'

// Remove this line if you're not using AppContext
// import AppProvider from "@/context/AppContext";

const NDKContextWrapper = dynamic(() => import('@/context/NDKContextWrapper'), { ssr: false })

export default function Layout({ children }) {
  return (
    <NDKContextWrapper>
      {/* Remove AppProvider if you're not using it */}
      {/* <AppProvider> */}
        <div>
          <Header />
          <main>{children}</main>
        </div>
      {/* </AppProvider> */}
    </NDKContextWrapper>
  );
}