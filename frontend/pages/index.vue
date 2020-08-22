<template>
  <b-container>
    {{linksData}}
  </b-container>
</template>

<script lang="ts">
import Vue from 'vue'
import { NuxtAxiosInstance } from '@nuxtjs/axios'

export default Vue.extend({
  data() {
    return {
      linksData: {},
    }
  },
  async mounted() {
    const token = this.$route.query.token
    if (token) {
      const loginResponse: any = await this.$auth.loginWith('local', {
        data: { token },
      })
      this.$auth.setUser(loginResponse.data)
      const linksResponse = await this.$axios.$get('/api/user-links')
      console.log("linksResponse = ", linksResponse)
      this.linksData = linksResponse
    }
  },
})
</script>

<style>
</style>
