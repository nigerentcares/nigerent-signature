import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="nf-wrap">
      <div className="nf-orb nf-orb1" />
      <div className="nf-orb nf-orb2" />
      <div className="nf-inner">
        <div className="nf-mark">N</div>
        <div className="nf-code">404</div>
        <div className="nf-title">Page Not Found</div>
        <div className="nf-sub">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.<br />
          Let us guide you back.
        </div>
        <div className="nf-actions">
          <Link href="/home" className="nf-btn-primary">Back to Home</Link>
          <Link href="/explore" className="nf-btn-outline">Explore</Link>
        </div>
      </div>
    </div>
  )
}
