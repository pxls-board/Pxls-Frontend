declare module '#build/nuxt-icon-client-bundle' {
  // oxlint-disable-next-line typescript/no-explicit-any
  export function init(addIcon: (name: string, data: any) => boolean): void;
}

declare module '*.po?raw' {
  const source: string;
  export default source;
}

// Loaded lazily for the staff admin script only.
declare module 'jquery';
declare module 'crel';
