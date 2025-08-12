import { lazy } from 'react'

const ChatPage = lazy(() => import('../pages/ChatPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))
const LibraryPage = lazy(() => import('../pages/LibraryPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

export const routes = [
  { path: '/', component: ChatPage, isChat: true },
  { path: '/chat/:id', component: ChatPage, isChat: true },
  { path: '/settings', component: SettingsPage },
  { path: '/library', component: LibraryPage },
  { path: '*', component: NotFoundPage },
]


