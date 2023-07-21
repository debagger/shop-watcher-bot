<template>
  <q-page class="q-pa-xl row items-start q-gutter-md">
    <div :class="['col-md-12', item.result.okResult ? 'bg-light-green-2' : 'bg-red-2', 'q-ma-none', 'text-body2']"
      v-for="item in finishedTasks" :key="item">
        workerId: [{{ item.workerId }}] {{ item.result?.testType.name }}
        {{ `socks${item.result?.protocol}://${item.result?.testedProxy.host}:${item.result?.testedProxy.port}` }}
        {{ `${item.result?.okResult ? 'OK' : item.result?.errorResult.message}` }}
    </div>

    <q-card v-for="worker in workers" :key="worker.workerId">
      <q-card-section horizontal>
        <q-card-section>
          {{ worker.workerId }}
        </q-card-section>
        <q-separator vertical />
          <q-card-section v-if="worker.currentTask">
            {{ worker.currentTask.name }} <br />
            {{
              `${worker.currentTask.protocol}://${worker.currentTask.host}:${worker.currentTask.port}`
            }}
          </q-card-section>
          <q-card-section v-else>No task</q-card-section>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import {
  useProxyTesterWorkerStateQuery,
  useWorkerTaskFinishSubscription,
} from '../graphql';

export default defineComponent({
  setup() {
    const { result: WorkerStateResult } = useProxyTesterWorkerStateQuery({ pollInterval: 1000 });
    const workers = computed(
      () => WorkerStateResult.value?.proxyTesterWorkerState.workers ?? []
    );

    const { result: TaskFinishedResult } = useWorkerTaskFinishSubscription();
    const taskFinished = computed(() => TaskFinishedResult.value?.onTaskFinish ?? null);
    const finishedTasks = ref<any[]>([]);
    watch(taskFinished, (task) => {
      if (task) finishedTasks.value.push(task);
      if (finishedTasks.value.length > 10) finishedTasks.value.shift()
    });
    return { workers, finishedTasks };
  },
});
</script>
