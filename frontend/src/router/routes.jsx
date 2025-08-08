import { lazy } from 'react'

export const routes = [
  { path: '/', component: lazy(() => import('../components/ChatWindow')) },
  { path: '/chat/:id', component: lazy(() => import('../components/ChatWindow')) },
  { path: '/settings', component: lazy(() => import('../pages/SettingsPage')) },
  { path: '/library', component: lazy(() => import('../pages/LibraryPage')) },
]


