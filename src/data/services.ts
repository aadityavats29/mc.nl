/**
 * Maison Coiffure service catalogue.
 * Source of truth: September 2026 booking form content, pricing and functional
 * specification (Maison_Coiffure_Booking_Form_Specification.docx), reproduced
 * in the preserved master brief. Superloop is preserved from the owner-mapped
 * V2 brochure page 5, as the latest menu requires.
 *
 * Price semantics: 'fixed' | 'from' | 'quote' | 'consultation'.
 * Unknown amounts and durations remain unknown; blanks are never zero or free.
 */

export type PriceType = 'fixed' | 'from' | 'quote' | 'consultation';

export interface ServiceOption {
  name: string;
  copy?: string;
  priceType: PriceType;
  amount?: number; // EUR, only for fixed/from/consultation
  duration?: string; // customer-facing duration where supplied
  durationInternal?: string; // internal scheduling only; not rendered
}

export interface ServiceGroup {
  id: string;
  title: string;
  sharedCopy?: string;
  options: ServiceOption[];
  notes?: string[];
  showGlobalCondition?: boolean;
}

export function priceLabel(o: ServiceOption): string {
  switch (o.priceType) {
    case 'fixed':
      return `€${o.amount}`;
    case 'from':
      return `From €${o.amount}`;
    case 'consultation':
      return `€${o.amount} consultation`;
    case 'quote':
      return 'Personal quotation';
  }
}

/* ------------------------------------------------------------------ */

export const haircuts: ServiceGroup = {
  id: 'haircuts',
  title: 'Haircuts',
  sharedCopy: 'Every haircut includes a personal consultation, hair wash, haircut and quick blow-dry.',
  showGlobalCondition: true,
  options: [
    { name: 'Haircut, short hair', copy: 'For hair that falls above the jawline. Includes a consultation, hair wash, haircut and quick blow-dry.', priceType: 'fixed', amount: 35, durationInternal: '45 min' },
    { name: 'Haircut, medium-length hair', copy: 'For hair from the jawline to just above the shoulders. Includes a consultation, hair wash, haircut and quick blow-dry.', priceType: 'fixed', amount: 35, durationInternal: '50 min' },
    { name: 'Haircut, long hair', copy: 'For hair that touches or falls below the shoulders. Includes a consultation, hair wash, haircut and quick blow-dry.', priceType: 'fixed', amount: 35, durationInternal: '60 min' },
    { name: 'Teen haircut, short hair', copy: 'For clients aged 12 to 17 with hair above the jawline. Includes a consultation, hair wash, haircut and quick blow-dry.', priceType: 'fixed', amount: 30, durationInternal: '45 min' },
    { name: 'Teen haircut, medium-length hair', copy: 'For clients aged 12 to 17 with hair from the jawline to above the shoulders. Includes wash, haircut and quick blow-dry.', priceType: 'fixed', amount: 30, durationInternal: '50 min' },
    { name: 'Teen haircut, long hair', copy: 'For clients aged 12 to 17 with hair that touches or falls below the shoulders. Includes wash, haircut and quick blow-dry.', priceType: 'fixed', amount: 30, durationInternal: '60 min' },
  ],
  notes: [
    'These services apply to every client. Maison Coiffure uses inclusive, hair-based categories rather than separate menus for women and men.',
  ],
};

export const curlyHaircuts: ServiceGroup = {
  id: 'curly-haircuts',
  title: 'Curly haircuts',
  sharedCopy:
    'Curly hair is cut dry so its natural movement and individual curl pattern remain visible. The treatment includes a curl consultation, dry haircut, hair wash, curl care and styling.',
  showGlobalCondition: true,
  options: [
    { name: 'Curly haircut, short hair', copy: 'Your curls are individually shaped to enhance their natural pattern and movement.', priceType: 'fixed', amount: 49, durationInternal: '60 min' },
    { name: 'Curly haircut, medium-length hair', copy: 'Your curls are shaped to create definition, balance and a flattering silhouette.', priceType: 'fixed', amount: 49, durationInternal: '75 min' },
    { name: 'Curly haircut, long hair', copy: 'Your curls are shaped while carefully preserving their length and natural movement.', priceType: 'fixed', amount: 49, durationInternal: '90 min' },
  ],
  notes: [
    'Teenagers needing a specialist curly haircut book the regular curly haircut, because the technique and time are the same.',
  ],
};

