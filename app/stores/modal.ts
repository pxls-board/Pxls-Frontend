import type { Component } from 'vue';

export interface ModalOptions {
  /** Close every open modal first. */
  closeExisting?: boolean;
  /** Allow closing with Escape / clicking outside. */
  escapeClose?: boolean;
  clickClose?: boolean;
  /** Hide the close button. */
  hideClose?: boolean;
  class?: string;
}

type DomPart = Node | Node[] | string | null | undefined;

export interface ModalEntry {
  id: number;
  open: boolean;
  title?: string | Node[];
  body?: Node[];
  footer?: Node[];
  component?: Component;
  props?: Record<string, unknown>;
  options: Required<Pick<ModalOptions, 'escapeClose' | 'clickClose' | 'hideClose'>> & { class?: string };
  onClose: Array<() => void>;
}

export interface ModalHandle {
  id: number;
  close(): void;
  onClose(callback: () => void): ModalHandle;
}

const PARTS = Symbol('pxls-modal-parts');

interface BuiltModal extends HTMLElement {
  [PARTS]?: { header?: Node[]; body?: Node[]; footer?: Node[] };
}

function toNodes(part: DomPart | DomPart[]): Node[] | undefined {
  if (part == null) return undefined;
  const list = Array.isArray(part) ? part : [part];
  return list
    .flat()
    .filter((item): item is Node | string => item != null)
    .map((item) => (typeof item === 'string' ? document.createTextNode(item) : item));
}

let nextId = 1;

export const useModalStore = defineStore('modal', () => {
  const stack = ref<ModalEntry[]>([]);

  function push(entry: Omit<ModalEntry, 'id' | 'open' | 'onClose' | 'options'>, options: ModalOptions = {}) {
    if (options.closeExisting !== false) {
      closeAll();
    }
    const id = nextId++;
    stack.value.push(
      markRaw({
        ...entry,
        id,
        open: true,
        onClose: [],
        options: {
          escapeClose: options.escapeClose ?? true,
          clickClose: options.clickClose ?? true,
          hideClose: options.hideClose ?? false,
          class: options.class,
        },
      }) as ModalEntry,
    );
    const handle: ModalHandle = {
      id,
      close: () => close(id),
      onClose(callback) {
        stack.value.find((item) => item.id === id)?.onClose.push(callback);
        return handle;
      },
    };
    return handle;
  }

  function close(id: number) {
    const index = stack.value.findIndex((item) => item.id === id);
    if (index === -1) return;
    const [entry] = stack.value.splice(index, 1);
    entry?.onClose.forEach((callback) => callback());
  }

  function closeTop() {
    const top = stack.value.at(-1);
    if (top) close(top.id);
    return top;
  }

  function closeAll() {
    while (stack.value.length > 0) {
      closeTop();
    }
  }

  /** Shows a Vue component. It receives a `close` prop. */
  function showComponent(
    component: Component,
    props: Record<string, unknown> = {},
    options?: ModalOptions & { title?: string },
  ) {
    return push({ component: markRaw(component), props, title: options?.title }, options);
  }

  /** Shows a DOM element, typically one made by `buildDom`. */
  function show(element: HTMLElement, options?: ModalOptions): ModalHandle {
    if (!(element instanceof HTMLElement)) {
      throw new TypeError('Invalid modal object supplied. Expected an HTMLElement');
    }
    const parts = (element as BuiltModal)[PARTS];
    if (parts) {
      return push({ title: parts.header, body: parts.body, footer: parts.footer }, options);
    }
    return push({ body: [element] }, options);
  }

  function showText(text: string, opts: { title?: string; modalOpts?: ModalOptions } = {}) {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    return push({ title: opts.title ?? 'Pxls', body: [paragraph] }, opts.modalOpts);
  }

  /** Builds a modal element from DOM parts (kept for the admin script and userscripts). */
  function buildDom(
    header?: DomPart | DomPart[],
    body?: DomPart | DomPart[],
    footer?: DomPart | DomPart[],
  ): HTMLElement {
    const element = document.createElement('div') as BuiltModal;
    element.className = 'modal';
    element[PARTS] = { header: toNodes(header), body: toNodes(body), footer: toNodes(footer) };
    return element;
  }

  return { stack, show, showText, showComponent, buildDom, close, closeTop, closeAll };
});

/** The object exposed as `App.modal` and passed to the admin script. */
export function useModal() {
  const store = useModalStore();
  return {
    show: store.show,
    showText: store.showText,
    showComponent: store.showComponent,
    buildDom: store.buildDom,
    buildCloser: () => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = '×';
      button.addEventListener('click', () => store.closeTop());
      return button;
    },
    closeTop: () => {
      store.closeTop();
    },
    closeAll: () => store.closeAll(),
  };
}
