<template>
      <div class="row fit row wrap justify-start items-start content-around" v-if="knownHosts">
      <q-card class="col-auto self-stretch q-ma-sm" v-for="host in knownHosts" :key="host.hostName">
        <q-card-section>
          <p class="text-h6">{{ host.hostName }}</p>
        </q-card-section>
        <q-list class="q-pb-md">
          <q-item v-for="proxy in host.proxiesBestList" :key="proxy.proxyAddress" dense>
            <q-item-section no-wrap>
              <q-item-label>{{ proxy.proxyAddress }}</q-item-label>
              <q-linear-progress size="md" rounded :value="proxy.rating / sumRate(host)" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>
  
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useKnownHostsQuery, KnownHostModel } from '../graphql'
// import {Unpacked} from '../type.tools'

export default defineComponent({
  name: 'CompositionComponent',
  setup() {
    const { result } = useKnownHostsQuery({
      pollInterval: 1000,
    });

    const sumRate = (host: KnownHostModel) =>
      host.proxiesBestList ? host.proxiesBestList.reduce(
        (acc: number, item) => (acc += item.rating),
        0
      ) : Number.NaN;

    const knownHosts = computed(
      () => result.value?.browserManagerState.knownHosts ?? []
    );

    return {
      knownHosts,
      sumRate,
    };
  },
});
</script>
