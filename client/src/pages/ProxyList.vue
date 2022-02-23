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
      <q-separator />
      <q-card-section>
        <div class="text-overline">Tests modifier</div>
        <q-toggle
          :indeterminate-value="null"
          toggle-indeterminate
          v-model="variables.hasNoTests"
          label="Has no tests"
        />
        <q-toggle
          :indeterminate-value="null"
          toggle-indeterminate
          v-model="variables.hasSuccessTests"
          label="Has success tests"
        />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="text-overline">Tests interval</div>
        <q-toggle v-model="testIntervalEnable" label="Enable" />
        <br />
        <q-badge color="grey-6">{{
          testItervals[testIntervalIndex].label
        }}</q-badge>
        <q-slider
          v-model="testItervalLabelIndex"
          @change="
            (val) => {
              testIntervalIndex = val;
            }
          "
          step="1"
          :min="0"
          :max="testItervals.length - 1"
          :label-value="testItervals[testItervalLabelIndex].label"
          markers
          label
          snap
          switch-label-side
          :disable="!testIntervalEnable"
        />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="text-h6">Actions</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-btn @click="deleteSelectedProxies">Delete</q-btn>
      </q-card-section>
    </q-card>
    <q-table
      class="col-10"
      :columns="columns"
      :rows="rows"
      :loading="loading"
      v-model:pagination="pagination"
      @request="onRequest"
      selection="multiple"
      v-model:selected="selected"
      :selected-rows-label="getSelectedString"
      :rows-per-page-options = "[10,20,50,100,250,500]"
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

    <q-dialog persistent v-model="proxyDeletion.show">
      <q-card>
        <q-card-section>
          <div class="text-h6">Proxy deletion progress</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-linear-progress
            :value="proxyDeletion.progress"
          ></q-linear-progress>
          {{ proxyDeletion.message }}
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, watch } from 'vue';

import { QTable, date } from 'quasar';
import {
  useGetProxiesPageQuery,
  GetProxiesPageQuery,
  ProxyQuerySortEnum,
  Proxy,
  useDeleteProxyMutation,
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
      {
        name: 'LastSeenOnSourcesHoursAgo',
        label: 'Last seen on sources hours ago',
        field: 'lastSeenOnSourcesHoursAgo',
      },
      { name: 'totalTests', label: 'Total tests', field: 'testsCount' },
      {
        name: 'successTests',
        label: 'Success tests count',
        field: 'successTestsCount',
      },
      { name: 'tests', label: 'Success tests rate' },
    ];
    const pagination = ref({ page: 1, rowsPerPage: 10, rowsNumber: 1000 });
    const rows = ref<GetProxiesPageQuery['proxiesPage']['rows']>([]);

    const selected = ref<Proxy[]>([]);

    const { onResult, loading, variables, refetch } = useGetProxiesPageQuery({
      page: 1,
      rowsPerPage: 10,
      sortBy: ProxyQuerySortEnum.Id,
      descending: false,
    });

    const onRequest: OnRequestType = (props) => {
      if (props?.pagination?.page && props?.pagination?.rowsPerPage) {
        variables.value = {
          page: props.pagination.page,
          rowsPerPage: props.pagination.rowsPerPage,
          sortBy: variables.value?.sortBy,
          descending: variables.value?.descending,
          hasNoTests: variables.value?.hasNoTests,
          hasSuccessTests: variables.value?.hasSuccessTests,
          proxyTestsHoursAgo: variables.value?.proxyTestsHoursAgo,
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

    const sortOptions = ref([
      ProxyQuerySortEnum.Id,
      ProxyQuerySortEnum.SuccessTestCount,
      ProxyQuerySortEnum.SuccessTestRate,
      ProxyQuerySortEnum.TestsCount,
      ProxyQuerySortEnum.LastSeenOnSourcesHoursAgo,
    ]);

    const testIntervalEnable = ref(false);
    const testIntervalIndex = ref(0);
    const testIntrvalValue = computed(() =>
      testIntervalEnable.value
        ? testItervals[testIntervalIndex.value].value
        : null
    );
    watch(testIntrvalValue, (v) => {
      console.log(v);
      if (variables.value) variables.value.proxyTestsHoursAgo = v;
    });

    const testItervals = [
      { label: '1 hour', value: 1 },
      { label: '3 hours', value: 3 },
      { label: '6 hours', value: 6 },
      { label: '12 hours', value: 12 },
      { label: '1 day', value: 24 },
      { label: '3 days', value: 3 * 24 },
      { label: '5 days', value: 5 * 24 },
      { label: '1 week', value: 7 * 24 },
      { label: '2 week', value: 2 * 7 * 24 },
      { label: '4 week', value: 4 * 7 * 24 },
      { label: '8 week', value: 8 * 7 * 24 },
    ];

    const proxyDeletion = ref({
      show: false,
      progress: 0,
      message: '',
    });

    const { mutate: deleteProxy } = useDeleteProxyMutation({});

    const deleteSelectedProxies = async () => {
      proxyDeletion.value.show = true;
      try {
        proxyDeletion.value.progress = 0;
        proxyDeletion.value.message = '';
        let count = 0;
        for (const proxy of selected.value) {
          try {
            await deleteProxy({ Id: proxy.id });
            proxyDeletion.value.message = `Proxy id: ${proxy.id} deleted`;
          } catch (error: any) {
            proxyDeletion.value.message = error.message;
          }
          ++count;
          proxyDeletion.value.progress = count / selected.value.length;
        }
      } catch (error) {
        console.log(error);
      } finally {
        selected.value = [];
        await refetch(variables.value);
        proxyDeletion.value.show = false;
      }
    };

    return {
      deleteSelectedProxies,
      proxyDeletion,
      selected,
      testItervalLabelIndex: ref(0),
      testItervals,
      testIntervalEnable,
      testIntervalIndex,
      variables,
      sortOptions,
      columns,
      rows,
      pagination,
      loading,
      onRequest,
      date,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      getSelectedString() {
        return selected.value.length === 0
          ? ''
          : `${selected.value.length} record${
              selected.value.length > 1 ? 's' : ''
            } selected`;
      },
    };
  },
});
</script>
