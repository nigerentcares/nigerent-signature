/**
 * Prisma seed — Nigerent Signature Lifestyle
 * Populates Partners, Offers, and Restaurants from the Airtable Concierge Directory.
 *
 * Run with:  npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
 * Or add to package.json:  "prisma": { "seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts" }
 * Then run:  npx prisma db seed
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

// Load .env.local (Prisma loads .env but not .env.local)
try {
  const envLocal = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of envLocal.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
} catch { /* .env.local may not exist */ }

const prisma = new PrismaClient()

// ─── Supabase Admin Client (for creating auth users) ─────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Helper ──────────────────────────────────────────────────────────────────

function offer(
  title: string,
  shortDesc: string,
  description: string,
  steps: string[] = [],
) {
  return { title, shortDesc, description, steps }
}

// ─── MEMBERSHIP TIERS ────────────────────────────────────────────────────────

const TIERS = [
  {
    name: 'Signature',
    slug: 'signature',
    pointsThreshold: 0,
    earnMultiplier: 1.0,
    displayOrder: 1,
    benefits: [
      'Access to all partner offers',
      'Priority dining reservations',
      'Concierge support (2hr response)',
      'Member wallet',
      '5 points per ₦1,000 on stays',
    ],
  },
  {
    name: 'Signature Plus',
    slug: 'plus',
    pointsThreshold: 2500,
    earnMultiplier: 1.5,
    displayOrder: 2,
    benefits: [
      'Everything in Signature',
      '1.5× points on all spend',
      'Exclusive Plus-only offers',
      'Priority concierge (1hr response)',
      'Complimentary airport transfer (monthly)',
    ],
  },
  {
    name: 'Elite',
    slug: 'elite',
    pointsThreshold: 5000,
    earnMultiplier: 2.0,
    displayOrder: 3,
    benefits: [
      'Everything in Signature Plus',
      '2× points on all spend',
      'Dedicated personal concierge',
      'Elite-only events & previews',
      'Complimentary airport transfer (weekly)',
      'Room upgrade on stays (subject to availability)',
    ],
  },
]

// ─── TEST USERS ──────────────────────────────────────────────────────────────

const TEST_USERS = [
  {
    email: 'member@nigerent.com',
    password: 'Member123!',
    name: 'Tolu Adeyemi',
    phone: '+2348012345678',
    city: 'Lagos',
    role: 'member' as const,
    preferences: ['Dining', 'Wellness', 'Experiences'],
    tierSlug: 'signature',
  },
  {
    email: 'concierge@nigerent.com',
    password: 'Concierge123!',
    name: 'Kemi Okafor',
    phone: '+2348023456789',
    city: 'Lagos',
    role: 'concierge' as const,
    preferences: [],
    tierSlug: 'signature',
  },
  {
    email: 'admin@nigerent.com',
    password: 'Admin123!',
    name: 'Oye Nigerent',
    phone: '+2348034567890',
    city: 'Lagos',
    role: 'admin' as const,
    preferences: [],
    tierSlug: 'elite',
  },
]

// ─── RESTAURANTS ─────────────────────────────────────────────────────────────

