import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { useFileStore } from './fileStore';
import { getLanguageFromFileName, beautifyHtml } from '../lib/utils';

export interface EditorTab {
  id: string;
  fileName: string;
  content: string;
  language: string;
  isUnsaved: boolean;
}

interface CursorPosition {
  line: number;
  column: number;
}

interface EditorStore {
  tabs: EditorTab[];
  activeTab: string | null;
  theme: 'light' | 'dark';
  cursorPosition: CursorPosition;
  createNewTab: (fileName: string, content: string) => void;
  openFile: (fileName: string, content: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  saveActiveTab: () => void;
  formatActiveTab: () => void;
  getCursorPosition: () => CursorPosition;
  toggleTheme: () => void;
  setCursorPosition: (position: CursorPosition) => void;
  loadSession: () => void;
  saveSession: () => void;
}

// Load session data from localStorage
const loadSessionFromStorage = (): { tabs: EditorTab[], activeTab: string | null, theme: 'light' | 'dark' } => {
  try {
    const sessionData = localStorage.getItem('editor-session');
    if (sessionData) {
      return JSON.parse(sessionData);
    }
  } catch (error) {
    console.error('Failed to load session from storage:', error);
  }
  
  return {
    tabs: [],
    activeTab: null,
    theme: 'dark'
  };
};

export const useEditorStore = create<EditorStore>((set, get) => {
  // Load initial state from localStorage
  const savedSession = loadSessionFromStorage();
  
  return {
    // Initialize with saved data or defaults
    tabs: savedSession.tabs || [],
    activeTab: savedSession.activeTab || null,
    theme: savedSession.theme || 'dark',
    cursorPosition: { line: 1, column: 1 },

    createNewTab: (fileName, content) => {
      const id = uuidv4();
      const language = getLanguageFromFileName(fileName);
      
      set(state => {
        const newTabs = [...state.tabs, { 
          id, 
          fileName, 
          content, 
          language,
          isUnsaved: true 
        }];
        
        const newState = { 
          tabs: newTabs, 
          activeTab: id 
        };
        
        // Save session data
        setTimeout(() => get().saveSession(), 0);
        
        return newState;
      });
    },

    openFile: (fileName, content) => {
      const existingTab = get().tabs.find(tab => tab.fileName === fileName);
      
      if (existingTab) {
        set({ activeTab: existingTab.id });
        // Save session after state update
        setTimeout(() => get().saveSession(), 0);
      } else {
        const id = uuidv4();
        const language = getLanguageFromFileName(fileName);
        
        set(state => {
          const newTabs = [...state.tabs, { 
            id, 
            fileName, 
            content, 
            language,
            isUnsaved: false 
          }];
          
          const newState = { 
            tabs: newTabs, 
            activeTab: id 
          };
          
          // Save session data
          setTimeout(() => get().saveSession(), 0);
          
          return newState;
        });
      }
    },

    closeTab: (tabId) => {
      set(state => {
        const tabIndex = state.tabs.findIndex(tab => tab.id === tabId);
        
        if (tabIndex === -1) return state;
        
        const newTabs = state.tabs.filter(tab => tab.id !== tabId);
        let newActiveTab = state.activeTab;
        
        if (tabId === state.activeTab) {
          if (newTabs.length > 0) {
            const newIndex = Math.min(tabIndex, newTabs.length - 1);
            newActiveTab = newTabs[newIndex].id;
          } else {
            newActiveTab = null;
          }
        }
        
        const newState = { 
          tabs: newTabs, 
          activeTab: newActiveTab 
        };
        
        // Save session after state update
        setTimeout(() => get().saveSession(), 0);
        
        return newState;
      });
    },

    setActiveTab: (tabId) => {
      set({ activeTab: tabId });
      // Save session after state update
      setTimeout(() => get().saveSession(), 0);
    },

    updateTabContent: (tabId, content) => {
      set(state => {
        const newState = {
          tabs: state.tabs.map(tab => 
            tab.id === tabId 
              ? { ...tab, content, isUnsaved: true } 
              : tab
          )
        };
        
        // Save session after state update
        setTimeout(() => get().saveSession(), 0);
        
        return newState;
      });
    },

    saveActiveTab: async () => {
      try {
        const { tabs, activeTab } = get();
        if (!activeTab) {
          console.warn('No active tab to save');
          return;
        }
        
        const currentTab = tabs.find(tab => tab.id === activeTab);
        if (!currentTab) {
          console.warn('Active tab not found in tabs list');
          return;
        }
        
        console.log('Saving file:', currentTab.fileName);
        
        if (!currentTab.fileName) {
          console.error('Cannot save file with empty filename');
          // Prompt for filename if empty
          const fileName = prompt('Please enter a filename to save:');
          if (!fileName) {
            console.warn('Save cancelled - no filename provided');
            return;
          }
          // Update the tab with the new filename
          set(state => ({
            tabs: state.tabs.map(tab => 
              tab.id === activeTab 
                ? { ...tab, fileName } 
                : tab
            )
          }));
          // Get the updated tab
          const updatedTab = get().tabs.find(tab => tab.id === activeTab);
          if (!updatedTab) return;
          
          // Save with the new filename
          const fileStore = useFileStore.getState();
          await fileStore.saveFile(updatedTab.fileName, updatedTab.content);
          
          // Update tab state
          set(state => ({
            tabs: state.tabs.map(tab => 
              tab.id === activeTab 
                ? { ...tab, isUnsaved: false } 
                : tab
            )
          }));
          
          // Save session after state update
          setTimeout(() => get().saveSession(), 0);
          
          console.log('File saved with new filename:', updatedTab.fileName);
          return;
        }
        
        // Save file to storage
        const fileStore = useFileStore.getState();
        
        try {
          await fileStore.saveFile(currentTab.fileName, currentTab.content);
          console.log('File saved successfully:', currentTab.fileName);
          
          // Update tab state
          set(state => {
            const newState = {
              tabs: state.tabs.map(tab => 
                tab.id === activeTab 
                  ? { ...tab, isUnsaved: false } 
                  : tab
              )
            };
            
            // Save session after state update
            setTimeout(() => get().saveSession(), 0);
            
            return newState;
          });
        } catch (saveError) {
          console.error('Error saving file to server:', saveError);
          
          // Try to prompt user for a new filename if save fails
          const saveAsFileName = prompt('Error saving file. Save as a different name?', currentTab.fileName);
          if (saveAsFileName) {
            try {
              await fileStore.saveFile(saveAsFileName, currentTab.content);
              console.log('File saved with new name:', saveAsFileName);
              
              // Update tab with new filename
              set(state => {
                const newState = {
                  tabs: state.tabs.map(tab => 
                    tab.id === activeTab 
                      ? { ...tab, fileName: saveAsFileName, isUnsaved: false } 
                      : tab
                  )
                };
                
                // Save session after state update
                setTimeout(() => get().saveSession(), 0);
                
                return newState;
              });
            } catch (saveAsError) {
              console.error('Error in save as operation:', saveAsError);
              alert('Failed to save the file. Please try again with a different filename.');
            }
          }
        }
      } catch (error) {
        console.error('Error in saveActiveTab:', error);
        alert('An error occurred while saving. Please check console for details.');
      }
    },

    formatActiveTab: () => {
      const { tabs, activeTab } = get();
      if (!activeTab) return;
      
      const currentTab = tabs.find(tab => tab.id === activeTab);
      if (!currentTab) return;
      
      if (currentTab.language === 'html') {
        const formattedContent = beautifyHtml(currentTab.content);
        
        set(state => {
          const newState = {
            tabs: state.tabs.map(tab => 
              tab.id === activeTab 
                ? { ...tab, content: formattedContent, isUnsaved: true } 
                : tab
            )
          };
          
          // Save session after state update
          setTimeout(() => get().saveSession(), 0);
          
          return newState;
        });
      }
    },

    toggleTheme: () => {
      set(state => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        
        // Save session after state update
        setTimeout(() => get().saveSession(), 0);
        
        return { theme: newTheme as 'light' | 'dark' };
      });
    },

    setCursorPosition: (position) => {
      set({ cursorPosition: position });
    },
    
    getCursorPosition: () => {
      return get().cursorPosition;
    },
    
    // Save the current session to localStorage
    saveSession: () => {
      try {
        const state = get();
        const sessionData = {
          tabs: state.tabs,
          activeTab: state.activeTab,
          theme: state.theme
        };
        
        localStorage.setItem('editor-session', JSON.stringify(sessionData));
        console.log('Session saved to localStorage');
      } catch (error) {
        console.error('Failed to save session to localStorage:', error);
      }
    },
    
    // Load session from localStorage
    loadSession: () => {
      try {
        const sessionData = localStorage.getItem('editor-session');
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          const loadedData: Partial<EditorStore> = {
            tabs: Array.isArray(parsed.tabs) ? parsed.tabs : [],
            activeTab: typeof parsed.activeTab === 'string' ? parsed.activeTab : null,
            theme: parsed.theme === 'light' || parsed.theme === 'dark' ? parsed.theme : 'dark'
          };
          set(loadedData);
          console.log('Session loaded from localStorage');
        }
      } catch (error) {
        console.error('Failed to load session from localStorage:', error);
      }
    }
  };
});