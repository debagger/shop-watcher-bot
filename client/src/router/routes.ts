import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Index.vue') },
      { path: 'proxies', component: () => import('pages/ProxyList.vue') },
      { path: 'proxy-tester', component: () => import('pages/ProxyTester.vue') },
      { path: 'proxy-list-sources', component: () => import('pages/ProxyListSources.vue') },
      { path: 'bot-users', component: () => import('pages/BotUsers.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
  },
];

export default routes;
