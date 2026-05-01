import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Coastal Corridor — Lagos to Calabar',
  description:
    'The verified real estate, tourism and investment platform for the Lagos-Calabar Coastal Highway corridor. 700km of coastline, 12 destinations, one platform.',
  keywords: ['Nigeria real estate', 'Lagos Calabar highway', 'diaspora property', 'coastal Nigeria'],
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Coastal Corridor — Lagos to Calabar',
    description: 'Verified real estate and tourism across the 700km Coastal Highway.',
    type: 'website',
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
  },
};

// ---------------------------------------------------------------------------
// Coastal Corridor brand appearance for all Clerk UI components
// Colours: laterite (#c96a3f) primary, paper (#f5f1ea) bg, ink (#0a0e12) text
// ---------------------------------------------------------------------------
const clerkAppearance = {
  variables: {
    // Core palette
    colorPrimary: '#c96a3f',          // laterite — buttons, focus rings, links
    colorBackground: '#f5f1ea',        // paper — modal/card background
    colorInputBackground: '#ffffff',   // white input fields
    colorText: '#0a0e12',             // ink — body text
    colorTextSecondary: 'rgba(10,14,18,0.60)', // ink/60
    colorInputText: '#0a0e12',
    colorDanger: '#e85a4f',           // alert red
    colorSuccess: '#6fae7a',          // success green
    colorNeutral: '#0a0e12',

    // Shape
    borderRadius: '2px',              // matches the platform's rounded-sm / sharp aesthetic
    fontFamily: '"Inter Tight", ui-sans-serif, system-ui, sans-serif',
    fontFamilyButtons: '"Inter Tight", ui-sans-serif, system-ui, sans-serif',
    fontSize: '14px',

    // Spacing
    spacingUnit: '16px',
  },
  elements: {
    // Card / modal container
    card: {
      boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      border: '1px solid rgba(10,14,18,0.10)',
      borderRadius: '4px',
    },
    // Header area
    headerTitle: {
      fontFamily: '"Fraunces", ui-serif, Georgia, serif',
      fontWeight: '300',
      fontSize: '28px',
      letterSpacing: '-0.015em',
      color: '#0a0e12',
    },
    headerSubtitle: {
      color: 'rgba(10,14,18,0.60)',
      fontSize: '14px',
    },
    // Logo area — show platform name above the Clerk form
    logoBox: {
      marginBottom: '8px',
    },
    // Primary action button (Sign in, Continue, etc.)
    formButtonPrimary: {
      backgroundColor: '#c96a3f',
      borderRadius: '2px',
      fontFamily: '"Inter Tight", ui-sans-serif, system-ui, sans-serif',
      fontSize: '13px',
      fontWeight: '500',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      '&:hover': {
        backgroundColor: '#e08660',
      },
      '&:focus': {
        boxShadow: '0 0 0 2px #c96a3f40',
      },
    },
    // Secondary / ghost buttons
    formButtonReset: {
      color: '#0a0e12',
      fontSize: '13px',
    },
    // Social OAuth buttons (Google, etc.)
    socialButtonsBlockButton: {
      border: '1px solid rgba(10,14,18,0.15)',
      borderRadius: '2px',
      color: '#0a0e12',
      fontSize: '13px',
      fontWeight: '500',
      '&:hover': {
        backgroundColor: 'rgba(10,14,18,0.04)',
      },
    },
    socialButtonsBlockButtonText: {
      fontFamily: '"Inter Tight", ui-sans-serif, system-ui, sans-serif',
      fontWeight: '500',
    },
    // Input fields
    formFieldInput: {
      borderRadius: '2px',
      border: '1px solid rgba(10,14,18,0.20)',
      fontSize: '14px',
      '&:focus': {
        borderColor: '#c96a3f',
        boxShadow: '0 0 0 2px rgba(201,106,63,0.15)',
      },
    },
    formFieldLabel: {
      fontSize: '11px',
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      textTransform: 'uppercase',
      letterSpacing: '0.18em',
      color: 'rgba(10,14,18,0.60)',
      fontWeight: '400',
    },
    // Divider between social and email
    dividerLine: {
      backgroundColor: 'rgba(10,14,18,0.10)',
    },
    dividerText: {
      color: 'rgba(10,14,18,0.40)',
      fontSize: '11px',
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      textTransform: 'uppercase',
      letterSpacing: '0.18em',
    },
    // Footer links (sign up, forgot password)
    footerActionLink: {
      color: '#c96a3f',
      fontWeight: '500',
      '&:hover': {
        color: '#e08660',
      },
    },
    // Verification code input
    otpCodeFieldInput: {
      borderRadius: '2px',
      border: '1px solid rgba(10,14,18,0.20)',
      fontSize: '20px',
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    },
    // User button (avatar in nav)
    userButtonAvatarBox: {
      width: '32px',
      height: '32px',
    },
    userButtonPopoverCard: {
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      border: '1px solid rgba(10,14,18,0.10)',
      borderRadius: '4px',
    },
    userButtonPopoverActionButton: {
      fontSize: '13px',
      color: '#0a0e12',
    },
    userButtonPopoverActionButtonText: {
      fontFamily: '"Inter Tight", ui-sans-serif, system-ui, sans-serif',
    },
    // Navbar (inside Clerk's account portal)
    navbar: {
      backgroundColor: '#f5f1ea',
    },
    navbarButton: {
      color: '#0a0e12',
      fontSize: '13px',
    },
    // Badge / chip
    badge: {
      borderRadius: '2px',
      fontSize: '10px',
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      allowedRedirectOrigins={[
        'https://coastalcorridor.africa',
        'https://admin.coastalcorridor.africa',
        'https://agent.coastalcorridor.africa',
        'https://developer.coastalcorridor.africa',
        'https://operator.coastalcorridor.africa',
        'https://host.coastalcorridor.africa',
        'https://map.coastalcorridor.africa',
      ]}
    >
      <html lang="en">
        <body className="min-h-screen flex flex-col">
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
