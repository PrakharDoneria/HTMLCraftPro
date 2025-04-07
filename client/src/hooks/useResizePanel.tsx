import { useCallback, useEffect } from 'react';

interface ResizePanelProps {
  id: string;
  direction: 'horizontal' | 'vertical';
  minSize?: number;
  onResize?: (sizes: { left: number; right: number }) => void;
}

export const useResizePanel = ({
  id,
  direction,
  minSize = 100,
  onResize
}: ResizePanelProps) => {
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const resizeHandle = document.getElementById(id);
    if (!resizeHandle) return;

    const leftPanel = resizeHandle.previousElementSibling as HTMLElement;
    const rightPanel = resizeHandle.nextElementSibling as HTMLElement;
    
    if (!leftPanel || !rightPanel) return;

    const parentRect = resizeHandle.parentElement?.getBoundingClientRect();
    if (!parentRect) return;

    if (direction === 'horizontal') {
      const leftWidth = e.clientX - parentRect.left;
      const rightWidth = parentRect.right - e.clientX;
      
      if (leftWidth >= minSize && rightWidth >= minSize) {
        leftPanel.style.width = `${leftWidth}px`;
        leftPanel.style.flexGrow = '0';
        rightPanel.style.width = `${rightWidth}px`;
        rightPanel.style.flexGrow = '0';
        
        if (onResize) {
          onResize({ 
            left: leftWidth / parentRect.width, 
            right: rightWidth / parentRect.width 
          });
        }
      }
    } else {
      const topHeight = e.clientY - parentRect.top;
      const bottomHeight = parentRect.bottom - e.clientY;
      
      if (topHeight >= minSize && bottomHeight >= minSize) {
        leftPanel.style.height = `${topHeight}px`;
        leftPanel.style.flexGrow = '0';
        rightPanel.style.height = `${bottomHeight}px`;
        rightPanel.style.flexGrow = '0';
        
        if (onResize) {
          onResize({ 
            left: topHeight / parentRect.height, 
            right: bottomHeight / parentRect.height 
          });
        }
      }
    }
  }, [id, direction, minSize, onResize]);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [direction, handleMouseMove, handleMouseUp]);

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return { handleMouseDown };
};
