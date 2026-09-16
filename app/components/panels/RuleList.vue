<script setup lang="ts">
export type Rule = string | { text: string; children: Rule[] };

withDefaults(defineProps<{ rules: Rule[]; ordered?: boolean }>(), { ordered: true });
</script>

<template>
  <component :is="ordered ? 'ol' : 'ul'">
    <li v-for="(rule, index) in rules" :key="index">
      <!-- Rule texts are our own translations and may contain markup. -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span v-html="$t(typeof rule === 'string' ? rule : rule.text)" />
      <RuleList v-if="typeof rule !== 'string'" :rules="rule.children" :ordered="false" />
    </li>
  </component>
</template>
