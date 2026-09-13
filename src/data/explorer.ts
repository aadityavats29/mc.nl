/**
 * Treatment explorer rows: the eight treatment submenu destinations.
 * Summaries and previews use current MC material; prices referenced in
 * previews come from the shared catalogue in services.ts.
 */
import {
  haircuts,
  curlyHaircuts,
  colourConsultation,
  foilHighlights,
  capHighlights,
  superloop,
  gracefullyGrey,
  headMassage,
} from './services';

export interface ExplorerRow {
  label: string;
  href: string;
  summary: string;
  preview: string;
}

const adultCut = haircuts.options[0].amount;
const curlyCut = curlyHaircuts.options[0].amount;
const consult = colourConsultation.options[0].amount;
const foilFrom = foilHighlights.options[0].amount;
const capFrom = capHighlights.options[0].amount;
const superloopFrom = superloop.options[0].amount;
const greyConsult = gracefullyGrey.options[0].amount;
const massage = headMassage.options[0];
const massageExt = headMassage.options[1];

export const explorerRows: ExplorerRow[] = [
  {
    label: 'Haircuts',
    href: '/treatments/haircuts',
    summary: 'Every haircut includes a personal consultation, hair wash, haircut and quick blow-dry.',
    preview: `Adult haircuts are €${adultCut} at every length; teen haircuts €30. A Signature Blow-Dry is available for a polished finish.`,
  },
  {
    label: 'Curls',
    href: '/treatments/curls',
    summary: 'Curly hair is cut dry, so its natural movement and individual curl pattern stay visible.',
    preview: `A curly haircut is €${curlyCut} and includes a curl consultation, dry haircut, wash, curl care and styling.`,
  },
  {
    label: 'Colouring',
    href: '/treatments/colouring',
    summary: 'Permanent colour, semi-permanent colour and toner, agreed together in a personal consultation.',
    preview: `First colour, toner or highlight bookings start with a €${consult} consultation, fully deducted from the agreed treatment.`,
  },
  {
    label: 'Highlights / Lowlights',
    href: '/treatments/highlights-lowlights',
    summary: 'Foil and cap highlights with a finishing toner included in every price and appointment.',
    preview: `Foil highlights from €${foilFrom}; cap highlights from €${capFrom}. The finishing toner is always included.`,
  },
  {
    label: 'Superloop',
    href: '/treatments/superloop',
    summary: 'A volumising treatment that makes hair appear fuller, with a result lasting about six weeks.',
    preview: `From €${superloopFrom}. Especially suitable when the hair on top is no longer than 15 cm.`,
  },
  {
    label: 'Grey Hair',
    href: '/treatments/grey-hair',
    summary: 'Gracefully Grey: embrace your natural grey, or transition from coloured hair at your own pace.',
    preview: `A €${greyConsult} consultation shapes a personal plan and quotation, deducted from your first Gracefully Grey treatment.`,
  },
  {
    label: 'Head Massage',
    href: '/treatments/head-massage',
    summary: 'An Indian head massage for the scalp, temples, neck and upper shoulders.',
    preview: `€${massage.amount} for ${massage.duration} or €${massageExt.amount} for ${massageExt.duration} of deep, unhurried calm.`,
  },
  {
    label: 'Salon Party',
    href: '/treatments/salon-party',
    summary: 'A relaxed salon experience together, at your home or at Maison Coiffure.',
    preview: 'Haircuts, styling, treatments and head massages for your group. Both locations work by quote enquiry.',
  },
];