export const signatureBlowDry: ServiceGroup = {
  id: 'signature-blow-dry',
  title: 'Signature Blow-Dry',
  sharedCopy:
    'A luxurious, personalised blow-dry that gives the hair shape, movement and a polished finish. Perfect for a party, presentation, photoshoot or whenever you want your hair to look its best.',
  options: [
    { name: 'Short hair', copy: 'Includes a hair wash and personalised professional blow-dry.', priceType: 'fixed', amount: 25, duration: '30 min' },
    { name: 'Medium-length hair', copy: 'Hair is washed and styled with volume, smoothness or movement.', priceType: 'fixed', amount: 30, duration: '45 min' },
    { name: 'Long hair', copy: 'Hair is washed and styled with a polished and long-lasting finish.', priceType: 'fixed', amount: 35, duration: '60 min' },
    { name: 'Curly hair', copy: 'A curl-conscious wash and styling treatment that enhances definition and reduces frizz.', priceType: 'from', amount: 35, duration: '45-75 min' },
  ],
};

export const colourConsultation: ServiceGroup = {
  id: 'colour-consultation',
  title: 'Colour and Highlight Consultation',
  sharedCopy:
    'A consultation is required before your first colour, toner or highlight treatment at Maison Coiffure. We assess your current colour, hair history, condition and desired result, then agree on the appropriate treatment, appointment duration and estimated price.',
  options: [
    { name: 'Colour and Highlight Consultation', priceType: 'fixed', amount: 25, duration: '20-30 min' },
  ],
  notes: [
    'The €25 consultation fee will be fully deducted from your colour, toner or highlight treatment when you proceed with the agreed appointment.',
    'In person is preferred for complex colours, highlights, damaged hair, colour corrections and major changes. A remote consultation is possible by video or telephone, supported by clear photographs taken in natural daylight.',
  ],
};

export const permanentColour: ServiceGroup = {
  id: 'permanent-colour',
  title: 'Permanent colour',
  sharedCopy:
    'Permanent colour provides lasting colour change and reliable grey coverage. It may lighten untreated natural hair within technical limits; the result must first be assessed during the mandatory consultation.',
  showGlobalCondition: true,
  options: [
    { name: 'Roots only, all hair lengths', copy: 'Permanent colour is applied to visible regrowth only for lasting colour and grey coverage. The starting price assumes a standard amount of regrowth and product.', priceType: 'from', amount: 49, duration: '90 min' },
    { name: 'Short hair, roots to ends', copy: 'An all-over permanent colour service. A softer semi-permanent colour or toner may be recommended for the lengths and ends.', priceType: 'from', amount: 59, duration: '105 min' },
    { name: 'Medium-length hair, roots to ends', copy: 'An all-over permanent colour service. A gentler colour may be used through the lengths to protect the hair.', priceType: 'from', amount: 69, duration: '120 min' },
    { name: 'Long hair, roots to ends', copy: 'An all-over colour service tailored to the amount, condition and desired result of the hair.', priceType: 'from', amount: 79, duration: '135 min' },
  ],
};

export const semiPermanentColour: ServiceGroup = {
  id: 'semi-permanent-colour',
  title: 'Semi-permanent colour',
  sharedCopy:
    'Semi-permanent colour adds visible tone, richness and depth while remaining gentler than permanent colour. It gradually fades through washing and cannot make the hair lighter.',
  showGlobalCondition: true,
  options: [
    { name: 'Short, all-over', copy: 'A gentle colour is applied from roots to ends to add tone, depth and shine.', priceType: 'from', amount: 45, duration: '75 min' },
    { name: 'Short, mid-lengths and ends', copy: 'Refreshes faded lengths, enriches existing colour and restores shine while leaving roots untouched.', priceType: 'from', amount: 39, duration: '60 min' },
    { name: 'Medium, all-over', copy: 'A gentle colour is applied from roots to ends for a rich, glossy result.', priceType: 'from', amount: 55, duration: '90 min' },
    { name: 'Medium, mid-lengths and ends', copy: 'Refreshes faded colour and adds shine without colouring the roots.', priceType: 'from', amount: 49, duration: '75 min' },
    { name: 'Long, all-over', copy: 'A gentle colour is applied from roots to ends for an even, glossy finish.', priceType: 'from', amount: 65, duration: '105 min' },
    { name: 'Long, mid-lengths and ends', copy: 'Revives faded lengths and ends while leaving the roots untouched.', priceType: 'from', amount: 59, duration: '90 min' },
  ],
};

