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
  createFile: (name: string, content: string) => Promise<void>;
  saveFile: (name: string, content: string) => Promise<void>;
  deleteFile: (name: string) => Promise<void>;
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
      set({ loading: true, error: null });
      await apiRequest('POST', '/api/files', { name, content });
      
      // Update local state
      set(state => ({
        files: [...state.files, { name, content }],
        loading: false
      }));
    } catch (error) {
      console.error('Error creating file:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create file', 
        loading: false 
      });
    }
  },
  
  saveFile: async (name, content) => {
    try {
      console.log(`Saving file to server: ${name}`);
      set({ loading: true, error: null });
      
      const url = `/api/files/${encodeURIComponent(name)}`;
      console.log(`Request URL: ${url}`);
      
      const response = await apiRequest('PUT', url, { content });
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
            files: [...state.files, { name, content }],
            loading: false
          };
        }
      });
      
      console.log(`File saved successfully: ${name}`);
    } catch (error) {
      console.error('Error saving file:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to save file', 
        loading: false 
      });
    }
  },
  
  deleteFile: async (name) => {
    try {
      set({ loading: true, error: null });
      await apiRequest('DELETE', `/api/files/${encodeURIComponent(name)}`, undefined);
      
      // Update local state
      set(state => ({
        files: state.files.filter(file => file.name !== name),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting file:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete file', 
        loading: false 
      });
    }
  }
}));
