import React, { useEffect, useState } from 'react';
import { useGitHubStore } from '@/store/githubStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Loader2, 
  Plus, 
  ExternalLink, 
  GitFork, 
  Star, 
  Lock, 
  Unlock,
  Code, 
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const GitHubRepos: React.FC = () => {
  const { 
    isAuthenticated, 
    repos, 
    reposLoading, 
    reposError, 
    fetchUserRepos,
    createRepo,
    creatingRepo,
    createRepoError
  } = useGitHubStore();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [repoDescription, setRepoDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && !repos.length && !reposLoading) {
      fetchUserRepos();
    }
  }, [isAuthenticated, repos.length, reposLoading, fetchUserRepos]);

  const handleCreateRepo = async () => {
    if (!repoName.trim()) {
      toast({
        title: "Repository Name Required",
        description: "Please enter a name for your repository",
        variant: "destructive"
      });
      return;
    }

    const repo = await createRepo(repoName.trim(), repoDescription.trim(), isPrivate);
    
    if (repo) {
      toast({
        title: "Repository Created",
        description: `Successfully created repository ${repo.name}`,
      });
      setRepoName('');
      setRepoDescription('');
      setIsPrivate(false);
      setShowCreateForm(false);
    } else {
      toast({
        title: "Error Creating Repository",
        description: createRepoError || "Failed to create repository",
        variant: "destructive"
      });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#cccccc]">Your Repositories</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="text-xs h-7 px-2"
        >
          {showCreateForm ? 'Cancel' : <><Plus className="h-3.5 w-3.5 mr-1" /> New</>}
        </Button>
      </div>

      {showCreateForm && (
        <div className="mb-4 rounded border border-[#424242] bg-[#2d2d2d] p-3 text-[#cccccc]">
          <div className="space-y-3">
            <div>
              <label htmlFor="repo-name" className="text-xs block mb-1">Repository Name</label>
              <Input
                id="repo-name"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="e.g. my-awesome-project"
                className="bg-[#3a3a3a] border-[#424242] text-sm h-8"
              />
            </div>
            <div>
              <label htmlFor="repo-description" className="text-xs block mb-1">Description (optional)</label>
              <Textarea
                id="repo-description"
                value={repoDescription}
                onChange={(e) => setRepoDescription(e.target.value)}
                placeholder="A short description of your project..."
                className="bg-[#3a3a3a] border-[#424242] text-sm min-h-[60px] resize-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="private-repo"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
                <label htmlFor="private-repo" className="text-xs cursor-pointer flex items-center">
                  {isPrivate ? <Lock className="h-3.5 w-3.5 mr-1" /> : <Unlock className="h-3.5 w-3.5 mr-1" />}
                  {isPrivate ? 'Private repository' : 'Public repository'}
                </label>
              </div>
              
              <Button 
                onClick={handleCreateRepo}
                disabled={creatingRepo || !repoName.trim()}
                size="sm"
              >
                {creatingRepo ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Code className="h-4 w-4 mr-1" />}
                Create
              </Button>
            </div>
            
            {createRepoError && (
              <div className="text-xs text-red-400 mt-1">{createRepoError}</div>
            )}
          </div>
        </div>
      )}

      {reposLoading ? (
        <div className="flex items-center justify-center p-4 text-[#9e9e9e]">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading repositories...
        </div>
      ) : reposError ? (
        <div className="text-xs text-red-400 p-2">{reposError}</div>
      ) : repos.length === 0 ? (
        <div className="text-xs text-[#9e9e9e] p-2">
          You don't have any repositories yet.
        </div>
      ) : (
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
          {repos.map((repo) => (
            <div 
              key={repo.id}
              className="rounded border border-[#424242] bg-[#2d2d2d] p-2.5 text-[#cccccc] hover:bg-[#333333] transition-colors duration-100"
            >
              <div className="flex items-start justify-between">
                <div className="w-full">
                  <a 
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sm text-[#007acc] hover:underline flex items-center"
                  >
                    {repo.name}
                    <ExternalLink className="h-3 w-3 ml-1 inline-block" />
                  </a>
                  
                  {repo.description && (
                    <p className="text-xs text-[#a0a0a0] mt-1 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  
                  <div className="flex items-center mt-2 space-x-3 text-[10px] text-[#9e9e9e]">
                    {repo.language && (
                      <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-[#f1e05a] mr-1"></span>
                        {repo.language}
                      </span>
                    )}
                    {repo.stargazers_count > 0 && (
                      <span className="flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        {repo.stargazers_count}
                      </span>
                    )}
                    {repo.fork && (
                      <span className="flex items-center">
                        <GitFork className="h-3 w-3 mr-1" />
                        Forked
                      </span>
                    )}
                    <span className="flex items-center">
                      {repo.private ? (
                        <Lock className="h-3 w-3 mr-1" />
                      ) : (
                        <Unlock className="h-3 w-3 mr-1" />
                      )}
                      {repo.private ? 'Private' : 'Public'}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(repo.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GitHubRepos;