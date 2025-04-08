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

    setIsLoggingIn(true);
    try {
      const success = await setToken(tokenInput);
      if (success) {
        setShowTokenInput(false);
        setTokenInput('');
        toast({
          title: "Login Successful",
          description: "You've been successfully authenticated with GitHub",
        });
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid token or GitHub API error",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "Failed to authenticate with GitHub",
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
              <div className="text-xs text-[#a0a0a0] mb-1">
                Enter a GitHub Personal Access Token with gist and repo scopes
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
              <div className="text-[10px] text-[#a0a0a0]">
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