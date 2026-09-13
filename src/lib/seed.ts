/**
 * First-run seed: loads the approved MC content (master brief + September
 * catalogue, as shipped in src/data/*) into the shared content records, both
 * as draft and as the published revision, so the public site serves the
 * already-approved material immediately and Studio starts from real content.
 * Runs once; an existing database is never overwritten.
 */
import { randomBytes } from 'node:crypto';
import { db, now, getConfig, setConfig } from './db';
import { createRecord } from './content';
import { site, nav, hairLengths, globalPriceCondition } from '../data/site';
import {
  haircuts, curlyHaircuts, signatureBlowDry, colourConsultation, permanentColour,
  semiPermanentColour, toner, foilHighlights, capHighlights, hairCare,
  recoveryProgramme, gracefullyGrey, headMassage, superloop, coaching,
} from '../data/services';
import { explorerRows } from '../data/explorer';
import { images } from '../data/images';

function publishSeed(id: string) {
  db.prepare(
    'UPDATE records SET published = draft, published_version = draft_version, ever_published = 1 WHERE id = ?'
  ).run(id);
  db.prepare('INSERT INTO events(kind, record_id, at) VALUES(?,?,?)').run('publish', id, now());
}

function seedRecord(id: string, type: string, title: string, data: any, publish = true) {
  createRecord(id, type, title, data, 'seed');
  if (publish) publishSeed(id);
}

