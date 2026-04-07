/**
 * Skeleton — shimmer placeholder blocks for loading states.
 */
export function Skeleton({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`sk ${className}`} style={style} />
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`sk-card ${className}`}><div className="sk-card-inner" /></div>
}
