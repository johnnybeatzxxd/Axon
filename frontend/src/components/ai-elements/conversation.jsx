'use client';;
import { Button } from '@/components/ui/button';
import { ArrowDownIcon } from 'lucide-react';
import { useCallback } from 'react';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';
import { cn } from '@/lib/utils';

export const Conversation = ({
  className,
  ...props
}) => (
  <StickToBottom
    className={cn('relative flex-1 h-full overflow-y-auto no-scrollbar', className)}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props} />
);

export const ConversationContent = ({
  className,
  ...props
}) => (
  <StickToBottom.Content className={cn('p-4 no-scrollbar', className)} {...props} />
);

export const ConversationScrollButton = ({
  className,
  ...props
}) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (!isAtBottom && (<Button
    className={cn('absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full', className)}
    onClick={handleScrollToBottom}
    size="icon"
    type="button"
    variant="outline"
    {...props}>
    <ArrowDownIcon className="size-4" />
  </Button>));
};