export function ensureSeeded(): void {
  const n = (db.prepare('SELECT COUNT(*) AS n FROM records').get() as any).n;
  if (n > 0) return;

  /* ---- media registry (web derivatives already in /public/images) ---- */
  const insertMedia = db.prepare(
    `INSERT INTO media(id, kind, base, ext, widths, w, h, alt, caption, credit, status, focal_x, focal_y, focal_xm, focal_ym, origin, created_at)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  for (const img of Object.values(images)) {
    const clientPhoto = img.source.startsWith('Before-After');
    insertMedia.run(
      img.slug, 'static', `/images/${img.slug}`, 'webp', JSON.stringify(img.widths),
      img.w, img.h, img.alt, '', '',
      clientPhoto ? 'needs-permission' : 'ready',
      50, img.slug === 'hero-wide' ? 45 : 50, 50, 45,
      img.source, now()
    );
  }

  /* ---- shared settings ---- */
  seedRecord('settings:site', 'settings', 'Business details', {
    name: site.name, tagline: site.tagline,
    addressLine: site.addressLine, streetAddress: site.streetAddress, locality: site.locality,
    phoneDisplay: site.phoneDisplay, phoneIntl: site.phoneIntl, whatsappBase: site.whatsappBase,
    email: site.email, instagram: site.instagram,
    availability: site.availability, walkIns: site.walkIns, onLocationArea: site.onLocationArea,
    url: site.url,
  });
  seedRecord('settings:nav', 'settings', 'Menus & footer', {
    items: nav,
    footerAbout: `A small, personal hair salon in ${site.areaNote}, and on location.`,
    footerNote: 'By appointment only',
  });

  /* ---- brands (owner-confirmed list; logo artwork still to be supplied) ---- */
  site.brands.forEach((b, i) =>
    seedRecord(`brand:${b.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, 'brand', b, {
      name: b, order: i, visible: true, confirmed: true, url: '', note: 'From the owner homepage feedback: "I work with the following couture brands".',
    })
  );

  /* ---- service catalogue ---- */
  const groups: [any, string, boolean][] = [
    [haircuts, 'Haircuts', false],
    [curlyHaircuts, 'Haircuts', false],
    [signatureBlowDry, 'Styling', false],
    [colourConsultation, 'Colour', false],
    [permanentColour, 'Colour', true],
    [semiPermanentColour, 'Colour', true],
    [toner, 'Colour', true],
    [foilHighlights, 'Highlights', true],
    [capHighlights, 'Highlights', true],
    ...hairCare.map((g) => [g, 'Hair Care', false] as [any, string, boolean]),
    [recoveryProgramme, 'Hair Care', false],
    [superloop, 'Superloop', false],
    [gracefullyGrey, 'Gracefully Grey', false],
    [headMassage, 'Massage', false],
    [coaching, 'Coaching', false],
  ];
  groups.forEach(([g, category, gated], i) =>
    seedRecord(`service-group:${g.id}`, 'service-group', g.title, {
      ...g, category, consultationGated: gated, order: i,
      globalCondition: g.showGlobalCondition ?? false,
    })
  );

  /* ---- treatment pages ---- */
  const t = (slug: string, extra: any) => {
    const row = explorerRows.find((r) => r.href === `/treatments/${slug}`)!;
    seedRecord(`treatment:${slug}`, 'treatment', extra.title ?? row.label, {
      slug, menuLabel: row.label, summary: row.summary, preview: row.preview,
      order: explorerRows.findIndex((r) => r.href === `/treatments/${slug}`),
      ...extra,
    });
  };

  t('haircuts', {
    title: 'Haircuts', metaTitle: 'Haircuts and Signature Blow-Dry',
    seoDescription: 'Haircuts at Maison Coiffure: €35 at every length, including consultation, wash and quick blow-dry. Teen haircuts €30. Signature Blow-Dry from €25.',
    lede: 'Great hair is about the right shape, movement and attention to detail.',
    media: 'haircut-bob',
    body: `Whether you love long layers, natural curls or a fresh new cut, every hairstyle is created to suit you, your hair and your personality. Every haircut includes a personal consultation, hair wash, haircut and quick blow-dry, and there is always enough time to do things properly.

Curly hair asks for its own approach: curls are cut dry, following your natural pattern. You will find the dedicated curly haircut on the [Curls page](/treatments/curls).

## Signature Blow-Dry

A Signature Blow-Dry is a bit more than just a blow-dry. It is a polished finish with extra attention to shape, movement, shine and lasting style. Perfect for dinner, drinks, a date or a day when you want your hair to look extra good.`,
    groups: ['haircuts', 'curly-haircuts', 'signature-blow-dry'],
    ctaLabel: 'Book an appointment',
    waMessage: 'Hello Maison Coiffure, I would like to book a haircut.',
  });

  t('curls', {
    title: 'Curls', metaTitle: 'Curly haircuts and curl care',
    seoDescription: 'Curly haircuts at Maison Coiffure: cut dry to enhance your natural curl pattern, €49 including curl consultation, wash, curl care and styling. Curl treatments from €39.',
    lede: 'Curly hair needs a different approach from straight hair.',
    media: 'curls-long',
    body: `It is about tailoring the cut to your unique curl pattern, understanding its natural movement, shape and texture, and enhancing it rather than flattening it. We take time to observe how your hair naturally falls and cut curls dry, so the pattern stays visible. The aim is a shape that suits your face, style and lifestyle.

Expect a calm, personalised treatment, advice on caring for and styling your curls, and a haircut that allows your natural texture to shine.

Alongside the cut, curl care nourishes and hydrates the hair, reduces frizz and supports natural definition. The curly haircut and the curl treatment are separate services, so you can choose what your hair needs.`,
    groups: ['curly-haircuts', 'curl-treatment'],
    ctaLabel: 'Book an appointment',
    waMessage: 'Hello Maison Coiffure, I would like to book a curly haircut.',
  });

  t('colouring', {
    title: 'Colouring', metaTitle: 'Colouring: permanent, semi-permanent and toner',
    seoDescription: 'Colouring at Maison Coiffure: permanent colour from €49, semi-permanent colour from €39 and toners from €30, always preceded by a personal €25 consultation that is deducted from the agreed treatment.',
    lede: 'Colour that suits your hair, agreed together before anything touches it.',
    media: 'colour-copper',
    body: `Permanent colour provides lasting colour change and grey coverage. Semi-permanent colour adds tone, depth and richness and fades gradually. A toner makes a softer, translucent tonal adjustment, neutralises unwanted warmth or refreshes shine. Neither semi-permanent colour nor toner makes hair lighter.

Before your first colour, toner or highlight treatment we assess your hair history, current condition and desired result in a personal consultation, then agree the service, the time it needs and the estimated price. The €25 consultation fee is fully deducted from the agreed treatment when you proceed.

Not sure what to book? Contact Maison Coiffure via WhatsApp for guidance.`,
    groups: ['colour-consultation', 'permanent-colour', 'semi-permanent-colour', 'toner'],
    ctaLabel: 'Book a colour consultation',
    waMessage: 'Hello Maison Coiffure, I would like to book a Colour and Highlight Consultation.',
  });

  t('highlights-lowlights', {
    title: 'Highlights / Lowlights', metaTitle: 'Highlights and lowlights, toner included',
    seoDescription: 'Foil highlights from €85 and cap highlights from €59 at Maison Coiffure, always including a finishing toner. Lowlights are planned personally in consultation.',
    lede: 'Light, dimension and depth, with the finishing toner included in every price.',
    media: 'highlights-blonde',
    body: `Foil highlights create carefully placed lighter sections and dimension throughout the hair. Cap highlights create evenly distributed fine highlights and suit short hair and bobs that remain above the shoulders. In both cases a finishing toner is an essential part of the treatment, included in the displayed price and the reserved time, so the result is refined rather than unfinished.

Lowlights add depth instead of light. They are planned personally: in your consultation we look at your current colour, condition and desired result and agree the right combination, time and estimate. Lowlights also play a role in the [Gracefully Grey](/treatments/grey-hair) transition plans.

A consultation is required before your first highlight treatment; the €25 fee is fully deducted from the agreed treatment.`,
    groups: ['foil-highlights', 'cap-highlights'],
    ctaLabel: 'Book a colour consultation',
    waMessage: 'Hello Maison Coiffure, I would like to book a Colour and Highlight Consultation for highlights.',
  });

  t('superloop', {
    title: 'Superloop', metaTitle: 'Superloop volumising treatment',
    seoDescription: 'The Superloop at Maison Coiffure: a volumising treatment that makes hair appear fuller, from €89. The result lasts approximately six weeks.',
    lede: 'More volume, or help making a crown fall beautifully again.',
    media: '',
    body: `Do you want more volume in your hair, or help making a crown fall beautifully again? A Superloop is a volumising treatment intended to make hair appear fuller. It is especially suitable when the hair on top is no longer than 15 cm, and the result lasts approximately six weeks.

After the treatment your hair is blow-dried and styled, and the Superloop can be combined with a haircut in the same visit.

Whether a Superloop suits your hair, and how long your appointment needs, is agreed personally before booking. Send a message and we will look at it together.`,
    groups: ['superloop'],
    ctaLabel: 'Ask about a Superloop',
    waMessage: 'Hello Maison Coiffure, I would like to know whether a Superloop suits my hair.',
  });

  t('grey-hair', {
    title: 'Grey Hair', metaTitle: 'Gracefully Grey: grey-hair transition and care',
    seoDescription: 'Gracefully Grey at Maison Coiffure: a personal consultation (€25, deducted from your first treatment) and a personalised plan to embrace natural grey or transition from coloured hair.',
    lede: 'Embrace your natural grey, or grow it out gradually, at your own pace.',
    media: 'grey-bob',
    body: `The Gracefully Grey plan supports clients who want to embrace their natural grey or gradually move away from coloured hair. The objective is a considered transition that suits your current colour, condition, preferences and pace.

Tonal work can soften the contrast between regrowth and coloured lengths, refine cool, grey and ash tones, and neutralise unwanted warmth, without losing what makes your hair yours.

Everything starts with a personal consultation. We assess the regrowth, existing colour and condition, and agree a treatment plan that may include highlights, lowlights, colour blending, colour removal or toning. You then receive a personal quotation for the agreed plan; there is no generic price for work this personal.`,
    groups: ['gracefully-grey'],
    ctaLabel: 'Book a Gracefully Grey consultation',
    waMessage: 'Hello Maison Coiffure, I would like to book a Gracefully Grey consultation.',
  });

  t('head-massage', {
    title: 'Head Massage', metaTitle: 'Indian Head Massage',
    seoDescription: 'Indian Head Massage at Maison Coiffure: €39 for 30 minutes or €55 for 45 minutes of unhurried attention for the scalp, temples, neck and shoulders.',
    lede: 'A relaxing massage for the scalp, temples, neck and upper shoulders.',
    media: '',
    body: `An Indian Head Massage helps release tension and create a deep sense of calm. In the quiet of a small home salon, without rows of chairs or background bustle, half an hour of focused attention can do a remarkable amount.

The extended massage allows more time for the neck and shoulders, where most of us hold the day's tension. Both versions combine beautifully with a haircut or treatment in the same visit.`,
    groups: ['head-massage'],
    ctaLabel: 'Book an appointment',
    waMessage: 'Hello Maison Coiffure, I would like to book an Indian Head Massage.',
  });

  t('salon-party', {
    title: 'Salon Party', metaTitle: 'Salon Party',
    seoDescription: 'A Salon Party with Maison Coiffure: a relaxed salon experience with friends or family, at your home or at the salon. Haircuts, styling, treatments and head massages, arranged by personal quote.',
    lede: 'A relaxed salon experience with the people you like most, at your home or at Maison Coiffure.',
    media: 'care-waves',
    body: `Invite Maison Coiffure into your home for a relaxed salon experience with friends or family. A gathering can include haircuts, styling, nourishing hair treatments, WellaPlex and Indian Head Massage, with hair analysis, home-care advice and styling tips tailored to the group. It suits birthdays, life transitions, bridal showers or simply a shared evening of care.

As the host you provide the setting, drinks and snacks; Maison Coiffure brings a washbasin, towels and products, and the group chooses a focus beforehand. Colour work on location requires a prior consultation, so the appropriate products can be prepared.`,
    venues: {
      heading: 'Two ways to gather',
      home: '**At your home.** The salon comes to you, and the evening stays entirely yours.',
      salon: '**At Maison Coiffure.** Come to the salon as a group and let the home-salon calm do its work.',
      note: 'Both are enquiry preferences rather than promises of availability: tell us your preferred location, date, group size and the treatments you are interested in, and we will prepare a personal quote for your gathering.',
    },
    enquiry: 'Salon Party',
    groups: [],
    ctaLabel: 'Request a quote',
    waMessage: 'Hello Maison Coiffure, I would like to request a quote for a salon party.',
  });

  /* ---- stylist ---- */
  seedRecord('stylist:founder', 'stylist', 'About the Hairstylist', {
    slug: 'founder',
    displayName: '',            // open item: owner display name not yet supplied
    role: 'Hairstylist & coach, founder of Maison Coiffure',
    portrait: 'stylist-portrait',
    intro: "A journey full of unexpected twists and turns, defined by trying new things and taking risks.",
    specialties: ['Haircuts and curly haircuts', 'Grey-hair transitions', 'Hair care and recovery', 'Coaching alongside hairdressing', 'On-location services'],
    active: true,
    order: 0,
    bookingHref: '/book',
    story: `There's something quietly powerful about a fresh haircut or style. As Coco Chanel once said, "A woman who cuts her hair is about to change her life." A new cut, colour, or treatment can boost confidence, inspire change, mark a new chapter in life, or simply celebrate it. This transformation, both inside and out, mirrors the way I approach my work, helping individuals and businesses navigate change with clarity and confidence.

My journey has been full of unexpected twists and turns, but it has always been defined by trying new things and taking risks. I am not for nothing an entrepreneur at heart, guided by curiosity, strategic thinking, and a passion for fostering collaboration. In 2014, I co-founded THEY VISUALIZE VALUE in India, a brand consulting and marketing agency, and became the Managing Director. Since then, I have played a key role in driving the strategic and financial growth of the company, ensuring smooth business operations, supporting team development, and overseeing high-level content creation.

Through my work, I gradually became involved in intercultural consultancy, a field I hadn't initially set out to pursue but naturally evolved into. Having lived in India for six years and worked there for over 14 years, I've witnessed firsthand the challenges of cross-cultural collaboration. As I worked with European and Indian teams struggling to understand one another, I found myself in the middle: listening, advising, and bridging cultural gaps. Now, I support businesses and individuals navigating cultural complexities, whether it's expats adapting to new work environments or multinational teams striving for smoother collaboration.

While I continue to lead THEY, now in The Netherlands, my passion for helping people navigate change has expanded beyond the corporate world. I am currently training to become a registered therapist and coach, with certification expected in 2027. This step felt like a natural progression from my consulting work, allowing me to help individuals through personal, professional, and cultural transitions.

Most recently, I embarked on a hairstyling certification at the Nederlands Kappersakademie, where I discovered a unique opportunity to blend hairstyling with coaching. At Maison Coiffure, I offer bespoke hair transformations paired with tailored coaching sessions, helping clients embrace both their inner and outer changes with confidence.

Whether in business operations, intercultural consultancy, coaching, or hairstyling, my goal remains the same: to empower people through change, ensuring they have the tools, clarity, and confidence to navigate life's transitions with ease.`,
  });

  /* ---- pages ---- */
  const quote = 'Sometimes you need a haircut. Sometimes you need a different perspective. Sometimes you need both.';

  seedRecord('page:home', 'page', 'Home', {
    slug: '', template: 'home',
    seo: {
      title: 'Maison Coiffure · Personal hair salon in IJburg, Amsterdam',
      description: 'A small, personal hair salon in IJburg, Amsterdam. Haircuts, curls, colouring, grey-hair care, head massage and optional coaching. By appointment on Wednesday, Friday and Saturday.',
    },
    hero: {
      visible: true,
      mediaDesktop: 'hero-wide', mediaMobile: 'hero-curls',
      bookingLabel: 'Book an appointment', bookingHref: '/book',
    },
    intro: {
      visible: true, watermark: true,
      heading: quote,
      body: "Maison Coiffure is a small, personal hair salon in the stylist's home in IJburg, Amsterdam, and on location. Hairdressing and coaching come together here: you can simply book a haircut, colour or treatment and nothing more, or combine your appointment with an explicitly booked coaching session. You decide what you come for.",
      tagline: 'Personal attention, honest advice and enough time to do things properly.',
      primaryCta: { label: 'Explore treatments', href: '/treatments' },
      secondaryCta: { label: 'Read the MC Philosophy', href: '/about/philosophy' },
    },
    aboutCards: {
      visible: true, autoMove: true, speed: 'standard',
      heading: 'Get to know Maison Coiffure',
      cards: [
        { media: 'curls-long', label: 'Philosophy', title: 'MC Philosophy', summary: 'What Maison Coiffure believes, and how hairdressing and optional coaching belong together.', href: '/about/philosophy', cta: 'Read the philosophy', visible: true },
        { media: 'stylist-portrait', label: 'The person', title: 'About the Hairstylist', summary: 'From entrepreneur and coach to hairstylist: the story behind the chair.', href: '/about/hairstylists', cta: 'Meet the hairstylist', visible: true },
        { media: 'grey-bob', label: 'Practical', title: 'Visit Maison Coiffure', summary: 'A home salon in IJburg, Amsterdam. Wednesday, Friday and Saturday, by appointment.', href: '/contact', cta: 'Plan your visit', visible: true },
      ],
    },
    brands: { visible: true, autoMove: true, speed: 'standard', heading: 'Brands we work with' },
    explorer: {
      visible: true, heading: 'Inviting to explore, easy to understand',
      lede: 'Every service has a clear explanation, a transparent price and enough time reserved to do it properly. Colour work always starts with a personal consultation.',
      footerLink: 'See the complete catalogue, including hair care, recovery, styling and coaching',
    },
    salonParty: {
      visible: true, media: 'care-waves', heading: 'Together, in either location',
      body: `Invite Maison Coiffure into your home for a relaxed salon experience with friends or family, or come to the salon as a group. The programme can include haircuts, styling, hair treatments and Indian head massages, tailored to your gathering.

Tell us your preferred location, date, group size and the treatments you are interested in, and we will prepare a personal quote.`,
      cta: 'Enquire about a salon party', href: '/treatments/salon-party',
    },
    recentWork: { visible: true, heading: 'Recent work', media: ['haircut-bob', 'colour-copper', 'curls-defined'] },
    practical: {
      visible: true, heading: 'Practical, from the start',
      body: `Boeierstraat 18, Amsterdam - IJburg. Open Wednesday, Friday and Saturday, by appointment only. Walk-ins cannot be accommodated; every visit is by appointment.

On location, Maison Coiffure works in Amsterdam, Amstelveen and Diemen, for salon parties, companies and care homes.`,
    },
  });

  seedRecord('page:philosophy', 'page', 'MC Philosophy', {
    slug: 'about/philosophy', template: 'standard', eyebrow: 'About',
    seo: { title: 'MC Philosophy', description: 'About Maison Coiffure: a small, personal home salon in IJburg, Amsterdam that brings hairdressing and optional, explicitly booked coaching together. You decide what you come for.' },
    heading: 'MC Philosophy',
    lede: 'Maison Coiffure brings two things together that may seem unusual at first: hairdressing and coaching.',
    sections: [
      { id: 's1', type: 'richtext', visible: true, text: `You can simply book a haircut, colour or treatment and nothing more. But you can also choose to combine your hair appointment with a professional coaching session. Because strangely enough, the hairdresser's chair can be a very good place to talk.

You're not sitting across from someone in a consulting room. You're doing something for yourself. There is time. And while I'm working with your hair, we can work on whatever is occupying your mind.

That might be a change in your career or relationship. A decision you can't quite make. Adjusting to another culture. Patterns you keep running into. Or simply that feeling of knowing something needs to change, without knowing what yet.

That's where coaching at Maison Coiffure is different from a good conversation with your hairdresser. It is an actual coaching session, with your question at the centre of it. I listen, ask questions, challenge you where useful and help you explore what may be underneath the problem you came in with.

All while cutting your hair, if that's what you've booked.

But not every haircut needs a deeper meaning. If you simply want a great cut, beautiful colour, help with your curls or a treatment for damaged hair, that's exactly what we'll do.

And sometimes it happens the other way around. You book a normal hair appointment and, somewhere between the shampoo and the scissors, we stumble upon something bigger. I won't turn that into an unsolicited coaching session. But if I think I can help, I may tell you. You can then decide whether you'd like to book a separate coaching session another time. You decide what you come for.` },
      { id: 's2', type: 'richtext', visible: true, text: `## Why hair and coaching?

I came to hairdressing later in life, after many years as an entrepreneur, consultant and coach. I'm also training to become a registered therapist. The combination made more sense to me than I initially expected.

People often change their hair when something else is changing too. A new beginning. Going naturally grey. Recovering from a difficult period. Starting a new job. Ending a relationship. Becoming more comfortable with who they are. But you don't need to be going through a life-changing event to sit in my chair.` },
      { id: 's3', type: 'richtext', visible: true, text: `## Not quite your typical salon

Maison Coiffure is based in my home, which I have partly transformed into a salon. It has everything I need to do my work properly, without feeling like a traditional salon. It's small, informal and cosy. No rows of chairs and no feeling that someone is waiting for you to leave.

And if you'd rather stay in your own surroundings, I can come to you. I also provide hairdressing services on location, including at homes, companies and care homes.

Maison Coiffure is ultimately built around one simple idea:

**You don't have to choose between taking care of how you look and taking care of what's going on inside.**

**But you absolutely can.**` },
      { id: 's4', type: 'cta', visible: true, label: 'Curious who is behind the chair? Meet the hairstylist', href: '/about/hairstylists' },
    ],
    aside: {
      media: 'hero-curls',
      noteTitle: 'Coaching is always your choice',
      noteText: 'Ordinary listening and personal attention are part of every appointment and are never charged as coaching. A coaching session is something you explicitly book, at a clear price, in the [treatments catalogue](/treatments#coaching-section).',
    },
  });

  seedRecord('page:hairstylists', 'page', 'About the Hairstylist', {
    slug: 'about/hairstylists', template: 'stylists', eyebrow: 'About',
    seo: { title: 'About the Hairstylist', description: 'Meet the hairstylist and founder of Maison Coiffure: entrepreneur, intercultural consultant and coach turned hairstylist, blending hairstyling with coaching in a personal home salon.' },
    heading: 'About the Hairstylist',
    lede: 'A journey full of unexpected twists and turns, defined by trying new things and taking risks.',
  });

  seedRecord('page:treatments', 'page', 'Treatments', {
    slug: 'treatments', template: 'treatments-index', eyebrow: 'Treatments',
    seo: { title: 'Treatments and prices', description: 'The complete Maison Coiffure catalogue: haircuts, curls, colouring, highlights with toner included, hair care and recovery, Gracefully Grey, head massage, optional coaching and on-location services, with transparent prices.' },
    heading: 'The complete catalogue',
    lede: 'Every service with a clear explanation, a transparent price and the time it deserves. Colour, toner, highlight and Gracefully Grey treatments are agreed in a personal consultation first.',
  });

  seedRecord('page:corporate-salon', 'page', 'Corporate Salon', {
    slug: 'for-businesses/corporate-salon', template: 'business', eyebrow: 'For Businesses',
    seo: { title: 'Corporate Salon', description: 'Bring Maison Coiffure to your workplace, coworking space or organisation for a tailored salon day of haircuts, treatments and personal care. Request a quote.' },
    heading: 'Corporate Salon',
    lede: 'Bring Maison Coiffure to your workplace or organisation for a tailored day of haircuts, treatments and personal care.',
    media: 'haircut-short',
    enquiryType: 'Organisation',
    enquiryHeading: 'Request a corporate salon quote',
    body: `We create the programme around your location, group size and available time. A coworking space can offer its members a salon day; a larger company can book the salon as a workplace treat, a wellbeing day or part of an event.

The programme can draw on the full [Maison Coiffure catalogue](/treatments): haircuts, styling, nourishing treatments and Indian head massages, delivered with the same calm and personal attention as in the salon. Half-day visits and recurring arrangements can be discussed.

Every corporate enquiry is quoted personally. Tell us about your organisation, location and group, and we will design a day that fits.`,
  });

  seedRecord('page:care-homes', 'page', 'Care Homes', {
    slug: 'for-businesses/care-homes', template: 'business', eyebrow: 'For Businesses',
    seo: { title: 'Care Homes', description: 'Maison Coiffure for care homes: gentle, personalised haircuts, styling and care treatments for residents in familiar surroundings, arranged with the care team. Request a quote.' },
    heading: 'Care Homes',
    lede: 'Gentle, personalised haircuts, styling and care treatments for residents, in familiar surroundings.',
    media: 'grey-long',
    enquiryType: 'Care Home',
    enquiryHeading: 'Request a care home quote',
    body: `For many residents, a haircut is about far more than hair. It is attention, touch and a moment that is entirely theirs. Maison Coiffure visits care homes, assisted-living settings and small residential communities, adapting each treatment to the person's needs and comfort, with time, respect and close coordination with the care team.

Care can happen where it suits the resident best, including gentle haircuts and blow-dry styling at the bed or chair, scalp massage and hair care, and light styling for family visits or special occasions. Small haircare and self-care workshops for staff or family, hand care and a soft hand massage can be discussed as part of a visit.

## Three ways to work together

**Individual treatments**, arranged by a resident or their family.

**Part-day visits** for several residents, planned together with the care team.

**Recurring visits**, monthly or quarterly, so residents see a familiar face.

Payment by family or institutional invoicing can both be discussed. A quiet space, a power socket and warm water are all the setup needs; the enquiry below asks about the practical details. Every arrangement is quoted personally.`,
  });

  seedRecord('page:blog', 'page', 'Blog', {
    slug: 'blog', template: 'blog-index', eyebrow: 'Blog',
    seo: { title: 'Blog', description: 'Notes from Maison Coiffure on grey hair, hair recovery, self-care and care for care-home residents. Articles will appear here as they are written.' },
    heading: 'Notes from the salon',
    lede: 'Articles will appear here as they are written: honest, practical pieces at the same unhurried pace as the salon itself.',
    topics: ['Grey hair', 'Hair recovery', 'Self-care', 'Care homes'],
  });

  seedRecord('page:gallery', 'page', 'Gallery', {
    slug: 'gallery', template: 'gallery', eyebrow: 'Gallery',
    seo: { title: 'Gallery', description: 'Recent work from Maison Coiffure: haircuts, curls, colour and grey-hair transitions, photographed in and around the salon.' },
    heading: 'Recent work',
    lede: 'Real hair, real clients, no filters: haircuts, curls, colour and grey-hair care from the Maison Coiffure chair.',
    media: ['hero-curls', 'grey-bob', 'colour-copper', 'haircut-bob', 'highlights-blonde', 'curls-defined', 'curls-long', 'grey-long', 'haircut-short', 'care-waves', 'haircut-layers'],
    note: 'More of the day-to-day lives on [Instagram](https://www.instagram.com/maisoncoiffure.nl/). If your hair appears here and you would like it taken down, [let us know](/contact) and it will be.',
  });

  seedRecord('page:contact', 'page', 'Contact', {
    slug: 'contact', template: 'contact', eyebrow: 'Contact',
    seo: { title: 'Contact', description: 'Contact Maison Coiffure in IJburg, Amsterdam: WhatsApp for an appointment on +31 6 41347401. Open Wednesday, Friday and Saturday, by appointment only.' },
    heading: 'Say hello',
    lede: 'The quickest way to reach Maison Coiffure is a WhatsApp message; you will get a personal reply.',
    brandsLine: 'I work with the following couture brands:',
  });

  seedRecord('page:book', 'page', 'Book an appointment', {
    slug: 'book', template: 'book', eyebrow: 'Book',
    seo: { title: 'Book an appointment', description: 'Request an appointment at Maison Coiffure via WhatsApp. Transparent prices, hair-length guidance and consultation-first colour work. Open Wednesday, Friday and Saturday.' },
    heading: 'Request an appointment',
    lede: 'Booking is personal here, like everything else: send your request via WhatsApp and we agree the time together. A request is not yet a confirmed appointment.',
    steps: [
      { t: 'Treatment', d: 'Choose what you would like; prices and durations are in the catalogue.' },
      { t: 'Details', d: 'Tell us your hair length and anything we should know.' },
      { t: 'Date', d: 'Suggest days or times that suit you; we are open Wednesday, Friday and Saturday.' },
      { t: 'Confirm', d: 'We reply personally to agree the exact time. Your request becomes an appointment once we confirm it.' },
    ],
  });

  /* ---- reference data ---- */
  seedRecord('settings:booking', 'settings', 'Booking rules', {
    hairLengths, globalPriceCondition,
    consultationNote: 'A consultation is required before a first colour, toner, highlight or Gracefully Grey treatment, and before major colour changes, colour corrections and hair that has previously been coloured, lightened or chemically treated. The €25 consultation fee is fully deducted from the agreed treatment.',
    allergyNote: 'Please tell us before your appointment about allergies, scalp conditions, sensitivities, medication or previous reactions to colouring products.',
  });

  if (!getConfig('assistant_token')) {
    setConfig('assistant_token', randomBytes(24).toString('hex'));
  }
  setConfig('seeded_at', now());
}
