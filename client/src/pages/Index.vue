<template>
  <q-page class="fit row wrap justify-evenly items-start content-around">
    <browser-state
      title="Example component"
      active
    ></browser-state>
  </q-page>
</template>

<script lang="ts">
import BrowserState from 'src/components/BrowserStateComponent.vue';
import { defineComponent} from 'vue';

export default defineComponent({
  name: 'PageIndex',
  components: { BrowserState },
  setup() {
    return {  };
  }
});
</script>
