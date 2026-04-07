/**
 * /admin/wallet — Wallet Transaction Oversight
 * Server Component: fetches pending + all wallet transactions, delegates to WalletApprovalClient.
 */

import { redirect }          from 'next/navigation'
import { createClient }      from '@/lib/supabase/server'
import { prisma }            from '@/lib/prisma'
import AdminShell            from '@/components/admin/AdminShell'
import WalletApprovalClient  from '@/components/admin/WalletApprovalClient'

async function getWalletData() {
  const [pending, allTxns, totalLoaded, totalSpent] = await Promise.all([
    prisma.walletTransaction.findMany({
      where:   { status: 'PENDING', paymentMethod: 'bank_transfer' },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.walletTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take:    100,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.walletTransaction.aggregate({
      where: { type: 'LOAD', status: 'COMPLETED' },
      _sum:  { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { type: 'SPEND' },
      _sum:  { amount: true },
    }),
  ])
  return {
    pending,
    allTxns,
    totalLoaded: totalLoaded._sum.amount ?? 0,
    totalSpent:  totalSpent._sum.amount  ?? 0,
  }
}

export default async function WalletAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const { pending, allTxns, totalLoaded, totalSpent } = await getWalletData()

  // Serialize dates for client components
  const serializeTxn = (t: typeof allTxns[number]) => ({
    id:            t.id,
    userId:        t.userId,
    type:          t.type,
    amount:        t.amount,
    status:        t.status,
    description:   t.description ?? '',
    paymentMethod: t.paymentMethod,
    createdAt:     t.createdAt.toISOString(),
    user:          { name: t.user.name, email: t.user.email },
  })

  const serializedPending = pending.map(serializeTxn)
  const serializedAll     = allTxns.map(serializeTxn)

  return (
    <AdminShell activeNav="wallet">
      <div className="adm-pg-hdr">
        <div>
          <div className="adm-pg-eye">Finance</div>
          <div className="adm-pg-title">Wallet Transactions</div>
        </div>
      </div>

      <WalletApprovalClient
        initialPending={serializedPending}
        initialAll={serializedAll}
        totalLoaded={totalLoaded}
        totalSpent={totalSpent}
      />
    </AdminShell>
  )
}
