import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/layout/Sidebar';
import AppHeader from '@/components/layout/AppHeader';
import StatusBar from '@/components/layout/StatusBar';
import RightPanel from '@/components/layout/RightPanel';
import Tabs from '@/components/editor/Tabs';
import MonacoEditor from '@/components/editor/Monaco';
import Preview from '@/components/editor/Preview';
import Terminal from '@/components/terminal/Terminal';
import ResizeHandle from '@/components/ui/ResizeHandle';
import CommandPalette from '@/components/ui/CommandPalette';
import { useEditorStore } from '@/store/editorStore';
import { useFileStore } from '@/store/fileStore';
import { useUiStore } from '@/store/uiStore';
import { getLanguageFromFileName, debounce } from '@/lib/utils';
import * as monaco from 'monaco-editor';
import { TerminalSquare } from 'lucide-react';

const Editor: React.FC = () => {
  const { 
    tabs, activeTab, updateTabContent, setCursorPosition, 
    createNewTab, loadSession, saveSession 
  } = useEditorStore();
  const { fetchFiles, files, loadFilesFromLocalStorage, saveFilesToLocalStorage } = useFileStore();
  const [localFilesLoaded, setLocalFilesLoaded] = useState(false);
  const { 
    sidebarVisible, rightPanelVisible, commandPaletteOpen,
    toggleCommandPalette 
  } = useUiStore();
  
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [htmlContent, setHtmlContent] = useState('');
  const [monacoInstance, setMonacoInstance] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [hasOpenedDefaultFile, setHasOpenedDefaultFile] = useState(false);
  const sessionLoaded = useRef(false);
  
  // Terminal state
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [terminalMaximized, setTerminalMaximized] = useState(false);
  
  // Load saved session on component mount
  useEffect(() => {
    if (!sessionLoaded.current) {
      loadSession();
      sessionLoaded.current = true;
      
      // If we have tabs after loading the session, mark that we've opened files
      if (tabs.length > 0) {
        setHasOpenedDefaultFile(true);
      }
    }
  }, [loadSession, tabs.length]);

  // Load files from localStorage before fetching from server
  useEffect(() => {
    if (!localFilesLoaded) {
      const loadLocalFiles = async () => {
        try {
          const success = await loadFilesFromLocalStorage();
          console.log('Loaded files from localStorage:', success);
          setLocalFilesLoaded(true);
        } catch (error) {
          console.error('Error loading files from localStorage:', error);
          setLocalFilesLoaded(true); // Still mark as loaded even on error to continue with fetching
        }
      };
      
      loadLocalFiles();
    }
  }, [loadFilesFromLocalStorage, localFilesLoaded]);

  const { isLoading } = useQuery({
    queryKey: ['/api/files'],
    queryFn: async () => {
      // If we couldn't load from localStorage, fetch from server
      if (files.length === 0) {
        await fetchFiles();
      }
      return null;
    },
    enabled: localFilesLoaded // Only run after checking localStorage
  });

  // Automatically open a default file when files are loaded
  useEffect(() => {
    if (!isLoading && files.length > 0 && !hasOpenedDefaultFile && tabs.length === 0) {
      // Get the first HTML file to open by default
      const defaultFile = files.find(file => file.name.endsWith('.html')) || files[0];
      if (defaultFile) {
        createNewTab(defaultFile.name, defaultFile.content);
        setHasOpenedDefaultFile(true);
      }
    }
  }, [isLoading, files, hasOpenedDefaultFile, tabs.length, createNewTab]);

  // Get current tab content - ensure we always get the latest version
  const currentTab = useCallback(() => {
    return tabs.find(tab => tab.id === activeTab);
  }, [tabs, activeTab]);
  
  // Get content and language for the current tab
  const activeTabData = currentTab();
  const editorContent = activeTabData?.content || '';
  const language = activeTabData?.fileName 
    ? getLanguageFromFileName(activeTabData.fileName) 
    : 'plaintext';

  // Get HTML file content for preview
  const getHtmlFileContent = useCallback(() => {
    // First check for an active HTML tab
    const htmlTab = tabs.find(tab => tab.id === activeTab && tab.fileName.endsWith('.html'));
    if (htmlTab) {
      return htmlTab.content;
    }
    
    // If active tab is not HTML, find the first HTML tab
    const firstHtmlTab = tabs.find(tab => tab.fileName.endsWith('.html'));
    if (firstHtmlTab) {
      return firstHtmlTab.content;
    }
    
    // If no HTML tab exists, check if there are HTML files that can be opened
    const htmlFile = files.find(file => file.name.endsWith('.html'));
    if (htmlFile) {
      return htmlFile.content;
    }
    
    // Fallback to a basic HTML template
    return '<!DOCTYPE html><html><head><title>HTML Preview</title></head><body><div style="padding: 20px; font-family: sans-serif; color: #333;"><h2>No HTML file found</h2><p>Open or create an HTML file to see the preview.</p></div></body></html>';
  }, [tabs, activeTab, files]);
  
  // Update preview content when editor content changes (debounced)
  const updatePreview = useCallback(debounce(() => {
    setHtmlContent(getHtmlFileContent());
  }, 500), [getHtmlFileContent]);

  // Update preview when editor content changes or when active tab changes
  useEffect(() => {
    updatePreview();
  }, [updatePreview, activeTab, tabs]);

  // Handle editor content changes
  const handleEditorChange = (value: string) => {
    if (activeTab) {
      updateTabContent(activeTab, value);
      updatePreview();
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
      try {
        console.log('Saving file with Ctrl+S shortcut...');
        useEditorStore.getState().saveActiveTab();
      } catch (error) {
        console.error('Error saving file:', error);
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {
      // Open command palette
      toggleCommandPalette();
    });

    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      // Format document
      useEditorStore.getState().formatActiveTab();
    });
    
    // Toggle terminal with shortcut (Ctrl+`)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote, () => {
      setTerminalVisible(prev => !prev);
    });

    // Find functionality (Ctrl+F)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      // Trigger Monaco's built-in find widget
      const findAction = editor.getAction('actions.find');
      if (findAction) {
        findAction.run();
      }
    });

    // Replace functionality (Ctrl+H)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
      // Trigger Monaco's built-in replace widget
      const replaceAction = editor.getAction('editor.action.startFindReplaceAction');
      if (replaceAction) {
        replaceAction.run();
      }
    });

    // Find Next (F3)
    editor.addCommand(monaco.KeyCode.F3, () => {
      const nextMatchAction = editor.getAction('editor.action.nextMatchFindAction');
      if (nextMatchAction) {
        nextMatchAction.run();
      }
    });

    // Find Previous (Shift+F3)
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.F3, () => {
      const previousMatchAction = editor.getAction('editor.action.previousMatchFindAction');
      if (previousMatchAction) {
        previousMatchAction.run();
      }
    });

    // Configure find widget with safe options
    editor.updateOptions({
      find: {
        addExtraSpaceOnTop: true,
        autoFindInSelection: 'never',
        seedSearchStringFromSelection: 'always',
      }
    });

    // Monaco editor needs full focus to work properly
    setTimeout(() => {
      editor.focus();
    }, 100);
  };

  // Refresh preview manually
  const refreshPreview = () => {
    setHtmlContent(getHtmlFileContent());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-editor">
        <div className="text-center text-white">
          <div className="animate-spin mb-4 mx-auto h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
          <p className="text-lg">Loading HTML Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#1e1e1e] text-[#cccccc]">
      <AppHeader />
      
      <div className="flex flex-1 overflow-hidden">
        {sidebarVisible && (
          <Sidebar className="bg-[#252526] border-r border-[#474747] w-64" />
        )}
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <Tabs className="bg-[#252526]" />
          
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 relative bg-[#1e1e1e]">
              {activeTab ? (
                <MonacoEditor
                  language={language}
                  value={editorContent}
                  onChange={handleEditorChange}
                  onMount={handleEditorMount}
                  options={{
                    theme: 'vs-dark',
                    fontSize: 14,
                    lineNumbers: 'on',
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    renderLineHighlight: 'all',
                    wordWrap: 'on',
                    automaticLayout: true,
                    tabSize: 2,
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-[#cccccc] bg-[#1e1e1e]">
                  <div className="text-center">
                    <h2 className="text-xl mb-2">Welcome to VS Code-like HTML Editor</h2>
                    <p className="text-[#8a8a8a]">Open a file from the sidebar or create a new file to get started</p>
                  </div>
                </div>
              )}
            </div>
            
            <ResizeHandle 
              id="editor-preview-resizer"
              direction="horizontal"
              className="bg-[#474747] w-[1px] hover:w-[3px] hover:bg-[#007acc] transition-all cursor-col-resize"
            />
            
            <Preview 
              className="w-1/2 bg-[#1e1e1e] border-l border-[#474747]" 
              htmlContent={htmlContent}
              refreshPreview={refreshPreview}
            />
          </div>
        </main>
        
        {rightPanelVisible && (
          <RightPanel 
            htmlContent={htmlContent} 
            className="bg-[#252526] border-l border-[#474747] w-64"
          />
        )}
      </div>
      
      <StatusBar 
        cursorPosition={cursorPos} 
        className="bg-[#007acc] text-white h-[22px] text-xs px-2 flex items-center"
      />
      
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={toggleCommandPalette}
      />
      
      {/* Terminal Button */}
      {!terminalVisible && (
        <button
          className="fixed bottom-6 right-6 bg-[#333] hover:bg-[#444] p-2 rounded-full shadow-lg z-50"
          onClick={() => setTerminalVisible(true)}
          title="Open Terminal (Ctrl+`)"
        >
          <TerminalSquare className="h-6 w-6 text-[#75beff]" />
        </button>
      )}
      
      {/* Terminal Component */}
      <Terminal
        visible={terminalVisible}
        onClose={() => setTerminalVisible(false)}
        onMinimize={() => setTerminalVisible(false)}
        onMaximize={() => setTerminalMaximized(!terminalMaximized)}
        isMaximized={terminalMaximized}
      />
    </div>
  );
};

export default Editor;
