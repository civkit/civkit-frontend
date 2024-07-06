"use client"
import Header from './Header';
import dynamic from 'next/dynamic'
import AppProvider from "@/context/AppContext";
// import NDKContextWrapper from "@/context/NDKContextWrapper";
const NDKContextWrapper = dynamic(() => import('@/context/NDKContextWrapper'), { ssr: false })

export default function Layout({ children }) {
  return (
    <NDKContextWrapper>
      <AppProvider>
        <div>
          <Header />
          <main>{children}</main>
        </div>
      </AppProvider>
    </NDKContextWrapper>
  );
}
