<template>
  <div class="row" v-if="knownHosts">
    <q-card
      class="col-3 q-ma-sm"
      v-for="host in knownHosts"
      :key="host.hostName"
    >
      <q-card-section>
        <p class="text-h6">{{ host.hostName }}</p>
      </q-card-section>
      <q-list class="q-pb-md">
        <q-item
          clickable="false"
          v-for="proxy in host.proxiesBestList"
          :key="proxy.proxyAddress"
          dense
        >
          <q-item-section>
            <q-item-label>{{ proxy.proxyAddress }}</q-item-label>
            <q-linear-progress
              size="md"
              rounded
              :value="proxy.rating / sumRate(host)"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useQuery, useResult } from '@vue/apollo-composable';
import { knownHostsQuery } from '../queries';
import { knownHosts } from '../__generated__/known-hosts';
import {Unpacked} from '../type.tools'


type knownHostType = Unpacked<knownHosts['browserManagerState']['knownHosts']>;


export default defineComponent({
  name: 'CompositionComponent',
  setup() {
    const { result } = useQuery<knownHosts>(knownHostsQuery, null, {
      pollInterval: 1000,
    });

    const sumRate = (host: knownHostType) =>
      host.proxiesBestList?host.proxiesBestList.reduce(
        (acc: number, item) => (acc += item.rating),
        0
      ):Number.NaN;

    const knownHosts = useResult(
      result,
      null,
      (data) => data.browserManagerState.knownHosts
    );

    return {
      knownHosts,
      sumRate,
    };
  },
});
</script>
