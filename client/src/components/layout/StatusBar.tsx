import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { getLanguageFromFileName } from '@/lib/utils';
import { cn } from '@/lib/utils';

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
    <footer className={cn("bg-statusbar text-white flex justify-between items-center text-xs px-2 py-0.5", className)}>
      <div className="flex items-center space-x-4">
        <span className="uppercase">{language}</span>
        <span>UTF-8</span>
        <span>LF</span>
      </div>
      <div className="flex items-center space-x-4">
        <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
        <span>Spaces: 2</span>
        <span>Live Preview: On</span>
      </div>
    </footer>
  );
};

export default StatusBar;
