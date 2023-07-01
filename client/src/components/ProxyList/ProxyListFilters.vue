<template>
    <q-card-section>
        <div class="text-overline">Sort by</div>
        <q-select :options="sortOptions" v-model="sortBy" />
        <q-toggle v-model="descending" label="Descending" />
    </q-card-section>
    <q-separator />
    <q-card-section>
        <div class="text-overline">Tests modifiers</div>
        <q-toggle :indeterminate-value="null" toggle-indeterminate v-model="hasNoTests" label="Has no tests" />
        <q-toggle :indeterminate-value="null" toggle-indeterminate v-model="hasSuccessTests" label="Has success tests" />
    </q-card-section>
    <q-separator />
    <q-card-section>
        <div class="text-overline">Tests interval</div>
        <q-toggle v-model="testIntervalEnable" label="Enable" />
        <br />
        <q-badge color="grey-6">{{ testIntervalLabel }}</q-badge>
        <q-slider v-model="testIntervalIndex" @change="(val) => testIntervalIndex = val" :min="0"
            :max="testIntervals.length - 1" :label-value="testIntervalLabel" markers label snap switch-label-side
            :disable="!testIntervalEnable" />
    </q-card-section>
</template>
<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { ProxyQuerySortEnum } from './../../graphql'
import { useProxyListPageRouteQuery } from './ProxyListPageDefaults'
export default defineComponent({
    setup() {

        const sortOptions = ref(Object.values(ProxyQuerySortEnum));
        const { sortBy, descending, hasNoTests, hasSuccessTests, proxyTestsHoursAgo, testIntervalEnable } = useProxyListPageRouteQuery()

        const testIntervals = [
            { label: '1 hour', value: 1 },
            { label: '3 hours', value: 3 },
            { label: '6 hours', value: 6 },
            { label: '12 hours', value: 12 },
            { label: '1 day', value: 24 },
            { label: '3 days', value: 3 * 24 },
            { label: '5 days', value: 5 * 24 },
            { label: '1 week', value: 7 * 24 },
            { label: '2 weeks', value: 2 * 7 * 24 },
            { label: '4 weeks', value: 4 * 7 * 24 },
            { label: '8 weeks', value: 8 * 7 * 24 },
        ];


        const testIntervalIndex = computed({
            get: () => testIntervals.findIndex(i => i.value === proxyTestsHoursAgo.value),
            set: (i) => proxyTestsHoursAgo.value = testIntervals[i].value
        });

        const testIntervalLabel = computed(() => testIntervalIndex.value < 0 ? '-' : testIntervals[testIntervalIndex.value].label)


        return {
            sortBy,
            descending,
            sortOptions,
            hasNoTests,
            hasSuccessTests,
            testIntervalEnable,
            testIntervalIndex,
            testIntervalLabel,
            testIntervals,
        }
    }
})
</script>