export const toner: ServiceGroup = {
  id: 'toner',
  title: 'Toner',
  sharedCopy:
    'A toner is an especially gentle, translucent colour treatment used to make a subtle tonal adjustment, neutralise unwanted warmth or refresh shine. It is softer and less colour-intensive than semi-permanent colour and cannot make the hair lighter.',
  showGlobalCondition: true,
  options: [
    { name: 'Short hair', copy: 'Subtly adjusts unwanted warm or cool tones and adds shine.', priceType: 'from', amount: 30, duration: '60 min' },
    { name: 'Medium-length hair', copy: 'Refines or refreshes the existing tone with a soft, translucent result.', priceType: 'from', amount: 40, duration: '75 min' },
    { name: 'Long hair', copy: 'Refreshes faded lengths, neutralises unwanted tones and adds shine.', priceType: 'from', amount: 50, duration: '90 min' },
  ],
  notes: [
    'Semi-permanent colour creates a more noticeable change in colour, depth or richness. A toner makes a softer tonal adjustment. Neither treatment makes the hair lighter.',
  ],
};

export const foilHighlights: ServiceGroup = {
  id: 'foil-highlights',
  title: 'Foil highlights, including toner',
  sharedCopy:
    'Foil highlights create carefully placed lighter sections and dimension throughout the hair. A finishing toner is included as an essential part of every treatment to refine the colour, neutralise unwanted warmth and create a polished result.',
  showGlobalCondition: true,
  options: [
    { name: 'Half head, short hair', copy: 'Highlights are placed through the crown, parting and visible upper sections for brightness and dimension.', priceType: 'from', amount: 85, duration: '150 min' },
    { name: 'Half head, medium-length hair', copy: 'Highlights through the crown, parting and visible upper sections.', priceType: 'from', amount: 95, duration: '165 min' },
    { name: 'Half head, long hair', copy: 'Highlights through the crown, parting and visible upper sections.', priceType: 'from', amount: 110, duration: '180 min' },
    { name: 'Three-quarter head, short hair', copy: 'Highlights are placed across most of the head, including the sides, while preserving some natural depth underneath.', priceType: 'from', amount: 105, duration: '180 min' },
    { name: 'Three-quarter head, medium-length hair', copy: 'Highlights across most of the head, preserving natural depth underneath.', priceType: 'from', amount: 115, duration: '210 min' },
    { name: 'Three-quarter head, long hair', copy: 'Highlights across most of the head, preserving natural depth underneath.', priceType: 'from', amount: 135, duration: '225 min' },
    { name: 'Full head, short hair', copy: 'Highlights are placed throughout the entire head for maximum brightness and multidimensional colour.', priceType: 'from', amount: 125, duration: '210 min' },
    { name: 'Full head, medium-length hair', copy: 'Highlights throughout the entire head for maximum brightness.', priceType: 'from', amount: 140, duration: '240 min' },
    { name: 'Full head, long hair', copy: 'Highlights throughout the entire head for maximum brightness.', priceType: 'from', amount: 165, duration: '270 min' },
  ],
};

export const capHighlights: ServiceGroup = {
  id: 'cap-highlights',
  title: 'Cap highlights, including toner',
  sharedCopy:
    'Cap highlights create evenly distributed fine highlights by pulling selected strands through a highlighting cap. This technique is available for short hair and medium-length hair that remains above the shoulders; a finishing toner is included.',
  showGlobalCondition: true,
  options: [
    { name: 'Short hair, partial', copy: 'Selected strands are pulled through part of the cap for a subtle scattering of lighter highlights.', priceType: 'from', amount: 59, duration: '105 min' },
    { name: 'Short hair, full', copy: 'Strands are pulled through the entire cap for a fuller and brighter highlighted effect.', priceType: 'from', amount: 69, duration: '120 min' },
    { name: 'Medium-length hair, partial', copy: 'Suitable for a bob above the shoulders; selected strands are lightened and toned.', priceType: 'from', amount: 69, duration: '120 min' },
    { name: 'Medium-length hair, full', copy: 'Suitable for hair above the shoulders; highlights are distributed across the full head and toned.', priceType: 'from', amount: 79, duration: '150 min' },
  ],
};

