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
      set({ loading: true, error: null });
      await apiRequest('PUT', `/api/files/${encodeURIComponent(name)}`, { content });
      
      // Update local state
      set(state => ({
        files: state.files.map(file => 
          file.name === name ? { ...file, content } : file
        ),
        loading: false
      }));
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
