import { useEffect, useState } from 'react'
import { fetchConversations } from '../services/chatService'

export function useConversations() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    fetchConversations()
      .then((data) => mounted && setConversations(data))
      .catch((e) => mounted && setError(e))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  return { conversations, setConversations, loading, error }
}


