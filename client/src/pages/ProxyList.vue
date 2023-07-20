<template>
  <q-page class="row">
    <q-card class="col-2">
      <q-card-section>
        <div class="text-h6">Filters</div>
      </q-card-section>

      <q-separator />
      <proxy-list-filters />
      <q-separator />
      <q-card-section>
        <div class="text-h6">Actions</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-btn @click="deleteSelectedProxies">Delete({{ selected.length }})</q-btn>
      </q-card-section>
    </q-card>

    <proxy-list-table :rows="rows" :total-rows-number="totalRowsNumber" v-model:selected="selected" :loading="loading" />

    <q-dialog persistent v-model="proxyDeletionProgress.show">
      <q-card>
        <q-card-section>
          <div class="text-h6">Proxy deletion progress</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-linear-progress :value="proxyDeletionProgress.progress"></q-linear-progress>
          {{ proxyDeletionProgress.message }}
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, toValue, readonly } from 'vue';

import {
  useGetProxiesPageQuery,
  GetProxiesPageQuery,
  ProxyQuerySortEnum,
  Proxy,
  useDeleteProxyMutation,
  GetProxiesPageQueryVariables,
} from '../graphql';
import { ReturnAsyncType } from '../type.tools';
import { useProxyListPageRouteQuery } from './../components/ProxyList/ProxyListPageDefaults';
import ProxyListFilters from './../components/ProxyList/ProxyListFilters.vue'
import ProxyListTable from './../components/ProxyList/ProxyListTable.vue'

export default defineComponent({
  components: { ProxyListFilters, ProxyListTable },
  setup() {

    const rows = ref<GetProxiesPageQuery['proxiesPage']['rows']>([]);

    const selected = ref<Proxy[]>([]);

    const routeQueryData = useProxyListPageRouteQuery()

    const variables = computed<GetProxiesPageQueryVariables>(() => {
      const res: GetProxiesPageQueryVariables = {
        page: toValue(routeQueryData.page),
        rowsPerPage: toValue(routeQueryData.rowsPerPage),
        descending: toValue(routeQueryData.descending),
        hasNoTests: toValue(routeQueryData.hasNoTests),
        hasSuccessTests: toValue(routeQueryData.hasSuccessTests),
        sortBy: toValue(routeQueryData.sortBy)
      }

      if (routeQueryData.testIntervalEnable.value === true)
        res.proxyTestsHoursAgo = toValue(routeQueryData.proxyTestsHoursAgo)

      return res
    }
    )

    const { onResult, loading, refetch } = useGetProxiesPageQuery(variables);

    const totalRowsNumber = ref(0)

    type RefetchReturnType = ReturnAsyncType<typeof refetch>;

    const update: (arg: RefetchReturnType) => void = ({ loading, data }) => {
      if (loading) return;
      totalRowsNumber.value = data.proxiesPage.pagination.rowsNumber;
      rows.value = data.proxiesPage.rows;
      selected.value = []
    };

    onResult(update);

    onMounted(async () => {
      loading.value = true;
      const refetchPromise = refetch();
      if (refetchPromise) {
        const res = await refetchPromise.finally(() => (loading.value = false));
        update(res);
      }
    });

    const sortOptions = readonly([
      ProxyQuerySortEnum.Id,
      ProxyQuerySortEnum.SuccessTestCount,
      ProxyQuerySortEnum.SuccessTestRate,
      ProxyQuerySortEnum.TestsCount,
      ProxyQuerySortEnum.LastSeenOnSourcesHoursAgo,
    ]);

    const proxyDeletionProgress = ref({
      show: false,
      progress: 0,
      message: '',
    });
    const { mutate: deleteProxy } = useDeleteProxyMutation({});

    const deleteSelectedProxies = async () => {
      proxyDeletionProgress.value.show = true;
      try {
        proxyDeletionProgress.value.progress = 0;
        proxyDeletionProgress.value.message = '';
        let count = 0;
        for (const proxy of selected.value) {
          try {
            await deleteProxy({ Id: proxy.id });
            proxyDeletionProgress.value.message = `Proxy id: ${proxy.id} deleted`;
          } catch (error: any) {
            proxyDeletionProgress.value.message = error.message;
          }
          ++count;
          proxyDeletionProgress.value.progress = count / selected.value.length;
        }
      } catch (error) {
        console.log(error);
      } finally {
        selected.value = [];
        await refetch();
        proxyDeletionProgress.value.show = false;
      }
    };

    return {
      queryData: routeQueryData,
      deleteSelectedProxies,
      proxyDeletionProgress,
      selected,
      testItervalLabelIndex: ref(0),
      variables,
      sortOptions,
      rows,
      totalRowsNumber,
      loading,
      getSelectedString() {
        return selected.value.length === 0
          ? ''
          : `${selected.value.length} record${selected.value.length > 1 ? 's' : ''
          } selected`;
      },
    };
  },
});
</script>
