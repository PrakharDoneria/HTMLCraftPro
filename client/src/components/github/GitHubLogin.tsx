import React, { useState, useEffect } from 'react';
import { useGitHubStore } from '@/store/githubStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Github, LogIn, LogOut, Loader2, User, UserCheck } from 'lucide-react';

const GitHubLogin: React.FC = () => {
  const { 
    isAuthenticated, 
    user, 
    userLoading,
    setToken, 
    clearToken, 
    fetchUserProfile
  } = useGitHubStore();
  
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    // If authenticated but no user info, fetch the profile
    if (isAuthenticated && !user && !userLoading) {
      fetchUserProfile();
    }
  }, [isAuthenticated, user, userLoading, fetchUserProfile]);

  const handleLogin = async () => {
    if (!tokenInput.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter your GitHub Personal Access Token",
        variant: "destructive"
      });
      return;
    }
    
    // Validate token format - personal access tokens should be 40+ characters and alphanumeric
    if (tokenInput.trim().length < 20 || !/^[a-zA-Z0-9_]+$/.test(tokenInput.trim())) {
      toast({
        title: "Invalid Token Format",
        description: "The token appears to be in an invalid format. GitHub tokens are long alphanumeric strings.",
        variant: "destructive"
      });
      return;
    }

    setIsLoggingIn(true);
    console.log("Attempting to login with GitHub token...");
    
    try {
      // Clean the token (remove any whitespace)
      const cleanToken = tokenInput.trim();
      console.log(`Token length: ${cleanToken.length} characters`);
      
      const success = await setToken(cleanToken);
      
      if (success) {
        console.log("GitHub authentication successful");
        setShowTokenInput(false);
        setTokenInput('');
        toast({
          title: "Login Successful",
          description: "You've been successfully authenticated with GitHub",
        });
        
        // Fetch user data immediately
        fetchUserProfile();
      } else {
        console.error("GitHub authentication failed - token validation unsuccessful");
        toast({
          title: "Login Failed",
          description: "Invalid token or GitHub API error. Please ensure your token has the necessary scopes (repo, gist).",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("GitHub login error:", error);
      let errorMessage = "Failed to authenticate with GitHub";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        // Make error message more user-friendly
        if (error.message.includes('401')) {
          errorMessage = "Authentication failed: Invalid token or insufficient permissions";
        } else if (error.message.includes('403')) {
          errorMessage = "Authentication failed: API rate limit exceeded or access forbidden";
        }
      }
      
      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    toast({
      title: "Logged Out",
      description: "You've been logged out from GitHub",
    });
  };

  return (
    <div className="mt-2 mb-6">
      {!isAuthenticated ? (
        <>
          {!showTokenInput ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTokenInput(true)}
              className="w-full bg-[#2d2d2d] border-[#444] hover:bg-[#3a3a3a] hover:text-white text-xs h-9"
            >
              <Github className="h-4 w-4 mr-2" />
              Connect GitHub Account
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="space-y-1 mb-1">
                <div className="text-xs text-[#a0a0a0]">
                  Enter a GitHub Personal Access Token (Fine-grained or Classic)
                </div>
                <div className="text-[10px] text-[#8a8a8a]">
                  Required scopes: <span className="text-[#75beff]">repo</span> (for repository operations) & <span className="text-[#75beff]">gist</span> (for gist operations)
                </div>
              </div>
              <div className="flex space-x-2">
                <Input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="GitHub token"
                  className="flex-1 h-8 text-xs bg-[#3a3a3a] border-[#444]"
                />
                <Button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="h-8 px-3"
                  size="sm"
                >
                  {isLoggingIn ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogIn className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button 
                  onClick={() => setShowTokenInput(false)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="text-[10px] text-[#a0a0a0] space-y-1">
                <div>
                  Create a token at{' '}
                  <a 
                    href="https://github.com/settings/tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#75beff] hover:underline"
                  >
                    github.com/settings/tokens
                  </a>
                </div>
                <div>
                  For <span className="text-[#75beff]">Classic tokens</span>, select scopes: <span className="text-[#75beff]">repo</span> and <span className="text-[#75beff]">gist</span>
                </div>
                <div>
                  For <span className="text-[#75beff]">Fine-grained tokens</span>, grant access to the repositories you want to work with and select <span className="text-[#75beff]">Contents</span> (read & write) and <span className="text-[#75beff]">Gists</span> (read & write) permissions
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div>
          {userLoading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-xs text-[#a0a0a0]">Loading profile...</span>
            </div>
          ) : user ? (
            <div className="rounded border border-[#444] bg-[#2d2d2d] p-3">
              <div className="flex items-center">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.login} 
                    className="h-10 w-10 rounded-full mr-3"
                  />
                ) : (
                  <User className="h-10 w-10 rounded-full mr-3 p-2 bg-[#444]" />
                )}
                <div className="flex-1 overflow-hidden">
                  <div className="font-medium text-sm truncate">{user.name || user.login}</div>
                  <div className="text-xs text-[#a0a0a0] truncate">@{user.login}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="h-7 px-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="mt-2 flex items-center space-x-3 text-[10px] text-[#a0a0a0]">
                <div className="flex items-center">
                  <Github className="h-3 w-3 mr-1" />
                  <span>
                    {user.public_repos}{' '}
                    {user.public_repos === 1 ? 'repository' : 'repositories'}
                  </span>
                </div>
                <div className="flex items-center">
                  <UserCheck className="h-3 w-3 mr-1" />
                  <span>{user.followers} followers</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-2">
              <span className="text-xs text-[#a0a0a0]">Failed to load profile</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GitHubLogin;