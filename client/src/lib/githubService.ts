// GitHub API integration service

export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string;
  email: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  private: boolean;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string;
  default_branch: string;
}

export interface GitHubGist {
  id: string;
  html_url: string;
  description: string;
  public: boolean;
  created_at: string;
  updated_at: string;
  files: Record<string, {
    filename: string;
    type: string;
    language: string;
    raw_url: string;
    size: number;
    content?: string;
  }>;
}

export interface GitHubFileContent {
  type: string;
  encoding: string;
  size: number;
  name: string;
  path: string;
  content: string;
  sha: string;
  url: string;
  html_url: string;
  download_url: string;
}

class GitHubService {
  private baseUrl = 'https://api.github.com';
  private token: string | null = null;

  /**
   * Set the GitHub token for authentication
   */
  setToken(token: string) {
    this.token = token;
    // Store token in localStorage for persistence
    localStorage.setItem('github_token', token);
    return this.validateToken();
  }

  /**
   * Load token from localStorage if available
   */
  loadToken(): string | null {
    const token = localStorage.getItem('github_token');
    if (token) {
      this.token = token;
      return token;
    }
    return null;
  }

  /**
   * Clear the stored token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('github_token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Validate the token by making a test API call
   */
  async validateToken(): Promise<boolean> {
    try {
      if (!this.token) return false;
      const response = await this.get('/user');
      return response.status === 200;
    } catch (error) {
      console.error('Error validating GitHub token:', error);
      return false;
    }
  }

  /**
   * Generic GET request to GitHub API
   */
  private async get(endpoint: string) {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers
    });
  }

  /**
   * Generic POST request to GitHub API
   */
  private async post(endpoint: string, data: any) {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
  }

  /**
   * Get authenticated user profile
   */
  async getCurrentUser(): Promise<GitHubUser | null> {
    try {
      if (!this.token) return null;
      
      const response = await this.get('/user');
      
      if (response.status === 200) {
        return response.json();
      } else {
        console.error('Error fetching user data:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error fetching GitHub user:', error);
      return null;
    }
  }

  /**
   * Get repos for the authenticated user
   */
  async getUserRepos(): Promise<GitHubRepo[]> {
    try {
      if (!this.token) return [];
      
      const response = await this.get('/user/repos?sort=updated&per_page=100');
      
      if (response.status === 200) {
        return response.json();
      } else {
        console.error('Error fetching user repos:', await response.text());
        return [];
      }
    } catch (error) {
      console.error('Error fetching GitHub repos:', error);
      return [];
    }
  }

  /**
   * Get gists for the authenticated user
   */
  async getUserGists(): Promise<GitHubGist[]> {
    try {
      if (!this.token) return [];
      
      const response = await this.get('/gists');
      
      if (response.status === 200) {
        return response.json();
      } else {
        console.error('Error fetching user gists:', await response.text());
        return [];
      }
    } catch (error) {
      console.error('Error fetching GitHub gists:', error);
      return [];
    }
  }

  /**
   * Create a new repository
   */
  async createRepo(name: string, description: string, isPrivate: boolean = false): Promise<GitHubRepo | null> {
    try {
      if (!this.token) return null;
      
      const response = await this.post('/user/repos', {
        name,
        description,
        private: isPrivate,
        auto_init: true
      });
      
      if (response.status === 201) {
        return response.json();
      } else {
        console.error('Error creating repo:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error creating GitHub repo:', error);
      return null;
    }
  }

  /**
   * Create a new gist
   */
  async createGist(
    files: Record<string, { content: string }>,
    description: string = '',
    isPublic: boolean = true
  ): Promise<GitHubGist | null> {
    try {
      if (!this.token) return null;
      
      const response = await this.post('/gists', {
        files,
        description,
        public: isPublic
      });
      
      if (response.status === 201) {
        return response.json();
      } else {
        console.error('Error creating gist:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error creating GitHub gist:', error);
      return null;
    }
  }

  /**
   * Create a new file in a repository
   */
  async createFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string = 'Add file via HTML Editor'
  ): Promise<GitHubFileContent | null> {
    try {
      if (!this.token) return null;
      
      // Convert content to base64
      const base64Content = btoa(unescape(encodeURIComponent(content)));
      
      const response = await this.post(`/repos/${owner}/${repo}/contents/${path}`, {
        message,
        content: base64Content
      });
      
      if (response.status === 201) {
        return response.json();
      } else {
        console.error('Error creating file:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error creating file in GitHub repo:', error);
      return null;
    }
  }
}

// Create a singleton instance
export const githubService = new GitHubService();

// Auto-load token if available
githubService.loadToken();

export default githubService;