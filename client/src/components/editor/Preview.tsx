import React, { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { RefreshCw, ExternalLink, Smartphone, Tablet, Monitor, Maximize, Chrome } from 'lucide-react';
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
  const [responsiveMode, setResponsiveMode] = useState<DeviceSize>('full');
  const { activeTab } = useEditorStore();

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

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="px-3 py-1.5 bg-[#1e1e1e] border-b border-[#474747] flex items-center justify-between">
        <div className="text-xs font-semibold text-[#cccccc]">PREVIEW</div>
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
        </div>
      </div>
      
      <div className={cn(
        "bg-[#1e1e1e] flex-1 overflow-auto",
        responsiveMode !== 'full' ? "flex items-center justify-center p-8" : ""
      )}>
        <div className="relative">
          <iframe 
            ref={iframeRef}
            title="HTML Preview"
            className={cn(
              "border-0 bg-white",
              getDeviceSizeStyles(),
              responsiveMode !== 'full' && "shadow-lg"
            )}
            sandbox="allow-same-origin allow-scripts"
          />
          {getDeviceFrame()}
        </div>
      </div>
      
      <div className="bg-[#1e1e1e] py-1.5 px-3 border-t border-[#474747] flex justify-between items-center">
        <div className="text-xs text-[#cccccc]">
          <span className="text-[#75beff]">HTML</span> Preview
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
