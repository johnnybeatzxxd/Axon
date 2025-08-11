import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';
import TextPart from '../ai-elements/TextPart';
import ReasoningPart from '../ai-elements/ReasoningPart';
import TasksPart from '../ai-elements/TasksPart';
import ToolsPart from '../ai-elements/ToolsPart';

const partComponents = {
  text: TextPart,
  reasoning: ReasoningPart,
  tasks: TasksPart,
  tools: ToolsPart,
};

export default function MessageList({ messages }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    requestAnimationFrame(() => {
      if (!listRef.current) return;
      listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }, [messages]);

  return (
    <ul className="message-list" ref={listRef} role="list">
      {messages.map((m) => (
        <li key={m.id} className={m.role === 'user' ? 'message message--user' : 'message message--assistant'}>
          <div className="message__bubble">
            {Array.isArray(m.parts) ? (
              m.parts.map((part, index) => {
                const PartComponent = partComponents[part.type];
                return PartComponent ? <PartComponent key={index} part={part} /> : null;
              })
            ) : (
              <div>{m.text}</div> // Fallback for old message format or user messages
            )}
          </div>
        </li>
      ))}
    </ul>
  );
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
      ),
      text: PropTypes.string, // text is now optional
    })
  ).isRequired,
};
