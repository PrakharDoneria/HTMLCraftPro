import React from 'react';
import { X } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { formatFileName } from '@/lib/utils';

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
    <div className={`bg-secondary flex text-sm border-b border-border overflow-x-auto ${className}`}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab px-4 py-1.5 border-r border-border flex items-center whitespace-nowrap cursor-pointer ${
            tab.id === activeTab ? 'active bg-editor' : ''
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span>{formatFileName(tab.fileName)}</span>
          <button
            className="ml-2 p-0.5 opacity-50 hover:opacity-100 rounded-full hover:bg-gray-700"
            onClick={(e) => handleCloseTab(e, tab.id)}
            aria-label="Close tab"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <div className="flex-1"></div>
    </div>
  );
};

export default Tabs;
