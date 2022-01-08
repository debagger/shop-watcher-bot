<template>
  <q-page class="row items-center justify-evenly">
    <example-component
      title="Example component"
      active
    ></example-component>
  </q-page>
</template>

<script lang="ts">
import ExampleComponent from 'src/components/BrowserStateComponent.vue';
import { defineComponent} from 'vue';

export default defineComponent({
  name: 'PageIndex',
  components: { ExampleComponent },
  setup() {
    return {  };
  }
});
</script>