const RESTAURANTS = [
  { name: 'Osteria dei Nonni', cuisine: 'Exclusive Italian; Private & Romantic', area: 'Ikoyi', priceLevel: 4, ambianceTags: ['private', 'romantic', 'italian'], phone: '0802 313 0000', address: '59 Raymond Njoku St' },
  { name: 'EatwithMimi', cuisine: 'Authentic home-style Nigerian & party bowls', area: 'Lekki Phase 1', priceLevel: 1, ambianceTags: ['party', 'African'], phone: '0703 648 7082', address: '15 Nike Art Gallery Rd, Ikate, Lekki' },
  { name: 'HSE Gourmet', cuisine: 'Comfort food; High-quality casual dining', area: 'Lekki Phase 1', priceLevel: 1, ambianceTags: ['Casual', 'Classy'], phone: '0810 745 3433', address: '25 Babatope Bejide Cres' },
  { name: 'Cilantro', cuisine: 'Indian & Tandoori specialty catering', area: 'Victoria Island', priceLevel: 2, ambianceTags: ['Indian'], phone: '0902 199 9999', address: '7 Charles Ithell Wy, VI' },
  { name: 'Stories Lagos', cuisine: 'Rooftop garden; Cocktails and shisha', area: 'Lekki', priceLevel: 2, ambianceTags: ['rooftops', 'garden', 'cocktails'], phone: '0908 000 0000', address: '19 Toure Close' },
  { name: 'TAJ Restaurant', cuisine: 'Trendy, Lively, Dinner & Night life', area: 'Victoria Island', priceLevel: 2, ambianceTags: ['trendy', 'lively', 'nightlife'], phone: '0704 744 9000', address: '1064 Abagbon Close, VI' },
  { name: 'Botanikka', cuisine: 'Intimate wine bar; Charming & quiet', area: 'Ikoyi', priceLevel: 2, ambianceTags: ['intimate', 'quiet', 'wine'], phone: '0909 001 3500', address: '35A Raymond Njoku St' },
  { name: 'Sketch Restaurant Lagos', cuisine: 'Local all-day restaurant', area: 'Victoria Island', priceLevel: 1, ambianceTags: ['local', 'all-day'], phone: '', address: '5 Adeola Hopewell St, Victoria Island' },
  { name: 'RSVP', cuisine: 'New American; upscale, stylish dining', area: 'Victoria Island', priceLevel: 3, ambianceTags: ['American', 'Upscale', 'stylish'], phone: '0818 616 6666', address: '9 Eletu Ogabi St, Victoria Island' },
  { name: 'Crust & Cream', cuisine: 'Full-service: Buffets, plated, and cocktails', area: 'Victoria Island', priceLevel: 1, ambianceTags: ['buffet', 'cocktails'], phone: '0906 000 7275', address: "11 Musa Yar'Adua St, VI" },
  { name: 'Gaby Lagos', cuisine: 'Fusion cuisine; trendy, fun', area: 'Victoria Island', priceLevel: 2, ambianceTags: ['trendy', 'fusion'], phone: '0912 486 2823', address: '6a Agoro Odiyan St, Victoria Island' },
  { name: 'Phoenix (Pitstop)', cuisine: 'Afro-urban fine dining; Sophisticated', area: 'Ikoyi', priceLevel: 4, ambianceTags: ['afro-urban', 'fine dining', 'sophisticated'], phone: '0807 402 3858', address: '44/46 Alexander Ave' },
  { name: 'Nok by Alara', cuisine: 'African fusion fine dining', area: 'Victoria Island', priceLevel: 4, ambianceTags: ['fine dining', 'African fusion'], phone: '0818 444 1234', address: '12a Akin Olugbade, VI' },
  { name: 'Nok at Ikoyi', cuisine: 'Contemporary African cuisine', area: 'Ikoyi', priceLevel: 4, ambianceTags: ['contemporary', 'African'], phone: '0807 602 1010', address: 'Ikoyi Club, Ikoyi' },
  { name: 'Craft Grill', cuisine: 'Contemporary grill; Casual upscale', area: 'Victoria Island', priceLevel: 3, ambianceTags: ['grill', 'upscale', 'casual'], phone: '0818 555 7000', address: 'Eko Hotel, Victoria Island' },
  { name: 'Hilt Restaurant', cuisine: 'Continental; Elegant casual dining', area: 'Victoria Island', priceLevel: 3, ambianceTags: ['continental', 'elegant'], phone: '0806 000 2222', address: 'Hilton Hotel, VI' },
  { name: 'The Blue Velvet', cuisine: 'Continental fine dining; Riverside', area: 'Victoria Island', priceLevel: 4, ambianceTags: ['fine dining', 'riverside', 'continental'], phone: '0818 777 4444', address: 'Civic Centre, Ozumba Mbadiwe Ave, VI' },
  { name: 'Zuma Bar & Restaurant', cuisine: 'Japanese; Modern robata grill', area: 'Victoria Island', priceLevel: 4, ambianceTags: ['Japanese', 'robata', 'premium'], phone: '0903 111 9999', address: 'Eko Hotel, Victoria Island' },
  { name: 'Dragon Palace', cuisine: 'Chinese; Dim sum & Cantonese', area: 'Victoria Island', priceLevel: 3, ambianceTags: ['Chinese', 'dim sum'], phone: '0902 333 2222', address: '1 Adetokunbo Ademola St, VI' },
  { name: 'Tapa Loca', cuisine: 'Spanish tapas; Vibrant & social', area: 'Lekki Phase 1', priceLevel: 2, ambianceTags: ['Spanish', 'social', 'tapas'], phone: '0906 111 2233', address: '5 Idejo St, Lekki Phase 1' },
  { name: 'The Orchid Bistro', cuisine: 'Pan-Asian; Calm elegant setting', area: 'Ikoyi', priceLevel: 3, ambianceTags: ['Pan-Asian', 'elegant', 'calm'], phone: '0803 900 1100', address: '21 Bourdillon Rd, Ikoyi' },
  { name: 'Sage Restaurant', cuisine: 'Continental; Business lunch favourite', area: 'Victoria Island', priceLevel: 3, ambianceTags: ['continental', 'business', 'lunch'], phone: '0812 111 5555', address: 'Radisson Blu, VI' },
  { name: 'Il Padrino', cuisine: 'Authentic Italian; Warm & romantic', area: 'Lekki Phase 1', priceLevel: 3, ambianceTags: ['Italian', 'romantic', 'warm'], phone: '0809 876 5432', address: '10 Admiralty Way, Lekki Phase 1' },
  { name: 'Bungalow Bar & Grill', cuisine: 'Afrocentric bar grill; Lively', area: 'Victoria Island', priceLevel: 2, ambianceTags: ['Afrocentric', 'lively', 'grill'], phone: '0905 678 9012', address: '30 Adeola Odeku St, VI' },
  { name: 'Mezzanine Lagos', cuisine: 'Contemporary Lebanese; Rooftop', area: 'Victoria Island', priceLevel: 3, ambianceTags: ['Lebanese', 'rooftop', 'contemporary'], phone: '0817 234 5678', address: '4B Adeola Hopewell, VI' },
  { name: 'Nkoyo', cuisine: 'Nigerian heritage fine dining', area: 'Ikoyi', priceLevel: 4, ambianceTags: ['Nigerian', 'heritage', 'fine dining'], phone: '0806 555 1234', address: '8 Awo Rd, Ikoyi' },
  { name: 'Cactus Restaurant', cuisine: 'Continental; Iconic Lagos dining', area: 'Victoria Island', priceLevel: 3, ambianceTags: ['continental', 'iconic'], phone: '0803 444 6789', address: '1a Curtis Rd, Victoria Island' },
  { name: 'Ember Creek', cuisine: 'Nigerian Afro-fusion; Outdoor ambience', area: 'Lekki Phase 1', priceLevel: 2, ambianceTags: ['Nigerian', 'outdoor', 'fusion'], phone: '0907 123 4567', address: '2 Hakeem Dickson Rd, Lekki Phase 1' },
  { name: 'Shiro Restaurant', cuisine: 'Pan-Asian; Stylish and vibrant', area: 'Victoria Island', priceLevel: 3, ambianceTags: ['Pan-Asian', 'stylish', 'vibrant'], phone: '0812 334 4556', address: 'The Water Corporation Drive, VI' },
  { name: 'Spice Route', cuisine: 'Indian fine dining; Aromatic & elegant', area: 'Victoria Island', priceLevel: 3, ambianceTags: ['Indian', 'fine dining', 'aromatic'], phone: '0902 500 5050', address: '10 Ozumba Mbadiwe Ave, VI' },
  { name: 'Mama Cass', cuisine: 'Nigerian local & catering', area: 'Lekki Phase 1', priceLevel: 1, ambianceTags: ['Nigerian', 'local', 'casual'], phone: '0803 773 6773', address: '14 Admiralty Way, Lekki Phase 1' },
  { name: 'The Southern Sun', cuisine: 'International buffet; Hotel dining', area: 'Ikoyi', priceLevel: 3, ambianceTags: ['buffet', 'international', 'hotel'], phone: '0803 123 4567', address: 'Southern Sun Hotel, Ikoyi' },
  { name: 'Seafood Junction', cuisine: 'Fresh seafood; Lekki waterfront', area: 'Lekki', priceLevel: 2, ambianceTags: ['seafood', 'waterfront', 'fresh'], phone: '0907 888 2222', address: 'Admiralty Way, Lekki' },
  { name: 'Pattaya Thai', cuisine: 'Authentic Thai cuisine', area: 'Victoria Island', priceLevel: 2, ambianceTags: ['Thai', 'authentic'], phone: '0816 123 9900', address: '3 Adeola Odeku St, VI' },
  { name: 'Marble Restaurant', cuisine: 'European fine dining; Award-winning', area: 'Ikoyi', priceLevel: 4, ambianceTags: ['European', 'fine dining', 'award-winning'], phone: '0812 000 4444', address: '12 Bourdillon Rd, Ikoyi' },
  { name: 'Hardrock Cafe Lagos', cuisine: 'Dining & music; American classics', area: 'Victoria Island', priceLevel: 2, ambianceTags: ['music', 'American', 'lively'], phone: '0916 400 0000', address: 'Landmark Centre, VI' },
  { name: 'Bogobiri House Restaurant', cuisine: 'Creative Nigerian fusion; Arts scene', area: 'Ikoyi', priceLevel: 2, ambianceTags: ['Nigerian', 'arts', 'fusion'], phone: '0706 817 6454', address: '9 Maitama Sule St, Ikoyi' },
  { name: 'The Jazzhole Cafe', cuisine: 'Music & cafe; Bookshop vibes', area: 'Ikoyi', priceLevel: 1, ambianceTags: ['music', 'cafe', 'bohemian'], phone: '0803 329 9502', address: '168 Awolowo Rd, Ikoyi' },
  { name: 'Whitestones Lagos', cuisine: 'Modern European; Rooftop sunset', area: 'Victoria Island', priceLevel: 4, ambianceTags: ['European', 'rooftop', 'modern'], phone: '0817 111 3333', address: '15A Bisi Onabanjo Close, VI' },
  { name: 'Kapadocya', cuisine: 'Turkish; Authentic and hearty', area: 'Victoria Island', priceLevel: 2, ambianceTags: ['Turkish', 'authentic'], phone: '0809 678 1234', address: '4 Ozumba Mbadiwe Ave, VI' },
]

// ─── WELLNESS PARTNERS ────────────────────────────────────────────────────────

