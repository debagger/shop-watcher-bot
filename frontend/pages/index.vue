<template>
  <b-container>
    <b-row>
      <b-col>
        <b-btn variant="primary" v-b-modal.add-link-dlg>Добавить</b-btn>
        <b-list-group>
          <b-list-group-item v-for="(linkData, index) in linksData" :key="index" class="p-0">
            <b-card no-body>
              <b-card-header class="p-0">
                <b-button
                  block
                  @click="toggleVisibility(linkData)"
                  class="m-0"
                >{{linkData.lastCheckResult.name}}</b-button>
              </b-card-header>
              <b-collapse v-model="linkData._visible">
                <b-card-body>
                  <b-container fluid>
                    <b-row>
                      <b-col
                        xl="3"
                        md="6"
                        class="mb-1 px-2"
                        v-for="size in linkData.lastCheckResult.sizes"
                        :key="index + size.size"
                      >
                        <b-card
                          no-body
                          :class="size.disabled?'p-2 bg-danger text-white':'p-2 bg-success text-white'"
                        >
                          <b-row no-gutters>
                            <b-col cols="10" class="align-middle">{{size.size}}</b-col>
                            <b-col cols="2" class="text-right align-middle">
                              <b-form-checkbox :checked="linkData.trackFor.includes(size.size)"></b-form-checkbox>
                            </b-col>
                          </b-row>
                        </b-card>
                      </b-col>
                    </b-row>
                  </b-container>
                </b-card-body>
                <b-card-footer>
                  <b-link :href="linkData.link" target="_blank">Перейти на сайт</b-link>
                </b-card-footer>
              </b-collapse>
            </b-card>
          </b-list-group-item>
        </b-list-group>
      </b-col>
    </b-row>
    <b-modal id="add-link-dlg" title="Add new link" @ok="addNewLink">
      <b-form>
        <b-input v-model="newLink"></b-input>
      </b-form>
    </b-modal>
  </b-container>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
      newLink: '',
      linksData: [],
    }
  },
  methods: {
    async addNewLink() {
      const resp = await this.$axios.$post('/api/user-links', {
        link: this.newLink,
      })
      this.loadData()
    },
    toggleVisibility(linkData: any) {
      this.linksData.forEach((i: any) => (i._visible = false))
      linkData._visible = !linkData._visible
    },
    async loadData() {
      const chatId = this.$auth.user.chat.id
      const data = await this.$axios.$get('/api/user-links')
      data.forEach((element: any) => {
        element._visible = false
      })
      this.linksData = data
    },
  },
  async mounted() {
    this.loadData()
  },
})
</script>

<style>
</style>