export const hairCare: ServiceGroup[] = [
  {
    id: 'nourishing-treatment',
    title: 'Nourishing Hair Treatment',
    sharedCopy:
      'A personalised treatment that improves moisture, softness and manageability. It may reduce breakage and improve the appearance of damaged ends, but existing split ends can only be removed by trimming.',
    options: [
      { name: 'Short hair', copy: 'Restores moisture, softness and manageability to dry, brittle or damaged hair.', priceType: 'fixed', amount: 35, duration: '45 min' },
      { name: 'Medium-length hair', copy: 'Nourishes the hair and helps reduce dryness and breakage.', priceType: 'fixed', amount: 45, duration: '60 min' },
      { name: 'Long hair', copy: 'Restores moisture and improves softness, strength and manageability.', priceType: 'fixed', amount: 55, duration: '75 min' },
    ],
  },
  {
    id: 'curl-treatment',
    title: 'Curl Treatment',
    sharedCopy:
      'A curl-conscious nourishing treatment designed to hydrate, reduce frizz and support the hair’s natural curl pattern.',
    options: [
      { name: 'Short hair', copy: 'Hydrates short curly hair, reduces frizz and enhances natural definition.', priceType: 'fixed', amount: 39, duration: '45 min' },
      { name: 'Medium-length hair', copy: 'Supports moisture, strength and definition without weighing curls down.', priceType: 'fixed', amount: 49, duration: '60 min' },
      { name: 'Long hair', copy: 'Deeply nourishes the lengths and supports strength and curl definition.', priceType: 'fixed', amount: 59, duration: '75 min' },
    ],
  },
  {
    id: 'wellaplex',
    title: 'WellaPlex Treatment',
    sharedCopy:
      'A professional bond-strengthening treatment for weakened, coloured, lightened or chemically treated hair. WellaPlex reinforces internal hair bonds and helps improve strength and resilience.',
    options: [
      { name: 'Short hair', copy: 'A strengthening treatment for short hair weakened by colouring, lightening or chemical services.', priceType: 'fixed', amount: 49, duration: '60 min' },
      { name: 'Medium-length hair', copy: 'Helps reduce breakage and improve the resilience of medium-length hair.', priceType: 'fixed', amount: 59, duration: '75 min' },
      { name: 'Long hair', copy: 'An intensive treatment supporting weakened lengths and ends.', priceType: 'fixed', amount: 69, duration: '90 min' },
    ],
  },
];

export const recoveryProgramme: ServiceGroup = {
  id: 'recovery-programme',
  title: 'Recovery Programme',
  sharedCopy:
    'A personalised recovery programme for dry, brittle, stressed or damaged hair. The composition is adjusted to the condition of the hair and may include WellaPlex, a restorative mask or deep hydration treatment, scalp massage, leave-in care, a light trim and personalised home-care advice.',
  options: [
    { name: 'Single treatment, short hair', priceType: 'fixed', amount: 109, duration: '120 min' },
    { name: 'Single treatment, medium-length hair', priceType: 'fixed', amount: 119, duration: '120 min' },
    { name: 'Single treatment, long hair', priceType: 'fixed', amount: 129, duration: '120 min' },
    { name: 'Three-treatment programme, short hair', priceType: 'fixed', amount: 299, duration: '3 × 120 min' },
    { name: 'Three-treatment programme, medium-length hair', priceType: 'fixed', amount: 329, duration: '3 × 120 min' },
    { name: 'Three-treatment programme, long hair', priceType: 'fixed', amount: 359, duration: '3 × 120 min' },
    { name: 'Five-treatment programme, short hair', priceType: 'fixed', amount: 479, duration: '5 × 120 min' },
    { name: 'Five-treatment programme, medium-length hair', priceType: 'fixed', amount: 519, duration: '5 × 120 min' },
    { name: 'Five-treatment programme, long hair', priceType: 'fixed', amount: 569, duration: '5 × 120 min' },
  ],
  notes: [
    'A single treatment is an intensive appointment tailored to the hair’s current condition. A light trim of damaged ends is included; a full haircut is a separate €35 service.',
    'The three-treatment programme is designed to improve condition, strength and manageability over time. Each appointment is adjusted as the hair responds and recovers.',
    'The five-treatment programme suits hair requiring consistent, longer-term care. Each session builds on the previous one and includes ongoing assessment and adapted home-care advice.',
  ],
};

