import React, { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { RefreshCw, ExternalLink, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewProps {
  className?: string;
  htmlContent: string;
  refreshPreview: () => void;
}

const Preview: React.FC<PreviewProps> = ({ 
  className, 
  htmlContent, 
  refreshPreview 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isResponsiveView, setIsResponsiveView] = useState(false);
  const { activeTab } = useEditorStore();

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

  const toggleResponsiveView = () => {
    setIsResponsiveView(!isResponsiveView);
  };

  const openInNewWindow = () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  return (
    <div className={cn("flex flex-col border-l border-border", className)}>
      <div className={cn(
        "bg-gray-100 flex-1 overflow-auto",
        isResponsiveView ? "flex items-center justify-center p-4" : ""
      )}>
        <iframe 
          ref={iframeRef}
          title="HTML Preview"
          className={cn(
            "w-full h-full border-0",
            isResponsiveView && "max-w-sm border border-gray-300 rounded h-[600px] shadow-md"
          )}
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
      
      <div className="bg-secondary p-2 border-t border-border flex justify-between items-center">
        <div className="text-xs text-gray-400">Preview</div>
        <div className="flex space-x-2">
          <button 
            className="p-1 hover:bg-opacity-20 hover:bg-white rounded"
            onClick={refreshPreview}
            title="Refresh Preview"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button 
            className="p-1 hover:bg-opacity-20 hover:bg-white rounded"
            onClick={openInNewWindow}
            title="Open in Browser"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
          <button 
            className={cn(
              "p-1 hover:bg-opacity-20 hover:bg-white rounded",
              isResponsiveView && "bg-opacity-20 bg-white"
            )}
            onClick={toggleResponsiveView}
            title="Responsive View"
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Preview;
