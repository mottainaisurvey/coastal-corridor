import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Coastal Corridor — Lagos to Calabar',
  description:
    'The verified real estate, tourism and investment platform for the Lagos-Calabar Coastal Highway corridor. 700km of coastline, 12 destinations, one platform.',
  keywords: ['Nigeria real estate', 'Lagos Calabar highway', 'diaspora property', 'coastal Nigeria'],
  openGraph: {
    title: 'Coastal Corridor — Lagos to Calabar',
    description: 'Verified real estate and tourism across the 700km Coastal Highway.',
    type: 'website'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
