/**
 * Auth route group layout — no nav, full-screen dark background.
 * Wraps: /invite/[token], /onboarding, /login
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="ob-flow">
      {children}
    </div>
  )
}
