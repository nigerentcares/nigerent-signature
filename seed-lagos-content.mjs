/**
 * seed-lagos-content.mjs
 * Seeds real Lagos content: restaurants, wellness, experiences,
 * supermarkets, pharmacies, hospitals — as Partner + Offer records.
 *
 * Run with: node seed-lagos-content.mjs
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.xmrxgbhrlxsflauvzjde:I3G5OE4JQKMnvzih@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true',
    },
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function future(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

// ─── 1. RESTAURANTS ───────────────────────────────────────────────────────────

const RESTAURANTS = [
  {
    name:        'Nobu Lagos',
    cuisine:     'Japanese · Pan-Asian',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'The world-renowned Nobu brand brings its signature Japanese-Peruvian fusion to Lagos. Expect black cod miso, rock shrimp tempura, and Wagyu beef alongside an expertly curated sake and cocktail list. One of Lagos\'s most celebrated fine dining destinations.',
    imageUrls:   ['https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800'],
    ambianceTags:['Fine Dining', 'Romantic', 'Celebratory', 'Business'],
    memberBenefit: 'NSL members receive priority seating and complimentary welcome drinks',
    priceLevel:  4,
    openingHours:{ 'mon-fri': '12:00–15:00, 19:00–23:00', 'sat-sun': '12:00–23:00' },
    reservationNotes: 'Advance booking required. Mention NSL membership for priority table.',
    mapLink:     'https://maps.app.goo.gl/nobulagos',
    isActive:    true,
    isFeatured:  true,
    contactInfo: { phone: '+234 908 198 8888', address: 'Landmark Village, Water Corporation Drive, Victoria Island, Lagos' },
  },
  {
    name:        'Nok by Alara',
    cuisine:     'African Contemporary',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'Nok brings a sophisticated take on West African cuisine in a stunning space inside the Alara concept store. The menu reimagines Nigerian classics with fine-dining precision — suya skewers, jollof risotto, egusi velouté. A cultural dining experience unlike any other in Lagos.',
    imageUrls:   ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'],
    ambianceTags:['Contemporary', 'Cultural', 'Design-Forward', 'Brunch'],
    memberBenefit: 'NSL members receive 15% off total bill and access to private dining room',
    priceLevel:  4,
    openingHours:{ 'tue-sat': '12:00–22:00', 'sun': '12:00–18:00', 'mon': 'Closed' },
    reservationNotes: 'Walk-ins welcome. Reservations recommended for dinner.',
    mapLink:     'https://maps.app.goo.gl/nokbyalara',
    isActive:    true,
    isFeatured:  true,
    contactInfo: { phone: '+234 1 342 2002', address: '12/13 Commercial Avenue, Off Ahmadu Bello Way, Victoria Island, Lagos' },
  },
  {
    name:        'Terra Kulture Restaurant',
    cuisine:     'Nigerian · African',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'The beloved cultural hub\'s restaurant serves authentic Nigerian dishes in a warm, art-filled setting. From pounded yam and egusi soup to peppered goat and ofada stew, every plate is a celebration of Nigerian culinary heritage. The perfect spot for business lunches and cultural immersion.',
    imageUrls:   ['https://images.unsplash.com/photo-1567529692333-de9fd6772897?w=800'],
    ambianceTags:['Cultural', 'Traditional', 'Art Gallery', 'Family-Friendly'],
    memberBenefit: 'NSL members receive complimentary appetiser and access to the gallery',
    priceLevel:  2,
    openingHours:{ 'mon-sat': '10:00–22:00', 'sun': '12:00–22:00' },
    reservationNotes: 'Reservations accepted. Large groups require advance booking.',
    mapLink:     'https://maps.app.goo.gl/terrakulture',
    isActive:    true,
    isFeatured:  false,
    contactInfo: { phone: '+234 1 270 0588', address: 'Plot 1376, Tiamiyu Savage Street, Off Ahmadu Bello Way, Victoria Island, Lagos' },
  },
  {
    name:        'Craft by Eros',
    cuisine:     'Modern European · Steakhouse',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'An upscale restaurant and bar offering expertly crafted European dishes with a strong focus on premium cuts of beef, fresh seafood, and handmade pasta. The wine cellar houses over 300 labels. Known for its sophisticated ambiance and impeccable service.',
    imageUrls:   ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'],
    ambianceTags:['Fine Dining', 'Steakhouse', 'Wine Bar', 'Business'],
    memberBenefit: 'NSL members receive sommelier-selected wine pairing on request',
    priceLevel:  4,
    openingHours:{ 'mon-sun': '12:00–23:00' },
    reservationNotes: 'Reservations strongly advised for dinner and weekends.',
    mapLink:     'https://maps.app.goo.gl/craftbyeros',
    isActive:    true,
    isFeatured:  true,
    contactInfo: { phone: '+234 812 340 5677', address: '1072 Bishop Aboyade Cole Street, Victoria Island, Lagos' },
  },
  {
    name:        'The Wheatbaker Restaurant',
    cuisine:     'Continental · Nigerian',
    city:        'Lagos',
    area:        'Ikoyi',
    description: 'Situated within The Wheatbaker hotel, this refined restaurant blends continental classics with Nigerian flavours. A favourite for power breakfasts and business lunches, offering a serene escape from the city\'s energy with impeccable service and a menu that changes seasonally.',
    imageUrls:   ['https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=800'],
    ambianceTags:['Hotel Dining', 'Business', 'Brunch', 'Quiet'],
    memberBenefit: 'NSL members receive complimentary breakfast when staying at The Wheatbaker',
    priceLevel:  3,
    openingHours:{ 'mon-sun': '06:30–22:30' },
    reservationNotes: 'Hotel guests given priority. Walk-ins welcome.',
    mapLink:     'https://maps.app.goo.gl/wheatbaker',
    isActive:    true,
    isFeatured:  false,
    contactInfo: { phone: '+234 1 277 3560', address: '4 Onitolo (Lawrence Road), Ikoyi, Lagos' },
  },
  {
    name:        '788 on the Sea',
    cuisine:     'Seafood · International',
    city:        'Lagos',
    area:        'Lekki',
    description: 'Perched on the second floor of the Twin Towers with sweeping Atlantic Ocean views, 788 on the Sea serves premium seafood and international cuisine. Signature dishes include sole meunière, grilled whole snapper, and lobster bisque. The perfect sunset dining destination.',
    imageUrls:   ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800'],
    ambianceTags:['Ocean View', 'Seafood', 'Sunset', 'Romantic'],
    memberBenefit: 'NSL members receive complimentary champagne on arrival',
    priceLevel:  4,
    openingHours:{ 'mon-sun': '12:00–23:00' },
    reservationNotes: 'Window tables available on request — mention NSL membership.',
    mapLink:     'https://maps.app.goo.gl/788onthesea',
    isActive:    true,
    isFeatured:  true,
    contactInfo: { phone: '+234 803 788 0000', address: 'Twin Towers, Block 79A, Lekki Phase 1, Lagos' },
  },
  {
    name:        'Shiro Restaurant',
    cuisine:     'Pan-Asian · Sushi',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'Shiro is Lagos\'s premier Pan-Asian dining destination, offering an exquisite blend of Japanese, Chinese, and Thai cuisine. The omakase menu is a highlight, alongside the extensive sushi bar, dim sum, and signature cocktails in a sleek, dramatic setting.',
    imageUrls:   ['https://images.unsplash.com/photo-1553621042-f6e147245754?w=800'],
    ambianceTags:['Pan-Asian', 'Sushi Bar', 'Cocktails', 'Stylish'],
    memberBenefit: 'NSL members receive complimentary miso soup and priority chef\'s table reservation',
    priceLevel:  4,
    openingHours:{ 'mon-sun': '12:00–23:00' },
    reservationNotes: 'Chef\'s table and omakase require 48-hour advance booking.',
    mapLink:     'https://maps.app.goo.gl/shirolagos',
    isActive:    true,
    isFeatured:  true,
    contactInfo: { phone: '+234 812 000 3000', address: 'Block XVI, Plot 3 & 4, Oniru Estate, Victoria Island, Lagos' },
  },
  {
    name:        'La Veranda',
    cuisine:     'Italian · Mediterranean',
    city:        'Lagos',
    area:        'Ikoyi',
    description: 'A romantic waterfront restaurant in the heart of Ikoyi, La Veranda serves handmade pasta, wood-fired pizzas, and fresh seafood with Italian Mediterranean flair. The terrace overlooking the lagoon is one of Lagos\'s most picturesque dining settings.',
    imageUrls:   ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'],
    ambianceTags:['Italian', 'Waterfront', 'Romantic', 'Terrace'],
    memberBenefit: 'NSL members receive complimentary bruschetta and a reserved terrace table',
    priceLevel:  3,
    openingHours:{ 'mon-sun': '12:00–22:30' },
    reservationNotes: 'Terrace seating limited — book in advance for weekend evenings.',
    mapLink:     'https://maps.app.goo.gl/laveranda',
    isActive:    true,
    isFeatured:  false,
    contactInfo: { phone: '+234 803 000 1234', address: '24 Glover Road, Ikoyi, Lagos' },
  },
  {
    name:        'Ìtàn Test Kitchen',
    cuisine:     'Modern Nigerian · Fine Dining',
    city:        'Lagos',
    area:        'Ikoyi',
    description: 'Lagos\'s most exciting culinary project — a fine dining experience built entirely around modern Nigerian gastronomy. Chef\'s tasting menus explore the full depth of Nigerian ingredients: fermented locust beans, smoked fish, African truffles, and heirloom grains. Featured in multiple international food publications.',
    imageUrls:   ['https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800'],
    ambianceTags:['Fine Dining', 'Tasting Menu', 'Modern Nigerian', 'Intimate'],
    memberBenefit: 'NSL members receive priority access to chef\'s table and wine pairing inclusion',
    priceLevel:  4,
    openingHours:{ 'wed-sat': '19:00–22:30', 'sun': '13:00–17:00', 'mon-tue': 'Closed' },
    reservationNotes: 'Reservation only — minimum 72-hour advance booking required.',
    mapLink:     'https://maps.app.goo.gl/itan',
    isActive:    true,
    isFeatured:  true,
    contactInfo: { phone: '+234 816 000 4567', address: 'Moor Road, Ikoyi, Lagos' },
  },
  {
    name:        'R.S.V.P. Restaurant & Bar',
    cuisine:     'New American · Cocktail Bar',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'Inspired by Manhattan\'s prohibition-era venues, R.S.V.P. delivers industrial luxury dining in Lagos. The menu spans premium burgers, charcuterie boards, and hearty mains alongside an award-winning cocktail programme. Known for its weekend brunches and live music nights.',
    imageUrls:   ['https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800'],
    ambianceTags:['Cocktail Bar', 'Live Music', 'Brunch', 'Industrial Chic'],
    memberBenefit: 'NSL members receive complimentary signature cocktail and priority brunch seating',
    priceLevel:  3,
    openingHours:{ 'mon-fri': '12:00–02:00', 'sat-sun': '11:00–02:00' },
    reservationNotes: 'Brunch reservations open Friday. Walk-ins welcome on weekdays.',
    mapLink:     'https://maps.app.goo.gl/rsvplagos',
    isActive:    true,
    isFeatured:  false,
    contactInfo: { phone: '+234 1 630 2890', address: '9 Eletu Ogabi Street, Victoria Island, Lagos' },
  },
]

// ─── 2. WELLNESS & SPA ────────────────────────────────────────────────────────

const WELLNESS = [
  {
    name:        'ORÍKÌ Spa – Victoria Island',
    category:    'Wellness & Spa',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'Nigeria\'s first and only all-natural farm-to-skin luxury spa brand. ORÍKÌ combines authentic African botanicals with world-class techniques to deliver exceptional results. Services include deep tissue massage, hot stone therapy, body scrubs, facials, and holistic wellness rituals. Multiple Lagos locations.',
    contactInfo: {
      phone:   '+234 807 771 9360',
      address: '3 Udi Street, Off Adeola Odeku, Victoria Island, Lagos',
      website: 'orikigroup.com',
      rating:  4.7,
      hours:   { 'mon-sat': '09:00–20:00', 'sun': '10:00–18:00' },
    },
    memberBenefit: 'NSL members receive 20% off all treatments and a complimentary scalp massage',
    offerTitle:    '20% Off All Spa Treatments',
    offerDesc:     'Present your NSL membership card for 20% off any treatment. Includes massages, facials, body wraps, and manicure/pedicure services.',
  },
  {
    name:        'Tirta Ayu Spa',
    category:    'Wellness & Spa',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'A slice of Bali in the heart of Victoria Island. Tirta Ayu brings Indonesia\'s legendary spa traditions to Lagos with Balinese massages, volcanic stone treatments, flower baths, and traditional Javanese rituals. The tranquil garden setting transports you far from the city\'s energy.',
    contactInfo: {
      phone:   '+234 815 834 4444',
      address: '8 Olabode George Street, Victoria Island, Lagos',
      website: 'tirtaayuspa.com.ng',
      rating:  4.6,
      hours:   { 'mon-sun': '10:00–21:00' },
    },
    memberBenefit: 'NSL members receive complimentary flower bath with any massage booking',
    offerTitle:    'Complimentary Flower Bath with Any Massage',
    offerDesc:     'Book any 60-minute or longer massage and receive a traditional Balinese flower bath at no charge. Valid for all NSL members.',
  },
  {
    name:        'Clear Essence Spa',
    category:    'Wellness & Spa',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'A comprehensive luxury destination blending relaxation with advanced skincare science. Clear Essence offers full-day spa packages, couple\'s retreats, and a curated menu of body treatments, facials, and holistic therapies. The tranquil rooftop pool makes it Lagos\'s most complete wellness retreat.',
    contactInfo: {
      phone:   '+234 1 461 7210',
      address: '10 Balarabe Musa Crescent, Off Samuel Manuwa Street, Victoria Island, Lagos',
      website: 'clearessencespa.com',
      rating:  4.5,
      hours:   { 'mon-sat': '09:00–21:00', 'sun': '10:00–19:00' },
    },
    memberBenefit: 'NSL members receive complimentary full-day access to thermal pool facilities',
    offerTitle:    'Full-Day Spa Access for Members',
    offerDesc:     'Enjoy complimentary access to the thermal pool, steam room, and relaxation lounge with any treatment booking over ₦50,000.',
  },
  {
    name:        'Dermaspace Wellness Centre',
    category:    'Wellness & Spa',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'A premium esthetic and wellness centre combining clinical skin science with indulgent spa experiences. Specialties include advanced facials, chemical peels, laser treatments, body contouring, and luxury nail care. Staffed by certified estheticians and dermatology-trained therapists.',
    contactInfo: {
      phone:   '+234 906 183 6625',
      address: '237B Muri Okunola Street, Victoria Island, Lagos',
      website: 'dermaspacelagos.com',
      rating:  4.4,
      hours:   { 'mon-sat': '09:00–19:00', 'sun': '11:00–17:00' },
    },
    memberBenefit: 'NSL members receive a complimentary skin analysis and 15% off first treatment',
    offerTitle:    'Complimentary Skin Analysis for New Members',
    offerDesc:     'Receive a comprehensive skin health assessment and personalised treatment plan. First treatment booked on the same day receives 15% off.',
  },
  {
    name:        'Body Temple Spa',
    category:    'Wellness & Spa',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'A serene urban escape offering traditional massage therapy, aromatherapy body treatments, and a carefully considered menu of holistic wellness rituals. Organic herbal teas and homemade cakes are served in the relaxation lounge post-treatment.',
    contactInfo: {
      phone:   '+234 806 000 7788',
      address: '82 Younis Bashorun Street, Victoria Island, Lagos',
      website: 'bodytemplespa.ng',
      rating:  4.3,
      hours:   { 'mon-sun': '10:00–20:00' },
    },
    memberBenefit: 'NSL members receive complimentary herbal tea ceremony and 10% off all treatments',
    offerTitle:    '10% Off + Complimentary Herbal Tea Ceremony',
    offerDesc:     'All NSL members receive 10% off every visit and a complimentary post-treatment organic herbal tea ceremony.',
  },
  {
    name:        'Urban Wellness Gym & Spa',
    category:    'Wellness & Spa',
    city:        'Lagos',
    area:        'Lekki Phase 1',
    description: 'Lekki\'s most sought-after integrated wellness facility. A world-class gym with Peloton bikes, a 25-metre pool, sauna, steam room, and a full-service spa. Personal training, yoga, Pilates, and nutrition coaching are offered by internationally certified instructors.',
    contactInfo: {
      phone:   '+234 818 000 9900',
      address: '5 Idowu Abiodun Street, Lekki Phase 1, Lagos',
      website: 'urbanwellnesslagos.com',
      rating:  4.6,
      hours:   { 'mon-fri': '05:30–22:00', 'sat-sun': '07:00–20:00' },
    },
    memberBenefit: 'NSL members receive a complimentary 1-week gym pass and spa day',
    offerTitle:    'Complimentary 1-Week Full Access Pass',
    offerDesc:     'New NSL members receive a complimentary 7-day full access pass including gym, pool, spa, and one personal training session.',
  },
]

// ─── 3. EXPERIENCES & ENTERTAINMENT ──────────────────────────────────────────

const EXPERIENCES = [
  {
    name:        'Nike Art Gallery',
    category:    'Arts & Culture',
    city:        'Lagos',
    area:        'Lekki',
    description: 'The largest private art gallery in West Africa, housing over 8,000 works of Nigerian and African art across five floors. Founded by Nike Davies-Okundaye, the gallery showcases oil paintings, sculptures, batik, weaving, and beadwork. A must-visit for art lovers and cultural explorers.',
    contactInfo: {
      phone:   '+234 803 409 6656',
      address: 'Elegushi Road, 3rd Roundabout, Lekki Phase 1, Lagos',
      website: 'nikeartfoundation.com',
      rating:  4.6,
      hours:   { 'mon-sat': '10:00–18:00', 'sun': '13:00–18:00' },
      admission: 'Free (donations welcome)',
    },
    memberBenefit: 'NSL members receive a private guided tour with the curator',
    offerTitle:    'Private Curator-Led Gallery Tour',
    offerDesc:     'NSL members receive an exclusive 45-minute private guided tour led by a senior curator, with access to the private collection on the upper floors.',
  },
  {
    name:        'Terra Kulture Arts Centre',
    category:    'Arts & Culture',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'Lagos\'s premier destination for Nigerian arts, culture, and performance. Beyond its acclaimed restaurant, Terra Kulture hosts theatre productions, art exhibitions, photography shows, and cultural events year-round. The bookshop carries the finest collection of African literature in the city.',
    contactInfo: {
      phone:   '+234 1 270 0588',
      address: 'Plot 1376, Tiamiyu Savage Street, Victoria Island, Lagos',
      website: 'terrakulture.com',
      rating:  4.5,
      hours:   { 'mon-sat': '10:00–22:00', 'sun': '12:00–22:00' },
    },
    memberBenefit: 'NSL members receive priority access to theatre productions and exhibition openings',
    offerTitle:    'Priority Access to All Cultural Events',
    offerDesc:     'NSL members receive first access to all Terra Kulture theatre productions, art exhibitions, and cultural events. Two complimentary tickets per month included.',
  },
  {
    name:        'Lekki Conservation Centre',
    category:    'Nature & Adventure',
    city:        'Lagos',
    area:        'Lekki',
    description: 'A vast nature reserve managed by the Nigerian Conservation Foundation, home to Lagos\'s famous canopy walkway — one of the longest in Africa at 401 metres. The wetlands harbour monkeys, crocodiles, mongoose, and hundreds of bird species. A remarkable natural escape within the city.',
    contactInfo: {
      phone:   '+234 1 264 2498',
      address: 'Lekki-Epe Expressway, Lekki, Lagos',
      website: 'ncfnigeria.org',
      rating:  4.4,
      hours:   { 'mon-sun': '08:30–16:30' },
      admission: '₦2,000 adult / ₦1,000 children',
    },
    memberBenefit: 'NSL members receive free entry and a private nature guide',
    offerTitle:    'Free Entry + Private Nature Guide',
    offerDesc:     'NSL members enjoy complimentary entry (saving ₦2,000 per person) and the option to book a private nature guide for an enhanced canopy walkway experience.',
  },
  {
    name:        'Freedom Park Lagos',
    category:    'Arts & Culture',
    city:        'Lagos',
    area:        'Lagos Island',
    description: 'Built on the site of a colonial prison, Freedom Park is Lagos\'s most iconic cultural and entertainment venue. Regular live concerts, jazz evenings, art fairs, and open-air cinema screenings fill the atmospheric open spaces. A symbol of Lagos\'s creative renaissance.',
    contactInfo: {
      phone:   '+234 818 000 5500',
      address: 'Old Prison Grounds, Broad Street, Lagos Island, Lagos',
      website: 'freedompark.com.ng',
      rating:  4.3,
      hours:   { 'mon-sun': '10:00–22:00' },
    },
    memberBenefit: 'NSL members receive priority access to premium shows and events',
    offerTitle:    'Premium Event Access for NSL Members',
    offerDesc:     'NSL members are added to the priority guest list for all premium shows, concerts, and art events at Freedom Park.',
  },
  {
    name:        'Filmhouse IMAX Lekki',
    category:    'Entertainment',
    city:        'Lagos',
    area:        'Lekki',
    description: 'Nigeria\'s flagship IMAX cinema experience, located in The Circle Mall on Lekki-Epe Expressway. Features a laser-projection IMAX screen, Dolby Atmos sound, premium VIP recliners, and a dedicated food and cocktail lounge. The destination for blockbuster premieres in Lagos.',
    contactInfo: {
      phone:   '+234 700 346 4687',
      address: 'Circle Mall, Jakande Bus Stop, Lekki-Epe Expressway, Lagos',
      website: 'filmhousecinemas.com',
      rating:  4.5,
      hours:   { 'mon-sun': '10:00–23:00' },
    },
    memberBenefit: 'NSL members receive 2 complimentary IMAX tickets per month',
    offerTitle:    '2 Complimentary IMAX Tickets Monthly',
    offerDesc:     'All active NSL members receive two complimentary standard IMAX tickets per calendar month. VIP recliner upgrades available at a discounted rate.',
  },
  {
    name:        'Quilox Club',
    category:    'Nightlife',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'Lagos\'s most famous nightclub and entertainment venue, attracting A-list celebrities, international DJs, and the city\'s most fashionable crowd. Multiple floors of music, a rooftop lounge, and legendary bottle service. The epicentre of Lagos nightlife since 2012.',
    contactInfo: {
      phone:   '+234 814 444 0000',
      address: 'Adeola Odeku Street, Victoria Island, Lagos',
      website: 'quiloxclub.com',
      rating:  4.2,
      hours:   { 'thu-sun': '22:00–05:00' },
    },
    memberBenefit: 'NSL members receive complimentary VIP table access and skip the queue',
    offerTitle:    'VIP Table Access & Queue Priority',
    offerDesc:     'NSL members receive a dedicated VIP table (subject to availability) with complimentary entry. No queue. Contact your concierge to reserve.',
  },
  {
    name:        'Hard Rock Café Lagos',
    category:    'Entertainment',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'The iconic global brand on the shores of Victoria Island, serving American classics in an electric atmosphere filled with rock music memorabilia. Live music several nights a week, themed events, and the famous Hard Rock merchandise make this a landmark Lagos experience.',
    contactInfo: {
      phone:   '+234 908 198 8888',
      address: 'Landmark Village, Water Corporation Road, Oniru, Victoria Island, Lagos',
      website: 'hardrock.com/lagos',
      rating:  4.1,
      hours:   { 'mon-sun': '12:00–01:00' },
    },
    memberBenefit: 'NSL members receive 15% off food and beverages and skip-the-queue access',
    offerTitle:    '15% Off Food & Beverage',
    offerDesc:     'NSL members enjoy 15% off the entire menu on every visit. Show your membership card at the door for priority seating.',
  },
  {
    name:        'The MUSON Centre',
    category:    'Arts & Culture',
    city:        'Lagos',
    area:        'Onikan, Lagos Island',
    description: 'The Musical Society of Nigeria\'s iconic performance centre, the cultural soul of Lagos. Hosts world-class orchestra performances, jazz concerts, theatrical productions, and the annual MUSON Festival. The main auditorium seats 1,000 guests in an elegant concert hall setting.',
    contactInfo: {
      phone:   '+234 1 264 0060',
      address: '8/9 Marina, Onikan, Lagos Island, Lagos',
      website: 'musonfestival.com',
      rating:  4.5,
      hours:   { 'mon-sat': '09:00–20:00', 'performance-nights': 'Until 22:00' },
    },
    memberBenefit: 'NSL members receive priority seating for all MUSON performances',
    offerTitle:    'Priority Seating at MUSON Performances',
    offerDesc:     'NSL members receive exclusive first-access ticket allocation for all MUSON events, with priority seating in the first 10 rows.',
  },
]

// ─── 4. SUPERMARKETS ─────────────────────────────────────────────────────────

const SUPERMARKETS = [
  {
    name:        'Shoprite – Victoria Island',
    category:    'Supermarket',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'Nigeria\'s largest retail chain brings its flagship Victoria Island store to the heart of Lagos\'s business district. Full-service grocery, fresh produce, butchery, bakery, electronics, and household essentials under one roof. The on-site food court is a popular lunch destination.',
    contactInfo: {
      phone:   '+234 1 271 4484',
      address: 'The Palms Shopping Mall, Off Lekki Expressway, Victoria Island, Lagos',
      rating:  4.0,
      hours:   { 'mon-sat': '09:00–21:00', 'sun': '10:00–20:00' },
    },
    memberBenefit: 'NSL members receive 5% cashback on all Shoprite purchases loaded to NSL wallet',
    offerTitle:    '5% Cashback on All Purchases',
    offerDesc:     'Link your NSL membership to your Shoprite account and receive 5% cashback on all purchases, credited directly to your NSL wallet within 48 hours.',
  },
  {
    name:        'Shoprite – Ikeja City Mall',
    category:    'Supermarket',
    city:        'Lagos',
    area:        'Ikeja',
    description: 'Shoprite\'s Ikeja flagship, one of the busiest retail locations in mainland Lagos. Complete grocery selection, household goods, fresh deli, and a substantial electronics section. Ample parking in the Ikeja City Mall complex.',
    contactInfo: {
      phone:   '+234 1 899 9128',
      address: 'Ikeja City Mall, Obafemi Awolowo Way, Alausa, Ikeja, Lagos',
      rating:  3.9,
      hours:   { 'mon-sat': '09:00–21:00', 'sun': '10:00–20:00' },
    },
    memberBenefit: 'NSL members receive 5% cashback on all Shoprite purchases',
    offerTitle:    '5% Cashback on All Purchases',
    offerDesc:     'Link your NSL membership for 5% cashback on all purchases, credited to your NSL wallet.',
  },
  {
    name:        'SPAR – Victoria Island',
    category:    'Supermarket',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'The premium European grocery chain with a strong focus on quality, fresh produce, imported goods, and international food brands. The Victoria Island SPAR is a favourite with expats and discerning Lagos shoppers seeking hard-to-find international products alongside quality local produce.',
    contactInfo: {
      phone:   '+234 800 000 7727',
      address: '1 Adeola Odeku Street, Victoria Island, Lagos',
      website: 'sparnigeria.com',
      rating:  4.2,
      hours:   { 'mon-sat': '08:00–21:00', 'sun': '09:00–19:00' },
    },
    memberBenefit: 'NSL members receive 10% off imported and premium goods',
    offerTitle:    '10% Off Premium & Imported Goods',
    offerDesc:     'NSL members enjoy 10% off all imported brands, premium labels, and SPAR Own Brand products. Show membership card at checkout.',
  },
  {
    name:        'Ebeano Supermarket – Lekki',
    category:    'Supermarket',
    city:        'Lagos',
    area:        'Lekki Phase 1',
    description: 'A beloved Lagos supermarket institution known for its extensive fresh produce section, quality butchery, and excellent selection of Nigerian and West African food products. The Lekki branch is a go-to for discerning home cooks and is famous for its range of fresh fish and seafood.',
    contactInfo: {
      phone:   '+234 805 200 0000',
      address: '45 Admiralty Way, Lekki Phase 1, Lagos',
      rating:  4.1,
      hours:   { 'mon-sat': '08:00–21:00', 'sun': '09:00–19:00' },
    },
    memberBenefit: 'NSL members receive priority service at the butchery and deli counter',
    offerTitle:    'Priority Butchery & Deli Service',
    offerDesc:     'Skip the queue at the butchery and deli counter. NSL members also receive a 5% discount on all fresh meat and seafood.',
  },
  {
    name:        'Hubmart – Lekki',
    category:    'Supermarket',
    city:        'Lagos',
    area:        'Lekki',
    description: 'A modern premium supermarket serving the upscale Lekki corridor, Hubmart is known for its wide selection of organic, health, and specialty foods alongside excellent imported wines and spirits. The clean, well-organised store is a favourite with Lagos\'s health-conscious community.',
    contactInfo: {
      phone:   '+234 909 099 4000',
      address: 'Ikate-Elegushi, Between 4th & 5th Roundabout, Lekki Expressway, Lagos',
      website: 'hubmartsupermarket.com',
      rating:  4.2,
      hours:   { 'mon-sun': '08:00–22:00' },
    },
    memberBenefit: 'NSL members receive complimentary home delivery within Lekki and VI',
    offerTitle:    'Free Home Delivery for NSL Members',
    offerDesc:     'NSL members enjoy complimentary same-day delivery to Lekki Phase 1, Phase 2, and Victoria Island on orders over ₦20,000.',
  },
]

// ─── 5. PHARMACIES ────────────────────────────────────────────────────────────

const PHARMACIES = [
  {
    name:        'MedPlus Pharmacy – Victoria Island',
    category:    'Pharmacy',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'Nigeria\'s leading retail pharmacy chain with over 100 locations nationwide. The Victoria Island branch stocks a comprehensive range of prescription and OTC medicines, health supplements, skincare, and diagnostic test kits. On-site pharmacists available for consultation.',
    contactInfo: {
      phone:   '+234 1 280 7777',
      address: '2 Adeola Odeku Street, Opposite Union Bank, Victoria Island, Lagos',
      website: 'medplusnig.com',
      rating:  4.2,
      hours:   { 'mon-sat': '08:00–21:00', 'sun': '09:00–18:00' },
      emergency: '24-hour emergency line available',
    },
    memberBenefit: 'NSL members receive 10% off all non-prescription purchases and free delivery',
    offerTitle:    '10% Off OTC Medicines & Free Delivery',
    offerDesc:     'NSL members receive 10% off all over-the-counter medicines, health supplements, and wellness products. Free same-day delivery within Victoria Island and Lekki.',
  },
  {
    name:        'MedPlus Pharmacy – Lekki Phase 1',
    category:    'Pharmacy',
    city:        'Lagos',
    area:        'Lekki Phase 1',
    description: 'Full-service MedPlus branch serving the Lekki Phase 1 community. Comprehensive medicine dispensing, vaccination services, blood pressure and glucose monitoring, and a dedicated skincare section.',
    contactInfo: {
      phone:   '+234 1 280 7778',
      address: 'Block 10A, Admiralty Way, Opposite Evercare Hospital, Lekki Phase 1, Lagos',
      website: 'medplusnig.com',
      rating:  4.1,
      hours:   { 'mon-sat': '08:00–21:00', 'sun': '09:00–18:00' },
    },
    memberBenefit: 'NSL members receive 10% off all non-prescription purchases',
    offerTitle:    '10% Off All OTC Purchases',
    offerDesc:     'Show your NSL membership card at checkout for 10% off all over-the-counter items.',
  },
  {
    name:        'HealthPlus Pharmacy – Victoria Island',
    category:    'Pharmacy',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'Nigeria\'s first integrative pharmacy and healthcare provider, HealthPlus combines a full-service pharmacy with wellness consultation, nutrition advisory, and a wide health and beauty retail section. The onsite nutritionist and health screener set it apart from conventional pharmacies.',
    contactInfo: {
      phone:   '+234 809 589 8328',
      address: 'Plot 121, T. F. Kuboye Road, Victoria Island, Lagos',
      website: 'healthplusnigeria.com',
      rating:  4.3,
      hours:   { 'mon-sat': '08:00–21:00', 'sun': '10:00–18:00' },
    },
    memberBenefit: 'NSL members receive a free health screening and 10% off all pharmacy items',
    offerTitle:    'Free Health Screening + 10% Pharmacy Discount',
    offerDesc:     'NSL members receive a complimentary annual health screening (BP, glucose, BMI, vision) and 10% off all pharmacy purchases year-round.',
  },
  {
    name:        'HealthPlus Pharmacy – Ikeja',
    category:    'Pharmacy',
    city:        'Lagos',
    area:        'Ikeja',
    description: 'The Ikeja branch of Nigeria\'s leading integrative pharmacy, located on Allen Avenue. Comprehensive dispensing, vaccination services, and a curated wellness retail section. Walk-in consultation available daily.',
    contactInfo: {
      phone:   '+234 817 200 5332',
      address: '11A Allen Avenue, Beside Mama Cass, Ikeja, Lagos',
      website: 'healthplusnigeria.com',
      rating:  4.1,
      hours:   { 'mon-sat': '08:00–21:00', 'sun': '10:00–18:00' },
    },
    memberBenefit: 'NSL members receive 10% off all pharmacy items',
    offerTitle:    '10% Off All Pharmacy Purchases',
    offerDesc:     'Show your NSL membership card for 10% off all purchases at any HealthPlus location.',
  },
  {
    name:        'Alpha Pharmacy & Stores',
    category:    'Pharmacy',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'One of Lagos\'s most trusted independent pharmacy groups, Alpha Pharmacy has served the Victoria Island community for over 30 years. Known for reliable stock of hard-to-find prescription medicines, specialist supplements, and genuine branded pharmaceutical products.',
    contactInfo: {
      phone:   '+234 1 261 3890',
      address: '2 Keffi Street, Off Awolowo Road, South West, Ikoyi, Lagos',
      rating:  4.3,
      hours:   { 'mon-sat': '08:00–20:00', 'sun': '10:00–17:00' },
    },
    memberBenefit: 'NSL members receive priority consultation and 8% off all purchases',
    offerTitle:    '8% Discount + Priority Consultation',
    offerDesc:     'NSL members receive 8% off all purchases and are given priority pharmacist consultation slots, skipping the standard queue.',
  },
]

// ─── 6. HOSPITALS & CLINICS ───────────────────────────────────────────────────

const HOSPITALS = [
  {
    name:        'Reddington Multi-Specialist Hospital – Victoria Island',
    category:    'Hospital & Medical',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'One of Nigeria\'s premier private multi-specialist hospitals, offering world-class medical care across 30+ specialties. Fully equipped with advanced diagnostic imaging, an ICU, and a 24-hour emergency department. International medical standards with Abuja and Lekki branches.',
    contactInfo: {
      phone:   '+234 916 535 9769',
      address: '12 Idowu Martins Street, Victoria Island, Lagos',
      website: 'reddingtonhospital.com',
      email:   'info@reddingtonhospital.com',
      rating:  4.5,
      hours:   { 'emergency': '24/7', 'outpatient': 'Mon–Fri 08:00–18:00, Sat 09:00–14:00' },
      specialties: ['Cardiology', 'Oncology', 'Neurology', 'Orthopaedics', 'Obstetrics & Gynaecology'],
    },
    memberBenefit: 'NSL members receive priority outpatient booking and 15% off consultations',
    offerTitle:    'Priority Booking + 15% Off Consultations',
    offerDesc:     'NSL members are given same-day or next-day appointment slots. 15% discount on all specialist consultations. Dedicated care coordinator assigned to each member.',
  },
  {
    name:        'Evercare Hospital Lekki',
    category:    'Hospital & Medical',
    city:        'Lagos',
    area:        'Lekki Phase 1',
    description: 'Part of the global Evercare Group, this state-of-the-art hospital delivers international standard healthcare to Lagos. Award-winning facilities include a cardiac centre, cancer institute, Level 3 NICU, 24-hour emergency, and telemedicine services. One of Africa\'s most advanced hospitals.',
    contactInfo: {
      phone:   '+234 813 985 0710',
      address: '1 Bisola Durosinmi-Etti Street, Admiralty Way, Lekki Phase 1, Lagos',
      website: 'evercare.ng',
      email:   'info@evercare.ng',
      rating:  4.6,
      hours:   { 'emergency': '24/7', 'outpatient': 'Mon–Sat 08:00–18:00' },
      specialties: ['Cardiology', 'Oncology', 'Paediatrics', 'Orthopaedics', 'Fertility'],
    },
    memberBenefit: 'NSL members receive a complimentary executive health check-up annually',
    offerTitle:    'Annual Executive Health Check-Up',
    offerDesc:     'One complimentary full executive health screening per year (ECG, full blood panel, chest X-ray, vision & dental check) for all NSL members. Valued at ₦120,000.',
  },
  {
    name:        'Lagoon Hospital – Victoria Island',
    category:    'Hospital & Medical',
    city:        'Lagos',
    area:        'Victoria Island',
    description: 'One of Nigeria\'s longest-standing private hospital chains, Lagoon Hospitals delivers trusted multi-specialist care across Victoria Island, Ikoyi, Ikeja, and Apapa. Known for its maternity services, diagnostic centre, and highly regarded general medicine department.',
    contactInfo: {
      phone:   '+234 913 938 3461',
      address: '1 Layi Yusuf Crescent, Off Ahmadu Bello Way, Victoria Island, Lagos',
      website: 'lagoonhospitals.com',
      email:   'appointments@lagoonhospitals.com',
      rating:  4.3,
      hours:   { 'emergency': '24/7', 'outpatient': 'Mon–Fri 08:00–17:00' },
      specialties: ['General Medicine', 'Obstetrics', 'Paediatrics', 'Surgery', 'Diagnostic Imaging'],
    },
    memberBenefit: 'NSL members receive 10% off consultations and priority appointment slots',
    offerTitle:    '10% Off All Consultations + Priority Slots',
    offerDesc:     'NSL members receive a 10% discount on all specialist consultations and are guaranteed appointment slots within 24 hours of booking.',
  },
  {
    name:        'St. Nicholas Hospital',
    category:    'Hospital & Medical',
    city:        'Lagos',
    area:        'Lagos Island',
    description: 'Established in 1969, St. Nicholas is one of Nigeria\'s most storied private hospitals. Generations of Lagos families have trusted its consistent standards of care. Specialties include cardiology, general surgery, and a renowned obstetrics department. The hospital also trains many of Nigeria\'s leading physicians.',
    contactInfo: {
      phone:   '+234 1 263 8152',
      address: '57 Campbell Street, Lagos Island, Lagos',
      website: 'stnicholasnigeria.com',
      rating:  4.2,
      hours:   { 'emergency': '24/7', 'outpatient': 'Mon–Fri 08:00–17:00, Sat 08:00–13:00' },
      specialties: ['Cardiology', 'General Surgery', 'Obstetrics', 'Paediatrics'],
    },
    memberBenefit: 'NSL members receive priority booking and 10% off all services',
    offerTitle:    'Priority Booking + 10% Discount',
    offerDesc:     'NSL members receive 10% off all consultations and procedures, with guaranteed same-week appointments for all departments.',
  },
  {
    name:        'Reddington Hospital – Lekki',
    category:    'Hospital & Medical',
    city:        'Lagos',
    area:        'Lekki Phase 1',
    description: 'The Lekki branch of Nigeria\'s premier specialist hospital, strategically located to serve the rapidly growing Lekki-Ajah corridor. Full outpatient clinic, diagnostic imaging, pharmacy, and emergency care. Same international standards as the Victoria Island flagship.',
    contactInfo: {
      phone:   '+234 1 271 5340',
      address: '15C Admiralty Way, Lekki Phase 1, Lagos',
      website: 'reddingtonhospital.com',
      rating:  4.4,
      hours:   { 'emergency': '24/7', 'outpatient': 'Mon–Fri 08:00–18:00, Sat 09:00–14:00' },
      specialties: ['Cardiology', 'Orthopaedics', 'Obstetrics & Gynaecology', 'Paediatrics'],
    },
    memberBenefit: 'NSL members receive priority outpatient booking and 15% off consultations',
    offerTitle:    'Priority Booking + 15% Off Consultations',
    offerDesc:     'NSL members are given same-day or next-day slots. 15% discount on all specialist consultations.',
  },
]

// ─── Main seeder ──────────────────────────────────────────────────────────────

async function run() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  Nigerent Signature — Lagos Content Seed')
  console.log('══════════════════════════════════════════════\n')

  const today = new Date()

  // ── Ensure tiers exist ──
  let signatureTier = await prisma.membershipTier.findFirst({ where: { slug: 'signature' } })
  if (!signatureTier) {
    signatureTier = await prisma.membershipTier.create({
      data: { name: 'Signature', slug: 'signature', pointsThreshold: 0, earnMultiplier: 1, displayOrder: 1, benefits: {} },
    })
  }

  // ── 1. Seed Restaurants ──
  console.log('── 1. Seeding Restaurants ──')
  let restCount = 0
  for (const r of RESTAURANTS) {
    const existing = await prisma.restaurant.findFirst({ where: { name: r.name } })
    if (existing) { console.log(`  ℹ Exists: ${r.name}`); continue }

    await prisma.restaurant.create({
      data: {
        name:             r.name,
        cuisine:          r.cuisine,
        city:             r.city,
        area:             r.area,
        description:      r.description,
        imageUrls:        r.imageUrls,
        ambianceTags:     r.ambianceTags,
        memberBenefit:    r.memberBenefit,
        priceLevel:       r.priceLevel,
        openingHours:     r.openingHours,
        reservationNotes: r.reservationNotes,
        mapLink:          r.mapLink ?? null,
        isActive:         r.isActive,
        isFeatured:       r.isFeatured,
      },
    })
    console.log(`  ✓ Restaurant: ${r.name} (${r.area})`)
    restCount++
  }

  // ── 2. Seed Partners + Offers ──
  console.log(`\n── 2. Seeding Partners & Offers ──`)
  const allPartners = [
    ...WELLNESS.map(p => ({ ...p, isFeatured: false })),
    ...EXPERIENCES.map(p => ({ ...p, isFeatured: true })),
    ...SUPERMARKETS.map(p => ({ ...p, isFeatured: false })),
    ...PHARMACIES.map(p => ({ ...p, isFeatured: false })),
    ...HOSPITALS.map(p => ({ ...p, isFeatured: false })),
  ]

  let partnerCount = 0, offerCount = 0
  for (const p of allPartners) {
    let partner = await prisma.partner.findFirst({ where: { name: p.name } })
    if (!partner) {
      partner = await prisma.partner.create({
        data: {
          name:        p.name,
          category:    p.category,
          city:        p.city,
          area:        p.area,
          description: p.description,
          contactInfo: p.contactInfo,
          isActive:    true,
        },
      })
      console.log(`  ✓ Partner: ${p.name} (${p.category})`)
      partnerCount++
    } else {
      console.log(`  ℹ Exists: ${p.name}`)
    }

    // Create offer for this partner
    const existOffer = await prisma.offer.findFirst({ where: { partnerId: partner.id } })
    if (!existOffer) {
      await prisma.offer.create({
        data: {
          partnerId:       partner.id,
          title:           p.offerTitle,
          description:     p.offerDesc,
          shortDesc:       p.offerDesc.slice(0, 118) + '…',
          category:        p.category,
          city:            p.city,
          area:            p.area,
          tierEligibility: ['signature', 'signature-plus', 'signature-elite'],
          pointsEligible:  false,
          redemptionType:  'SHOW_ON_SCREEN',
          redemptionSteps: [
            { step: 1, text: 'Open your NSL membership card in the app' },
            { step: 2, text: `Show it to staff at ${p.name}` },
            { step: 3, text: 'Enjoy your member benefit' },
          ],
          validFrom:       today,
          validTo:         future(365),
          status:          'ACTIVE',
          isFeatured:      p.isFeatured,
          displayOrder:    offerCount + 1,
        },
      })
      offerCount++
    }
  }

  // ── Also create Partner + Offer entries for each Restaurant ──
  console.log(`\n── 3. Creating Partner records for Restaurants ──`)
  for (const r of RESTAURANTS) {
    let partner = await prisma.partner.findFirst({ where: { name: r.name } })
    if (!partner) {
      partner = await prisma.partner.create({
        data: {
          name:        r.name,
          category:    'Restaurant',
          city:        r.city,
          area:        r.area,
          description: r.description,
          contactInfo: {
            ...(r.contactInfo || {}),
            priceLevel:  r.priceLevel,
            hours:       r.openingHours,
            rating:      4.4,
          },
          isActive: true,
        },
      })
    }

    const existOffer = await prisma.offer.findFirst({ where: { partnerId: partner.id } })
    if (!existOffer) {
      await prisma.offer.create({
        data: {
          partnerId:       partner.id,
          title:           `Member Dining Benefit at ${r.name}`,
          description:     r.memberBenefit + '. Book through your concierge or contact the restaurant directly.',
          shortDesc:       r.memberBenefit.slice(0, 118),
          category:        'Restaurant',
          city:            r.city,
          area:            r.area,
          tierEligibility: ['signature', 'signature-plus', 'signature-elite'],
          pointsEligible:  true,
          pointsAward:     500,
          redemptionType:  'CONCIERGE_CONFIRM',
          redemptionSteps: [
            { step: 1, text: 'Contact your Nigerent Concierge to reserve' },
            { step: 2, text: 'Confirm your NSL membership at the restaurant' },
            { step: 3, text: 'Enjoy your dining experience' },
          ],
          validFrom:    today,
          validTo:      future(365),
          status:       'ACTIVE',
          isFeatured:   r.isFeatured,
          displayOrder: offerCount + 1,
        },
      })
      offerCount++
      console.log(`  ✓ Offer: ${r.name}`)
    }
  }

  console.log(`
══════════════════════════════════════════════
  Seeding complete!

  • ${restCount} restaurants added to dining directory
  • ${partnerCount} partners seeded
  • ${offerCount} member offers created

  Categories seeded:
  ✓ Restaurants (10) — Fine Dining, Casual, Seafood, African, Asian
  ✓ Wellness & Spa (6) — ORÍKÌ, Tirta Ayu, Clear Essence, Dermaspace, Body Temple, Urban Wellness
  ✓ Experiences (8) — Nike Art Gallery, Terra Kulture, Lekki Conservation, Freedom Park, IMAX, Quilox, Hard Rock, MUSON
  ✓ Supermarkets (5) — Shoprite (×2), SPAR, Ebeano, Hubmart
  ✓ Pharmacies (5) — MedPlus (×2), HealthPlus (×2), Alpha Pharmacy
  ✓ Hospitals (5) — Reddington (×2), Evercare, Lagoon, St. Nicholas

  Now visit /explore to see all partners and /dining for restaurants.
══════════════════════════════════════════════
`)

  await prisma.$disconnect()
}

run().catch(e => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
