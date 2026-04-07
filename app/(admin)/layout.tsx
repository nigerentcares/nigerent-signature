/**
 * Admin layout — wraps all /admin/* routes.
 * No bottom nav; uses a sidebar instead (rendered client-side).
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm-shell">
      {children}
    </div>
  )
}
