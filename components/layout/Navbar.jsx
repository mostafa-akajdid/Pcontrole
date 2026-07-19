import { useState, useRef, useEffect } from 'react';
import { Search, Menu, User, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import EmailDropdown from './EmailDropdown';
import NotificationBadge from '@/components/notifications/NotificationBadge';
import CommandPalette from '@/components/ui/CommandPalette';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar({ toggleSidebar }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileClosing, setProfileClosing] = useState(false);
  const { user, logout } = useAuth();

  const emailDropdownRef = useRef(null);
  const profileRef = useRef(null);
  const animationTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const closeWithAnimation = (setter, closingSetter) => {
    closingSetter(true);
    animationTimeoutRef.current = setTimeout(() => {
      setter(false);
      closingSetter(false);
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileOpen && profileRef.current && !profileRef.current.contains(event.target)) {
        closeWithAnimation(setProfileOpen, setProfileClosing);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        if (profileOpen) closeWithAnimation(setProfileOpen, setProfileClosing);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [profileOpen]);

  const userName = user?.name || 'User';
  const userEmail = user?.email || '';
  const userAvatar = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=e5e7eb&color=6b7280&bold=true`;

  return (
    <>
      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={toggleSidebar} 
            className="lg:hidden p-2 bg-white rounded-lg shadow-sm"
          >
            <Menu size={20} />
          </button>
          
          <button
            onClick={() => setPaletteOpen(true)}
            className="relative flex-1 max-w-md text-left hidden min-[425px]:block"
          >
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
              size={18} 
            />
            <div className="w-full pl-10 pr-12 py-3 bg-white rounded-full text-sm shadow-sm border-none cursor-pointer hover:shadow-md transition-shadow">
              <span className="text-gray-400">Search everything...</span>
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-medium">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setPaletteOpen(true)}
            className="p-2.5 bg-white rounded-full shadow-sm hover:bg-gray-50 text-gray-500 transition-all duration-200 hover:shadow-md min-[425px]:hidden"
          >
            <Search size={18} />
          </button>
          <EmailDropdown 
            ref={emailDropdownRef}
            onOpen={() => {
              setProfileOpen(false);
              setProfileClosing(false);
            }}
          />
          
          <NotificationBadge />
          
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                if (profileOpen) {
                  closeWithAnimation(setProfileOpen, setProfileClosing);
                } else {
                  setProfileOpen(true);
                  setProfileClosing(false);
                }
              }}
              className="flex items-center gap-3 pl-2 hover:opacity-80 transition-opacity"
            >
              <img 
                src={userAvatar} 
                alt={userName} 
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" 
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-gray-800">{userName}</p>
                <p className="text-xs text-gray-400">{userEmail}</p>
              </div>
            </button>

            {(profileOpen || profileClosing) && (
              <div className={`absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 origin-top-right ${
                profileClosing ? 'animate-dropdownSlideOut' : 'animate-dropdownSlideIn'
              }`}>
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{userName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
                  {user?.role && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded-full">
                      {user.role.name}
                    </span>
                  )}
                </div>
                <div className="py-2">
                  <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                    <User size={18} />
                    <span className="text-sm">My Profile</span>
                  </Link>
                  <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                    <Settings size={18} />
                    <span className="text-sm">Settings</span>
                  </Link>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 transition-colors">
                    <LogOut size={18} />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
