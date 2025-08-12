import PropTypes from 'prop-types'
import { useEffect, useRef } from 'react'
import { Message, MessageContent, MessageAvatar } from '../ai-elements/message'
import { Reasoning } from '../ai-elements/reasoning'
import { Task } from '../ai-elements/task'
import { Tool } from '../ai-elements/tool'
import { CodeBlock } from '../ai-elements/code-block'

export default function MessageList({ messages }) {
  const listRef = useRef(null)

  useEffect(() => {
    if (!listRef.current) return
    requestAnimationFrame(() => {
      if (!listRef.current) return
      listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }, [messages])

  const renderPart = (part, index) => {
    switch (part.type) {
      case 'reasoning':
        return <Reasoning key={index}>{part.text}</Reasoning>
      case 'tasks':
        return <Task key={index} title={part.title} items={part.items} />
      case 'tools':
        return <Tool key={index} header={part.header} input={part.input} output={part.output} />
      case 'text':
        return <p key={index}>{part.text}</p>
      case 'code':
        return <CodeBlock key={index} code={part.code} language={part.language} />
      default:
        return null
    }
  }

  return (
    <ul className="message-list" ref={listRef} role="list">
      {messages.map((m) => (
        <Message key={m.id} from={m.role}>
          <MessageContent>
            {m.parts.map(renderPart)}
          </MessageContent>
          <MessageAvatar name={m.role} />
        </Message>
      ))}
    </ul>
  )
}

MessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      role: PropTypes.oneOf(['user', 'assistant']).isRequired,
      parts: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.string.isRequired,
        })
      ).isRequired,
    })
  ).isRequired,
}
