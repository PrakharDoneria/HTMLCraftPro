import { create } from 'zustand';
import { apiRequest } from '@/lib/queryClient';

export interface File {
  name: string;
  content: string;
  path?: string; // Windows-style path for the file
}

interface FileStore {
  files: File[];
  loading: boolean;
  error: string | null;
  localStorageKey: string; // Key for storing files in localStorage
  fetchFiles: () => Promise<void>;
  createFile: (name: string, content: string) => Promise<File>;
  saveFile: (name: string, content: string) => Promise<File>;
  deleteFile: (name: string) => Promise<boolean>;
  deleteFolder: (folderPath: string) => Promise<boolean>;
  renameFile: (oldName: string, newName: string) => Promise<boolean>;
  saveFilesToLocalStorage: () => void; // Save files to localStorage
  loadFilesFromLocalStorage: () => void; // Load files from localStorage
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  loading: false,
  error: null,
  localStorageKey: 'windows-html-editor-files',
  
  fetchFiles: async () => {
    try {
      set({ loading: true, error: null });
      const response = await apiRequest('GET', '/api/files', undefined);
      const files = await response.json();
      set({ files, loading: false });
    } catch (error) {
      console.error('Error fetching files:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch files', 
        loading: false 
      });
    }
  },
  
  createFile: async (name, content) => {
    try {
      if (!name) throw new Error('File name cannot be empty');
      
      set({ loading: true, error: null });
      
      // Check if file already exists
      const existingFile = get().files.find(file => file.name === name);
      if (existingFile) {
        throw new Error(`File '${name}' already exists`);
      }
      
      // Create new file on server
      const response = await apiRequest('POST', '/api/files', { name, content });
      const newFile = await response.json();
      
      // Update local state
      set(state => {
        const updatedFiles = [...state.files, newFile];
        const updatedState = {
          files: updatedFiles,
          loading: false
        };
        
        // Save to localStorage after state update
        setTimeout(() => get().saveFilesToLocalStorage(), 0);
        
        return updatedState;
      });
      
      return newFile;
    } catch (error) {
      console.error('Error creating file:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create file', 
        loading: false 
      });
      throw error;
    }
  },
  
  saveFile: async (name, content) => {
    try {
      if (!name) throw new Error('File name cannot be empty');
      
      console.log(`Saving file to server: ${name}`);
      set({ loading: true, error: null });
      
      const url = `/api/files/${encodeURIComponent(name)}`;
      console.log(`Request URL: ${url}`);
      
      const response = await apiRequest('PUT', url, { content });
      const savedFile = await response.json();
      console.log('Save response:', response.status, response.statusText);
      
      // Update local state
      set(state => {
        const existingFile = state.files.find(file => file.name === name);
        let updatedState;
        
        if (existingFile) {
          console.log(`Updating existing file in state: ${name}`);
          updatedState = {
            files: state.files.map(file => 
              file.name === name ? { ...file, content } : file
            ),
            loading: false
          };
        } else {
          console.log(`Adding new file to state: ${name}`);
          updatedState = {
            files: [...state.files, savedFile],
            loading: false
          };
        }
        
        // Save to localStorage after state update
        setTimeout(() => get().saveFilesToLocalStorage(), 0);
        
        return updatedState;
      });
      
      console.log(`File saved successfully: ${name}`);
      return savedFile;
    } catch (error) {
      console.error('Error saving file:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to save file', 
        loading: false 
      });
      throw error;
    }
  },
  
  deleteFile: async (name) => {
    try {
      if (!name) throw new Error('File name cannot be empty');
      
      set({ loading: true, error: null });
      
      await apiRequest('DELETE', `/api/files/${encodeURIComponent(name)}`, undefined);
      
      // Update local state
      set(state => {
        const updatedState = {
          files: state.files.filter(file => file.name !== name),
          loading: false
        };
        
        // Save to localStorage after state update
        setTimeout(() => get().saveFilesToLocalStorage(), 0);
        
        return updatedState;
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete file', 
        loading: false 
      });
      return false;
    }
  },
  
  deleteFolder: async (folderPath) => {
    try {
      if (!folderPath) throw new Error('Folder path cannot be empty');
      
      set({ loading: true, error: null });
      
      const { files } = get();
      
      // Find all files that are in this folder (start with folderPath/)
      const filesToDelete = files.filter(file => 
        file.name === folderPath || // The folder itself might be a file
        file.name.startsWith(folderPath + '/')
      );
      
      console.log(`Deleting folder: ${folderPath} with ${filesToDelete.length} files`);
      
      // Delete each file
      const deletePromises = filesToDelete.map(file => 
        apiRequest('DELETE', `/api/files/${encodeURIComponent(file.name)}`, undefined)
      );
      
      await Promise.all(deletePromises);
      
      // Update local state
      set(state => {
        const updatedState = {
          files: state.files.filter(file => 
            file.name !== folderPath && !file.name.startsWith(folderPath + '/')
          ),
          loading: false
        };
        
        // Save to localStorage after state update
        setTimeout(() => get().saveFilesToLocalStorage(), 0);
        
        return updatedState;
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete folder', 
        loading: false 
      });
      return false;
    }
  },
  
  renameFile: async (oldName, newName) => {
    try {
      if (!oldName || !newName) throw new Error('File names cannot be empty');
      if (oldName === newName) return true; // No change needed
      
      set({ loading: true, error: null });
      
      // Get existing file content
      const existingFile = get().files.find(file => file.name === oldName);
      if (!existingFile) {
        throw new Error(`File '${oldName}' not found`);
      }
      
      // Create new file with new name
      await apiRequest('POST', '/api/files', { 
        name: newName, 
        content: existingFile.content 
      });
      
      // Delete old file
      await apiRequest('DELETE', `/api/files/${encodeURIComponent(oldName)}`, undefined);
      
      // Update local state
      set(state => {
        const updatedState = {
          files: state.files.map(file => 
            file.name === oldName 
              ? { ...file, name: newName } 
              : file
          ),
          loading: false
        };
        
        // Save updated files to localStorage
        setTimeout(() => get().saveFilesToLocalStorage(), 0);
        
        return updatedState;
      });
      
      return true;
    } catch (error) {
      console.error('Error renaming file:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to rename file', 
        loading: false 
      });
      return false;
    }
  },
  
  // Save files to localStorage for Windows app persistence
  saveFilesToLocalStorage: () => {
    try {
      const { files, localStorageKey } = get();
      localStorage.setItem(localStorageKey, JSON.stringify(files));
      console.log('Files saved to localStorage successfully');
    } catch (error) {
      console.error('Error saving files to localStorage:', error);
    }
  },
  
  // Load files from localStorage for Windows app persistence
  loadFilesFromLocalStorage: async () => {
    try {
      const { localStorageKey } = get();
      const storedFiles = localStorage.getItem(localStorageKey);
      console.log('Loaded files from localStorage:', !!storedFiles);
      
      if (storedFiles) {
        const parsedFiles = JSON.parse(storedFiles);
        if (Array.isArray(parsedFiles)) {
          // Update local state with the stored files
          set({ files: parsedFiles });
          
          // Also ensure the backend is synchronized with these files
          // This is important for the Preview component which might fetch files from the backend
          for (const file of parsedFiles) {
            try {
              // Save each file to the server store
              if (file.name && file.content) {
                const url = `/api/files/${encodeURIComponent(file.name)}`;
                await apiRequest('PUT', url, { content: file.content });
                console.log(`Synchronized file with server: ${file.name}`);
              }
            } catch (syncError) {
              console.error(`Error synchronizing file ${file.name} with server:`, syncError);
            }
          }
          
          console.log('Files loaded and synchronized successfully');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error loading files from localStorage:', error);
      return false;
    }
  }
}));
