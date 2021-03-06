
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Start.vue') },
      { path: 'login/:loginType?', component: () => import('pages/Login.vue'), props: true },
      { name: 'Watcher View', meta: { label: 'Watcher View' }, path: 'watch', component: () => import('pages/Viewer.vue') },
      { path: 'test', component: () => import('pages/PeerVideoTest.vue') },
      { path: 'aframe', component: () => import('pages/AframeTest.vue') },
      { path: 'settings', component: () => import('pages/Settings.vue') },
    ],
  },
  {
    path: '/',
    meta: { requiresAuth: true },
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: 'camera', component: () => import('pages/Start.vue'), props: { isCamera: true } },
      { path: 'kamera', redirect: 'camera' },
      { name: 'Camera View', meta: { label: 'Camera View' }, path: 'camera/send', component: () => import('pages/Camera.vue') },
    ],
  },
  {
    path: '/admin',
    meta: { requiresAdmin: true },
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Admin.vue') },
    ],
  },
];

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '*',
    component: () => import('pages/Error404.vue'),
  });
}

export default routes;
