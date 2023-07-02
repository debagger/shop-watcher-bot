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
        <span
          v-if="src.lastUpdate.error"
          class="text-negative cursor-pointer"
          @click="showErrorDialog(src)"
          >Error</span
        >
        <span v-else class="text-positive"
          >New proxies count: {{ src.lastUpdate.newProxiesCount }}</span
        >
      </q-card-section>
    </q-card>


    <q-dialog v-model="errorDialogVisible" full-width>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Error details</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
          <q-card-section v-if="errorContent">
          <div class="text-subtitle2">{{errorContent.message}}</div>
          <pre>{{errorContent.stack}}</pre>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import {
  useProxyListSourcesWithLastUpdateQuery,
  ProxyListSourcesWithLastUpdateQuery,
} from '../graphql';
import { Unpacked, PropType } from './../type.tools';

type ProxyListSource = Unpacked<
  PropType<ProxyListSourcesWithLastUpdateQuery, 'proxyListSources'>
>;

export default defineComponent({
  setup() {
    const { result } = useProxyListSourcesWithLastUpdateQuery();
    const proxyListSources = computed(() => result.value?.proxyListSources ?? []);
    const errorContent = ref<Error>();
    const errorDialogVisible = ref(false);
    const showErrorDialog = (src: ProxyListSource) => {
      errorContent.value = src.lastUpdate.error;
      errorDialogVisible.value = true;
    };
    return {
      proxyListSources,
      errorContent,
      errorDialogVisible,
      showErrorDialog,
    };
  },
});
</script>
