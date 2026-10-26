// File: pages/404.tsx
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const NotFound: NextPage = () => {
  const [dots, setDots] = useState('');

  // Animation for the searching dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-center px-4">
      <Head>
        <title>404 - Bot Not Found</title>
        <meta name="description" content="Bot Not Found - 404 Error Page" />
      </Head>

      <main className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <h2 className="text-3xl font-mono mb-6">Bot Not Found</h2>
        
        <div className="border-t border-b border-gray-200 py-6 my-6">
          <p className="text-lg mb-4">The bot you are looking for does not exist or has been deactivated.</p>
        </div>
        
      </main>


    </div>
  );
};

export default NotFound;