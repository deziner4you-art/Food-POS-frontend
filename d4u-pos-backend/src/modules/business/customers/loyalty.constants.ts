/**
 * Rupees credited per redeemed loyalty point. Single source of truth — do not
 * hardcode this conversion rate anywhere else; consumers (POS client, CMS
 * settings response) should read it from here or from the backend response
 * that echoes it, never duplicate the literal.
 */
export const LOYALTY_POINT_VALUE = 0.2;
