<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui';
import type { ProfileData, ProfileReport } from '~/types/profile';

const props = defineProps<{ data: ProfileData }>();
const { t } = useI18n();

function section(
  label: string,
  reports: ProfileReport[],
  empty: string,
): AccordionItem & { reports: ProfileReport[]; empty: string } {
  const open = reports.filter((report) => !report.closed).length;
  return { label: t(label, [open, reports.length]), reports, empty };
}

const sections = computed(() => [
  section('Canvas Reports ({0}/{1} open)', props.data.canvasReports ?? [], t('There are no canvas reports to show.')),
  section('Chat Reports ({0}/{1} open)', props.data.chatReports ?? [], t('There are no chat reports to show.')),
]);

function reportItems(reports: ProfileReport[]): AccordionItem[] {
  return reports.map((report) => ({
    // translator: e.g. "Report on Bob (open)"
    label: report.closed ? t('Report on {0} (closed)', [report.target]) : t('Report on {0} (open)', [report.target]),
    class: report.closed ? 'text-success' : 'text-warning',
    content: report.message,
    // translator: e.g. "Reported Bob on Jan 1, 1970, 00:00:00 AM"
    description: t('Reported {0} on {1}', [report.target, new Date(report.time * 1000).toLocaleString()]),
  }));
}
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-center text-xl font-semibold">{{ $t('Reports') }}</h3>
    <UCard v-for="item in sections" :key="item.label">
      <UCollapsible>
        <UButton color="info" variant="link" :trailing-icon="ICONS.collapse" class="px-0">{{ item.label }}</UButton>
        <template #content>
          <UAccordion v-if="item.reports.length" :items="reportItems(item.reports)" class="mt-3">
            <template #body="{ item: report }">
              <h6 class="font-semibold">{{ report.description }}</h6>
              <p class="whitespace-pre-line">{{ report.content }}</p>
            </template>
          </UAccordion>
          <p v-else class="mt-3 text-muted">{{ item.empty }}</p>
        </template>
      </UCollapsible>
    </UCard>
  </div>
</template>
