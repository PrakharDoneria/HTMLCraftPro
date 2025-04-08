import React, { useEffect, useState } from 'react';
import { useGitHubStore } from '@/store/githubStore';
import { useEditorStore } from '@/store/editorStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Loader2, 
  Plus, 
  ExternalLink, 
  FileUp, 
  Pencil,
  Clock,
  Eye,
  EyeOff,
  FileCode
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const GitHubGists: React.FC = () => {
  const { 
    isAuthenticated, 
    gists, 
    gistsLoading, 
    gistsError, 
    fetchUserGists,
    createGist,
    creatingGist,
    createGistError
  } = useGitHubStore();
  
  const { tabs, activeTab } = useEditorStore();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [gistDescription, setGistDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  const { toast } = useToast();

  // Get the active files from editor tabs
  const availableFiles = tabs.map(tab => ({
    id: tab.id,
    fileName: tab.fileName,
    content: tab.content,
    isActive: tab.id === activeTab
  }));

  useEffect(() => {
    if (isAuthenticated && !gists.length && !gistsLoading) {
      fetchUserGists();
    }
  }, [isAuthenticated, gists.length, gistsLoading, fetchUserGists]);

  const toggleFileSelection = (fileId: string) => {
    if (selectedFiles.includes(fileId)) {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
    } else {
      setSelectedFiles([...selectedFiles, fileId]);
    }
  };

  const handleCreateGist = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login with your GitHub account first",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to include in your gist",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Creating new gist...');
      console.log('Selected files:', selectedFiles.length);
      
      // Prepare files for gist creation
      const gistFiles: Record<string, { content: string }> = {};
      
      // Find the selected tab objects and add their content to gistFiles
      for (const fileId of selectedFiles) {
        const tab = tabs.find(tab => tab.id === fileId);
        if (tab) {
          // Make sure content is a non-empty string (GitHub API requires content)
          const content = tab.content || ' '; // GitHub API doesn't accept empty content
          console.log(`Adding file: ${tab.fileName} (${content.length} chars)`);
          gistFiles[tab.fileName] = { content };
        }
      }
      
      // Validate that we have at least one file with content
      if (Object.keys(gistFiles).length === 0) {
        toast({
          title: "No Valid Files",
          description: "Selected files don't have any content to share",
          variant: "destructive"
        });
        return;
      }

      console.log(`Creating gist with ${Object.keys(gistFiles).length} files`);
      console.log('Description:', gistDescription.trim() || '(no description)');
      console.log('Public:', isPublic);
      
      // Create the gist and handle response
      const gist = await createGist(gistFiles, gistDescription.trim(), isPublic);
      
      if (gist) {
        console.log('Gist created successfully:', gist.html_url);
        toast({
          title: "Gist Created",
          description: `Successfully created gist${gist.description ? ': ' + gist.description : ''}`,
        });
        
        // Reset form state
        setGistDescription('');
        setIsPublic(true);
        setSelectedFiles([]);
        setShowCreateForm(false);
        
        // If gist was created successfully, open it in a new tab
        if (gist.html_url) {
          window.open(gist.html_url, '_blank');
        }
        
        // Refresh gist list
        fetchUserGists();
      } else {
        console.error('Failed to create gist, null response');
        toast({
          title: "Error Creating Gist",
          description: createGistError || "Failed to create gist - check console for details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating gist:", error);
      let errorMessage = "An unexpected error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        // Extract useful information from error message
        if (error.message.includes('404')) {
          errorMessage = "GitHub API error: The API endpoint was not found. Please check your authentication token.";
        } else if (error.message.includes('401')) {
          errorMessage = "GitHub API error: Authentication failed. Your token might be invalid or expired.";
        }
      } else if (createGistError) {
        errorMessage = createGistError;
      }
      
      toast({
        title: "Error Creating Gist",
        description: errorMessage,
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
        <h3 className="text-sm font-medium text-[#cccccc]">Your Gists</h3>
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
              <Label htmlFor="gist-description" className="text-xs">Description (optional)</Label>
              <Input
                id="gist-description"
                value={gistDescription}
                onChange={(e) => setGistDescription(e.target.value)}
                placeholder="What's this gist about?"
                className="bg-[#3a3a3a] border-[#424242] text-sm h-8 mt-1"
              />
            </div>
            
            <div>
              <Label className="text-xs block mb-2">Select Files to Include</Label>
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {availableFiles.length === 0 ? (
                  <div className="text-xs text-[#9e9e9e] italic">No files open in editor</div>
                ) : (
                  availableFiles.map(file => (
                    <div 
                      key={file.id}
                      className={`flex items-center justify-between p-2 rounded text-xs ${
                        selectedFiles.includes(file.id) 
                          ? 'bg-[#094771] text-white' 
                          : 'bg-[#3a3a3a] text-[#cccccc] hover:bg-[#444444]'
                      } cursor-pointer transition-colors`}
                      onClick={() => toggleFileSelection(file.id)}
                    >
                      <div className="flex items-center">
                        <FileCode className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                        <span className="truncate">{file.fileName}</span>
                        {file.isActive && (
                          <span className="ml-2 text-[10px] bg-[#333333] px-1.5 py-0.5 rounded">Active</span>
                        )}
                      </div>
                      <div className="w-4 h-4 rounded-sm border border-[#555555] flex items-center justify-center flex-shrink-0">
                        {selectedFiles.includes(file.id) && (
                          <div className="w-2 h-2 bg-white rounded-sm"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="public-gist"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="public-gist" className="text-xs cursor-pointer flex items-center">
                  {isPublic ? <Eye className="h-3.5 w-3.5 mr-1" /> : <EyeOff className="h-3.5 w-3.5 mr-1" />}
                  {isPublic ? 'Public gist' : 'Secret gist'}
                </Label>
              </div>
              
              <Button 
                onClick={handleCreateGist}
                disabled={creatingGist || selectedFiles.length === 0}
                size="sm"
              >
                {creatingGist ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileUp className="h-4 w-4 mr-1" />}
                Create Gist
              </Button>
            </div>
            
            {createGistError && (
              <div className="text-xs text-red-400 mt-1">{createGistError}</div>
            )}
          </div>
        </div>
      )}

      {gistsLoading ? (
        <div className="flex items-center justify-center p-4 text-[#9e9e9e]">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading gists...
        </div>
      ) : gistsError ? (
        <div className="text-xs text-red-400 p-2">{gistsError}</div>
      ) : gists.length === 0 ? (
        <div className="text-xs text-[#9e9e9e] p-2">
          You don't have any gists yet.
        </div>
      ) : (
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
          {gists.map((gist) => (
            <div 
              key={gist.id}
              className="rounded border border-[#424242] bg-[#2d2d2d] p-2.5 text-[#cccccc] hover:bg-[#333333] transition-colors duration-100"
            >
              <div className="flex items-start justify-between">
                <div className="w-full">
                  <a 
                    href={gist.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sm text-[#007acc] hover:underline flex items-center"
                  >
                    {gist.description || 'Untitled gist'}
                    <ExternalLink className="h-3 w-3 ml-1 inline-block" />
                  </a>
                  
                  <div className="flex flex-wrap mt-2 gap-2">
                    {Object.keys(gist.files).map(fileName => (
                      <div key={fileName} className="text-xs bg-[#333333] px-2 py-1 rounded flex items-center">
                        <Pencil className="h-3 w-3 mr-1.5" />
                        {fileName}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center mt-2 text-[10px] space-x-3 text-[#9e9e9e]">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(gist.created_at), { addSuffix: true })}
                    </span>
                    <span className="flex items-center">
                      {gist.public ? 
                        <Eye className="h-3 w-3 mr-1" /> : 
                        <EyeOff className="h-3 w-3 mr-1" />
                      }
                      {gist.public ? 'Public' : 'Secret'}
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

export default GitHubGists;