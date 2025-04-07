import React, { useState } from 'react';
import { Moon, Settings, Code, Github } from 'lucide-react';
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

  // Close menu when clicking outside
  const handleClickOutside = () => {
    if (activeMenu) {
      setActiveMenu(null);
    }
  };

  const menuItems = {
    file: ['New File', 'Open...', 'Save', 'Save As...', 'Close Editor', 'Exit'],
    edit: ['Undo', 'Redo', 'Cut', 'Copy', 'Paste', 'Find', 'Replace'],
    view: ['Explorer', 'Search', 'Problems', 'Output', 'Terminal', 'Appearance'],
    help: ['Welcome', 'Documentation', 'Keyboard Shortcuts', 'About']
  };

  return (
    <header className={cn("flex items-center text-xs h-8 bg-[#333333] text-[#cccccc]", className)}>
      <div className="flex items-center h-full">
        <div className="px-4 flex items-center h-full">
          <Code className="h-4 w-4 mr-2 text-[#75beff]" />
          <span className="font-medium text-white">HTML Editor</span>
        </div>
      </div>
      
      <div className="flex items-center relative">
        {Object.keys(menuItems).map((menu) => (
          <div key={menu} className="relative h-full">
            <div 
              className={cn(
                "px-3 h-full flex items-center hover:bg-[#505050] cursor-pointer", 
                activeMenu === menu && "bg-[#3c3c3c]"
              )}
              onClick={() => handleMenuToggle(menu)}
            >
              {menu.charAt(0).toUpperCase() + menu.slice(1)}
            </div>
            {activeMenu === menu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={handleClickOutside}
                />
                <div className="absolute top-full left-0 bg-[#252526] border border-[#474747] shadow-lg z-50 min-w-[200px] py-1">
                  {menuItems[menu as keyof typeof menuItems].map((item) => (
                    <div key={item} className="px-3 py-1 hover:bg-[#094771] cursor-pointer">
                      {item}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="ml-auto flex items-center h-full">
        <a 
          href="https://github.com/prakhardoneria" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-2 h-full flex items-center hover:bg-[#505050]"
          title="GitHub Profile"
        >
          <Github className="h-4 w-4" />
        </a>
        <button 
          className="px-2 h-full flex items-center hover:bg-[#505050]"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          <Moon className="h-4 w-4" />
        </button>
        <button 
          className="px-2 h-full flex items-center hover:bg-[#505050]" 
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
