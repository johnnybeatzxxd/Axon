'use client';;
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { ChevronDownIcon, SearchIcon } from 'lucide-react';

export const TaskItemFile = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn(
      'text-xs inline-flex items-center gap-1 px-1.5 py-0.5 text-foreground border bg-secondary rounded-md',
      className
    )}
    {...props}>
    {children}
  </div>
);

export const TaskItem = ({
  children,
  className,
  ...props
}) => (
  <div className={cn('text-sm text-neutral-500', className)} {...props}>
    {children}
  </div>
);

export const Task = ({
  defaultOpen = true,
  className,
  ...props
}) => (
  <Collapsible
    defaultOpen={defaultOpen}
    className={cn(
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2',
      className
    )}
    {...props} />
);

export const TaskTrigger = ({
  children,
  className,
  title,
  ...props
}) => (
  <CollapsibleTrigger asChild className={cn('group', className)} {...props}>
    {children ?? (
      <div
        className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground">
        <SearchIcon className="size-4" />
        <p className="text-sm">{title}</p>
        <ChevronDownIcon
          className="size-4 transition-transform group-data-[state=open]:rotate-180" />
      </div>
    )}
  </CollapsibleTrigger>
);

export const TaskContent = ({
  children,
  className,
  ...props
}) => (
  <CollapsibleContent
    className={cn(
      'text-popover-foreground outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1',
      className
    )}
    {...props}>
    <div className="border-l-2 border-muted pl-3 mt-2 space-y-1">
      {children}
    </div>
  </CollapsibleContent>
);
