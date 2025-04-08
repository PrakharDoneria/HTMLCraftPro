import React, { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useFileStore } from '@/store/fileStore';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Command {
  title: string;
  shortcut?: string;
  action: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  
  const { 
    createNewTab, saveActiveTab, formatActiveTab, 
    toggleTheme, activeTab, tabs 
  } = useEditorStore();
  
  const { createFile } = useFileStore();
  
  // Handle clicking outside to close the command palette
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const commands: Command[] = [
    { 
      title: 'New File', 
      shortcut: 'Ctrl+N', 
      action: () => {
        const fileName = prompt('Enter file name:');
        if (fileName) {
          createFile(fileName, '');
          createNewTab(fileName, '');
          onClose();
        }
      }
    },
    { 
      title: 'Open File', 
      shortcut: 'Ctrl+O', 
      action: () => {
        // This would typically open a file picker dialog
        alert('Open file functionality would be here');
        onClose();
      }
    },
    { 
      title: 'Save', 
      shortcut: 'Ctrl+S', 
      action: () => {
        saveActiveTab();
        onClose();
      }
    },
    { 
      title: 'Format Document', 
      shortcut: 'Shift+Alt+F', 
      action: () => {
        formatActiveTab();
        onClose();
      }
    },
    { 
      title: 'Toggle Theme', 
      shortcut: 'Alt+T', 
      action: () => {
        toggleTheme();
        onClose();
      }
    },
    { 
      title: 'Toggle Sidebar', 
      shortcut: 'Ctrl+B', 
      action: () => {
        // This would typically toggle the sidebar
        alert('Toggle sidebar functionality would be here');
        onClose();
      }
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setFilteredCommands(commands);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        if (!isOpen) {
          onClose(); // This will toggle to open state
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    
    if (value.trim() === '') {
      setFilteredCommands(commands);
    } else {
      const filtered = commands.filter(cmd => 
        cmd.title.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCommands(filtered);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div ref={paletteRef} className="bg-secondary border border-border rounded shadow-lg w-full max-w-lg">
        <div className="p-2 border-b border-border">
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Type a command or search..." 
            value={search}
            onChange={handleSearchChange}
            className="w-full bg-editor border border-border rounded p-2 text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="overflow-auto max-h-96">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((command, index) => (
              <div 
                key={index}
                className="p-2 hover:bg-gray-700 cursor-pointer flex items-center"
                onClick={command.action}
              >
                <span className="flex-1">{command.title}</span>
                {command.shortcut && (
                  <span className="text-gray-400 text-xs">{command.shortcut}</span>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-400">
              No commands found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
