import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/layout/Sidebar';
import AppHeader from '@/components/layout/AppHeader';
import StatusBar from '@/components/layout/StatusBar';
import RightPanel from '@/components/layout/RightPanel';
import Tabs from '@/components/editor/Tabs';
import MonacoEditor from '@/components/editor/Monaco';
import Preview from '@/components/editor/Preview';
import ResizeHandle from '@/components/ui/ResizeHandle';
import CommandPalette from '@/components/ui/CommandPalette';
import { useEditorStore } from '@/store/editorStore';
import { useFileStore } from '@/store/fileStore';
import { useUiStore } from '@/store/uiStore';
import { getLanguageFromFileName, debounce } from '@/lib/utils';
import * as monaco from 'monaco-editor';

const Editor: React.FC = () => {
  const { tabs, activeTab, updateTabContent, setCursorPosition } = useEditorStore();
  const { fetchFiles } = useFileStore();
  const { 
    sidebarVisible, rightPanelVisible, commandPaletteOpen,
    toggleCommandPalette 
  } = useUiStore();
  
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [htmlContent, setHtmlContent] = useState('');
  const [monacoInstance, setMonacoInstance] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  const { isLoading } = useQuery({
    queryKey: ['/api/files'],
    queryFn: async () => {
      await fetchFiles();
      return null;
    }
  });

  // Get current tab content
  const currentTab = tabs.find(tab => tab.id === activeTab);
  const editorContent = currentTab?.content || '';
  const language = currentTab ? getLanguageFromFileName(currentTab.fileName) : 'plaintext';

  // Update preview content when editor content changes (debounced)
  const updatePreview = useCallback(debounce((content: string) => {
    if (language === 'html') {
      setHtmlContent(content);
    }
  }, 500), [language]);

  // Update preview when editor content changes
  useEffect(() => {
    if (currentTab && currentTab.language === 'html') {
      setHtmlContent(currentTab.content);
    }
  }, [currentTab]);

  // Handle editor content changes
  const handleEditorChange = (value: string) => {
    if (activeTab) {
      updateTabContent(activeTab, value);
      updatePreview(value);
    }
  };

  // Handle editor mount
  const handleEditorMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    setMonacoInstance(editor);

    editor.onDidChangeCursorPosition(e => {
      const position = e.position;
      setCursorPos({ line: position.lineNumber, column: position.column });
      setCursorPosition({ line: position.lineNumber, column: position.column });
    });

    // Set up keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save the current file
      useEditorStore.getState().saveActiveTab();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {
      // Open command palette
      toggleCommandPalette();
    });

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      // Format document
      useEditorStore.getState().formatActiveTab();
    });
  };

  // Refresh preview manually
  const refreshPreview = () => {
    if (currentTab && currentTab.language === 'html') {
      setHtmlContent(currentTab.content);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppHeader />
      
      <div className="flex flex-1 overflow-hidden">
        {sidebarVisible && <Sidebar />}
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <Tabs />
          
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 relative">
              {activeTab ? (
                <MonacoEditor
                  language={language}
                  value={editorContent}
                  onChange={handleEditorChange}
                  onMount={handleEditorMount}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <h2 className="text-xl mb-2">Welcome to HTML Editor</h2>
                    <p>Open a file from the sidebar or create a new file to get started</p>
                  </div>
                </div>
              )}
            </div>
            
            <ResizeHandle 
              id="editor-preview-resizer"
              direction="horizontal"
            />
            
            <Preview 
              className="w-1/2" 
              htmlContent={htmlContent}
              refreshPreview={refreshPreview}
            />
          </div>
        </main>
        
        {rightPanelVisible && activeTab && (
          <RightPanel htmlContent={htmlContent} />
        )}
      </div>
      
      <StatusBar cursorPosition={cursorPos} />
      
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={toggleCommandPalette}
      />
    </div>
  );
};

export default Editor;
