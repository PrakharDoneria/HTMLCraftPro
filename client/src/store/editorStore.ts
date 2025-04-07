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
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  tabs: [],
  activeTab: null,
  theme: 'dark',
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
      
      return { 
        tabs: newTabs, 
        activeTab: id 
      };
    });
  },

  openFile: (fileName, content) => {
    const existingTab = get().tabs.find(tab => tab.fileName === fileName);
    
    if (existingTab) {
      set({ activeTab: existingTab.id });
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
        
        return { 
          tabs: newTabs, 
          activeTab: id 
        };
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
      
      return { 
        tabs: newTabs, 
        activeTab: newActiveTab 
      };
    });
  },

  setActiveTab: (tabId) => {
    set({ activeTab: tabId });
  },

  updateTabContent: (tabId, content) => {
    set(state => ({
      tabs: state.tabs.map(tab => 
        tab.id === tabId 
          ? { ...tab, content, isUnsaved: true } 
          : tab
      )
    }));
  },

  saveActiveTab: () => {
    const { tabs, activeTab } = get();
    if (!activeTab) return;
    
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (!currentTab) return;
    
    // Save file to storage
    const fileStore = useFileStore.getState();
    fileStore.saveFile(currentTab.fileName, currentTab.content);
    
    // Update tab state
    set(state => ({
      tabs: state.tabs.map(tab => 
        tab.id === activeTab 
          ? { ...tab, isUnsaved: false } 
          : tab
      )
    }));
  },

  formatActiveTab: () => {
    const { tabs, activeTab } = get();
    if (!activeTab) return;
    
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (!currentTab) return;
    
    if (currentTab.language === 'html') {
      const formattedContent = beautifyHtml(currentTab.content);
      
      set(state => ({
        tabs: state.tabs.map(tab => 
          tab.id === activeTab 
            ? { ...tab, content: formattedContent, isUnsaved: true } 
            : tab
        )
      }));
    }
  },

  toggleTheme: () => {
    set(state => ({
      theme: state.theme === 'dark' ? 'light' : 'dark'
    }));
  },

  setCursorPosition: (position) => {
    set({ cursorPosition: position });
  },
  
  getCursorPosition: () => {
    return get().cursorPosition;
  }
}));