const WELLNESS_PARTNERS = [
  { name: '234 Luxury Spa', area: 'Lekki Phase 1', address: 'Lekki Phase 1, Lagos', phone: '+234 909 999 0234', serviceType: 'Massage & wellness', notes: 'Home service available' },
  { name: 'Refinery Beauty Lounge', area: 'Lekki Phase 1', address: '14 Fatai Idowu Arobieke St, Lekki Phase 1', phone: '0810 615 4977', serviceType: 'Beauty & Lounge', notes: 'Beauty salon with spa treatments' },
  { name: 'Tirta Ayu Spa', area: 'Victoria Island', address: '8 Olabode George St, Victoria Island, Lagos', phone: '+234 706 607 1319', serviceType: 'Spa', notes: 'Health-focused spa with various wellness services' },
  { name: 'Beauty Atelier', area: 'Victoria Island', address: '9 Akin Adesola St, VI, Lagos', phone: '+234 701 111 2222', serviceType: 'Hair & beauty', notes: 'Female guests love this' },
  { name: "Tan's Touch Beauty Spa & Massage", area: 'Victoria Island', address: '5 Tony Anegbode St, Victoria Island, Lagos', phone: '+234 816 391 7761', serviceType: 'Spa & massage', notes: 'Highly rated beauty spa offering massages and body treatments' },
  { name: 'ORIKI Spa & Products (VI)', area: 'Victoria Island', address: '4th Floor, Oriental Hotel, 3 Lekki Expressway, VI', phone: '+234 807 771 9360', serviceType: 'Spa', notes: 'Premium hotel spa with broad services' },
  { name: 'i-Fitness Gym', area: 'Lekki Phase 1', address: 'Lekki Phase 1, Lagos', phone: '', serviceType: 'Gym', notes: 'Well equipped fitness centre' },
  { name: 'Spa Island Lagos', area: 'Victoria Island', address: '1228B Ahmadu Bello Way, BWC Hotel, Victoria Island', phone: '+234 701 062 7765', serviceType: 'Spa', notes: 'Highly rated spa with full body treatments, facials, massages' },
  { name: "Johnny's Salon & Spa", area: 'Victoria Island', address: 'Mega Plaza Mall, 14 Idowu Martins St, Victoria Island', phone: '+234 808 080 8805', serviceType: 'Salon & Spa', notes: 'Premium salon & spa; popular for grooming and beauty services' },
  { name: 'Oriki Spa (VI Main)', area: 'Victoria Island', address: '25A Akin Olugbade St, VI, Lagos', phone: '+234 818 111 6745', serviceType: 'Spa & skincare', notes: 'Popular with guests' },
  { name: 'ORIKI Spa (Continental Hotel)', area: 'Victoria Island', address: '52 Kofo Abayomi St, Victoria Island, Lagos', phone: '+234 916 601 0524', serviceType: 'Spa', notes: 'Well-known spa inside Continental Hotel; facials, wellness, body care' },
  { name: 'Beyond Beauty Salon & Spa', area: 'Lekki Phase 1', address: '6 Abike Sulaiman St, Lekki Phase 1, Lagos', phone: '+234 806 644 6951', serviceType: 'Spa & Salon', notes: 'Hair, nails, beauty treatments' },
  { name: 'Vintage by Naomie Luxury Spa', area: 'Lekki Phase 1', address: '8b Chief Collins Uchidiuno St, off Fola Osibo Rd, Lekki Phase 1', phone: '+234 915 560 0600', serviceType: 'Luxury Spa', notes: 'Highly rated luxury spa & wellness' },
  { name: 'Pamper Plum Luxury Spa & Salon', area: 'Lekki Phase 1', address: '14 Wole Olateju Cres, off Admiralty Way, Lekki Phase 1', phone: '+234 916 673 3333', serviceType: 'Luxury Spa & Salon', notes: 'Luxury spa & salon with massages, facials, waxing, beauty services' },
  { name: 'Body Temple Spa', area: 'Victoria Island', address: '82 Younis Bashorun St, Victoria Island, Lagos', phone: '+234 706 877 9977', serviceType: 'Spa', notes: 'Well-reviewed spa with body treatments and wellness services' },
  { name: 'Giinini Spa', area: 'Ikoyi', address: '16 Oyinkan Abayomi Dr, Ikoyi, Lagos', phone: '0803 333 0671', serviceType: 'Spa', notes: 'Spa & beauty services' },
  { name: 'Apples & Oranges Spa', area: 'Ikoyi', address: '36 Alexander Rd, Ikoyi, Lagos', phone: '+234 908 734 0000', serviceType: 'Spa & massage', notes: 'Great for relaxation' },
  { name: 'Indy Spa & Salon', area: 'Lekki Phase 1', address: '9 Itumo Ogbonna Rd, Lekki Phase 1', phone: '0809 084 6121', serviceType: 'Spa & Salon', notes: 'Hair and beauty services' },
  { name: 'N Lounge And Spa', area: 'Lekki Phase 1', address: '92 Akanbi Disu St, Lekki Phase 1, Lagos', phone: '+234 909 116 7652', serviceType: 'Spa & Lounge', notes: 'Beauty salon with spa services in Lekki' },
  { name: '360 Wellness Spa', area: 'Lekki Phase 1', address: '5 Admiralty Way, Lekki Phase 1', phone: '+234 903 333 4444', serviceType: 'Spa', notes: 'Walk-in friendly' },
  { name: 'Labetty Skincare and Spa', area: 'Victoria Island', address: '206a Muri Okunola St, Victoria Island', phone: '+234 806 058 9581', serviceType: 'Spa & skincare', notes: 'Spa and skincare treatments' },
  { name: 'Proflex Gym', area: 'Victoria Island', address: 'Victoria Island, Lagos', phone: '12774620', serviceType: 'Gym', notes: 'Well equipped gym' },
]

// ─── EXPERIENCES & CULTURE PARTNERS ──────────────────────────────────────────

type ExperienceCategory = 'Arts & Culture' | 'Entertainment' | 'Nature & Adventure' | 'Nightlife'

function mapExperienceCategory(expType: string, vibes: string[]): ExperienceCategory {
  const t = expType.toLowerCase()
  const v = vibes.join(' ').toLowerCase()
  if (t.includes('art') || t.includes('museum') || t.includes('gallery') || t.includes('culture') || t.includes('heritage') || t.includes('history') || t.includes('music') || t.includes('open mic') || t.includes('bookshop')) return 'Arts & Culture'
  if (t.includes('nightlife') || t.includes('lounge') || t.includes('social club') || v.includes('nightlife') || v.includes('lounge')) return 'Nightlife'
  if (t.includes('beach') || t.includes('nature') || t.includes('park') || t.includes('canopy') || t.includes('water sport') || t.includes('kayak') || t.includes('jet ski') || t.includes('golf') || t.includes('boat') || t.includes('island resort') || t.includes('resort') || t.includes('fishing')) return 'Nature & Adventure'
  return 'Entertainment'
}

