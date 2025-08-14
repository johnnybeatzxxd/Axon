import PropTypes from 'prop-types'
import React, { memo } from 'react'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { Response } from '@/components/ai-elements/response'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool'
import {
  Task,
  TaskContent,
  TaskTrigger,
  TaskItem,
  TaskItemFile,
} from '@/components/ai-elements/task'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  WebPreview,
  WebPreviewNavigation,
  WebPreviewUrl,
  WebPreviewBody,
  WebPreviewNavigationButton, 
} from '@/components/ai-elements/web-preview';
import { ArrowLeftIcon, ArrowRightIcon, RotateCwIcon } from 'lucide-react';

function MessageList({ messages }) {
  const renderContentPart = (part, message, index) => {
    // Text content -> markdown-capable Response
    if (typeof part?.text === 'string') {
      return (
        <Response key={`${message.id}-text-${index}`}>{part.text}</Response>
      )
    }

    // Image content -> render image inline
    if (typeof part?.image === 'string') {
      return (
        <div key={`${message.id}-image-${index}`} className="w-full">
          <img
            alt="User provided"
            className="max-w-full rounded-md border"
            src={part.image}
          />
        </div>
      )
    }

    // Reasoning content -> collapsible Reasoning
    if (typeof part?.reasoning === 'string') {
      return (
        <Reasoning key={`${message.id}-reasoning-${index}`} className="w-full">
          <ReasoningTrigger />
          <ReasoningContent>{part.reasoning}</ReasoningContent>
        </Reasoning>
      )
    }
   if (part?.app && typeof part.app === 'object') {
        const app = part.app || {};
        const appUrl = app.url || app.src || 'about:blank'; 
        const sourceCode = app.sourceCode; 
        const height = app.height || '400px'; 
        const width = app.width || '1800px'; 
        
      return (
        <WebPreview key={`${message.id}-app-${index}`} defaultUrl={appUrl} style={{ height, width }} className="w-full">
          {/* --- 2. UPDATE THE NAVIGATION SECTION --- */}
          <WebPreviewNavigation className='border-4 border-white'>
            <WebPreviewNavigationButton
              tooltip="Back"
              onClick={() => alert('Back button clicked!')}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </WebPreviewNavigationButton>
            <WebPreviewNavigationButton
              tooltip="Forward"
              onClick={() => alert('Forward button clicked!')}
            >
              <ArrowRightIcon className="h-4 w-4" />
            </WebPreviewNavigationButton>
            <WebPreviewNavigationButton
              tooltip="Refresh"
              onClick={() => alert('Refresh button clicked!')}
            >
              <RotateCwIcon className="h-4 w-4" />
            </WebPreviewNavigationButton>

            <WebPreviewUrl src={appUrl} />
            
          </WebPreviewNavigation>
          <WebPreviewBody src={appUrl} srcDoc={sourceCode} />
        </WebPreview>
      );
    }
    // Tool call content -> Tool with header, input and output
    if (part?.tool && typeof part.tool === 'object') {
      const tool = part.tool || {}
      const toolType = tool.type || tool.name || 'Tool'
      const toolState = tool.state || tool.status || 'output-available'
      const toolInput = tool.input ?? tool.params ?? tool.arguments ?? null
      const toolOutput = tool.output ?? tool.result ?? null
      const toolError = tool.errorText ?? tool.error ?? null

      return (
        <Tool key={`${message.id}-tool-${index}`} className="w-full">
          <ToolHeader type={toolType} state={toolState} />
          <ToolContent>
            {toolInput != null && <ToolInput input={toolInput} />}
            <ToolOutput output={toolOutput} errorText={toolError} />
          </ToolContent>
        </Tool>
      )
    }

    // Task content -> list of task items
    if (Array.isArray(part?.task)) {
      const items = part.task
      return (
        <Task key={`${message.id}-task-${index}`} className="w-full">
          <TaskTrigger title="Task" />
          <TaskContent>
            {items.map((item, i) => {
              if (typeof item === 'string') {
                return <TaskItem key={`task-${i}`}>{item}</TaskItem>
              }
              if (item && typeof item === 'object') {
                const text = item.text ?? item.title ?? ''
                const file = item.file ?? item.path ?? null
                return (
                  <div key={`task-${i}`} className="space-y-1">
                    {text && <TaskItem>{text}</TaskItem>}
                    {file && <TaskItemFile>{file}</TaskItemFile>}
                  </div>
                )
              }
              return null
            })}
          </TaskContent>
        </Task>
      )
    }

    return null
  }

  return (
    // messages list schema [
    //  {id,role:'user',content:[
    //    {text:''},{image:''}]
    //    },
    //  {id,role:'assistant',content:[
    //    {text:''},{tool:{}},{reasoning:""},{task:[]}
    //  ]}]
    <Conversation className="h-full">
      <ConversationContent>
        {messages.flatMap((m) => (
          Array.isArray(m.content)
            ? m.content.map((part, index) => {
                const isTool = !!part?.tool
                const rendered = renderContentPart(part, m, index)
                if (!rendered) return null
                return (
                  <Message
                    from={m.role}
                    key={`${m.id}-${index}`}
                    className={isTool ? 'w-full [&>div]:max-w-full' : undefined}
                  >
                    <MessageContent className={isTool ? 'w-full' : undefined}>
                      {rendered}
                    </MessageContent>
                  </Message>
                )
              })
            : null
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  )
}

MessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      role: PropTypes.oneOf(['user', 'assistant']).isRequired,
      content: PropTypes.arrayOf(
        PropTypes.shape({
          text: PropTypes.string,
          image: PropTypes.string,
          reasoning: PropTypes.string,
          tool: PropTypes.object,
          task: PropTypes.array,
        })
      ).isRequired,
    })
  ).isRequired,
}

export default memo(MessageList)
