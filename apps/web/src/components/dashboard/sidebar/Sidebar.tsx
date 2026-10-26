'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';

// Define menu item type
export type MenuItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
};

// Define sidebar props to make it customizable
type SidebarProps = {
  menuItems: MenuItem[];
  accountItems: MenuItem[];
  logoComponent?: React.ReactNode;
  upgradePlanComponent?: React.ReactNode;
  sidebarTitle?: string;
  menu?: string;
};

const Sidebar = ({
  menuItems,
  accountItems,
  logoComponent,
  upgradePlanComponent,
  sidebarTitle = 'Dashboard',
  menu="Menu"
}: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Determine if menu item is active
  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6 text-gray-700" />
        ) : (
          <Bars3Icon className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed top-0 left-0 h-screen bg-white overflow-y-auto z-40 transition-transform duration-300 ease-in-out
          w-64 lg:translate-x-0 lg:static lg:h-screen flex flex-col`}
      >
        {/* Logo / Header */}
        <div className="p-4 border-b">
          {logoComponent || (
            <h1 className="text-xl font-bold">{sidebarTitle}</h1>
          )}
        </div>

        {/* Menu Section */}
        <div className="flex-grow p-4">
          <p className="text-sm text-gray-500 px-3 mb-2">{menu}</p>
          <nav>
            {menuItems.map((item) => (
              <Link
                href={item.path}
                key={item.path}
                className={`flex items-center px-3 py-2 my-1 rounded-lg ${
                  isActive(item.path)
                    ? 'bg-black text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                onClick={() => isMobile && setIsOpen(false)}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Account Section */}
        <div className="p-4 border-t">
          <p className="text-sm text-gray-500 px-3 mb-2">Account</p>
          <nav>
            {accountItems.map((item) => (
              <Link
                href={item.path}
                key={item.path}
                className={`flex items-center px-3 py-2 my-1 rounded-lg ${
                  isActive(item.path)
                    ? 'bg-black text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                onClick={() => isMobile && setIsOpen(false)}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Upgrade Plan Section */}
        {upgradePlanComponent && (
          <div className="p-4 border-t">
            {upgradePlanComponent}
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;