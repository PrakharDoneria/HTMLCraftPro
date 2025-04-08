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
  private async get(endpoint: string, anonymousAllowed: boolean = false) {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else if (!anonymousAllowed) {
      throw new Error('Authentication required for this operation');
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
      
      // Validate files object
      if (!files || Object.keys(files).length === 0) {
        throw new Error('No files provided for gist creation');
      }
      
      // Ensure all file contents are valid strings
      const processedFiles: Record<string, { content: string }> = {};
      for (const [filename, fileData] of Object.entries(files)) {
        if (!filename) continue; // Skip entries with empty filenames
        
        // Ensure content is a non-empty string (GitHub API requirement)
        const content = fileData.content || ' ';
        processedFiles[filename] = { content };
      }
      
      // Check again after processing to ensure we have at least one valid file
      if (Object.keys(processedFiles).length === 0) {
        throw new Error('No valid files to create gist with');
      }
      
      const response = await this.post('/gists', {
        files: processedFiles,
        description,
        public: isPublic
      });
      
      if (response.status === 201) {
        return response.json();
      } else {
        const errorText = await response.text();
        console.error('Error creating gist:', errorText);
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error creating GitHub gist:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Unknown error creating gist');
      }
    }
  }

  /**
   * Create or update a file in a repository
   * If the file already exists, it will be updated (if sha is provided)
   */
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string = 'Update via HTML Editor',
    sha?: string
  ): Promise<GitHubFileContent | null> {
    try {
      if (!this.token) return null;
      
      // Convert content to base64
      const base64Content = btoa(unescape(encodeURIComponent(content)));
      
      const data: any = {
        message,
        content: base64Content
      };
      
      // If sha is provided, it means we're updating an existing file
      if (sha) {
        data.sha = sha;
      }
      
      const response = await this.post(`/repos/${owner}/${repo}/contents/${path}`, data);
      
      if (response.status === 200 || response.status === 201) {
        return response.json();
      } else {
        console.error('Error creating/updating file:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error creating/updating file in GitHub repo:', error);
      return null;
    }
  }
  
  /**
   * Get a file's content from a GitHub repository
   * This works with public repositories without requiring authentication
   */
  async getFileContent(owner: string, repo: string, path: string): Promise<string | null> {
    try {
      const response = await this.get(`/repos/${owner}/${repo}/contents/${path}`, true);
      
      if (response.status === 200) {
        const data = await response.json();
        // Content is base64 encoded
        if (data.content && data.encoding === 'base64') {
          return decodeURIComponent(escape(atob(data.content)));
        } else {
          console.error('Unknown file encoding or missing content');
          return null;
        }
      } else {
        console.error('Error fetching file:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error getting file from GitHub:', error);
      return null;
    }
  }
  
  /**
   * Get repository contents at a specific path
   * This works with public repositories without requiring authentication
   */
  async getRepoContents(owner: string, repo: string, path: string = ''): Promise<GitHubFileContent[] | null> {
    try {
      // Path might be empty for root directory
      const endpoint = `/repos/${owner}/${repo}/contents${path ? `/${path}` : ''}`;
      const response = await this.get(endpoint, true);
      
      if (response.status === 200) {
        return response.json();
      } else {
        console.error('Error fetching repo contents:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error getting repo contents from GitHub:', error);
      return null;
    }
  }
  
  /**
   * Import all files from a GitHub repository or a specific directory in a repo
   * Returns a map of all imported files
   */
  async importRepoContents(
    owner: string, 
    repo: string, 
    path: string = '', 
    fileFilter: string[] = ['.html', '.css', '.js']
  ): Promise<Record<string, string>> {
    const files: Record<string, string> = {};
    try {
      const contents = await this.getRepoContents(owner, repo, path);
      
      if (!contents) return files;
      
      for (const item of contents) {
        // Skip directories or non-matching files
        if (item.type === 'dir' || !fileFilter.some(ext => item.name.endsWith(ext))) {
          continue;
        }
        
        const content = await this.getFileContent(owner, repo, item.path);
        if (content) {
          files[item.name] = content;
        }
      }
      
      return files;
    } catch (error) {
      console.error('Error importing repo contents:', error);
      return files;
    }
  }
  
  /**
   * Push multiple files to a GitHub repository
   */
  async pushFiles(
    owner: string,
    repo: string,
    files: Array<{path: string, content: string}>,
    commitMessage: string = 'Push from HTML Editor'
  ): Promise<boolean> {
    try {
      if (!this.token) return false;
      
      // Process files one by one since the GitHub API doesn't support batch operations
      for (const file of files) {
        try {
          // Try to get existing file to get its SHA
          const currentFile = await this.get(
            `/repos/${owner}/${repo}/contents/${file.path}`, 
            false // This requires authentication
          );
          
          let sha = null;
          if (currentFile.status === 200) {
            const fileData = await currentFile.json();
            sha = fileData.sha;
          }
          
          // Create or update the file
          await this.createOrUpdateFile(
            owner,
            repo,
            file.path,
            file.content,
            commitMessage,
            sha
          );
        } catch (fileError) {
          console.error(`Error processing file ${file.path}:`, fileError);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error pushing files to GitHub:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const githubService = new GitHubService();

// Auto-load token if available
githubService.loadToken();

export default githubService;