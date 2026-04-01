import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';

interface ResizablePanelProps {
  children: ReactNode;
  side: 'left' | 'right';
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

export function ResizablePanel({
  children,
  side,
  defaultWidth,
  minWidth = 150,
  maxWidth = 500,
  className = '',
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      let newWidth: number;

      if (side === 'left') {
        newWidth = e.clientX - rect.left;
      } else {
        newWidth = rect.right - e.clientX;
      }

      // Clamp to min/max
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(newWidth);
    },
    [isResizing, side, minWidth, maxWidth]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resize, stopResizing]);

  const handleStyle = side === 'left' 
    ? 'right-0 cursor-col-resize' 
    : 'left-0 cursor-col-resize';

  return (
    <div
      ref={panelRef}
      className={`relative shrink-0 ${className}`}
      style={{ width: `${width}px` }}
    >
      {children}
      
      {/* Resize handle */}
      <div
        onMouseDown={startResizing}
        className={`absolute top-0 ${handleStyle} w-1 h-full z-30 group`}
      >
        <div 
          className={`absolute top-0 ${side === 'left' ? 'right-0' : 'left-0'} w-1 h-full 
            bg-transparent hover:bg-primary/50 transition-colors
            ${isResizing ? 'bg-primary' : ''}`}
        />
      </div>
    </div>
  );
}
