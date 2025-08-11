import React, { Children } from 'react'
import PropTypes from 'prop-types'
import { Send as SendIcon, Loader2 as Loader2Icon, Square as SquareIcon, X as XIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

// Container form
export function PromptInput({ className, ...props }) {
  return (
    <form
      className={cn('relative w-full', className)}
      {...props}
    />
  )
}

PromptInput.propTypes = {
  className: PropTypes.string,
}

// Textarea
export function PromptInputTextarea({
  className,
  placeholder = 'What would you like to know?',
  minHeight = 48,
  maxHeight = 164,
  onChange,
  ...props
}) {
  function autoSize(el) {
    if (!el) return
    el.style.height = 'auto'
    const next = Math.min(el.scrollHeight, maxHeight)
    el.style.height = `${Math.max(next, minHeight)}px`
  }

  return (
    <textarea
      className={cn(
        'w-full resize-none rounded-xl border border-white/10 bg-black/40 p-3 pr-10 shadow-none outline-none ring-0 text-white',
        'placeholder:text-white/50 focus-visible:ring-0',
        className,
      )}
      name="message"
      placeholder={placeholder}
      rows={1}
      onInput={(e) => autoSize(e.currentTarget)}
      onChange={(e) => {
        autoSize(e.currentTarget)
        onChange?.(e)
      }}
      style={{ height: `${minHeight}px` }}
      {...props}
    />
  )
}

PromptInputTextarea.propTypes = {
  className: PropTypes.string,
  placeholder: PropTypes.string,
  minHeight: PropTypes.number,
  maxHeight: PropTypes.number,
  onChange: PropTypes.func,
}

// Toolbar container
export function PromptInputToolbar({ className, ...props }) {
  return <div className={cn('flex items-center justify-between p-1', className)} {...props} />
}

PromptInputToolbar.propTypes = {
  className: PropTypes.string,
}

// Tools group (left side)
export function PromptInputTools({ className, ...props }) {
  return (
    <div className={cn('flex items-center gap-1', '[&_button:first-child]:rounded-bl-xl', className)} {...props} />
  )
}

PromptInputTools.propTypes = {
  className: PropTypes.string,
}

// Generic button
export function PromptInputButton({ variant = 'ghost', className, size, children, ...props }) {
  const newSize = (size ?? Children.count(children) > 1) ? 'default' : 'icon'
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center shrink-0 gap-1.5 rounded-lg',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        variant === 'ghost' && 'text-muted-foreground hover:bg-accent hover:text-foreground',
        variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        newSize === 'default' ? 'h-9 px-3' : 'h-9 w-9',
        className,
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}

PromptInputButton.propTypes = {
  variant: PropTypes.oneOf(['ghost', 'default']),
  className: PropTypes.string,
  size: PropTypes.oneOf(['icon', 'default']),
  children: PropTypes.node,
}

// Submit button with status icon
export function PromptInputSubmit({ className, variant = 'default', size = 'icon', status, children, ...props }) {
  let Icon = <SendIcon className="size-4" />
  if (status === 'submitted' || status === 'ready') Icon = <Loader2Icon className="size-4 animate-spin" />
  else if (status === 'streaming') Icon = <SquareIcon className="size-4" />
  else if (status === 'error') Icon = <XIcon className="size-4" />

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        size === 'default' ? 'h-9 px-3' : 'h-9 w-9',
        className,
      )}
      type="submit"
      {...props}
    >
      {children ?? Icon}
    </button>
  )
}

PromptInputSubmit.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default']),
  size: PropTypes.oneOf(['icon', 'default']),
  status: PropTypes.oneOf(['ready', 'submitted', 'streaming', 'error']),
  children: PropTypes.node,
}

// Model select placeholders (native select wrappers)
export function PromptInputModelSelect({ children, ...props }) {
  return <div {...props}>{children}</div>
}
export function PromptInputModelSelectTrigger({ className, ...props }) {
  return <div className={cn('rounded-md px-2 py-1 cursor-pointer', className)} {...props} />
}
export function PromptInputModelSelectContent({ className, ...props }) {
  return <div className={cn('rounded-md border bg-popover p-1 shadow-md', className)} {...props} />
}
export function PromptInputModelSelectItem({ className, ...props }) {
  return <div className={cn('cursor-pointer rounded-sm px-2 py-1 hover:bg-accent', className)} {...props} />
}
export function PromptInputModelSelectValue({ className, ...props }) {
  return <span className={cn(className)} {...props} />
}


