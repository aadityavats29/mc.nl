/**
 * Shared site facts. Single source: preserved MC master brief (10 Sep 2026).
 * Items marked "unconfirmed" are reproduced from the preserved material and
 * listed in _handoff/HANDOFF.md for owner sign-off.
 */

export const site = {
  name: 'Maison Coiffure',
  tagline: 'Personal attention, honest advice and enough time to do things properly.',
  addressLine: 'Boeierstraat 18, Amsterdam - IJburg',
  streetAddress: 'Boeierstraat 18',
  locality: 'Amsterdam',
  areaNote: 'IJburg, Amsterdam',
  phoneDisplay: '+31 (0)6 41347401',
  phoneIntl: '+31641347401',
  whatsappBase: 'https://wa.me/31641347401',
  email: 'appointment@maisoncoiffure.nl', // mailbox activation unconfirmed
  instagram: 'https://www.instagram.com/maisoncoiffure.nl/',
  availability: 'Wednesday, Friday and Saturday, by appointment only',
  walkIns: 'Walk-ins cannot be accommodated; every visit is by appointment.',
  onLocationArea: 'Amsterdam, Amstelveen and Diemen',
  url: 'https://maisoncoiffure.nl',
  brands: ['Kérastase', 'Balmain', "L'Oréal", 'Milkshake', 'Lush', 'Moroccanoil', 'O-Way'],
};

export function waLink(message: string): string {
  return `${site.whatsappBase}?text=${encodeURIComponent(message)}`;
}

export interface NavChild {
  label: string;
  href: string;
  note?: string;
}
export interface NavItem {
  label: string;
  href?: string; // direct destination (Treatments has both a link and children)
  children?: NavChild[];
}

export const nav: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'About',
    children: [
      { label: 'MC Philosophy', href: '/about/philosophy', note: 'What Maison Coiffure believes' },
      { label: 'About the Hairstylist', href: '/about/hairstylists', note: 'The person behind MC' },
    ],
  },
  {
    label: 'Treatments',
    href: '/treatments',
    children: [
      { label: 'Haircuts', href: '/treatments/haircuts' },
      { label: 'Curls', href: '/treatments/curls' },
      { label: 'Colouring', href: '/treatments/colouring' },
      { label: 'Highlights / Lowlights', href: '/treatments/highlights-lowlights' },
      { label: 'Superloop', href: '/treatments/superloop' },
      { label: 'Grey Hair', href: '/treatments/grey-hair' },
      { label: 'Head Massage', href: '/treatments/head-massage' },
      { label: 'Salon Party', href: '/treatments/salon-party' },
    ],
  },
  {
    label: 'For Businesses',
    children: [
      { label: 'Corporate Salon', href: '/for-businesses/corporate-salon', note: 'Salon days at your workplace' },
      { label: 'Care Homes', href: '/for-businesses/care-homes', note: 'Care in familiar surroundings' },
    ],
  },
  { label: 'Blog', href: '/blog' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact', href: '/contact' },
];

export const globalPriceCondition =
  'Prices and appointment times are based on the selected hair length and an average amount of hair. ' +
  'A surcharge of €12.50 may apply to exceptionally thick, very long or tangled hair, or when substantially ' +
  'more product and time are required. This will always be discussed before the treatment begins.';

export const hairLengths = [
  { name: 'Short hair', def: 'Hair that falls above the jawline.' },
  {
    name: 'Medium-length hair',
    def: 'Hair from the jawline to just above the shoulders, including a bob that remains above the shoulders.',
  },
  { name: 'Long hair', def: 'Hair that touches or falls below the shoulders.' },
  { name: 'Very long hair', def: 'Hair that reaches the mid-back or below; an additional charge may apply.' },
];
