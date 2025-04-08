import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ExternalLink, Smartphone, Tablet, Monitor, Maximize, Chrome, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewProps {
  className?: string;
  htmlContent: string;
  refreshPreview: () => void;
}

type DeviceSize = 'mobile' | 'tablet' | 'desktop' | 'full'; // Explicitly define all possible view modes

const Preview: React.FC<PreviewProps> = ({ 
  className, 
  htmlContent, 
  refreshPreview 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [responsiveMode, setResponsiveMode] = useState<DeviceSize>('full');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [iframeSize, setIframeSize] = useState({ width: 0, height: 0 });
  const [showRulers, setShowRulers] = useState(false);

  // Update preview when HTML content changes
  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();
      }
    }
  }, [htmlContent]);

  // Update iframe size on resize
  useEffect(() => {
    const updateIframeSize = () => {
      if (iframeRef.current) {
        setIframeSize({
          width: iframeRef.current.clientWidth,
          height: iframeRef.current.clientHeight
        });
      }
    };

    // Initial size
    updateIframeSize();

    // Setup observer for iframe size changes
    if (iframeRef.current) {
      const resizeObserver = new ResizeObserver(updateIframeSize);
      resizeObserver.observe(iframeRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [responsiveMode]);

  // Track mouse position for the coordinate display
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (responsiveMode === 'full' && previewContainerRef.current && iframeRef.current) {
      const rect = iframeRef.current.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      
      // Only update if coordinates are within the iframe
      if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        setMousePosition({ x, y });
      }
    }
  }, [responsiveMode]);

  // Reset mouse position when leaving the iframe area
  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  // Toggle responsive view modes
  const setDeviceSize = (size: DeviceSize) => {
    setResponsiveMode(size);
  };

  // Open in new window
  const openInNewWindow = () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  // Toggle ruler display
  const toggleRulers = () => {
    setShowRulers(!showRulers);
  };

  // Get device size styles
  const getDeviceSizeStyles = () => {
    switch (responsiveMode) {
      case 'mobile':
        return 'max-w-[375px] h-[667px]';
      case 'tablet':
        return 'max-w-[768px] h-[1024px]';
      case 'desktop':
        return 'max-w-[1440px] h-[900px]';
      default:
        return 'w-full h-full';
    }
  };

  // VS Code device frame appearance for responsive modes
  const getDeviceFrame = () => {
    if (responsiveMode === 'full') return null;
    
    return (
      <div className={cn(
        "absolute inset-0 pointer-events-none border-2 border-[#474747] rounded",
        {
          "rounded-[32px]": responsiveMode === 'mobile',
          "rounded-[24px]": responsiveMode === 'tablet'
        }
      )}>
        {responsiveMode === 'mobile' && (
          <>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#474747] rounded-full"></div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 border-2 border-[#474747] rounded-full"></div>
          </>
        )}
        {responsiveMode === 'tablet' && (
          <>
            <div className="absolute top-1/2 -translate-y-1/2 right-3 w-1 h-10 bg-[#474747] rounded-full"></div>
          </>
        )}
      </div>
    );
  };

  // Render rulers for full mode
  const renderRulers = () => {
    if (!showRulers || responsiveMode !== 'full') return null;

    return (
      <>
        {/* Horizontal ruler */}
        <div className="absolute top-0 left-0 h-6 bg-[#252526] opacity-60 border-b border-[#474747] w-full z-10 pointer-events-none">
          {Array.from({ length: Math.ceil(iframeSize.width / 100) }).map((_, i) => (
            <div key={`h-${i}`} className="absolute top-0 h-full" style={{ left: `${i * 100}px` }}>
              <div className="absolute bottom-0 w-px h-2 bg-[#cccccc]"></div>
              <div className="absolute bottom-4 text-[10px] text-[#cccccc]" style={{ left: '2px' }}>
                {i * 100}
              </div>
            </div>
          ))}
        </div>

        {/* Vertical ruler */}
        <div className="absolute top-0 left-0 w-6 bg-[#252526] opacity-60 border-r border-[#474747] h-full z-10 pointer-events-none">
          {Array.from({ length: Math.ceil(iframeSize.height / 100) }).map((_, i) => (
            <div key={`v-${i}`} className="absolute left-0 w-full" style={{ top: `${i * 100}px` }}>
              <div className="absolute right-0 h-px w-2 bg-[#cccccc]"></div>
              <div className="absolute left-1 text-[10px] text-[#cccccc]" style={{ top: '2px' }}>
                {i * 100}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="px-3 py-1.5 bg-[#1e1e1e] border-b border-[#474747] flex items-center justify-between">
        <div className="text-xs font-semibold text-[#cccccc]">
          PREVIEW
          {responsiveMode !== 'full' && (
            <span className="ml-2 font-normal">
              {responsiveMode === 'mobile' ? '375×667' : 
               responsiveMode === 'tablet' ? '768×1024' : 
               responsiveMode === 'desktop' ? '1440×900' : ''}
            </span>
          )}
          {responsiveMode === 'full' && mousePosition.x > 0 && mousePosition.y > 0 && (
            <span className="ml-2 font-normal">
              x: {mousePosition.x}, y: {mousePosition.y}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button 
            className={cn(
              "p-1 rounded text-[#cccccc] hover:bg-[#2a2d2e]",
              responsiveMode === 'mobile' && "bg-[#37373d]"
            )}
            onClick={() => setDeviceSize('mobile')}
            title="Mobile view (375x667)"
          >
            <Smartphone className="h-4 w-4" />
          </button>
          <button 
            className={cn(
              "p-1 rounded text-[#cccccc] hover:bg-[#2a2d2e]",
              responsiveMode === 'tablet' && "bg-[#37373d]"
            )}
            onClick={() => setDeviceSize('tablet')}
            title="Tablet view (768x1024)"
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button 
            className={cn(
              "p-1 rounded text-[#cccccc] hover:bg-[#2a2d2e]",
              responsiveMode === 'desktop' && "bg-[#37373d]"
            )}
            onClick={() => setDeviceSize('desktop')}
            title="Desktop view (1440x900)"
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button 
            className={cn(
              "p-1 rounded text-[#cccccc] hover:bg-[#2a2d2e]",
              responsiveMode === 'full' && "bg-[#37373d]"
            )}
            onClick={() => setDeviceSize('full')}
            title="Full size"
          >
            <Maximize className="h-4 w-4" />
          </button>
          {responsiveMode === 'full' && (
            <button 
              className={cn(
                "p-1 rounded text-[#cccccc] hover:bg-[#2a2d2e]",
                showRulers && "bg-[#37373d]"
              )}
              onClick={toggleRulers}
              title="Toggle rulers"
            >
              <Ruler className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      <div 
        className={cn(
          "bg-[#1e1e1e] flex-1 overflow-auto relative",
          responsiveMode !== 'full' ? "flex items-center justify-center p-8" : ""
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        ref={previewContainerRef}
      >
        <div className={cn(
          "relative",
          responsiveMode === 'full' ? "w-full h-full" : ""
        )}>
          <iframe 
            ref={iframeRef}
            title="HTML Preview"
            className={cn(
              "border-0 bg-white",
              responsiveMode === 'full' ? "w-full h-full absolute inset-0" : getDeviceSizeStyles(),
              responsiveMode !== 'full' && "shadow-lg"
            )}
            sandbox="allow-same-origin allow-scripts"
          />
          {getDeviceFrame()}
          {renderRulers()}
        </div>
      </div>
      
      <div className="bg-[#1e1e1e] py-1.5 px-3 border-t border-[#474747] flex justify-between items-center">
        <div className="text-xs text-[#cccccc]">
          <span className="text-[#75beff]">HTML</span> Preview
          {responsiveMode === 'full' && (
            <span className="ml-2 text-[#75beff]">
              {iframeSize.width}×{iframeSize.height}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button 
            className="p-1 hover:bg-[#2a2d2e] text-[#cccccc] rounded"
            onClick={refreshPreview}
            title="Refresh Preview"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button 
            className="p-1 hover:bg-[#2a2d2e] text-[#cccccc] rounded"
            onClick={openInNewWindow}
            title="Open in Browser"
          >
            <Chrome className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Preview;
