// Auth pages use a full-page layout — no global Nav or Footer
export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
