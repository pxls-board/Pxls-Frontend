import crel from 'crel';

type AttrHandler = (element: HTMLElement, value: never) => void;

// Same helpers the old client registered; the admin script relies on them.
const attrMap = crel.attrMap as Record<string, AttrHandler>;
attrMap.onmousemiddledown = (element: HTMLElement, handler: (event: MouseEvent) => void) => {
  element.addEventListener('mousedown', function (this: HTMLElement, event) {
    if (event.button === 1) handler.call(this, event);
  });
};
attrMap.dataset = (element: HTMLElement, values: Record<string, string | undefined>) => {
  for (const [key, value] of Object.entries(values)) {
    if (value) element.dataset[key] = value;
  }
};

// pxlsMarkdown (and the staff admin script) expect a global `crel`, read when
// the library loads. Import this module before `pxlsMarkdown.min.js`.
const w = window as unknown as { crel?: unknown };
w.crel ??= crel;
