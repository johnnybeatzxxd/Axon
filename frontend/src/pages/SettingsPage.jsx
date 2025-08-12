import { LampDemo } from '../components/ui/lamp'
import { Button } from '../components/ui/button'
import { Message, MessageContent, MessageAvatar} from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolOutput,
  ToolInput,
} from '@/components/ai-elements/tool';
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from '@/components/ai-elements/task';
import { cn } from "../lib/utils";

export default function SettingsPage() {
  return (
    <div className={cn("bg-grey-400")}>
      <Conversation className="relative w-full h-full" >
        <ConversationContent>
          <Message from={'user'}>
            <MessageContent className='bg-[#111214]'>
              <Response>**hellow world**</Response>  
            </MessageContent>
          </Message>
          <Message from={'assistant'}>
            <Tool>
              <ToolHeader type="tool-call" state={'input-streaming'} />
              <ToolContent>
                <ToolInput input={"john"} />
                <ToolOutput output="Output from tool call" />
              </ToolContent>
            </Tool>
          </Message>
          <Message from={'user'}>
            <MessageContent>
              <Task className="w-full">
                <TaskTrigger title="Found project files" />
                <TaskContent>
                  <TaskItem>
                    Read <TaskItemFile>index.jsx</TaskItemFile>
                  </TaskItem>
                  <TaskItem>
                    Read <TaskItemFile>helloworld.md</TaskItemFile>
                  </TaskItem>
                </TaskContent>
              </Task>
            </MessageContent>
          </Message>
          <Message from={'user'}>
            <MessageContent>
              <Response>**hellow world**</Response>  
            </MessageContent>
          </Message>
          <Message from={'user'}>
            <MessageContent>
              <Response>**hellow world**</Response>  
            </MessageContent>
          </Message>
          <Message from={'user'}>
            <MessageContent>
              <Response>**hellow world**</Response>  
            </MessageContent>
          </Message>
          <Message from={'user'}>
            <MessageContent>
              <Response>**hellow world**</Response>  
            </MessageContent>
          </Message>
          <Message from={'user'}>
            <MessageContent>
              <Response>**hellow world**</Response>  
            </MessageContent>
          </Message>
          <Message from={'user'}>
            <MessageContent>
              <Response>**hellow world**</Response>  
            </MessageContent>
          </Message>
          <Message from={'user'}>
            <MessageContent>
              <Response>**hellow world**</Response>  
            </MessageContent>
          </Message>
          <Message from={'user'}>
            <MessageContent>
              <Response>**hellow world**</Response>  
            </MessageContent>
          </Message>
          <Message from={'user'}>
            <MessageContent>
              <Response>**hellow world**</Response>  
            </MessageContent>
          </Message>
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  )
}


