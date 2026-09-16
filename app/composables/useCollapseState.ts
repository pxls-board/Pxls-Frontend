const STORAGE_KEY = 'settings.collapse.states';

const states = ref<Record<string, boolean>>(ls.get<Record<string, boolean>>(STORAGE_KEY) ?? {});

/** Persisted collapsed state of a panel section (shared by all panels, like before). */
export function useCollapseState(id: MaybeRefOrGetter<string | undefined>) {
  const local = ref(false);
  return computed({
    get: () => {
      const key = toValue(id);
      return key ? states.value[key] === true : local.value;
    },
    set: (collapsed: boolean) => {
      const key = toValue(id);
      if (!key) {
        local.value = collapsed;
        return;
      }
      states.value = { ...states.value, [key]: collapsed };
      ls.set(STORAGE_KEY, states.value);
    },
  });
}