const EXPERIENCES = [
  { name: 'Freedom Park', area: 'Ikoyi', address: '1 Hospital Rd, Onikan', phone: '+234 803 073 7481', expType: 'History/Culture', vibes: ['Outdoor'] },
  { name: 'Omenka Gallery', area: 'Ikoyi', address: '24 Modupe Alakija Cres, Ikoyi', phone: '+234 818 455 3331', expType: 'Art Gallery', vibes: ['Calm', 'art'] },
  { name: 'National Museum Lagos', area: 'Ikoyi', address: 'Onikan Rd, Ikoyi', phone: '+234 818 642 9661', expType: 'Historical Museum', vibes: ['Calm', 'art'] },
  { name: 'Rele Gallery', area: 'Ikoyi', address: '5 Military St, Onikan', phone: '+234 805 555 1111', expType: 'Contemporary Art', vibes: ['Classy'] },
  { name: 'Thought Pyramid Art Centre', area: 'Ikoyi', address: '96 Norman Williams St, Ikoyi', phone: '+234 803 332 2885', expType: 'Modern Art Gallery', vibes: ['Calm', 'art'] },
  { name: 'Ogirikan Art Gallery', area: 'Ikoyi', address: '38B Raymond Njoku St, Ikoyi', phone: '+234 818 300 0212', expType: 'Local Art', vibes: ['Calm', 'art'] },
  { name: 'ArtTwentyOne Gallery', area: 'Victoria Island', address: '997A Danmole St, VI', phone: '+234 809 555 1111', expType: 'Art & culture', vibes: ['Calm', 'art'] },
  { name: 'J. Randle Centre for Yorùbá Culture', area: 'Victoria Island', address: 'J.K. Randle Rd, Onikan Round About', phone: '+234 807 891 8190', expType: 'Cultural Attraction', vibes: ['Calm'] },
  { name: 'The Jazzhole', area: 'Ikoyi', address: '168 Awolowo Rd, Ikoyi', phone: '+234 803 329 9502', expType: 'Music/Bookshop', vibes: ['Lively', 'music'] },
  { name: 'Bogobiri House', area: 'Ikoyi', address: '9 Maitama Sule St, Ikoyi', phone: '+234 706 817 6454', expType: 'Arts/Open Mic', vibes: ['Lively', 'Relaxed'] },
  { name: 'Nike Art Gallery', area: 'Lekki Phase 1', address: '2 Nike Art Gallery Rd, Lekki Phase 1', phone: '+234 803 409 6656', expType: 'Culture', vibes: ['Calm', 'Fun'] },
  { name: 'Sip and Paint NG', area: 'Lekki Phase 1', address: "32 Musa Yar'Adua, Lekki venues", phone: '+234 904 000 0081', expType: 'Art Workshop', vibes: ['Fun', 'Lively', 'art'] },
  { name: 'The Garden, Ikoyi', area: 'Ikoyi', address: '8 Bayo Kuku Rd, Ikoyi', phone: '+234 812 423 0942', expType: 'Botanical/Cafe', vibes: ['Calm', 'cafe'] },
  { name: 'The Library Lagos', area: 'Victoria Island', address: '17 Adeola Odeku St, VI', phone: '+234 816 402 5306', expType: 'Lounge / nightlife', vibes: ['Classy', 'nightlife', 'lounge'] },
  { name: 'The Metaphor', area: 'Ikoyi', address: "32 Musa Yar'Adua St, Ikoyi", phone: '+234 818 712 2351', expType: 'Social Club/Lounge', vibes: ['Premium', 'Classy'] },
  { name: 'Kriss Kross Skate Rink', area: 'Victoria Island', address: '6-8 Ahmadu Bello Wy, Victoria Island', phone: '0916 337 9075', expType: 'Skating', vibes: ['Lively', 'Outdoor'] },
  { name: 'Rufus & Bee Bowling', area: 'Lekki', address: 'Okunde Bluewaters Scheme, off Remi Olowude St, Lekki', phone: '0908 007 7226', expType: 'Games', vibes: ['Lively', 'games'] },
  { name: 'FunWorld Lekki', area: 'Lekki', address: 'Novare Lekki Mall, Sangotedo', phone: '+234 909 057 3212', expType: 'Arcade/Games', vibes: ['Lively', 'Fun'] },
  { name: 'Enzo Reality (VR Experiences)', area: 'Lekki Phase 1', address: '8 Providence St, Lekki Phase 1', phone: '+234 707 312 3220', expType: 'Games', vibes: ['Lively'] },
  { name: 'Illusions Zone', area: 'Lekki', address: 'Garnet Plaza, Lekki-Epe Expy', phone: '+234 707 724 6854', expType: 'Illusions', vibes: ['Lively', 'Fun'] },
  { name: 'Landmark Upside-Down House', area: 'Victoria Island', address: '3&4 Water Corp Dr, VI', phone: '234 906 688 2627', expType: 'Tourist Attraction', vibes: ['Relaxed', 'tourism'] },
  { name: 'Hard Rock Cafe Lagos', area: 'Victoria Island', address: 'Landmark Centre, VI', phone: '+234 916 400 0000', expType: 'Dining & music', vibes: ['Fun', 'music'] },
  { name: 'Gameland Lagos', area: 'Lekki Phase 1', address: 'Plot 14, Providence St, Lekki Phase 1', phone: '+234 802 605 1619', expType: 'Outdoor Games/Social', vibes: ['Lively', 'Outdoor', 'games'] },
  { name: 'Upbeat Recreation Centre', area: 'Lekki Phase 1', address: '11 Admiralty Rd, Lekki Phase 1', phone: '+234 818 884 4991', expType: 'Trampoline/Fitness', vibes: ['fitness'] },
  { name: 'Omu Resort', area: 'Lekki', address: '1 Asiwaju Bola Tinubu Wy, Bogije', phone: '+234 814 281 2406', expType: 'Zoo/Theme Park', vibes: ['Lively'] },
  { name: 'Lufasi Nature Park', area: 'Lekki', address: 'Majek Bus Stop, Lekki-Epe Expy', phone: '+234 803 323 1007', expType: 'Nature Park', vibes: ['Lively'] },
  { name: 'Lekki Conservation Centre', area: 'Lekki', address: 'Km 19 Lekki-Epe Expy, Lekki Peninsula II', phone: '0906 546 0479', expType: 'Canopy walk, Nature Park', vibes: ['Outdoor', 'park'] },
  { name: 'Falomo Garden', area: 'Ikoyi', address: '2, Lateef Junaid Dosumu St, Ikoyi', phone: '', expType: 'Urban Park', vibes: ['Relaxed', 'Outdoor'] },
  { name: 'Oh La La Park', area: 'Ikoyi', address: '3b Thompson Ave, Ikoyi', phone: '', expType: 'Picnic Space', vibes: ['Outdoor'] },
  { name: 'Paradise Moris', area: 'Ikoyi', address: 'Awolowo Rd, Ikoyi', phone: '', expType: 'Scenic Walk', vibes: ['Calm'] },
  { name: 'Muri Okunola Park', area: 'Ikoyi', address: 'Adeyemo Alakija St, Ikoyi', phone: '', expType: 'Public Park/Events', vibes: ['Relaxed', 'Outdoor', 'events'] },
  { name: 'Sail Lagos', area: 'Victoria Island', address: 'Victoria Island, Lagos', phone: '+234 901 234 5678', expType: 'Boat cruise', vibes: ['Premium', 'water'] },
  { name: 'Boat Cruise NG', area: 'Lekki Phase 1', address: 'Lekki Waterfront, Lekki Phase 1', phone: '+234 901 000 0000', expType: 'Water Tour', vibes: ['Outdoor', 'Lively', 'water'] },
  { name: 'Kayaking (Kimono Logistics)', area: 'Lekki Phase 1', address: 'Admiralty Way, Lekki Phase 1', phone: '+234 803 306 3822', expType: 'Water Sports', vibes: ['Fun', 'water'] },
  { name: 'Lagos Jet Ski Riders Club', area: 'Ikoyi', address: '12 Ademola St, Ikoyi', phone: '+234 803 750 0000', expType: 'Water Sports', vibes: ['Fun', 'Outdoor'] },
  { name: 'Tarkwa Bay (Boat Access)', area: 'Ikoyi', address: 'Ikoyi Waterfront (Private Jetties)', phone: '+234 916 362 8068', expType: 'Beach/Surfing', vibes: ['Fun', 'surfing', 'beach'] },
  { name: 'Elegushi Royal Beach', area: 'Lekki Phase 1', address: 'Elegushi Beach Rd, Lekki Phase 1', phone: '+234 802 353 3924', expType: 'Beach Club/Party', vibes: ['Lively', 'beach'] },
  { name: 'Skyfall Oceanfront Club', area: 'Lekki', address: 'Elegushi Beach, Lekki', phone: '+234 912 222 2229', expType: 'Beach Club', vibes: ['Lively', 'beach'] },
  { name: 'Dan & Den Oceanfront', area: 'Lekki', address: 'Elegushi Beach, Lekki', phone: '+234 810 555 6666', expType: 'Beach Lounge', vibes: ['Lively', 'Relaxed', 'beach'] },
  { name: 'Moist Beach Club', area: 'Lekki', address: 'Elegushi Beach Rd, Lekki', phone: '+234 813 333 4444', expType: 'Beach club', vibes: ['Lively', 'beach'] },
  { name: 'Jara Beach Resort', area: 'Lekki', address: 'Museyo Beach, Eleko', phone: '+234 902 025 1515', expType: 'Beach Getaway', vibes: ['Premium', 'beach'] },
  { name: 'Barracuda Beach Resort', area: 'Lekki', address: 'Okun-Mapo Village, Ajah', phone: '+234 818 912 3456', expType: 'Beach Fun', vibes: ['Fun', 'Lively', 'beach'] },
  { name: 'Santa Cruz Beach', area: 'Lekki', address: 'Abraham Adesanya, Ajah', phone: '+234 802 301 9283', expType: 'Private Beach', vibes: ['Fun', 'Lively', 'Outdoor'] },
  { name: 'Atican Beach Resort', area: 'Lekki', address: 'Okun Ajah Town, off Lekki-Epe Expy', phone: '+234 810 577 0000', expType: 'Beach Resort', vibes: ['Fun', 'Outdoor', 'beach'] },
  { name: 'Lekki Arts & Craft Market', area: 'Lekki', address: 'Oba Elegushi St (off Lekki-Epe Expy)', phone: '', expType: 'Cultural Shopping', vibes: ['Fun', 'Lively'] },
  { name: 'Ikoyi Golf Club', area: 'Ikoyi', address: '6 Ikoyi Club 1938 Rd, Ikoyi', phone: '+234 810 322 0310', expType: 'Golf/Sport', vibes: ['Classy', 'Outdoor'] },
  { name: 'Lakowe Lakes Golf Estate', area: 'Lekki', address: 'Lakowe Lakes, Lekki-Epe Expy', phone: '+234 700 525 693', expType: 'Golf & Nature', vibes: ['Classy', 'Premium'] },
  { name: 'Lagos Motor Boat Club', area: 'Ikoyi', address: '25 Awolowo Rd, Ikoyi', phone: '+234 1 269 1614', expType: 'Elite Social Club', vibes: ['Fun', 'Lively'] },
  { name: 'Inagbe Grand Resort', area: 'Ikoyi', address: 'Regatta Jetty, Queens Drive, Ikoyi', phone: '+234 817 088 5261', expType: 'Island Resort', vibes: ['Fun', 'Outdoor'] },
  { name: 'La Campagne Tropicana', area: 'Lekki', address: 'Ikegun, Ibeju-Lekki', phone: '+234 805 222 5222', expType: 'Cultural Resort', vibes: ['Lively', 'Calm'] },
  { name: 'The Studio (Art Space)', area: 'Ikoyi', address: 'Parkview Estate, Ikoyi', phone: '+234 802 306 2024', expType: 'Creative Space', vibes: ['Calm'] },
]

