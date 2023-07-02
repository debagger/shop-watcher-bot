<template>
  <q-page padding>
    <div class="q-ma-md row">
      <div class="col-md-2 q-pa-md"></div>
      <div class="col-md-10 q-pa-md" v-if="selectedUserDialogs">
          <div v-for="dialog in selectedUserDialogs" :key="`userDialog_${dialog.id}`">
            <q-separator spaced />
            <q-chat-message :text="[formatUri(dialog.inputMessage)]" :stamp="dialog.startTime" :name="selectedUserName"
              sent />
            <q-chat-message v-for="answer in dialog.answers" :text="[formatUri(answer.text)]" :key="`answer${answer.id}`"
              :stamp="answer.answerTime" name="bot" />
          </div>
        </div>
      </div>
      <q-page-sticky position="top-left" :offset="[18, 18]">
        <q-list bordered separator>
          <q-item clickable v-ripple v-for="user in telegramUsers" :key="`telegramUser_${user.id}`"
            @click="selectUser(user)">
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white">
              {{ user.first_name[0] }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label overline> {{ user.first_name }}</q-item-label>
            <q-item-label>{{ user.username }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import {
  useTelegramUsersQuery,
  useTelegramUserQuery,
} from '../graphql';
export default defineComponent({
  setup() {
    const { result: telegramUsersResult } = useTelegramUsersQuery({
      pollInterval: 3000,
    });

    const telegramUsers = computed(
      () => telegramUsersResult.value?.telegramUsers ?? []
    );
    const selectedUserVar = ref({ userId: 0, take: 100, skip: 0 });
    const { result: selectedTelegramUserResult } = useTelegramUserQuery(
      selectedUserVar,
      { pollInterval: 3000 }
    );

    const selectedUserName = computed(() => selectedTelegramUserResult.value?.telegramUser.first_name ?? '')
    const selectedUserDialogs = computed(
      () => selectedTelegramUserResult.value?.telegramUser.dialogs ?? null
    );

    return {
      telegramUsers,
      selectUser(user: { id: number }) {
        selectedUserVar.value = { userId: user.id, take: 100, skip: 0 };
      },
      selectedUserDialogs,
      selectedUserName,
      formatUri(text: string) {
        try {
          return decodeURI(text);
        } catch (err) {
          return text;
        }
      },
    };
  },
});
</script>
