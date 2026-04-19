// Admin section uses its own layout — suppress the global Nav and Footer
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