// ─── SUPERMARKETS ─────────────────────────────────────────────────────────────

const SUPERMARKETS = [
  { name: 'SPAR Market Lekki', area: 'Lekki', address: 'Palm Springs Rd, Lekki Peninsula II', phone: '+234 701 998 1081', hours: 'Daily 09:00–21:00' },
  { name: 'N Y Supermarket', area: 'Lekki Phase 1', address: '19 Admiralty Way, Lekki Phase 1', phone: '+234 818 841 0894', hours: 'Daily 08:30–22:30' },
  { name: 'Lupees Online', area: 'Lekki Phase 1', address: '41 Adebayo Doherty Rd, Lekki Phase 1', phone: '+234 815 253 1399', hours: 'Check for open hours' },
  { name: 'One Source Supermarket', area: 'Victoria Island', address: 'Oniru, Victoria Island', phone: '', hours: 'Daily 9am–9pm' },
  { name: 'Edge Supermart', area: 'Lekki Phase 1', address: '7 Oriwu St (Elf Bus stop), Lekki Phase 1', phone: '+234 809 999 8413', hours: 'Daily 08:00–21:00' },
  { name: 'C Mart', area: 'Lekki Phase 1', address: 'Admiralty Rd, Lekki Phase 1', phone: '', hours: 'Daily ~08:00–23:00' },
  { name: 'Prince Ebeano Supermarket', area: 'Lekki Phase 1', address: 'Plot 9 Northern Business District, Admiralty Wy, Lekki Phase 1', phone: '+234 705 109 2255', hours: 'Daily 08:00–21:30' },
  { name: 'Daytona 24/7 Supermarket', area: 'Lekki Phase 1', address: '7 Hakeem Dickson Link Rd, Lekki Phase 1', phone: '+234 818 000 2968', hours: 'Daily 08:00–20:00' },
  { name: 'Renee Supermarket Freedom Way', area: 'Lekki', address: 'Off Freedom Way, Eti-Osa, Lekki', phone: '+234 908 411 1120', hours: 'Daily 07:00–00:00' },
]

// ─── PHARMACIES ───────────────────────────────────────────────────────────────

const PHARMACIES = [
  { name: 'Greenway 24/7 Pharmacy', area: 'Lekki', address: '141 Lekki-Epe, Lekki Peninsula II', phone: '+234 805 909 1233', notes: '24/7 pharmacy service' },
  { name: 'Medplus Pharmacy', area: 'Lekki Phase 1', address: 'Plot 2 Admiralty Way, Lekki Phase 1', phone: '+234 915 259 2952', notes: 'Well-reviewed pharmacy' },
  { name: 'Alpha Pharmacy & Stores', area: 'Victoria Island', address: '16B Emma Abimbola Cole St, Lagos', phone: '+234 906 244 0937', notes: 'Pharmacy & general items' },
  { name: 'Mopheth Pharmacy', area: 'Lekki Phase 1', address: '32a Admiralty Wy, Lekki Phase 1', phone: '+234 808 158 5229', notes: 'Highly rated pharmacy' },
  { name: 'Namz Pharmacy and Stores', area: 'Lekki Phase 1', address: '4b Taiwo Ishola St, Lekki Phase 1', phone: '+234 707 215 0806', notes: 'Pharmacy & convenience store' },
  { name: 'Daytona 24/7 Supermarket & Pharmacy', area: 'Lekki Phase 1', address: '21 Admiralty Rd, Lekki Phase 1', phone: '+234 818 000 2968', notes: 'Supermarket + pharmacy combined' },
  { name: 'JRyan Supermarket & Pharmacy', area: 'Lekki Phase 1', address: 'CFHJ+GQ8, Lekki Phase 1', phone: '', notes: 'Combined supermarket & pharmacy' },
  { name: 'Purelife Pharmacy', area: 'Lekki Phase 1', address: 'Block 15 Admiralty Wy, Lekki Phase 1', phone: '+234 809 056 4568', notes: 'Trusted pharmacy & health store' },
]

// ─── HOSPITALS & EMERGENCY SERVICES ──────────────────────────────────────────

const HOSPITALS = [
  { name: 'Evercare Hospital', area: 'Lekki Phase 1', address: '1 Evercare Way, Lekki Phase 1', phone: '0813 985 0710', type: 'Hospital' },
  { name: 'Reddington Multi-Specialist Hospital', area: 'Victoria Island', address: '12 Idowu Martins St, VI', phone: '0812 800 8187', type: 'Hospital' },
  { name: 'Iwosan Lagoon Hospital', area: 'Ikoyi', address: '17B Bourdillon Road, Ikoyi', phone: '0708 639 3027', type: 'Hospital' },
  { name: 'Paelon Memorial Hospital', area: 'Victoria Island', address: '1221 Ahmadu Bello Way, VI', phone: '0817 834 8312', type: 'Hospital' },
  { name: 'St. Nicholas Hospital', area: 'Victoria Island', address: '7B Etim Inyang Crescent, VI', phone: '0802 290 8484', type: 'Hospital' },
  { name: 'First Cardiology Consultants', area: 'Ikoyi', address: '20-22 Thompson Ave, Ikoyi', phone: '0817 333 3333', type: 'Hospital' },
  { name: 'Tranquil and Quest Hospital', area: 'Lekki Phase 1', address: '10A Fola Osibo Rd, Lekki Phase 1', phone: '0800 000 3344', type: 'Hospital' },
  { name: 'Vedic Lifecare Hospital', area: 'Lekki Phase 1', address: 'Block 105, 6 Olabanji Olajide, Lekki Phase 1', phone: '0810 500 0045', type: 'Hospital' },
  { name: 'Britannia Hospital', area: 'Lekki Phase 1', address: 'Plot 13, Block 91, Aliu Animashaun, Lekki Phase 1', phone: '01 950 4880', type: 'Hospital' },
  { name: 'Ave Maria Hospital', area: 'Victoria Island', address: 'Block 14, Plot 7, Oniru, VI', phone: '0803 333 4444', type: 'Hospital' },
  { name: 'Renaissance Medical Services', area: 'Victoria Island', address: '8B Elsie Femi Pearse St, VI', phone: '0903 076 9633', type: 'Hospital' },
  { name: 'Lifeline Children\'s Hospital', area: 'Lekki Phase 1', address: '1 Augustine Anozie St, Lekki Phase 1', phone: '0802 234 4343', type: 'Hospital' },
  { name: 'Bestcare Hospital', area: 'Ikoyi', address: '2A Keffi Street, Ikoyi', phone: '0901 361 7520', type: 'Hospital' },
  { name: 'Georges Memorial Medical', area: 'Lekki Phase 1', address: '6 Rasheed Alaba Williams St, Lekki Phase 1', phone: '01 271 8727', type: 'Hospital' },
  { name: 'Etta Atlantic Memorial', area: 'Lekki', address: '22 Abioro Street, Ikate, Lekki', phone: '0808 373 4008', type: 'Hospital' },
  { name: 'Lagos State Emergency Line', area: 'Lagos', address: 'All VI, Ikoyi, Lekki', phone: '767 / 112', type: 'Emergency Service' },
  { name: 'LASAMBUS Ambulance Service', area: 'Lagos', address: 'All VI, Ikoyi, Lekki', phone: '0802 288 7777', type: 'Emergency Service' },
  { name: 'Emergency Response Africa', area: 'Lagos', address: 'All VI, Ikoyi, Lekki', phone: '0800 022 55372', type: 'Emergency Service' },
  { name: 'Lagos State Fire Service', area: 'Lagos', address: 'All VI, Ikoyi, Lekki', phone: '0803 323 4943', type: 'Emergency Service' },
  { name: 'Rapid Response Squad (RRS)', area: 'Lagos', address: 'All VI, Ikoyi, Lekki', phone: '0905 395 0347', type: 'Emergency Service' },
]

