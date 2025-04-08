import { create } from 'zustand';
import { apiRequest } from '@/lib/queryClient';

export interface File {
  name: string;
  content: string;
}

interface FileStore {
  files: File[];
  loading: boolean;
  error: string | null;
  fetchFiles: () => Promise<void>;
  createFile: (name: string, content: string) => Promise<File>;
  saveFile: (name: string, content: string) => Promise<File>;
  deleteFile: (name: string) => Promise<boolean>;
  renameFile: (oldName: string, newName: string) => Promise<boolean>;
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  loading: false,
  error: null,
  
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
      set(state => ({
        files: [...state.files, newFile],
        loading: false
      }));
      
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
        
        if (existingFile) {
          console.log(`Updating existing file in state: ${name}`);
          return {
            files: state.files.map(file => 
              file.name === name ? { ...file, content } : file
            ),
            loading: false
          };
        } else {
          console.log(`Adding new file to state: ${name}`);
          return {
            files: [...state.files, savedFile],
            loading: false
          };
        }
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
      set(state => ({
        files: state.files.filter(file => file.name !== name),
        loading: false
      }));
      
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
      set(state => ({
        files: state.files.map(file => 
          file.name === oldName 
            ? { ...file, name: newName } 
            : file
        ),
        loading: false
      }));
      
      return true;
    } catch (error) {
      console.error('Error renaming file:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to rename file', 
        loading: false 
      });
      return false;
    }
  }
}));
