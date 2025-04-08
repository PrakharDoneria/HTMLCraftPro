import { create } from 'zustand';
import githubService, { 
  GitHubUser, 
  GitHubRepo, 
  GitHubGist 
} from '@/lib/githubService';

interface GitHubStore {
  // Authentication state
  token: string | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  authError: string | null;

  // User data
  user: GitHubUser | null;
  repos: GitHubRepo[];
  gists: GitHubGist[];
  
  // Loading states
  userLoading: boolean;
  reposLoading: boolean;
  gistsLoading: boolean;
  
  // Action loading states
  creatingRepo: boolean;
  creatingGist: boolean;
  
  // Error states
  userError: string | null;
  reposError: string | null;
  gistsError: string | null;
  createRepoError: string | null;
  createGistError: string | null;
  
  // Auth actions
  setToken: (token: string) => Promise<boolean>;
  clearToken: () => void;
  
  // Data fetch actions
  fetchUserProfile: () => Promise<GitHubUser | null>;
  fetchUserRepos: () => Promise<GitHubRepo[]>;
  fetchUserGists: () => Promise<GitHubGist[]>;
  
  // Creation actions
  createRepo: (name: string, description: string, isPrivate?: boolean) => Promise<GitHubRepo | null>;
  createGist: (
    files: Record<string, { content: string }>,
    description?: string,
    isPublic?: boolean
  ) => Promise<GitHubGist | null>;
  
  // Aggregated actions
  loadAllUserData: () => Promise<void>;
}

export const useGitHubStore = create<GitHubStore>((set, get) => ({
  // Initial state
  token: githubService.loadToken(),
  isAuthenticated: githubService.isAuthenticated(),
  authLoading: false,
  authError: null,
  
  user: null,
  repos: [],
  gists: [],
  
  userLoading: false,
  reposLoading: false,
  gistsLoading: false,
  
  creatingRepo: false,
  creatingGist: false,
  
  userError: null,
  reposError: null,
  gistsError: null,
  createRepoError: null,
  createGistError: null,
  
  // Auth actions
  setToken: async (token: string) => {
    set({ authLoading: true, authError: null });
    try {
      const isValid = await githubService.setToken(token);
      
      if (isValid) {
        set({ 
          token, 
          isAuthenticated: true, 
          authLoading: false,
          // Clear any previous errors on success
          authError: null,
          userError: null,
          reposError: null,
          gistsError: null
        });
        
        // After setting token, fetch user data
        get().fetchUserProfile();
        
        return true;
      } else {
        set({ 
          token: null, 
          isAuthenticated: false, 
          authLoading: false,
          authError: 'Invalid GitHub token' 
        });
        return false;
      }
    } catch (error) {
      set({ 
        token: null, 
        isAuthenticated: false, 
        authLoading: false,
        authError: 'Error authenticating with GitHub' 
      });
      return false;
    }
  },
  
  clearToken: () => {
    githubService.clearToken();
    set({ 
      token: null, 
      isAuthenticated: false,
      user: null,
      repos: [],
      gists: []
    });
  },
  
  // Data fetch actions
  fetchUserProfile: async () => {
    const { isAuthenticated } = get();
    if (!isAuthenticated) return null;
    
    set({ userLoading: true, userError: null });
    
    try {
      const user = await githubService.getCurrentUser();
      set({ user, userLoading: false });
      return user;
    } catch (error) {
      console.error('Error fetching GitHub user profile:', error);
      set({ userLoading: false, userError: 'Failed to fetch GitHub profile' });
      return null;
    }
  },
  
  fetchUserRepos: async () => {
    const { isAuthenticated } = get();
    if (!isAuthenticated) return [];
    
    set({ reposLoading: true, reposError: null });
    
    try {
      const repos = await githubService.getUserRepos();
      set({ repos, reposLoading: false });
      return repos;
    } catch (error) {
      console.error('Error fetching GitHub repos:', error);
      set({ reposLoading: false, reposError: 'Failed to fetch repositories' });
      return [];
    }
  },
  
  fetchUserGists: async () => {
    const { isAuthenticated } = get();
    if (!isAuthenticated) return [];
    
    set({ gistsLoading: true, gistsError: null });
    
    try {
      const gists = await githubService.getUserGists();
      set({ gists, gistsLoading: false });
      return gists;
    } catch (error) {
      console.error('Error fetching GitHub gists:', error);
      set({ gistsLoading: false, gistsError: 'Failed to fetch gists' });
      return [];
    }
  },
  
  // Creation actions
  createRepo: async (name: string, description: string, isPrivate: boolean = false) => {
    const { isAuthenticated } = get();
    if (!isAuthenticated) return null;
    
    set({ creatingRepo: true, createRepoError: null });
    
    try {
      const repo = await githubService.createRepo(name, description, isPrivate);
      
      if (repo) {
        // Update repos list with the new repo
        set(state => ({ 
          repos: [repo, ...state.repos],
          creatingRepo: false 
        }));
      } else {
        set({ 
          creatingRepo: false, 
          createRepoError: 'Failed to create repository'
        });
      }
      
      return repo;
    } catch (error) {
      console.error('Error creating GitHub repo:', error);
      set({ 
        creatingRepo: false, 
        createRepoError: 'Error creating repository'
      });
      return null;
    }
  },
  
  createGist: async (
    files: Record<string, { content: string }>,
    description: string = '',
    isPublic: boolean = true
  ) => {
    const { isAuthenticated } = get();
    if (!isAuthenticated) return null;
    
    set({ creatingGist: true, createGistError: null });
    
    try {
      const gist = await githubService.createGist(files, description, isPublic);
      
      if (gist) {
        // Update gists list with the new gist
        set(state => ({ 
          gists: [gist, ...state.gists],
          creatingGist: false 
        }));
      } else {
        set({ 
          creatingGist: false, 
          createGistError: 'Failed to create gist'
        });
      }
      
      return gist;
    } catch (error) {
      console.error('Error creating GitHub gist:', error);
      set({ 
        creatingGist: false, 
        createGistError: 'Error creating gist'
      });
      return null;
    }
  },
  
  // Aggregated actions
  loadAllUserData: async () => {
    const { isAuthenticated, fetchUserProfile, fetchUserRepos, fetchUserGists } = get();
    
    if (!isAuthenticated) return;
    
    // Execute all fetches in parallel
    await Promise.all([
      fetchUserProfile(),
      fetchUserRepos(),
      fetchUserGists()
    ]);
  }
}));