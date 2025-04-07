import { create } from 'zustand';

interface UiStore {
  sidebarVisible: boolean;
  rightPanelVisible: boolean;
  commandPaletteOpen: boolean;
  editorWidth: number;
  previewWidth: number;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  toggleCommandPalette: () => void;
  setPanelSizes: (sizes: { editor: number; preview: number }) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarVisible: true,
  rightPanelVisible: true,
  commandPaletteOpen: false,
  editorWidth: 50, // percentage
  previewWidth: 50, // percentage
  
  toggleSidebar: () => set(state => ({ 
    sidebarVisible: !state.sidebarVisible 
  })),
  
  toggleRightPanel: () => set(state => ({ 
    rightPanelVisible: !state.rightPanelVisible 
  })),
  
  toggleCommandPalette: () => set(state => ({ 
    commandPaletteOpen: !state.commandPaletteOpen 
  })),
  
  setPanelSizes: (sizes) => set({ 
    editorWidth: sizes.editor, 
    previewWidth: sizes.preview 
  })
}));
