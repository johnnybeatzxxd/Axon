import { useEffect, useState, useCallback } from 'react';
import {
  addMessageListener,
  removeMessageListener,
  sendMessage as sendWsMessage,
} from '../services/chatService';

export function useConversations() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleNewMessage = useCallback((newMessage) => {
    // Ignore messages without an ID or role, but log them
    if (newMessage.log) {
      console.log("Log from backend:", newMessage.log);
      return;
    }

    if (!newMessage.id || !newMessage.role) {
      console.warn('Received message without id or role', newMessage);
      return;
    }

    setMessages((prevMessages) => {
      const existingMessageIndex = prevMessages.findIndex(
        (msg) => msg.id === newMessage.id
      );

      if (existingMessageIndex !== -1) {
        // Merge parts into existing message
        return prevMessages.map((msg, index) => {
          if (index === existingMessageIndex) {
            const existingParts = msg.parts || [];
            const newParts = newMessage.parts || [];
            const combinedParts = [...existingParts, ...newParts];

            return { ...msg, parts: combinedParts };
          }
          return msg;
        });
      } else {
        // Add new message
        return [...prevMessages, newMessage];
      }
    });
  }, []);

  useEffect(() => {
    addMessageListener(handleNewMessage);
    return () => {
      removeMessageListener(handleNewMessage);
    };
  }, [handleNewMessage]);

  const sendMessage = useCallback((text) => {
    // Add user message to the state immediately
    const userMessage = {
      id: `m_${crypto.randomUUID()}`,
      role: 'user',
      parts: [{ type: 'text', text }],
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // Send message via WebSocket
    sendWsMessage(text);
  }, []);

  const clearConversations = () => {
    setMessages([]);
  }

  return { messages, loading, error, sendMessage, clearConversations };
}
