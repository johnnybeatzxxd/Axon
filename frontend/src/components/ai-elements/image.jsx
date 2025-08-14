import { cn } from '@/lib/utils';

export const Image = ({
  base64,
  uint8Array,
  mediaType,
  ...props
}) => (
  <img
    {...props}
    src={`data:${mediaType};base64,${base64}`}
    alt={props.alt}
    className={cn('max-w-full h-auto rounded-md overflow-hidden', props.className)} />
);
