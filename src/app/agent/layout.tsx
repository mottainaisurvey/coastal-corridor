// Agent section uses its own nav — suppress the global Nav and Footer
export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
