/**
 * /rewards — redirects to /wallet (Rewards is now a tab inside Wallet).
 */

import { redirect } from 'next/navigation'

export default function RewardsRedirect() {
  redirect('/wallet')
}