// ─── TRANSPORT PARTNERS ───────────────────────────────────────────────────────

const TRANSPORT_PARTNERS = [
  { name: 'Sixt Nigeria', area: 'Victoria Island', address: 'Plot 6, Block 41, Ajose Adeogun St, VI', phone: '+234 818 444 7498', serviceType: 'Airport pickup, car hire', notes: 'Reliable for business & tourists' },
  { name: 'Hertz Nigeria', area: 'Victoria Island', address: '2 Ozumba Mbadiwe Ave, VI', phone: '+234 809 990 6000', serviceType: 'Car hire, airport transfer', notes: 'Good for longer stays' },
  { name: 'MetroCabs Nigeria', area: 'Lekki Phase 1', address: 'Lekki Phase 1', phone: '+234 809 999 2222', serviceType: 'Private driver service', notes: 'Ideal for guests who prefer drivers' },
  { name: 'Triola Fleet', area: 'Victoria Island', address: 'VI / Lekki', phone: '0902 626 9819', serviceType: 'Chauffeur / Airport', notes: 'Professional fleet service' },
]

// ─── LAUNDRY PARTNERS ─────────────────────────────────────────────────────────

const LAUNDRY_PARTNERS = [
  { name: 'Skip Your Laundry (Ikoyi)', area: 'Ikoyi', address: 'No 2 Alexander Rd, Ikoyi', phone: '0907 194 7992', notes: 'Multi-branch laundry; convenient pickup/drop-off' },
  { name: 'Garment Care Limited', area: 'Victoria Island', address: '288b Ajose Adeogun St, Victoria Island', phone: '0807 741 1594', notes: 'Long-established laundry service' },
  { name: 'LuxeWash Premium Laundry', area: 'Lekki Phase 1', address: 'Multiple: VI, Lekki, Ikoyi', phone: '', notes: 'Luxury laundry with pickup & delivery' },
  { name: 'Jclean Services', area: 'Lekki Phase 1', address: '4 Taiwo Ishola St, Lekki Phase 1', phone: '0908 092 2222', notes: 'Laundry and cleaning service' },
  { name: 'Richfred Laundry & Drycleaners', area: 'Lekki Phase 1', address: 'Lekki Phase 1', phone: '+234 809 999 3330', notes: 'Drycleaning & wash, good for formal wear' },
  { name: 'WashRyte Laundry Service', area: 'Lekki Phase 1', address: 'Lekki Phase 1', phone: '+234 805 930 3818', notes: 'Pickup & delivery' },
]

