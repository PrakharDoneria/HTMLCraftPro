import React, { useState } from 'react';
import { Moon, Settings } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  className?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ className = '' }) => {
  const { toggleTheme, theme } = useEditorStore();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleMenuToggle = (menu: string) => {
    if (activeMenu === menu) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menu);
    }
  };

  const menuItems = {
    file: ['New File', 'Open...', 'Save', 'Save As...', 'Close Editor', 'Exit'],
    edit: ['Undo', 'Redo', 'Cut', 'Copy', 'Paste', 'Find', 'Replace'],
    view: ['Explorer', 'Search', 'Problems', 'Output', 'Terminal', 'Appearance'],
    help: ['Welcome', 'Documentation', 'Keyboard Shortcuts', 'About']
  };

  return (
    <header className={cn("bg-secondary border-b border-border flex items-center text-sm", className)}>
      <div className="flex items-center relative">
        {Object.keys(menuItems).map((menu) => (
          <div key={menu} className="relative">
            <div 
              className={cn(
                "px-4 py-2 hover:bg-opacity-20 hover:bg-white cursor-pointer", 
                activeMenu === menu && "bg-opacity-20 bg-white"
              )}
              onClick={() => handleMenuToggle(menu)}
            >
              {menu.charAt(0).toUpperCase() + menu.slice(1)}
            </div>
            {activeMenu === menu && (
              <div className="absolute top-full left-0 bg-secondary border border-border shadow-lg z-50 min-w-[180px]">
                {menuItems[menu as keyof typeof menuItems].map((item) => (
                  <div key={item} className="px-4 py-2 hover:bg-primary hover:bg-opacity-20 cursor-pointer">
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="ml-auto flex items-center">
        <button 
          className="p-2 hover:bg-opacity-20 hover:bg-white rounded"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          <Moon className="h-4 w-4" />
        </button>
        <button className="p-2 hover:bg-opacity-20 hover:bg-white rounded" title="Settings">
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
