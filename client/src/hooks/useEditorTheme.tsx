import { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';

export const useEditorTheme = () => {
  const { theme } = useEditorStore();
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');

  useEffect(() => {
    setIsDarkMode(theme === 'dark');
    
    // Update document class for global styling
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Update Monaco Editor theme if it's loaded
    if (window.monaco) {
      window.monaco.editor.setTheme(theme === 'dark' ? 'vs-dark-custom' : 'vs');
    }
  }, [theme]);

  return { isDarkMode };
};

export default useEditorTheme;
