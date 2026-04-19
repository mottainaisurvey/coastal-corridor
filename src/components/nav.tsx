'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Menu, X, Search, User } from 'lucide-react';
// Clerk imports removed for now

export function Nav() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const isSignedIn = false; // Clerk disabled for now

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults(null);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setSearchResults(data.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-ink/8 bg-paper/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
            <path d="M4 28 Q 10 22, 16 26 T 28 24 T 36 20" stroke="#2d7d7d" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M4 32 Q 12 28, 20 30 T 36 26" stroke="#c96a3f" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
            <circle cx="6" cy="28" r="2.5" fill="#d4a24c" />
            <circle cx="36" cy="20" r="2.5" fill="#d4a24c" />
            <circle cx="20" cy="27" r="1.8" fill="#0a0e12" />
          </svg>
          <div className="flex flex-col leading-none">
            <span className="font-serif text-[18px] font-medium tracking-display">Coastal Corridor</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/50 mt-0.5">Lagos ⟶ Calabar</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/properties" className="text-sm font-medium text-ink/80 hover:text-ink transition-colors">
            Properties
          </Link>
          <Link href="/destinations" className="text-sm font-medium text-ink/80 hover:text-ink transition-colors">
            Destinations
          </Link>
          <Link href="/agents" className="text-sm font-medium text-ink/80 hover:text-ink transition-colors">
            Agents
          </Link>
          <Link href="/tourism" className="text-sm font-medium text-ink/80 hover:text-ink transition-colors">
            Tourism
          </Link>
          <Link href="/invest" className="text-sm font-medium text-ink/80 hover:text-ink transition-colors">
            Invest
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {/* Search Dropdown */}
          <div className="relative" ref={searchRef}>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-ink/5 rounded-full transition-colors"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {searchOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-ink/10 rounded-lg shadow-panel p-4 z-50">
                <input
                  type="text"
                  placeholder="Search properties, destinations, agents..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full px-3 py-2 border border-ink/15 rounded-sm text-sm outline-none focus:border-ink/30"
                  autoFocus
                />

                {searchLoading && (
                  <div className="mt-4 text-center text-sm text-ink/50">Searching...</div>
                )}

                {searchResults && searchQuery.length >= 2 && (
                  <div className="mt-4 max-h-96 overflow-y-auto">
                    {searchResults.properties?.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-mono uppercase tracking-wider text-ink/50 mb-2">Properties</div>
                        {searchResults.properties.map((p: any) => (
                          <Link
                            key={p.id}
                            href={`/properties/${p.slug}`}
                            className="block p-2 hover:bg-paper rounded text-sm mb-1"
                            onClick={() => setSearchOpen(false)}
                          >
                            <div className="font-medium text-ink">{p.title}</div>
                            <div className="text-xs text-ink/60">{p.destination}</div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {searchResults.destinations?.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-mono uppercase tracking-wider text-ink/50 mb-2">Destinations</div>
                        {searchResults.destinations.map((d: any) => (
                          <Link
                            key={d.id}
                            href={`/destinations/${d.slug}`}
                            className="block p-2 hover:bg-paper rounded text-sm mb-1"
                            onClick={() => setSearchOpen(false)}
                          >
                            <div className="font-medium text-ink">{d.title}</div>
                            <div className="text-xs text-ink/60">{d.state}</div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {searchResults.agents?.length > 0 && (
                      <div>
                        <div className="text-xs font-mono uppercase tracking-wider text-ink/50 mb-2">Agents</div>
                        {searchResults.agents.map((a: any) => (
                          <Link
                            key={a.id}
                            href={`/agents`}
                            className="block p-2 hover:bg-paper rounded text-sm mb-1"
                            onClick={() => setSearchOpen(false)}
                          >
                            <div className="font-medium text-ink">{a.title}</div>
                            <div className="text-xs text-ink/60">{a.agency}</div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {!searchResults.properties?.length &&
                      !searchResults.destinations?.length &&
                      !searchResults.agents?.length && (
                        <div className="text-center text-sm text-ink/50 py-4">No results found</div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Auth UI disabled for now */}
          <Link href="#" className="btn-secondary !py-2 !px-4" onClick={(e) => e.preventDefault()}>
            <User className="h-4 w-4" />
            Sign in
          </Link>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-ink/8 bg-paper">
          <nav className="container-x flex flex-col py-4 gap-1">
            {[
              { href: '/properties', label: 'Properties' },
              { href: '/destinations', label: 'Destinations' },
              { href: '/agents', label: 'Agents' },
              { href: '/tourism', label: 'Tourism' },
              { href: '/invest', label: 'Invest' },
              { href: '/account', label: isSignedIn ? 'Account' : 'Sign in' }
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-3 text-base font-medium text-ink/80 hover:text-ink"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