export const gracefullyGrey: ServiceGroup = {
  id: 'gracefully-grey',
  title: 'Gracefully Grey',
  sharedCopy:
    'A personal consultation for clients who want to embrace their natural grey or gradually transition from coloured hair. We assess the regrowth, existing colour, condition and desired result before determining the treatment plan, required time and estimated price.',
  options: [
    { name: 'Gracefully Grey Consultation', priceType: 'fixed', amount: 25, duration: '30 min' },
    {
      name: 'Gracefully Grey Colour Treatment',
      copy: 'Can only be booked after completing a Gracefully Grey consultation. The personalised treatment may include highlights, lowlights, colour blending, colour removal or toning.',
      priceType: 'quote',
    },
  ],
  notes: [
    'The €25 consultation fee will be fully deducted from your first Gracefully Grey colour treatment.',
  ],
};

export const headMassage: ServiceGroup = {
  id: 'head-massage',
  title: 'Indian Head Massage',
  options: [
    { name: 'Indian Head Massage', copy: 'A relaxing massage focusing on the scalp, temples, neck and upper shoulders. It helps release tension and create a deep sense of calm.', priceType: 'fixed', amount: 39, duration: '30 min' },
    { name: 'Extended Indian Head Massage', copy: 'More time to focus on the scalp, temples, neck and shoulders and release built-up tension.', priceType: 'fixed', amount: 55, duration: '45 min' },
  ],
};

export const superloop: ServiceGroup = {
  id: 'superloop',
  title: 'Superloop',
  sharedCopy:
    'A volumising treatment intended to make hair appear fuller, especially suitable when the hair on top is no longer than 15 cm. The result lasts approximately six weeks. After the treatment the hair is blow-dried and styled, and it can be combined with a haircut.',
  options: [
    { name: 'Superloop volumising treatment', priceType: 'from', amount: 89 },
  ],
  notes: [
    'Appointment duration and eligibility are agreed personally. Contact Maison Coiffure to discuss whether a Superloop suits your hair before booking.',
  ],
};

export const coaching: ServiceGroup = {
  id: 'coaching',
  title: 'Coaching at Maison Coiffure',
  sharedCopy:
    'The hairdresser’s chair offers a natural, less clinical setting in which meaningful conversation can flow more easily. Normal empathy, listening and personal attention remain part of every hair appointment and are never charged as coaching unless you have explicitly booked a coaching service.',
  options: [
    {
      name: 'First Coaching Introduction in the Hairdresser’s Chair',
      copy: 'A gentle first impression of coaching during your hair treatment. We briefly explore what is happening in your life, where you may feel stuck and what kind of support could help you move forward. This is not a full coaching session.',
      priceType: 'fixed',
      amount: 25,
      duration: 'approx. 20-30 min within your appointment',
    },
    {
      name: 'Coaching in the Hairdresser’s Chair',
      copy: 'For returning coaching clients. While caring for your hair, we explore a life transition, limiting pattern, difficult decision or emotional block in a setting that feels natural and less formal than a traditional coaching room.',
      priceType: 'fixed',
      amount: 55,
      duration: 'approx. 45-60 min within a suitable treatment',
    },
    {
      name: 'Private Professional Coaching Session',
      copy: 'A dedicated, uninterrupted session for people who feel stuck, are experiencing a difficult transition or want to understand recurring emotional or relational patterns.',
      priceType: 'fixed',
      amount: 85,
      duration: '60 min',
    },
  ],
  notes: [
    'Coaching is optional and always explicitly booked. If painful or traumatic experiences require deeper attention, or if hypnosis may be helpful, this is only offered during a separate, uninterrupted private session.',
    'Coaching at Maison Coiffure is intended for personal development and psychosocial support. It does not replace medical, psychiatric or specialist mental-health treatment.',
  ],
};

/** Categories for the booking journey and treatments index. */
export const bookingCategories: { label: string; groups: ServiceGroup[] }[] = [
  { label: 'Haircuts', groups: [haircuts, curlyHaircuts] },
  { label: 'Styling', groups: [signatureBlowDry] },
  { label: 'Colour', groups: [colourConsultation, permanentColour, semiPermanentColour, toner] },
  { label: 'Highlights', groups: [foilHighlights, capHighlights] },
  { label: 'Hair Care', groups: [...hairCare, recoveryProgramme] },
  { label: 'Superloop', groups: [superloop] },
  { label: 'Gracefully Grey', groups: [gracefullyGrey] },
  { label: 'Massage', groups: [headMassage] },
  { label: 'Coaching', groups: [coaching] },
];
