// Placeholder chat service. Swap with real backend endpoints.
import { getJson, postJson } from './apiClient'

export async function fetchConversations() {
  // Example: return await getJson('/api/conversations')
  return []
}

export async function sendMessage(conversationId, text) {
  // Example: return await postJson(`/api/conversations/${conversationId}/messages`, { text })
  return { id: crypto.randomUUID(), role: 'assistant', text: `Echo: ${text}` }
}


