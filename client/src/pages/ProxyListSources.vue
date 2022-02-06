<template>
  <q-page class="q-pa-xl row items-start q-gutter-md">
    <q-card
      :class="src.lastUpdate.error ? 'bg-red-2' : ''"
      v-for="src in proxyListSources"
      :key="`proxyListSource_${src.name}`"
    >
      <q-card-section class="text-overline text-weight-bold">
        {{ src.name }}
      </q-card-section>
      <q-card-section>
        Last update <br />
        Updated at: {{ src.lastUpdate.updateTime }}<br />
        <span v-if="src.lastUpdate.error" class="text-negative">Error</span>
        <span v-else class="text-positive"
          >New proxies count: {{ src.lastUpdate.newProxiesCount }}</span
        >
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useProxyListSourcesWithLastUpdateQuery } from '../graphql';
import { useResult } from '@vue/apollo-composable';

export default defineComponent({
  setup() {
    const { result } = useProxyListSourcesWithLastUpdateQuery();
    const proxyListSources = useResult(result, [], (r) => r.proxyListSources);
    return { proxyListSources };
  },
});
</script>
