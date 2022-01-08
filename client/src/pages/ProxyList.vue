<template>
  <q-page>
    <q-table
      :columns="columns"
      :rows="rows"
      :loading="loading"
      v-model:pagination="pagination"
      @request="onRequest"
    >
      <template v-slot:body-cell-sources="props">
        <q-td :props="props">
          <ul>
            <li v-for="sourceItem in props.row.sources" :key="sourceItem">
              {{sourceItem.source.name}}
            </li>
          </ul>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';

const query = gql`
  query ($page: Int!, $rowsPerPage: Int!) {
    proxiesPage(page: $page, rowsPerPage: $rowsPerPage) {
      pagination {
        page
        rowsPerPage
        rowsNumber
      }
      rows {
        id
        host
        port
        sources {
          source {
            name
          }
          firstUpdate {
            updateTime
          }
          lastUpdate {
            updateTime
          }
        }
      }
    }
  }
`;

export default defineComponent({
  setup() {
    const columns = [
      { name: 'id', label: 'id', field: 'id' },
      { name: 'host', label: 'host', field: 'host' },
      { name: 'port', label: 'port', field: 'port' },
      { name: 'sources', label: 'Sources' },
    ];
    const pagination = ref({ page: 1, rowsPerPage: 10, rowsNumber: 1000 });
    const rows = ref([]);

    const { onResult, loading, variables, refetch } = useQuery(query, {
      page: 1,
      rowsPerPage: 10,
    });

    function onRequest(props) {
      variables.value = {
        page: props.pagination.page,
        rowsPerPage: props.pagination.rowsPerPage,
      };
      pagination.value.page = props.pagination.page;
      pagination.value.rowsPerPage = props.pagination.rowsPerPage;
    }

    function update({ loading, data }) {
      if (loading) return;
      pagination.value.rowsNumber = data.proxiesPage.pagination.rowsNumber;
      rows.value = data.proxiesPage.rows;
    }

    onResult(update);

    onMounted(async () => {
      loading.value = true;
      update(
        await refetch(variables.value).finally(() => (loading.value = false))
      );
    });
    return { columns, rows, pagination, loading, onRequest };
  },
});
</script>
