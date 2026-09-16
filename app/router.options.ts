import type { RouterConfig } from '@nuxt/schema';

export default {
  // The URL hash holds board state (`#x=…&y=…`), not an element to scroll to.
  scrollBehavior: () => false,
} satisfies RouterConfig;
