import React, { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { RefreshCw, ExternalLink, Smartphone, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewProps {
  className?: string;
  htmlContent: string;
  refreshPreview: () => void;
}

type DeviceSize = 'mobile' | 'tablet' | 'desktop' | 'full';

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

  return (
    <div className={cn("flex flex-col border-l border-border", className)}>
      <div className="px-2 py-1 bg-secondary border-b border-border flex items-center justify-between">
        <div className="text-xs text-gray-400">Preview</div>
        <div className="flex space-x-1">
          <button 
            className={cn(
              "p-1 hover:bg-gray-700 rounded",
              responsiveMode === 'mobile' && "bg-gray-700"
            )}
            onClick={() => setDeviceSize('mobile')}
            title="Mobile view"
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
          <button 
            className={cn(
              "p-1 hover:bg-gray-700 rounded",
              responsiveMode === 'tablet' && "bg-gray-700"
            )}
            onClick={() => setDeviceSize('tablet')}
            title="Tablet view"
          >
            <Smartphone className="h-4 w-4" />
          </button>
          <button 
            className={cn(
              "p-1 hover:bg-gray-700 rounded",
              responsiveMode === 'desktop' && "bg-gray-700"
            )}
            onClick={() => setDeviceSize('desktop')}
            title="Desktop view"
          >
            <Maximize className="h-3.5 w-3.5" />
          </button>
          <button 
            className={cn(
              "p-1 hover:bg-gray-700 rounded",
              responsiveMode === 'full' && "bg-gray-700"
            )}
            onClick={() => setDeviceSize('full')}
            title="Full size"
          >
            <Maximize className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      <div className={cn(
        "bg-editor flex-1 overflow-auto",
        responsiveMode !== 'full' ? "flex items-center justify-center p-4" : ""
      )}>
        <iframe 
          ref={iframeRef}
          title="HTML Preview"
          className={cn(
            "border-0 bg-white",
            getDeviceSizeStyles(),
            responsiveMode !== 'full' && "border border-gray-300 rounded shadow-md"
          )}
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
      
      <div className="bg-secondary p-2 border-t border-border flex justify-between items-center">
        <div className="text-xs text-gray-400">Preview</div>
        <div className="flex space-x-2">
          <button 
            className="p-1 hover:bg-gray-700 rounded"
            onClick={refreshPreview}
            title="Refresh Preview"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button 
            className="p-1 hover:bg-gray-700 rounded"
            onClick={openInNewWindow}
            title="Open in Browser"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Preview;
