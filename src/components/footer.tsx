import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-ink text-paper">
      <div className="container-x py-16">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <svg viewBox="0 0 40 40" fill="none" className="h-9 w-9">
                <path d="M4 28 Q 10 22, 16 26 T 28 24 T 36 20" stroke="#4db3b3" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M4 32 Q 12 28, 20 30 T 36 26" stroke="#e08660" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
                <circle cx="6" cy="28" r="2.5" fill="#d4a24c" />
                <circle cx="36" cy="20" r="2.5" fill="#d4a24c" />
                <circle cx="20" cy="27" r="1.8" fill="#f5f1ea" />
              </svg>
              <div>
                <div className="font-serif text-lg">Coastal Corridor</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/50">Lagos ⟶ Calabar</div>
              </div>
            </div>
            <p className="text-sm text-paper/60 leading-relaxed">
              The verified real estate, tourism and investment platform for Nigeria&apos;s 700km Coastal Highway corridor.
            </p>
          </div>

          <div>
            <div className="eyebrow-on-dark mb-4">Explore</div>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/properties" className="text-paper/70 hover:text-paper transition-colors">Browse properties</Link></li>
              <li><Link href="/destinations" className="text-paper/70 hover:text-paper transition-colors">12 destinations</Link></li>
              <li><Link href="/agents" className="text-paper/70 hover:text-paper transition-colors">Verified agents</Link></li>
              <li><Link href="/tourism" className="text-paper/70 hover:text-paper transition-colors">Tourism</Link></li>
              <li><Link href="/map" className="text-paper/70 hover:text-paper transition-colors">3D corridor map</Link></li>
            </ul>
          </div>

          <div>
            <div className="eyebrow-on-dark mb-4">Platform</div>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/how-verification-works" className="text-paper/70 hover:text-paper transition-colors">How verification works</Link></li>
              <li><Link href="/for-agents" className="text-paper/70 hover:text-paper transition-colors">For agents</Link></li>
              <li><Link href="/for-developers" className="text-paper/70 hover:text-paper transition-colors">For developers</Link></li>
              <li><Link href="/fractional" className="text-paper/70 hover:text-paper transition-colors">Fractional ownership</Link></li>
              <li><Link href="/diaspora" className="text-paper/70 hover:text-paper transition-colors">Diaspora services</Link></li>
            </ul>
          </div>

          <div>
            <div className="eyebrow-on-dark mb-4">Company</div>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="text-paper/70 hover:text-paper transition-colors">About</Link></li>
              <li><Link href="/press" className="text-paper/70 hover:text-paper transition-colors">Press</Link></li>
              <li><Link href="/careers" className="text-paper/70 hover:text-paper transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="text-paper/70 hover:text-paper transition-colors">Contact</Link></li>
              <li><Link href="/legal" className="text-paper/70 hover:text-paper transition-colors">Legal</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-paper/10 flex flex-col md:flex-row justify-between gap-4 text-[11px] text-paper/40 font-mono tracking-wider">
          <div>© 2026 Coastal Corridor Ltd · Lagos · London · All rights reserved</div>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-paper/70 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-paper/70 transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-paper/70 transition-colors">Cookies</Link>
            <span>v0.1 · Pre-launch</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
