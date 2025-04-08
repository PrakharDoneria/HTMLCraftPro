import React, { useState } from 'react';
import { useGitHubStore } from '@/store/githubStore';
import { useFileStore } from '@/store/fileStore';
import { useEditorStore } from '@/store/editorStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Loader2, 
  Download, 
  Upload, 
  Archive,
  FileCode,
  GitBranch,
  FolderOpen,
  Trash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GitHubImportExport: React.FC = () => {
  const { 
    isAuthenticated,
    importFilesFromRepo,
    pushFilesToRepo,
    importingFiles,
    pushingFiles,
    importFilesError,
    pushFilesError
  } = useGitHubStore();
  
  const { files, createFile } = useFileStore();
  const { createNewTab } = useEditorStore();
  
  const [showImportForm, setShowImportForm] = useState(false);
  const [showPushForm, setShowPushForm] = useState(false);
  
  // Import form state
  const [importOwner, setImportOwner] = useState('');
  const [importRepo, setImportRepo] = useState('');
  const [importPath, setImportPath] = useState('');
  const [openFilesAfterImport, setOpenFilesAfterImport] = useState(true);
  
  // Push form state
  const [pushOwner, setPushOwner] = useState('');
  const [pushRepo, setPushRepo] = useState('');
  const [commitMessage, setCommitMessage] = useState('Push from HTML Editor');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  const { toast } = useToast();
  
  // Handle importing files from a GitHub repository
  const handleImportFiles = async () => {
    if (!importOwner.trim() || !importRepo.trim()) {
      toast({
        title: "Required Fields",
        description: "Please enter repository owner and name",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const importedFiles = await importFilesFromRepo(
        importOwner.trim(), 
        importRepo.trim(), 
        importPath.trim()
      );
      
      const fileCount = Object.keys(importedFiles).length;
      
      if (fileCount > 0) {
        // Import each file to the editor
        for (const [filename, content] of Object.entries(importedFiles)) {
          await createFile(filename, content);
          
          // Open each file in a new tab if requested
          if (openFilesAfterImport) {
            createNewTab(filename, content);
          }
        }
        
        toast({
          title: "Import Successful",
          description: `Imported ${fileCount} file${fileCount !== 1 ? 's' : ''} from GitHub repository`,
        });
        
        // Reset the form
        setImportOwner('');
        setImportRepo('');
        setImportPath('');
        setShowImportForm(false);
      } else {
        toast({
          title: "No Files Found",
          description: "No valid HTML, CSS, or JS files found in the specified repository path",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error importing files:', error);
      toast({
        title: "Import Failed",
        description: importFilesError || "Failed to import files from GitHub repository",
        variant: "destructive"
      });
    }
  };
  
  // Handle pushing files to a GitHub repository
  const handlePushFiles = async () => {
    if (!pushOwner.trim() || !pushRepo.trim()) {
      toast({
        title: "Required Fields",
        description: "Please enter repository owner and name",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to push",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Prepare files for pushing
      const filesToPush = selectedFiles.map(filename => {
        const file = files.find(f => f.name === filename);
        return {
          path: filename,
          content: file?.content || ''
        };
      });
      
      const success = await pushFilesToRepo(
        pushOwner.trim(),
        pushRepo.trim(),
        filesToPush,
        commitMessage.trim() || 'Push from HTML Editor'
      );
      
      if (success) {
        toast({
          title: "Push Successful",
          description: `Pushed ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} to GitHub repository`,
        });
        
        // Reset the form
        setPushOwner('');
        setPushRepo('');
        setCommitMessage('Push from HTML Editor');
        setSelectedFiles([]);
        setShowPushForm(false);
      } else {
        toast({
          title: "Push Failed",
          description: pushFilesError || "Failed to push files to GitHub repository",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error pushing files:', error);
      toast({
        title: "Push Failed",
        description: pushFilesError || "Error pushing files to GitHub repository",
        variant: "destructive"
      });
    }
  };
  
  // Toggle file selection for pushing
  const toggleFileSelection = (filename: string) => {
    if (selectedFiles.includes(filename)) {
      setSelectedFiles(selectedFiles.filter(name => name !== filename));
    } else {
      setSelectedFiles([...selectedFiles, filename]);
    }
  };
  
  // Select all files for pushing
  const selectAllFiles = () => {
    setSelectedFiles(files.map(file => file.name));
  };
  
  // Clear file selection
  const clearFileSelection = () => {
    setSelectedFiles([]);
  };
  
  if (!isAuthenticated) {
    return (
      <div className="mt-6 text-sm text-[#9e9e9e] p-2">
        Please connect your GitHub account to import or export files.
      </div>
    );
  }
  
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#cccccc]">GitHub Import/Export</h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setShowImportForm(!showImportForm);
              setShowPushForm(false);
            }}
            className="text-xs h-7 px-2"
          >
            {showImportForm ? 'Cancel' : <><Download className="h-3.5 w-3.5 mr-1" /> Import</>}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setShowPushForm(!showPushForm);
              setShowImportForm(false);
            }}
            className="text-xs h-7 px-2"
          >
            {showPushForm ? 'Cancel' : <><Upload className="h-3.5 w-3.5 mr-1" /> Push</>}
          </Button>
        </div>
      </div>
      
      {/* Import Form */}
      {showImportForm && (
        <div className="mb-4 rounded border border-[#424242] bg-[#2d2d2d] p-3 text-[#cccccc]">
          <div className="space-y-3">
            <div className="text-xs">
              Import HTML, CSS & JS files from a GitHub repository
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="import-owner" className="text-xs block mb-1">Repository Owner</label>
                <Input
                  id="import-owner"
                  value={importOwner}
                  onChange={(e) => setImportOwner(e.target.value)}
                  placeholder="e.g. github-username"
                  className="bg-[#3a3a3a] border-[#424242] text-sm h-8"
                />
              </div>
              <div>
                <label htmlFor="import-repo" className="text-xs block mb-1">Repository Name</label>
                <Input
                  id="import-repo"
                  value={importRepo}
                  onChange={(e) => setImportRepo(e.target.value)}
                  placeholder="e.g. my-website"
                  className="bg-[#3a3a3a] border-[#424242] text-sm h-8"
                />
              </div>
            </div>
            <div>
              <label htmlFor="import-path" className="text-xs block mb-1">Directory Path (optional)</label>
              <Input
                id="import-path"
                value={importPath}
                onChange={(e) => setImportPath(e.target.value)}
                placeholder="e.g. src/components (leave empty for root)"
                className="bg-[#3a3a3a] border-[#424242] text-sm h-8"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="open-files"
                  checked={openFilesAfterImport}
                  onCheckedChange={setOpenFilesAfterImport}
                />
                <label htmlFor="open-files" className="text-xs cursor-pointer">
                  Open files after import
                </label>
              </div>
              
              <Button 
                onClick={handleImportFiles}
                disabled={importingFiles || !importOwner.trim() || !importRepo.trim()}
                size="sm"
              >
                {importingFiles ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                Import Files
              </Button>
            </div>
            
            {importFilesError && (
              <div className="text-xs text-red-400 mt-1">{importFilesError}</div>
            )}
          </div>
        </div>
      )}
      
      {/* Push Form */}
      {showPushForm && (
        <div className="mb-4 rounded border border-[#424242] bg-[#2d2d2d] p-3 text-[#cccccc]">
          <div className="space-y-3">
            <div className="text-xs">
              Push files to a GitHub repository
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="push-owner" className="text-xs block mb-1">Repository Owner</label>
                <Input
                  id="push-owner"
                  value={pushOwner}
                  onChange={(e) => setPushOwner(e.target.value)}
                  placeholder="e.g. your-username"
                  className="bg-[#3a3a3a] border-[#424242] text-sm h-8"
                />
              </div>
              <div>
                <label htmlFor="push-repo" className="text-xs block mb-1">Repository Name</label>
                <Input
                  id="push-repo"
                  value={pushRepo}
                  onChange={(e) => setPushRepo(e.target.value)}
                  placeholder="e.g. my-website"
                  className="bg-[#3a3a3a] border-[#424242] text-sm h-8"
                />
              </div>
            </div>
            <div>
              <label htmlFor="commit-message" className="text-xs block mb-1">Commit Message</label>
              <Input
                id="commit-message"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Describe your changes"
                className="bg-[#3a3a3a] border-[#424242] text-sm h-8"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs">Select Files to Push</label>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={selectAllFiles}
                    className="text-xs h-6 px-2"
                    disabled={files.length === 0}
                  >
                    <Archive className="h-3 w-3 mr-1" />
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearFileSelection}
                    className="text-xs h-6 px-2"
                    disabled={selectedFiles.length === 0}
                  >
                    <Trash className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
              
              <div className="bg-[#252526] border border-[#424242] rounded max-h-[120px] overflow-y-auto p-2">
                {files.length === 0 ? (
                  <div className="text-xs text-[#9e9e9e] text-center py-2">
                    No files available
                  </div>
                ) : (
                  <div className="space-y-1">
                    {files.map(file => (
                      <div 
                        key={file.name}
                        className="flex items-center rounded px-2 py-1 hover:bg-[#2a2d2e]"
                      >
                        <input
                          type="checkbox"
                          id={`file-${file.name}`}
                          checked={selectedFiles.includes(file.name)}
                          onChange={() => toggleFileSelection(file.name)}
                          className="mr-2"
                        />
                        <label 
                          htmlFor={`file-${file.name}`}
                          className="flex items-center text-xs cursor-pointer flex-1 truncate"
                        >
                          <FileCode className="h-3.5 w-3.5 mr-1.5 text-[#75beff]" />
                          {file.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handlePushFiles}
                disabled={
                  pushingFiles || 
                  !pushOwner.trim() || 
                  !pushRepo.trim() || 
                  selectedFiles.length === 0
                }
                size="sm"
              >
                {pushingFiles ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <GitBranch className="h-4 w-4 mr-1" />}
                Push Files
              </Button>
            </div>
            
            {pushFilesError && (
              <div className="text-xs text-red-400 mt-1">{pushFilesError}</div>
            )}
          </div>
        </div>
      )}
      
      {!showImportForm && !showPushForm && (
        <div className="text-xs text-[#9e9e9e] p-2">
          Import files from a public GitHub repository or push your files to a repository you own.
        </div>
      )}
    </div>
  );
};

export default GitHubImportExport;