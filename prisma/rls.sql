-- ─────────────────────────────────────────────────
-- NIGERENT SIGNATURE LIFESTYLE — Supabase RLS Policies
-- Run this in Supabase SQL editor AFTER prisma migrate dev
-- ─────────────────────────────────────────────────

-- Enable RLS on all member-data tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wallet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WalletTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PointsLedger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatThread" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SavedItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DiningRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConciergeRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OfferRedemption" ENABLE ROW LEVEL SECURITY;

-- Public (read-only) tables — all authenticated members can see
ALTER TABLE "Offer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Partner" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Restaurant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MembershipTier" ENABLE ROW LEVEL SECURITY;

-- ── USER ──
CREATE POLICY "member_own_profile_select" ON "User"
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "member_own_profile_update" ON "User"
  FOR UPDATE USING (auth.uid()::text = id);

-- ── WALLET ──
CREATE POLICY "member_own_wallet" ON "Wallet"
  FOR SELECT USING (auth.uid()::text = "userId");

-- ── WALLET TRANSACTIONS ──
CREATE POLICY "member_own_txns" ON "WalletTransaction"
  FOR SELECT USING (auth.uid()::text = "userId");

-- ── POINTS LEDGER ──
CREATE POLICY "member_own_points" ON "PointsLedger"
  FOR SELECT USING (auth.uid()::text = "userId");

-- ── MEMBERSHIP ──
CREATE POLICY "member_own_membership" ON "UserMembership"
  FOR SELECT USING (auth.uid()::text = "userId");

-- ── CHAT THREAD ──
CREATE POLICY "member_own_thread" ON "ChatThread"
  FOR SELECT USING (auth.uid()::text = "userId");

-- ── CHAT MESSAGES ──
CREATE POLICY "member_own_messages" ON "ChatMessage"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "ChatThread"
      WHERE id = "threadId" AND "userId" = auth.uid()::text
    )
  );

CREATE POLICY "member_insert_messages" ON "ChatMessage"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

-- ── NOTIFICATIONS ──
CREATE POLICY "member_own_notifications" ON "Notification"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "member_mark_read" ON "Notification"
  FOR UPDATE USING (auth.uid()::text = "userId");

-- ── SAVED ITEMS ──
CREATE POLICY "member_own_saved" ON "SavedItem"
  FOR ALL USING (auth.uid()::text = "userId");

-- ── DINING REQUESTS ──
CREATE POLICY "member_own_dining" ON "DiningRequest"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "member_create_dining" ON "DiningRequest"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

-- ── CONCIERGE REQUESTS ──
CREATE POLICY "member_own_concierge" ON "ConciergeRequest"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "member_create_concierge" ON "ConciergeRequest"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

-- ── BOOKINGS ──
CREATE POLICY "member_own_bookings" ON "Booking"
  FOR SELECT USING (auth.uid()::text = "userId");

-- ── OFFER REDEMPTIONS ──
CREATE POLICY "member_own_redemptions" ON "OfferRedemption"
  FOR SELECT USING (auth.uid()::text = "userId");

-- ── OFFERS (public read) ──
CREATE POLICY "member_see_active_offers" ON "Offer"
  FOR SELECT USING (
    auth.role() = 'authenticated' AND status = 'ACTIVE'
  );

-- ── PARTNERS (public read) ──
CREATE POLICY "member_see_active_partners" ON "Partner"
  FOR SELECT USING (
    auth.role() = 'authenticated' AND "isActive" = true
  );

-- ── RESTAURANTS (public read) ──
CREATE POLICY "member_see_active_restaurants" ON "Restaurant"
  FOR SELECT USING (
    auth.role() = 'authenticated' AND "isActive" = true
  );

-- ── MEMBERSHIP TIERS (public read) ──
CREATE POLICY "member_see_tiers" ON "MembershipTier"
  FOR SELECT USING (auth.role() = 'authenticated');

-- ── SERVICE ROLE bypasses all RLS ──
-- (handled automatically — use SUPABASE_SERVICE_ROLE_KEY in server-only code)
