'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';

export type MenuItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
};

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
  sidebarTitle = 'KSTM',
  menu = 'Workspace',
}: SidebarProps) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-white border border-zinc-200 shadow-xs"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {isOpen ? (
          <XMarkIcon className="w-5 h-5 text-zinc-700" />
        ) : (
          <Bars3Icon className="w-5 h-5 text-zinc-700" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-zinc-950/20 backdrop-blur-xs z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed top-0 left-0 h-screen bg-white border-r border-zinc-200/80 overflow-y-auto z-40 transition-transform duration-200 ease-out
          w-60 lg:translate-x-0 lg:static lg:h-screen flex flex-col shrink-0`}
      >
        {/* Logo / Header */}
        <div className="h-14 px-5 border-b border-zinc-200/80 flex items-center justify-between">
          {logoComponent || (
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-zinc-900 text-white flex items-center justify-center font-mono text-xs font-semibold">
                K
              </div>
              <span className="text-sm font-semibold tracking-tight text-zinc-950">
                {sidebarTitle}
              </span>
            </Link>
          )}
          <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 rounded px-1.5 py-0.5 bg-zinc-50">
            STUDIO
          </span>
        </div>

        {/* Menu Section */}
        <div className="flex-grow px-3 py-5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 px-2.5 mb-2">
            {menu}
          </p>
          <nav className="space-y-0.5">
            {menuItems.map((item) => (
              <Link
                href={item.path}
                key={item.path}
                className={`flex items-center px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
                onClick={() => isMobile && setIsOpen(false)}
              >
                <span className="mr-2.5 opacity-80">{item.icon}</span>
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Account Section */}
        <div className="px-3 py-4 border-t border-zinc-200/80">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 px-2.5 mb-2">
            Account
          </p>
          <nav className="space-y-0.5">
            {accountItems.map((item) => (
              <Link
                href={item.path}
                key={item.path}
                className={`flex items-center px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
                onClick={() => isMobile && setIsOpen(false)}
              >
                <span className="mr-2.5 opacity-80">{item.icon}</span>
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>

        {upgradePlanComponent && (
          <div className="p-4 border-t border-zinc-200/80">
            {upgradePlanComponent}
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;