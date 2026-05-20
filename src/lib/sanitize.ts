import DOMPurify from "isomorphic-dompurify";

const CONFIG = {
  ALLOWED_TAGS: [] as string[],
  ALLOWED_ATTR: [] as string[],
};

export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, CONFIG).trim();
}
