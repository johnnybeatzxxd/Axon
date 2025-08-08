import { createContext, useContext, useMemo, useState } from 'react'

const AppStateContext = createContext(null)

export function AppStateProvider({ children }) {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')

  const value = useMemo(() => ({ apiKey, setApiKey, model, setModel }), [apiKey, model])
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider')
  return ctx
}


