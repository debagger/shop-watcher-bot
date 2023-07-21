<template>
        <q-table class="col-10" :columns="columns" :rows="rows" :loading="loading" v-model:pagination="pagination"
            @request="onRequest" selection="multiple" :selected="selected" @update:selected="s => $emit('update:selected', s)"
            :selected-rows-label="getSelectedString(selected)" :rows-per-page-options="[10, 20, 50, 100, 250, 500]">
            <template v-slot:body-cell-sources="props">
                <q-td :props="props">
                    <q-list dense>
                        <q-item v-for="sourceItem in props.row.sources" :key="sourceItem">
                            <q-item-section>
                                <q-item-label overline>{{ sourceItem.source.name.toUpperCase() }}
                                </q-item-label>
                                <q-item-label>
                                    <q-badge>{{
                                        date.formatDate(
                                            sourceItem.firstUpdate.updateTime,
                                            'YYYY-MM-DD HH:mm:ss'
                                        )
                                    }}</q-badge>-<q-badge>{{
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
                    <q-linear-progress v-if="props.row.successTestRate" :value="props.row.successTestRate" />
                </q-td>
            </template>
        </q-table>
</template>
<script lang="ts">
import { defineComponent, PropType, ref, watchEffect } from 'vue'
import { date, QTable, QTableProps } from 'quasar';
import { useProxyListPageRouteQuery } from './ProxyListPageDefaults'
import { GetProxiesPageQuery, Proxy } from './../../graphql';

export default defineComponent({
    props: {
        rows: Object as PropType<GetProxiesPageQuery['proxiesPage']['rows']>,
        totalRowsNumber: Number,
        loading: Boolean,
        selected: Object as PropType<Proxy[]>
    },
    emits: ['update:selected'],
    setup(props) {

        const columns: QTableProps['columns'] = [
            { name: 'id', label: 'id', field: 'id' },
            { name: 'host', label: 'host', field: 'host' },
            { name: 'port', label: 'port', field: 'port' },
            { name: 'sources', label: 'Sources', align: 'left', field: r => r },
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
            { name: 'tests', label: 'Success tests rate', field: r => r },
        ];

        const routeQueryData = useProxyListPageRouteQuery()

        const pagination = ref<QTableProps['pagination']>()

        watchEffect(() => {
            pagination.value = {
                page: routeQueryData.page.value,
                rowsPerPage: routeQueryData.rowsPerPage.value,
                rowsNumber: props.totalRowsNumber
            }
        })

        function getSelectedString(selected: Proxy[] | undefined) {

            return () => selected === undefined || selected.length === 0
                ? ''
                : `${selected.length} record${selected.length > 1 ? 's' : ''
                } selected`;
        }


        const onRequest: QTable['requestServerInteraction'] = (props) => {
            if (!props) return
            if (!props.pagination) return;
            const { page, rowsPerPage } = props.pagination
            if (page) routeQueryData.page.value = page
            if (rowsPerPage) routeQueryData.rowsPerPage.value = rowsPerPage
        };

        return { pagination, date, columns, getSelectedString, onRequest }
    }
})
</script>