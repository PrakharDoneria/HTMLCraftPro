import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { getLanguageFromFileName } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Brackets, Globe, Bell, Check } from 'lucide-react';

interface StatusBarProps {
  className?: string;
  cursorPosition?: { line: number; column: number };
}

const StatusBar: React.FC<StatusBarProps> = ({ 
  className = '', 
  cursorPosition = { line: 1, column: 1 } 
}) => {
  const { tabs, activeTab } = useEditorStore();
  const currentTab = tabs.find(tab => tab.id === activeTab);
  const language = currentTab ? getLanguageFromFileName(currentTab.fileName) : 'text';

  return (
    <footer className={cn("bg-[#007acc] text-white flex justify-between items-center text-xs h-[22px]", className)}>
      <div className="flex items-center h-full divide-x divide-[#ffffff33]">
        <div className="flex items-center px-2 h-full hover:bg-[#1177bb] cursor-pointer">
          <Check className="h-3.5 w-3.5 mr-1" />
          <span>Ready</span>
        </div>
        <div className="flex items-center px-2 h-full hover:bg-[#1177bb] cursor-pointer">
          <Brackets className="h-3.5 w-3.5 mr-1" />
          <span className="uppercase">{language}</span>
        </div>
        <div className="flex items-center px-2 h-full hover:bg-[#1177bb] cursor-pointer">
          <span>UTF-8</span>
        </div>
        <div className="flex items-center px-2 h-full hover:bg-[#1177bb] cursor-pointer">
          <span>LF</span>
        </div>
      </div>
      
      <div className="flex items-center h-full divide-x divide-[#ffffff33]">
        <div className="flex items-center px-2 h-full hover:bg-[#1177bb] cursor-pointer">
          <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
        </div>
        <div className="flex items-center px-2 h-full hover:bg-[#1177bb] cursor-pointer">
          <span>Spaces: 2</span>
        </div>
        <div className="flex items-center px-2 h-full hover:bg-[#1177bb] cursor-pointer">
          <Globe className="h-3.5 w-3.5 mr-1" />
          <span>Live Preview</span>
        </div>
        <div className="flex items-center px-2 h-full hover:bg-[#1177bb] cursor-pointer">
          <Bell className="h-3.5 w-3.5" />
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;