// ─── SEED FUNCTION ────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding Nigerent Signature Lifestyle directory...\n')

  // ── MEMBERSHIP TIERS ────────────────────────────────────────────────────────
  console.log('Upserting membership tiers...')

  // Fix any legacy tiers with wrong slugs before upserting
  const legacySlugFixes: Record<string, string> = { 'signature-plus': 'plus' }
  for (const [oldSlug, newSlug] of Object.entries(legacySlugFixes)) {
    const legacy = await prisma.membershipTier.findUnique({ where: { slug: oldSlug } })
    if (legacy) {
      console.log(`  ↻ Fixing legacy slug: ${oldSlug} → ${newSlug}`)
      await prisma.membershipTier.update({
        where: { slug: oldSlug },
        data: { slug: newSlug },
      })
    }
  }

  for (const t of TIERS) {
    await prisma.membershipTier.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        pointsThreshold: t.pointsThreshold,
        earnMultiplier: t.earnMultiplier,
        displayOrder: t.displayOrder,
        benefits: t.benefits,
      },
      create: t,
    })
  }
  console.log(`  ✓ ${TIERS.length} tiers seeded\n`)

  // ── TEST USERS (Supabase Auth + Prisma) ─────────────────────────────────────
  console.log('Upserting test users...')
  const WELCOME_POINTS = 500

  for (const u of TEST_USERS) {
    // Check if Prisma user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: u.email } })
    if (existingUser) {
      console.log(`  ⏭ User ${u.email} already exists, skipping`)
      continue
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { role: u.role },
    })

    if (authError) {
      // If user already exists in Supabase, try to fetch their ID
      if (authError.message?.includes('already been registered')) {
        const { data: listData } = await supabase.auth.admin.listUsers()
        const found = listData?.users?.find((su) => su.email === u.email)
        if (!found) {
          console.error(`  ✗ Cannot resolve Supabase user for ${u.email}:`, authError.message)
          continue
        }
        // Use existing Supabase auth ID
        await createPrismaUser(found.id, u)
        console.log(`  ✓ ${u.email} (${u.role}) — linked to existing Supabase auth`)
      } else {
        console.error(`  ✗ Failed to create ${u.email}:`, authError.message)
        continue
      }
    } else if (authData?.user) {
      await createPrismaUser(authData.user.id, u)
      console.log(`  ✓ ${u.email} (${u.role}) — created`)
    }
  }

  async function createPrismaUser(
    supabaseId: string,
    u: (typeof TEST_USERS)[number],
  ) {
    const tier = await prisma.membershipTier.findUnique({ where: { slug: u.tierSlug } })
    if (!tier) throw new Error(`Tier ${u.tierSlug} not found`)

    await prisma.$transaction(async (tx) => {
      // User record
      const user = await tx.user.create({
        data: {
          id: supabaseId,
          email: u.email,
          name: u.name,
          phone: u.phone,
          city: u.city,
          role: u.role,
          preferences: u.preferences,
          inviteActivatedAt: new Date(),
          invitedBy: 'seed',
        },
      })

      // Membership
      await tx.userMembership.create({
        data: { userId: user.id, tierId: tier.id },
      })

      // Wallet
      await tx.wallet.create({
        data: { userId: user.id },
      })

      // Chat thread
      await tx.chatThread.create({
        data: { userId: user.id },
      })

      // Welcome points
      await tx.pointsLedger.create({
        data: {
          userId: user.id,
          actionType: 'WELCOME_BONUS',
          points: WELCOME_POINTS,
          balanceAfter: WELCOME_POINTS,
        },
      })

      // Welcome notification
      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'WELCOME',
          title: 'Welcome to Nigerent Signature Lifestyle',
          body: `Your ${tier.name} membership is active. You've been awarded ${WELCOME_POINTS} welcome points.`,
          ctaUrl: '/rewards',
        },
      })

      // Add some wallet activity for the test member
      if (u.role === 'member') {
        // A completed wallet load
        await tx.walletTransaction.create({
          data: {
            userId: user.id,
            type: 'LOAD',
            amount: 50000,
            status: 'COMPLETED',
            description: 'Wallet top-up',
            paymentMethod: 'card',
            paystackRef: `seed_load_${Date.now()}`,
          },
        })

        // A spend transaction
        await tx.walletTransaction.create({
          data: {
            userId: user.id,
            type: 'SPEND',
            amount: 15000,
            status: 'COMPLETED',
            description: 'Dining reservation deposit — Nok by Alara',
            paymentMethod: 'wallet',
          },
        })

        // A second wallet load
        await tx.walletTransaction.create({
          data: {
            userId: user.id,
            type: 'LOAD',
            amount: 25000,
            status: 'COMPLETED',
            description: 'Wallet top-up',
            paymentMethod: 'card',
            paystackRef: `seed_load2_${Date.now()}`,
          },
        })

        // Extra points from a stay and a wallet load
        const currentBalance = WELCOME_POINTS
        await tx.pointsLedger.create({
          data: {
            userId: user.id,
            actionType: 'WALLET_LOAD',
            points: 250,
            balanceAfter: currentBalance + 250,
          },
        })
        await tx.pointsLedger.create({
          data: {
            userId: user.id,
            actionType: 'DINING_CONFIRMED',
            points: 100,
            balanceAfter: currentBalance + 250 + 100,
          },
        })

        // A few extra notifications
        await tx.notification.createMany({
          data: [
            {
              userId: user.id,
              type: 'OFFER_NEW',
              title: 'New offer from Nok by Alara',
              body: '15% off your next fine dining experience. Valid this month.',
              ctaUrl: '/explore',
            },
            {
              userId: user.id,
              type: 'POINTS_EARNED',
              title: 'You earned 250 points',
              body: 'Points awarded for your recent wallet top-up.',
              ctaUrl: '/rewards',
            },
            {
              userId: user.id,
              type: 'CONCIERGE_UPDATE',
              title: 'Your concierge request was received',
              body: 'We\'re working on your dining reservation. You\'ll hear back within 2 hours.',
              ctaUrl: '/chat',
            },
          ],
        })

        // A sample booking
        await tx.booking.create({
          data: {
            userId: user.id,
            property: 'Meridian Suite — Eko Hotel',
            checkIn: new Date('2026-04-12'),
            checkOut: new Date('2026-04-16'),
            amount: 320000,
            status: 'confirmed',
          },
        })
      }
    })
  }

  console.log('')

  // ── RESTAURANTS ─────────────────────────────────────────────────────────────
  console.log(`Upserting ${RESTAURANTS.length} restaurants...`)
  let restCount = 0
  for (const r of RESTAURANTS) {
    const existing = await prisma.restaurant.findFirst({ where: { name: r.name } })
    if (!existing) {
      await prisma.restaurant.create({
        data: {
          name:          r.name,
          cuisine:       r.cuisine,
          area:          r.area,
          city:          'Lagos',
          ambianceTags:  r.ambianceTags,
          priceLevel:    r.priceLevel,
          memberBenefit: 'Priority reservations and exclusive member discount for Nigerent Signature members.',
          openingHours:  {},
          isActive:      true,
          isFeatured:    false,
          imageUrls:     [],
        },
      })
    } else {
      await prisma.restaurant.update({
        where: { id: existing.id },
        data: {
          cuisine:       r.cuisine,
          area:          r.area,
          city:          'Lagos',
          ambianceTags:  r.ambianceTags,
          priceLevel:    r.priceLevel,
          memberBenefit: 'Priority reservations and exclusive member discount for Nigerent Signature members.',
          openingHours:  {},
          isActive:      true,
        },
      })
    }
    restCount++
  }
  console.log(`  ✓ ${restCount} restaurants seeded\n`)

  // ── WELLNESS PARTNERS + OFFERS ───────────────────────────────────────────────
  console.log(`Upserting ${WELLNESS_PARTNERS.length} wellness partners...`)
  let wellnessCount = 0
  for (const w of WELLNESS_PARTNERS) {
    const partner = await prisma.partner.upsert({
      where: { name: w.name },
      update: {
        category: 'Wellness & Spa',
        area: w.area,
        city: 'Lagos',
        contactInfo: { phone: w.phone, address: w.address },
        isActive: true,
      },
      create: {
        name: w.name,
        category: 'Wellness & Spa',
        area: w.area,
        city: 'Lagos',
        description: w.notes,
        contactInfo: { phone: w.phone, address: w.address },
        isActive: true,
      },
    })

    // Check if offer already exists
    const existingOffer = await prisma.offer.findFirst({ where: { partnerId: partner.id } })
    if (!existingOffer) {
      await prisma.offer.create({
        data: {
          partnerId:       partner.id,
          title:           `Member Wellness Benefit — ${w.name}`,
          shortDesc:       `Exclusive ${w.serviceType.toLowerCase()} access for Nigerent Signature members.`,
          description:     `As a Nigerent Signature member, enjoy exclusive access and priority booking at ${w.name}. ${w.notes}. Present your membership card or show this screen to redeem.`,
          category:        'Wellness & Spa',
          city:            'Lagos',
          area:            w.area,
          tierEligibility: ['Signature', 'Signature Plus', 'Elite'],
          pointsEligible:  true,
          pointsAward:     50,
          redemptionType:  'SHOW_ON_SCREEN',
          redemptionSteps: ['Open this benefit on your app', 'Show the screen to staff at reception', 'Staff will verify and apply your member discount'],
          status:          'ACTIVE',
          validFrom:       new Date('2026-01-01'),
        },
      })
    }
    wellnessCount++
  }
  console.log(`  ✓ ${wellnessCount} wellness partners seeded\n`)

  // ── EXPERIENCES PARTNERS + OFFERS ────────────────────────────────────────────
  console.log(`Upserting ${EXPERIENCES.length} experiences & culture partners...`)
  let expCount = 0
  for (const e of EXPERIENCES) {
    const category = mapExperienceCategory(e.expType, e.vibes)
    const partner = await prisma.partner.upsert({
      where: { name: e.name },
      update: {
        category,
        area: e.area,
        city: 'Lagos',
        contactInfo: { phone: e.phone, address: e.address },
        isActive: true,
      },
      create: {
        name: e.name,
        category,
        area: e.area,
        city: 'Lagos',
        contactInfo: { phone: e.phone, address: e.address },
        isActive: true,
      },
    })

    const existingOffer = await prisma.offer.findFirst({ where: { partnerId: partner.id } })
    if (!existingOffer) {
      await prisma.offer.create({
        data: {
          partnerId:       partner.id,
          title:           `Member Access — ${e.name}`,
          shortDesc:       `${e.expType} • Exclusive Nigerent Signature access.`,
          description:     `Nigerent Signature members get exclusive access and special privileges at ${e.name} (${e.expType}). ${e.area}, Lagos. ${e.phone ? `Call: ${e.phone}` : ''}`,
          category,
          city:            'Lagos',
          area:            e.area,
          tierEligibility: ['Signature', 'Signature Plus', 'Elite'],
          pointsEligible:  true,
          pointsAward:     30,
          redemptionType:  'SHOW_ON_SCREEN',
          redemptionSteps: ['Open this benefit on your app', 'Show the screen at the entrance or front desk', 'Staff will verify your membership'],
          status:          'ACTIVE',
          validFrom:       new Date('2026-01-01'),
        },
      })
    }
    expCount++
  }
  console.log(`  ✓ ${expCount} experiences partners seeded\n`)

  // ── SUPERMARKET PARTNERS + OFFERS ────────────────────────────────────────────
  console.log(`Upserting ${SUPERMARKETS.length} supermarkets...`)
  let superCount = 0
  for (const s of SUPERMARKETS) {
    const partner = await prisma.partner.upsert({
      where: { name: s.name },
      update: {
        category: 'Supermarket',
        area: s.area,
        city: 'Lagos',
        contactInfo: { phone: s.phone, address: s.address, hours: s.hours },
        isActive: true,
      },
      create: {
        name: s.name,
        category: 'Supermarket',
        area: s.area,
        city: 'Lagos',
        contactInfo: { phone: s.phone, address: s.address, hours: s.hours },
        isActive: true,
      },
    })

    const existingOffer = await prisma.offer.findFirst({ where: { partnerId: partner.id } })
    if (!existingOffer) {
      await prisma.offer.create({
        data: {
          partnerId:       partner.id,
          title:           `Member Priority — ${s.name}`,
          shortDesc:       `Priority service and exclusive discounts at ${s.name}.`,
          description:     `Nigerent Signature members enjoy priority queuing and an exclusive discount at ${s.name}. Hours: ${s.hours}. Address: ${s.address}.`,
          category:        'Supermarket',
          city:            'Lagos',
          area:            s.area,
          tierEligibility: ['Signature', 'Signature Plus', 'Elite'],
          pointsEligible:  false,
          redemptionType:  'SHOW_ON_SCREEN',
          redemptionSteps: ['Show your Nigerent Signature membership screen at checkout', 'Cashier will apply your member discount'],
          status:          'ACTIVE',
          validFrom:       new Date('2026-01-01'),
        },
      })
    }
    superCount++
  }
  console.log(`  ✓ ${superCount} supermarkets seeded\n`)

  // ── PHARMACY PARTNERS + OFFERS ───────────────────────────────────────────────
  console.log(`Upserting ${PHARMACIES.length} pharmacies...`)
  let pharmaCount = 0
  for (const p of PHARMACIES) {
    const partner = await prisma.partner.upsert({
      where: { name: p.name },
      update: {
        category: 'Pharmacy',
        area: p.area,
        city: 'Lagos',
        contactInfo: { phone: p.phone, address: p.address },
        isActive: true,
      },
      create: {
        name: p.name,
        category: 'Pharmacy',
        area: p.area,
        city: 'Lagos',
        description: p.notes,
        contactInfo: { phone: p.phone, address: p.address },
        isActive: true,
      },
    })

    const existingOffer = await prisma.offer.findFirst({ where: { partnerId: partner.id } })
    if (!existingOffer) {
      await prisma.offer.create({
        data: {
          partnerId:       partner.id,
          title:           `Member Pharmacy Access — ${p.name}`,
          shortDesc:       `Preferred service and discounts at ${p.name}.`,
          description:     `Nigerent Signature members enjoy preferred service and discounts at ${p.name}. ${p.notes}. Address: ${p.address}.`,
          category:        'Pharmacy',
          city:            'Lagos',
          area:            p.area,
          tierEligibility: ['Signature', 'Signature Plus', 'Elite'],
          pointsEligible:  false,
          redemptionType:  'SHOW_ON_SCREEN',
          redemptionSteps: ['Show your membership screen at the pharmacy counter', 'Pharmacist will verify and apply your member benefit'],
          status:          'ACTIVE',
          validFrom:       new Date('2026-01-01'),
        },
      })
    }
    pharmaCount++
  }
  console.log(`  ✓ ${pharmaCount} pharmacies seeded\n`)

  // ── HOSPITAL PARTNERS + OFFERS ───────────────────────────────────────────────
  console.log(`Upserting ${HOSPITALS.length} hospitals & emergency services...`)
  let hospCount = 0
  for (const h of HOSPITALS) {
    const partner = await prisma.partner.upsert({
      where: { name: h.name },
      update: {
        category: 'Hospital & Medical',
        area: h.area,
        city: 'Lagos',
        contactInfo: { phone: h.phone, address: h.address, type: h.type },
        isActive: true,
      },
      create: {
        name: h.name,
        category: 'Hospital & Medical',
        area: h.area,
        city: 'Lagos',
        contactInfo: { phone: h.phone, address: h.address, type: h.type },
        isActive: true,
      },
    })

    const existingOffer = await prisma.offer.findFirst({ where: { partnerId: partner.id } })
    if (!existingOffer) {
      const isEmergency = h.type === 'Emergency Service'
      await prisma.offer.create({
        data: {
          partnerId:       partner.id,
          title:           isEmergency ? `Emergency Service — ${h.name}` : `Member Medical Access — ${h.name}`,
          shortDesc:       isEmergency ? `Emergency contact: ${h.phone}` : `Priority medical care for members at ${h.name}.`,
          description:     isEmergency
            ? `${h.name} — ${h.type}. Contact: ${h.phone}. Available for all Nigerent Signature members.`
            : `Nigerent Signature members receive priority admission and preferred rates at ${h.name}. Address: ${h.address}. Phone: ${h.phone}.`,
          category:        'Hospital & Medical',
          city:            'Lagos',
          area:            h.area,
          tierEligibility: ['Signature', 'Signature Plus', 'Elite'],
          pointsEligible:  false,
          redemptionType:  'CONCIERGE_CONFIRM',
          redemptionSteps: ['Call your Nigerent Signature concierge', 'Concierge will coordinate with the facility on your behalf', 'Present your membership card on arrival'],
          status:          'ACTIVE',
          validFrom:       new Date('2026-01-01'),
        },
      })
    }
    hospCount++
  }
  console.log(`  ✓ ${hospCount} hospitals & emergency services seeded\n`)

  // ── TRANSPORT PARTNERS + OFFERS ──────────────────────────────────────────────
  console.log(`Upserting ${TRANSPORT_PARTNERS.length} transport partners...`)
  let transCount = 0
  for (const t of TRANSPORT_PARTNERS) {
    const partner = await prisma.partner.upsert({
      where: { name: t.name },
      update: {
        category: 'Nature & Adventure',
        area: t.area,
        city: 'Lagos',
        contactInfo: { phone: t.phone, address: t.address },
        isActive: true,
      },
      create: {
        name: t.name,
        category: 'Nature & Adventure',
        area: t.area,
        city: 'Lagos',
        description: t.notes,
        contactInfo: { phone: t.phone, address: t.address },
        isActive: true,
      },
    })

    const existingOffer = await prisma.offer.findFirst({ where: { partnerId: partner.id } })
    if (!existingOffer) {
      await prisma.offer.create({
        data: {
          partnerId:       partner.id,
          title:           `Member Transport — ${t.name}`,
          shortDesc:       `${t.serviceType} — preferred rates for Nigerent Signature members.`,
          description:     `Nigerent Signature members enjoy preferred rates and priority booking with ${t.name}. ${t.notes}. Contact: ${t.phone}.`,
          category:        'Nature & Adventure',
          city:            'Lagos',
          area:            t.area,
          tierEligibility: ['Signature', 'Signature Plus', 'Elite'],
          pointsEligible:  false,
          redemptionType:  'CONCIERGE_CONFIRM',
          redemptionSteps: ['Contact your concierge to arrange transport', 'Provide your destination and preferred time', 'Concierge will confirm your booking'],
          status:          'ACTIVE',
          validFrom:       new Date('2026-01-01'),
        },
      })
    }
    transCount++
  }
  console.log(`  ✓ ${transCount} transport partners seeded\n`)

  // ── LAUNDRY PARTNERS + OFFERS ────────────────────────────────────────────────
  console.log(`Upserting ${LAUNDRY_PARTNERS.length} laundry partners...`)
  let laundryCount = 0
  for (const l of LAUNDRY_PARTNERS) {
    const partner = await prisma.partner.upsert({
      where: { name: l.name },
      update: {
        category: 'Wellness & Spa',
        area: l.area,
        city: 'Lagos',
        contactInfo: { phone: l.phone ?? '', address: l.address },
        isActive: true,
      },
      create: {
        name: l.name,
        category: 'Wellness & Spa',
        area: l.area,
        city: 'Lagos',
        description: l.notes,
        contactInfo: { phone: l.phone ?? '', address: l.address },
        isActive: true,
      },
    })

    const existingOffer = await prisma.offer.findFirst({ where: { partnerId: partner.id } })
    if (!existingOffer) {
      await prisma.offer.create({
        data: {
          partnerId:       partner.id,
          title:           `Member Laundry Service — ${l.name}`,
          shortDesc:       `Premium laundry & dry-cleaning for Nigerent Signature members.`,
          description:     `Nigerent Signature members enjoy preferred rates and priority pickup at ${l.name}. ${l.notes}. Address: ${l.address}.`,
          category:        'Wellness & Spa',
          city:            'Lagos',
          area:            l.area,
          tierEligibility: ['Signature', 'Signature Plus', 'Elite'],
          pointsEligible:  false,
          redemptionType:  'SHOW_ON_SCREEN',
          redemptionSteps: ['Show your membership screen when dropping off your items', 'Member rates will be applied automatically'],
          status:          'ACTIVE',
          validFrom:       new Date('2026-01-01'),
        },
      })
    }
    laundryCount++
  }
  console.log(`  ✓ ${laundryCount} laundry partners seeded\n`)

  // ── SUMMARY ─────────────────────────────────────────────────────────────────
  const [totalPartners, totalOffers, totalRestaurants, totalUsers, totalTiers] =
    await Promise.all([
      prisma.partner.count(),
      prisma.offer.count(),
      prisma.restaurant.count(),
      prisma.user.count(),
      prisma.membershipTier.count(),
    ])

  console.log('─────────────────────────────────────────')
  console.log(`✅ Seed complete!`)
  console.log(`   Tiers:        ${totalTiers}`)
  console.log(`   Users:        ${totalUsers}`)
  console.log(`   Restaurants:  ${totalRestaurants}`)
  console.log(`   Partners:     ${totalPartners}`)
  console.log(`   Offers:       ${totalOffers}`)
  console.log('─────────────────────────────────────────')
  console.log('')
  console.log('Test accounts:')
  console.log('  member@nigerent.com    / Member123!')
  console.log('  concierge@nigerent.com / Concierge123!')
  console.log('  admin@nigerent.com     / Admin123!')
  console.log('─────────────────────────────────────────')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
