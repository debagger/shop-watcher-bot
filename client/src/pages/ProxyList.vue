<template>
  <q-page class="row">
    <q-card class="col-2">
      <q-card-section>
        <div class="text-h6">Filters</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="text-overline">Sort by</div>
        <q-select :options="sortOptions" v-model="variables.sortBy" />
        <q-toggle v-model="variables.descending" label="Descending" />
      </q-card-section>
      <q-card-section>
        <div class="text-overline">Tests modifier</div>
        <q-toggle v-model="variables.hasNoTests" label="Has no tests" />
        <q-toggle v-model="variables.hasSuccessTests" label="Has success tests" />
      </q-card-section>
    </q-card>
    <q-table
      class="col-10"
      :columns="columns"
      :rows="rows"
      :loading="loading"
      v-model:pagination="pagination"
      @request="onRequest"
    >
      <template v-slot:body-cell-sources="props">
        <q-td :props="props">
          <q-list dense>
            <q-item v-for="sourceItem in props.row.sources" :key="sourceItem">
              <q-item-section>
                <q-item-label overline
                  >{{ sourceItem.source.name.toUpperCase() }}
                </q-item-label>
                <q-item-label>
                  <q-badge>{{
                    date.formatDate(
                      sourceItem.firstUpdate.updateTime,
                      'YYYY-MM-DD HH:mm:ss'
                    )
                  }}</q-badge
                  >-<q-badge>{{
                    date.formatDate(
                      sourceItem.lastUpdate.updateTime,
                      'YYYY-MM-DD HH:mm:ss'
                    )
                  }}</q-badge>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-td>
      </template>

      <template v-slot:body-cell-tests="props">
        <q-td :props="props">
          <q-linear-progress
            v-if="props.row.successTestRate"
            :value="props.row.successTestRate"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';

import { QTable, date } from 'quasar';
import {
  useGetProxiesPageQuery,
  GetProxiesPageQuery,
  ProxyQuerySortEnum,
} from '../graphql';
import { PropType, ReturnAsyncType } from '../type.tools';

type OnRequestType = PropType<QTable, 'requestServerInteraction'>;

export default defineComponent({
  setup() {
    const columns = [
      { name: 'id', label: 'id', field: 'id' },
      { name: 'host', label: 'host', field: 'host' },
      { name: 'port', label: 'port', field: 'port' },
      { name: 'sources', label: 'Sources', align: 'left' },
      { name: 'totalTests', label: 'Total tests', field: 'testsCount' },
      {
        name: 'successTests',
        label: 'Success tests count',
        field: 'successTestsCount',
      },
      { name: 'tests', label: 'Tests' },
    ];
    const pagination = ref({ page: 1, rowsPerPage: 10, rowsNumber: 1000 });
    const rows = ref<GetProxiesPageQuery['proxiesPage']['rows']>([]);

    const { onResult, loading, variables, refetch } = useGetProxiesPageQuery({
      page: 1,
      rowsPerPage: 10,
      sortBy: ProxyQuerySortEnum.Id,
      descending:false
    });

    const onRequest: OnRequestType = (props) => {
      if (props?.pagination?.page && props?.pagination?.rowsPerPage) {
        variables.value = {
          page: props.pagination.page,
          rowsPerPage: props.pagination.rowsPerPage,
          sortBy:variables.value?.sortBy,
          descending: variables.value?.descending,
          hasNoTests: variables.value?.hasNoTests,
          hasSuccessTests: variables.value?.hasSuccessTests
        };
        pagination.value.page = props.pagination.page;
        pagination.value.rowsPerPage = props.pagination.rowsPerPage;
      }
    };

    type RefetchReturnType = ReturnAsyncType<typeof refetch>;

    const update: (arg: RefetchReturnType) => void = ({ loading, data }) => {
      if (loading) return;
      pagination.value.rowsNumber = data.proxiesPage.pagination.rowsNumber;
      rows.value = data.proxiesPage.rows;
    };

    onResult(update);

    onMounted(async () => {
      loading.value = true;
      const refetchPromise = refetch(variables.value);
      if (refetchPromise) {
        const res = await refetchPromise.finally(() => (loading.value = false));
        update(res);
      }
    });

    const sortOptions = ref([ProxyQuerySortEnum.Id, ProxyQuerySortEnum.SuccessTestCount, ProxyQuerySortEnum.SuccessTestRate, ProxyQuerySortEnum.TestsCount]);

    return {
      variables,
      sortOptions,
      columns,
      rows,
      pagination,
      loading,
      onRequest,
      date,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  },
});
</script>
