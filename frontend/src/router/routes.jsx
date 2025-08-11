import { lazy } from 'react'

export const routes = [
  { path: '/', component: lazy(() => import('../pages/ChatPage')) },
  { path: '/chat/:id', component: lazy(() => import('../pages/ChatPage')) },
  { path: '/settings', component: lazy(() => import('../pages/SettingsPage')) },
  { path: '/library', component: lazy(() => import('../pages/LibraryPage')) },
]


