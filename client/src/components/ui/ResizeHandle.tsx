import React from 'react';
import { cn } from '@/lib/utils';
import { useResizePanel } from '@/hooks/useResizePanel';

interface ResizeHandleProps {
  id: string;
  direction: 'horizontal' | 'vertical';
  onResize?: (sizes: { left: number; right: number }) => void;
  className?: string;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({
  id,
  direction,
  onResize,
  className
}) => {
  const { handleMouseDown } = useResizePanel({
    id,
    direction,
    onResize
  });

  return (
    <div
      id={id}
      className={cn(
        direction === 'horizontal' 
          ? 'w-1 cursor-col-resize hover:bg-primary' 
          : 'h-1 cursor-row-resize hover:bg-primary',
        'resize-handle bg-border',
        className
      )}
      onMouseDown={handleMouseDown}
    />
  );
};

export default ResizeHandle;
