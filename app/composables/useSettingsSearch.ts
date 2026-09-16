import type { ComputedRef, InjectionKey, Ref } from 'vue';

interface SearchScope {
  /** An ancestor matched the query, so everything below is shown. */
  forced: ComputedRef<boolean>;
  register(visible: Ref<boolean>): () => void;
}

const SCOPE: InjectionKey<SearchScope> = Symbol('settings-search-scope');

function useQueryRegex() {
  const store = useSettingsStore();
  return computed(() => {
    const query = store.search.trim();
    return query ? new RegExp(escapeRegExp(query), 'i') : null;
  });
}

function keywordsMatch(regex: RegExp, keywords?: string) {
  return !!keywords && keywords.split(';').some((keyword) => regex.test(keyword));
}

/**
 * A searchable container (article or group): visible when its keywords match
 * or any child is visible. Matching forces all descendants visible.
 */
export function useSearchContainer(keywords: () => string | undefined) {
  const regex = useQueryRegex();
  const parent = inject(SCOPE, null);
  const children = shallowReactive(new Set<Ref<boolean>>());

  const matched = computed(
    () => regex.value === null || parent?.forced.value === true || keywordsMatch(regex.value, keywords()),
  );
  const visible = computed(() => matched.value || [...children].some((child) => child.value));

  provide(SCOPE, {
    forced: matched,
    register(child) {
      children.add(child);
      return () => children.delete(child);
    },
  });

  if (parent) {
    const unregister = parent.register(visible);
    onBeforeUnmount(unregister);
  }

  return visible;
}

/** A searchable leaf, matched by keywords or its visible text. */
export function useSearchItem(keywords: () => string | undefined, text: () => string | undefined) {
  const regex = useQueryRegex();
  const parent = inject(SCOPE, null);

  const visible = computed(() => {
    if (regex.value === null || parent?.forced.value) return true;
    const label = text();
    return keywordsMatch(regex.value, keywords()) || (!!label && regex.value.test(label));
  });

  if (parent) {
    const unregister = parent.register(visible);
    onBeforeUnmount(unregister);
  }

  return visible;
}
