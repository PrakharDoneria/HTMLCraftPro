import React, { useState, useEffect, useRef } from 'react';
import { Moon, Settings, Code, Github, Instagram, Search, Save, FolderOpen, Plus, X, Download, Upload, RefreshCw } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { useFileStore } from '@/store/fileStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  className?: string;
}

interface MenuAction {
  label: string;
  shortcut?: string;
  action: () => void;
  divider?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ className = '' }) => {
  const { toggleTheme, theme, tabs, activeTab, createNewTab, saveActiveTab, closeTab, formatActiveTab } = useEditorStore();
  const { toggleSidebar, toggleRightPanel, toggleCommandPalette } = useUiStore();
  const { createFile, saveFile } = useFileStore();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const findInputRef = useRef<HTMLInputElement>(null);

  // GitHub integration
  const [githubToken, setGithubToken] = useState<string | null>(localStorage.getItem('github_token'));
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

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

  // Close find/replace when Escape is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && findReplaceOpen) {
        setFindReplaceOpen(false);
      }
      
      // Open find with Ctrl+F
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setFindReplaceOpen(true);
        setTimeout(() => {
          findInputRef.current?.focus();
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [findReplaceOpen]);

  // Focus find input when opened
  useEffect(() => {
    if (findReplaceOpen && findInputRef.current) {
      findInputRef.current.focus();
    }
  }, [findReplaceOpen]);

  const handleTokenSubmit = () => {
    if (tokenInput) {
      localStorage.setItem('github_token', tokenInput);
      setGithubToken(tokenInput);
      setShowTokenInput(false);
      setTokenInput('');
      alert('GitHub token saved successfully!');
    }
  };

  // File operations
  const handleNewFile = () => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      createNewTab(fileName, '');
      createFile(fileName, '');
    }
    setActiveMenu(null);
  };

  const handleOpenFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.css,.js,.json,.txt';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          createNewTab(file.name, content);
          createFile(file.name, content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
    setActiveMenu(null);
  };

  const handleSaveFile = () => {
    saveActiveTab();
    setActiveMenu(null);
  };

  const handleSaveFileAs = () => {
    try {
      const currentTab = tabs.find(tab => tab.id === activeTab);
      if (currentTab) {
        const fileName = prompt('Save as:', currentTab.fileName);
        if (fileName) {
          console.log('Saving file as:', fileName);
          const content = currentTab.content;
          
          // Save to server
          saveFile(fileName, content)
            .then(() => console.log('File saved to server successfully'))
            .catch(err => console.error('Error saving file to server:', err));
          
          // Create a download link
          try {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log('File download triggered');
          } catch (downloadError) {
            console.error('Error downloading file:', downloadError);
          }
        }
      } else {
        console.warn('No active tab found for Save As operation');
      }
    } catch (error) {
      console.error('Error in Save As operation:', error);
    }
    setActiveMenu(null);
  };

  const handleCloseEditor = () => {
    if (activeTab) {
      closeTab(activeTab);
    }
    setActiveMenu(null);
  };

  // Find and replace operations
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [decorations, setDecorations] = useState<string[]>([]);

  // Add highlight decorations for all matches
  const highlightMatches = (editor: any, editorInstance: any, matches: any[]) => {
    // Clear existing decorations
    if (decorations.length > 0) {
      editorInstance.removeDecorations(decorations);
    }

    // Set total matches count
    setTotalMatches(matches.length);
    
    if (matches.length === 0) {
      setCurrentMatch(0);
      setDecorations([]);
      return;
    }

    // Create decorations for all matches
    const decorationOptions = matches.map((match, index) => ({
      range: match.range,
      options: {
        inlineClassName: index === currentMatch ? 'findMatchHighlightCurrent' : 'findMatchHighlight',
        stickiness: 1, // Always stick to the content
        hoverMessage: { value: `Match ${index + 1} of ${matches.length}` }
      }
    }));

    // Apply decorations
    const newDecorations = editorInstance.deltaDecorations([], decorationOptions);
    setDecorations(newDecorations);
  };

  // Add custom CSS for highlighting (one-time)
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .findMatchHighlight {
        background-color: rgba(255, 213, 0, 0.3);
        border: 1px solid rgba(255, 213, 0, 0.8);
      }
      .findMatchHighlightCurrent {
        background-color: rgba(255, 140, 0, 0.5);
        border: 1px solid rgba(255, 140, 0, 0.8);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Remember last active tab when switching to avoid losing search context
  const [lastSearchedTab, setLastSearchedTab] = useState<string | null>(null);

  const performFind = () => {
    if (!findText || !window.monaco) return;
    
    const editor = window.monaco.editor.getModels()[0];
    if (editor) {
      const editorInstance = window.monaco.editor.getEditors()[0];
      if (editorInstance) {
        // Save the current tab context
        if (activeTab) {
          setLastSearchedTab(activeTab);
        }
        
        // Get all matches
        const matches = editor.findMatches(findText, true, false, false, null, true);
        
        // Update the highlight and current match position
        const newCurrentMatch = currentMatch >= matches.length ? 0 : currentMatch;
        setCurrentMatch(newCurrentMatch);
        
        // Apply highlights
        highlightMatches(editor, editorInstance, matches);
        
        // Navigate to the current match
        if (matches.length > 0) {
          const targetMatch = matches[newCurrentMatch];
          editorInstance.setSelection(targetMatch.range);
          editorInstance.revealRangeInCenter(targetMatch.range);
        }
      }
    }
  };

  // Find next occurrence
  const findNext = () => {
    if (!findText || !window.monaco) return;
    
    const editor = window.monaco.editor.getModels()[0];
    if (editor) {
      const editorInstance = window.monaco.editor.getEditors()[0];
      if (editorInstance) {
        const matches = editor.findMatches(findText, true, false, false, null, true);
        if (matches.length > 0) {
          const nextMatch = (currentMatch + 1) % matches.length;
          setCurrentMatch(nextMatch);
          
          // Update highlights
          highlightMatches(editor, editorInstance, matches);
          
          // Navigate to the match
          editorInstance.setSelection(matches[nextMatch].range);
          editorInstance.revealRangeInCenter(matches[nextMatch].range);
        }
      }
    }
  };

  // Find previous occurrence
  const findPrevious = () => {
    if (!findText || !window.monaco) return;
    
    const editor = window.monaco.editor.getModels()[0];
    if (editor) {
      const editorInstance = window.monaco.editor.getEditors()[0];
      if (editorInstance) {
        const matches = editor.findMatches(findText, true, false, false, null, true);
        if (matches.length > 0) {
          const prevMatch = (currentMatch - 1 + matches.length) % matches.length;
          setCurrentMatch(prevMatch);
          
          // Update highlights
          highlightMatches(editor, editorInstance, matches);
          
          // Navigate to the match
          editorInstance.setSelection(matches[prevMatch].range);
          editorInstance.revealRangeInCenter(matches[prevMatch].range);
        }
      }
    }
  };

  const performReplace = () => {
    if (!findText || !window.monaco) return;
    
    const editor = window.monaco.editor.getModels()[0];
    if (editor) {
      const editorInstance = window.monaco.editor.getEditors()[0];
      if (editorInstance) {
        const selection = editorInstance.getSelection();
        if (selection) {
          // Check if the selection matches our search text
          const selectedText = editor.getValueInRange(selection);
          if (selectedText === findText) {
            const op = {
              identifier: { major: 1, minor: 1 },
              range: selection,
              text: replaceText,
              forceMoveMarkers: true
            };
            editor.pushEditOperations([], [op], () => null);
            
            // Re-run search to update matches after replace
            setTimeout(performFind, 0);
          }
        }
      }
    }
  };

  const performReplaceAll = () => {
    if (!findText || !window.monaco) return;
    
    const editor = window.monaco.editor.getModels()[0];
    if (editor) {
      // Use the findMatches function to get all matches and replace them systematically
      const matches = editor.findMatches(findText, true, false, false, null, true);
      
      if (matches.length > 0) {
        // Sort the matches in reverse order to avoid position shifting during replacement
        const sortedMatches = [...matches].sort((a, b) => 
          b.range.startLineNumber - a.range.startLineNumber || 
          b.range.startColumn - a.range.startColumn
        );
        
        // Create operations for each match
        const operations = sortedMatches.map(match => ({
          identifier: { major: 1, minor: 1 },
          range: match.range,
          text: replaceText,
          forceMoveMarkers: true
        }));
        
        // Apply all replacements in a single operation
        editor.pushEditOperations([], operations, () => null);
        
        // Clear decorations since all matches are gone
        const editorInstance = window.monaco.editor.getEditors()[0];
        if (editorInstance && decorations.length > 0) {
          editorInstance.removeDecorations(decorations);
          setDecorations([]);
        }
        
        setCurrentMatch(0);
        setTotalMatches(0);
      }
    }
  };

  // Menu actions
  const menuItems: Record<string, MenuAction[]> = {
    file: [
      { label: 'New File', shortcut: 'Ctrl+N', action: handleNewFile },
      { label: 'Open File...', shortcut: 'Ctrl+O', action: handleOpenFile },
      { label: 'Save', shortcut: 'Ctrl+S', action: handleSaveFile },
      { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: handleSaveFileAs },
      { label: 'Close Editor', shortcut: 'Ctrl+W', action: handleCloseEditor, divider: true },
      { label: 'Exit', action: () => window.close() }
    ],
    edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z', action: () => document.execCommand('undo') },
      { label: 'Redo', shortcut: 'Ctrl+Y', action: () => document.execCommand('redo') },
      { label: 'Cut', shortcut: 'Ctrl+X', action: () => document.execCommand('cut'), divider: true },
      { label: 'Copy', shortcut: 'Ctrl+C', action: () => document.execCommand('copy') },
      { label: 'Paste', shortcut: 'Ctrl+V', action: () => document.execCommand('paste') },
      { label: 'Find', shortcut: 'Ctrl+F', action: () => setFindReplaceOpen(true), divider: true },
      { label: 'Replace', shortcut: 'Ctrl+H', action: () => setFindReplaceOpen(true) },
      { label: 'Format Document', shortcut: 'Shift+Alt+F', action: formatActiveTab }
    ],
    view: [
      { label: 'Explorer', shortcut: 'Ctrl+Shift+E', action: () => toggleSidebar() },
      { label: 'Search', shortcut: 'Ctrl+Shift+F', action: () => setFindReplaceOpen(true) },
      { label: 'Output', action: () => {/* No action needed - HTML output always shows */} },
      { label: 'Problems', action: () => toggleRightPanel(), divider: true },
      { label: 'Toggle Side Bar', shortcut: 'Ctrl+B', action: () => toggleSidebar() },
      { label: 'Toggle Panel', action: () => toggleRightPanel() },
      { label: 'Command Palette', shortcut: 'Ctrl+Shift+P', action: () => toggleCommandPalette() }
    ],
    git: [
      { label: 'Connect to GitHub', action: () => setShowTokenInput(true) },
      { label: 'Clone Repository', action: () => {
        if (!githubToken) {
          alert('Please connect to GitHub first');
          setShowTokenInput(true);
          return;
        }
        const repo = prompt('Enter repository (format: username/repo):');
        if (repo) {
          // Implementation would go here
          alert('GitHub cloning will be implemented in a future update');
        }
      }, divider: true },
      { label: 'Initialize Repository', action: () => alert('GitHub initialization will be implemented in a future update') },
      { label: 'Push', action: () => alert('GitHub push will be implemented in a future update') },
      { label: 'Pull', action: () => alert('GitHub pull will be implemented in a future update') }
    ],
    help: [
      { label: 'Welcome', action: () => alert('Welcome to HTML Editor!') },
      { label: 'Documentation', action: () => window.open('https://github.com/prakhardoneria', '_blank') },
      { label: 'Keyboard Shortcuts', action: () => alert('Keyboard shortcuts will be implemented in a future update') },
      { label: 'About', action: () => alert('HTML Editor - Created by Prakhar Doneria') }
    ]
  };

  return (
    <header className={cn("flex flex-col text-xs bg-[#333333] text-[#cccccc]", className)}>
      <div className="flex items-center h-8">
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
                  <div className="absolute top-full left-0 bg-[#252526] border border-[#474747] shadow-lg z-50 min-w-[220px] py-1">
                    {menuItems[menu as keyof typeof menuItems].map((item, index) => (
                      <React.Fragment key={index}>
                        <div 
                          className="px-3 py-1.5 hover:bg-[#094771] cursor-pointer flex justify-between items-center"
                          onClick={item.action}
                        >
                          <span>{item.label}</span>
                          {item.shortcut && <span className="text-[#a0a0a0] text-xs ml-4">{item.shortcut}</span>}
                        </div>
                        {item.divider && <div className="border-t border-[#474747] my-1"></div>}
                      </React.Fragment>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center h-full">
          <button 
            className="px-2 h-full flex items-center hover:bg-[#505050]"
            onClick={handleSaveFile}
            title="Save (Ctrl+S)"
          >
            <Save className="h-4 w-4" />
          </button>
          <a 
            href="https://instagram.com/prakhardoneria" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-2 h-full flex items-center hover:bg-[#505050]"
            title="Instagram Profile"
          >
            <Instagram className="h-4 w-4" />
          </a>
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
      </div>

      {/* Find/Replace Panel */}
      {findReplaceOpen && (
        <div className="bg-[#252526] border-t border-[#474747] p-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button 
              className="hover:bg-[#3c3c3c] p-1.5 rounded text-[#e8e8e8]"
              onClick={() => setFindReplaceOpen(false)}
              title="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="relative flex-1">
              <input
                ref={findInputRef}
                type="text"
                value={findText}
                onChange={(e) => {
                  setFindText(e.target.value);
                  // Auto-search as you type if more than 2 characters
                  if (e.target.value.length > 2) {
                    setTimeout(() => performFind(), 300);
                  }
                }}
                onKeyDown={(e) => {
                  // Search on Enter
                  if (e.key === 'Enter') {
                    performFind();
                  } else if (e.key === 'F3' || (e.ctrlKey && e.key === 'g')) {
                    e.preventDefault();
                    findNext();
                  } else if (e.key === 'F3' && e.shiftKey) {
                    e.preventDefault();
                    findPrevious();
                  }
                }}
                placeholder="Find"
                className="w-full bg-[#3c3c3c] border border-[#5f5f5f] rounded-sm px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#007acc]"
              />
              <Search className="absolute right-2 top-1.5 h-3.5 w-3.5 text-[#a0a0a0]" />
            </div>
            <div className="flex space-x-1">
              <button 
                className="bg-[#3c3c3c] hover:bg-[#4c4c4c] p-1 rounded text-white"
                onClick={findPrevious}
                title="Previous Match (Shift+F3)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button 
                className="bg-[#3c3c3c] hover:bg-[#4c4c4c] p-1 rounded text-white"
                onClick={findNext}
                title="Next Match (F3)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
            <button 
              className="bg-[#007acc] hover:bg-[#1b8bd4] px-2 py-1 rounded text-white text-xs"
              onClick={performFind}
            >
              Find
            </button>
          </div>
          
          {/* Match count indicator */}
          {totalMatches > 0 && (
            <div className="flex justify-end text-xs text-[#a0a0a0] pr-2 -mt-1">
              {currentMatch + 1} of {totalMatches} matches
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="w-6"></div>
            <div className="relative flex-1">
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replace"
                className="w-full bg-[#3c3c3c] border border-[#5f5f5f] rounded-sm px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#007acc]"
              />
            </div>
            <button 
              className="bg-[#3c3c3c] hover:bg-[#4c4c4c] px-2 py-1 rounded text-white text-xs"
              onClick={performReplace}
            >
              Replace
            </button>
            <button 
              className="bg-[#3c3c3c] hover:bg-[#4c4c4c] px-2 py-1 rounded text-white text-xs"
              onClick={performReplaceAll}
            >
              Replace All
            </button>
          </div>
        </div>
      )}

      {/* GitHub Token Input */}
      {showTokenInput && (
        <div className="bg-[#252526] border-t border-[#474747] p-2 flex flex-col gap-2">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-medium">GitHub Integration</h3>
            <button 
              className="hover:bg-[#3c3c3c] p-1 rounded text-[#e8e8e8]"
              onClick={() => setShowTokenInput(false)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-[#a0a0a0] mb-2">
            Enter your GitHub personal access token to enable Git integration.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="GitHub Personal Access Token"
              className="flex-1 bg-[#3c3c3c] border border-[#5f5f5f] rounded-sm px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#007acc]"
            />
            <button 
              className="bg-[#007acc] hover:bg-[#1b8bd4] px-2 py-1 rounded text-white text-xs"
              onClick={handleTokenSubmit}
            >
              Save
            </button>
          </div>
          <p className="text-xs text-[#a0a0a0] mt-1">
            The token will be stored in your browser's local storage.
          </p>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
