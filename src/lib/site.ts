/** Public contact details and the site's address, in one place. */

// Set NEXT_PUBLIC_SITE_URL once the custom domain exists. Until then,
// Vercel's production URL is used, then localhost for development.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const WHATSAPP = "96894435394";
export const EMAIL = "xkhalilalblushi@gmail.com";
export const GITHUB = "https://github.com/khalil-div";
export const LINKEDIN = "https://www.linkedin.com/in/khalil-al-blushi";

export const whatsappLink = (message: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
