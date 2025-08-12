import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger } from '@/components/ai-elements/task';

// Render a single part according to its type (allowed: text, reasoning, tools, tasks)
const renderPart = (part, key) => {
  switch (part.type) {
    case 'text':
      return <Response key={key}>{part.text}</Response>;
    case 'reasoning':
      return (
        <Reasoning key={key} className="w-full mt-4" defaultOpen={part.defaultOpen ?? false}>
          <ReasoningTrigger />
          <ReasoningContent>{part.text}</ReasoningContent>
        </Reasoning>
      );
    case 'tasks':
      return (
        <Task key={key} className="mt-4" defaultOpen={part.defaultOpen ?? false}>
          <TaskTrigger title={part.title} />
          <TaskContent>
            {Array.isArray(part.items) && part.items.map((item, idx) => (
              <TaskItem key={`${key}-item-${idx}`}>
                {item}
                {Array.isArray(part.files) && idx === (part.fileAttachIndex ?? -1) && (
                  <>
                    <span className="mx-2" />
                    {part.files.map((file) => (
                      <TaskItemFile key={`${key}-file-${file}`}>{file}</TaskItemFile>
                    ))}
                  </>
                )}
              </TaskItem>
            ))}
          </TaskContent>
        </Task>
      );
    case 'tools':
      return (
        <Tool key={key} defaultOpen={part.defaultOpen ?? false} className="mt-4">
          <ToolHeader type={part.header?.type} state={part.header?.state} />
          <ToolContent>
            {part.input && <ToolInput input={part.input} />}
            <ToolOutput output={part.output} errorText={part.errorText} />
          </ToolContent>
        </Tool>
      );
    default:
      return null;
  }
};

// Normalize incoming messages: if legacy { text } exists, wrap it into parts
const normalizeMessages = (messages) => {
  if (!Array.isArray(messages)) return [];
  return messages.map((m) => {
    if (Array.isArray(m.parts) && m.parts.length > 0) return m;
    if (typeof m.text === 'string' && m.text.length > 0) {
      return { ...m, parts: [{ type: 'text', text: m.text }] };
    }
    return { ...m, parts: [] };
  });
};

export default function MessageList({ messages }) {
  // Local conversation state for easy testing; update this state to change the rendered conversation
  const [conversation, setConversation] = useState(() => normalizeMessages(messages));

  // Keep in sync if parent passes a new messages array
  useEffect(() => {
    setConversation(normalizeMessages(messages));
  }, [messages]);

  // Flatten: each part is rendered as its own message bubble
  const flatParts = useMemo(() => {
    const items = [];
    for (const m of conversation) {
      const parts = Array.isArray(m.parts) ? m.parts : [];
      for (let i = 0; i < parts.length; i += 1) {
        items.push({ key: `${m.id}-part-${i}`, role: m.role, part: parts[i] });
      }
    }
    return items;
  }, [conversation]);

  return (
    <Conversation className="h-full w-full bg-black text-zinc-100">
      <ConversationContent className="p-4">
        {flatParts.map(({ key, role, part }) => (
          <Message key={key} from={role}>
            <MessageContent className={role === 'user'
              ? 'text-zinc-100 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3'
              : 'text-zinc-100'}>
              {renderPart(part, key)}
            </MessageContent>
          </Message>
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}

MessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      role: PropTypes.oneOf(['user', 'assistant']).isRequired,
      parts: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.oneOf(['text', 'reasoning', 'tools', 'tasks']).isRequired,
          // text
          text: PropTypes.string,
          // tools
          header: PropTypes.shape({
            type: PropTypes.string,
            state: PropTypes.oneOf(['input-streaming', 'input-available', 'output-available', 'output-error']),
          }),
          input: PropTypes.object,
          output: PropTypes.node,
          errorText: PropTypes.string,
          // tasks
          title: PropTypes.string,
          items: PropTypes.arrayOf(PropTypes.node),
          files: PropTypes.arrayOf(PropTypes.string),
          fileAttachIndex: PropTypes.number,
          defaultOpen: PropTypes.bool,
        })
      ),
      // Legacy support: optional top-level text (will be wrapped into parts)
      text: PropTypes.string,
    })
  ),
};
