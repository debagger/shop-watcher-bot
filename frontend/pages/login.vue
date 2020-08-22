<template>
  <b-container></b-container>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
      q: '',
    }
  },
  async mounted() {
    const token = this.$route.query.token
    if (token) {
      console.log('token = ', token)
      const loginData = await this.$auth.loginWith('local', { data: { token } })
      console.log('loginData = ', loginData)
    }
  },
})
</script>

<style>
</style>
