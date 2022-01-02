<template>
  <div class="row" v-if='result?.browserManagerState'>
        <q-card class="col-3 q-ma-sm" v-for="host in result.browserManagerState.knownHosts" :key="host.hostName">
          <q-card-section>
               <p class="text-h6">{{host.hostName}}</p>
          </q-card-section>
          <q-markup-table dense>
            <tbody>
              <tr v-for="proxy in host.proxiesBestList" :key="proxy.proxyAddress">
                <td>{{proxy.proxyAddress}}</td>
                <td>{{proxy.rating}}</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card>
  </div>

</template>

<script lang="ts">
import { defineComponent, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';

export default defineComponent({
  name: 'CompositionComponent',
  setup() {
    const { result } = useQuery(gql`
      query {
        browserManagerState {
          knownHosts {
            hostName
            proxiesBlackList
            proxiesBestList {
              proxyAddress
              rating
            }
          }
        }
      }
    `, null, {pollInterval: 1000});

    watch(result, (v)=>console.log(v))

    return {
      result,
    };
  },
});
</script>
