import React from 'react';
import { X, FileCode } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { formatFileName, getFileIcon } from '@/lib/utils';

interface TabsProps {
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ className = '' }) => {
  const { tabs, activeTab, closeTab, setActiveTab } = useEditorStore();

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  return (
    <div className={`flex text-sm border-b border-[#474747] overflow-x-auto bg-[#252526] ${className}`}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`flex items-center whitespace-nowrap cursor-pointer group border-r border-[#474747] ${
            tab.id === activeTab 
              ? 'bg-[#1e1e1e] text-[#cccccc] px-3 py-1.5 border-t-2 border-t-[#007acc]'
              : 'bg-[#2d2d2d] text-[#969696] px-3 py-[0.65rem] hover:bg-[#252526]'
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <FileCode className="h-4 w-4 mr-1.5 text-[#75beff]" />
          <span className="max-w-[120px] truncate">{formatFileName(tab.fileName)}</span>
          {tab.isUnsaved && (
            <span className="ml-1.5 text-[#e6e6e6] text-opacity-70">•</span>
          )}
          <button
            className={`ml-2 p-0.5 rounded-sm ${
              tab.id === activeTab 
                ? 'text-[#cccccc] opacity-0 group-hover:opacity-100 hover:bg-[#474747]' 
                : 'text-[#969696] opacity-0 group-hover:opacity-100 hover:bg-[#3e3e3e]'
            }`}
            onClick={(e) => handleCloseTab(e, tab.id)}
            aria-label="Close tab"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex-1 bg-[#1e1e1e] border-b border-[#474747]"></div>
    </div>
  );
};

export default Tabs;
