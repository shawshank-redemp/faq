'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';

export default function Navbar({ onSearch }) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-primary-600">
              QuoraFAQ
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link href="/questions" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                Questions
              </Link>
              <Link href="/faqs" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                FAQs
              </Link>
              <Link href="/tags" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                Tags
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-lg mx-4">
            <form onSubmit={handleSearch} className="w-full">
              <input
                type="text"
                placeholder="Search questions, FAQs, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </form>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/questions/ask" className="btn-primary btn-sm hidden md:flex">
                  Ask Question
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-medium">
                      {getInitials(user.displayName || user.username)}
                    </div>
                  </button>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-20 py-1">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user.displayName || user.username}</p>
                          <p className="text-xs text-gray-500">{user.reputation} reputation</p>
                        </div>
                        <Link href={`/users/${user.username}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                          Profile
                        </Link>
                        <Link href="/notifications" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                          Notifications
                        </Link>
                        {(user.role === 'admin' || user.role === 'moderator') && (
                          <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                            Admin Panel
                          </Link>
                        )}
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={() => { logout(); setProfileOpen(false); }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth?mode=login" className="btn-secondary btn-sm">
                  Login
                </Link>
                <Link href="/auth?mode=signup" className="btn-primary btn-sm">
                  Sign Up
                </Link>
              </div>
            )}
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-3 border-t border-gray-100 pt-3">
            <form onSubmit={handleSearch} className="mb-3">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </form>
            <div className="space-y-1">
              <Link href="/questions" className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Questions</Link>
              <Link href="/faqs" className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">FAQs</Link>
              <Link href="/tags" className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Tags</Link>
              {user && <Link href="/questions/ask" className="block px-3 py-2 text-sm text-primary-600 font-medium hover:bg-gray-100 rounded-lg">Ask Question</Link>}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
