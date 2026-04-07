import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import InviteLanding from './InviteLanding'

interface InvitePageProps {
  params: { token: string }
}

/**
 * /invite/[token]
 *
 * Server Component — verifies the invite token, then renders
 * the client-side InviteLanding component with the pre-verified email.
 */
export default async function InvitePage({ params }: InvitePageProps) {
  const invite = await prisma.inviteLink.findUnique({
    where: { token: params.token },
  })

  // Token not found
  if (!invite) notFound()

  // Token already used
  if (invite.usedAt) {
    redirect('/login?reason=invite_used')
  }

  // Token expired
  if (invite.expiresAt < new Date()) {
    redirect('/login?reason=invite_expired')
  }

  return (
    <InviteLanding
      email={invite.email}
      token={params.token}
    />
  )
}
