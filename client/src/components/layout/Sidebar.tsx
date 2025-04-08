import React, { useState, useRef, lazy } from 'react';
import { FolderIcon, Search, Package, GitBranchIcon, PlusIcon, ChevronDown, FileCode, FileCog, FileJson, 
  Trash2, Edit, FolderUp, MoreHorizontal, Copy, X, Menu } from 'lucide-react';
import { useFileStore } from '@/store/fileStore';
import { useEditorStore } from '@/store/editorStore';
import { getFileIcon } from '@/lib/utils';
import { cn } from '@/lib/utils';

// Lazy load GitHub components to avoid circular dependencies
const GitHubLoginLazy = lazy(() => import('@/components/github/GitHubLogin'));
const GitHubReposLazy = lazy(() => import('@/components/github/GitHubRepos'));
const GitHubGistsLazy = lazy(() => import('@/components/github/GitHubGists'));
const GitHubImportExportLazy = lazy(() => import('@/components/github/GitHubImportExport'));

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const { files, createFile, deleteFile, deleteFolder } = useFileStore();
  const { openFile } = useEditorStore();
  const [activeTab, setActiveTab] = useState<string>('explorer');
  const [folderExpanded, setFolderExpanded] = useState(true);
  const [draggedFile, setDraggedFile] = useState<string | null>(null);
  const [activeFileMenu, setActiveFileMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = (fileName: string, content: string) => {
    openFile(fileName, content);
  };

  const handleCreateFile = () => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      createFile(fileName, '');
    }
  };

  const handleDeleteFile = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${fileName}?`)) {
      deleteFile(fileName);
    }
    setActiveFileMenu(null);
  };
  
  const handleDeleteFolder = (folderPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete folder '${folderPath}' and ALL of its contents? This cannot be undone.`)) {
      deleteFolder(folderPath)
        .then(success => {
          if (success) {
            console.log(`Folder deleted: ${folderPath}`);
            // Update expanded folders state to remove the deleted folder
            setExpandedFolders(prev => {
              const newState = { ...prev };
              delete newState[folderPath];
              // Remove any subfolders as well
              Object.keys(newState).forEach(key => {
                if (key.startsWith(folderPath + '/')) {
                  delete newState[key];
                }
              });
              return newState;
            });
          } else {
            console.error('Folder deletion operation returned false');
            alert('Failed to delete folder. Please try again.');
          }
        })
        .catch(err => {
          console.error('Error deleting folder:', err);
          alert('Failed to delete folder. Please try again.');
        });
    }
    setActiveFileMenu(null);
  };

  const { renameFile } = useFileStore();

  const handleRenameFile = (oldFileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFileName = prompt('Enter new file name:', oldFileName);
    if (newFileName && newFileName !== oldFileName) {
      renameFile(oldFileName, newFileName)
        .then(success => {
          if (success) {
            console.log(`File renamed from ${oldFileName} to ${newFileName}`);
          } else {
            console.error('File rename operation returned false');
            alert('Failed to rename file. Please try again.');
          }
        })
        .catch(err => {
          console.error('Error renaming file:', err);
          alert('Failed to rename file. Please try again.');
        });
    }
    setActiveFileMenu(null);
  };

  const handleDragStart = (fileName: string, e: React.DragEvent) => {
    setDraggedFile(fileName);
    e.dataTransfer.setData('text/plain', fileName);
    // Add visual effects for drag
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedFile(null);
    // Reset visual effects
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDrop = (targetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedFile) return;
    
    // In a real app, you'd implement actual file reordering logic here
    console.log(`Dropped ${draggedFile} at position ${targetIndex}`);
    
    // Reset drag state
    setDraggedFile(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow drop
  };

  const handleOpenFolder = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('webkitdirectory', '');
      fileInputRef.current.setAttribute('directory', '');
      fileInputRef.current.click();
    }
  };

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Temporary list to collect file paths and contents
    const filesToProcess: { path: string; file: File }[] = [];

    // Convert FileList to array and sort by path
    Array.from(files).forEach(file => {
      // Get relative path and filter out unwanted system files
      const path = file.webkitRelativePath || file.name;
      if (!path.includes('.git/') && !path.startsWith('.') && !path.includes('node_modules/')) {
        filesToProcess.push({ path, file });
      }
    });

    // Create a map to organize files by their directories
    const folderStructure: Map<string, { isFolder: boolean, name: string, path: string, content?: string, children: string[] }> = new Map();
    
    // Add root folder to structure
    folderStructure.set('root', { isFolder: true, name: 'root', path: '', children: [] });
    
    // First pass: build folder structure
    filesToProcess.forEach(({ path }) => {
      const parts = path.split('/');
      const fileName = parts.pop() || '';
      
      // Create parent folders if they don't exist yet
      let currentPath = '';
      for (let i = 0; i < parts.length; i++) {
        const folderName = parts[i];
        const parentPath = currentPath;
        
        // Update current path as we traverse deeper
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
        
        // Add folder to structure if it doesn't exist
        if (!folderStructure.has(currentPath)) {
          folderStructure.set(currentPath, {
            isFolder: true,
            name: folderName,
            path: currentPath,
            children: []
          });
          
          // Add as child to parent
          const parent = parentPath === '' ? 'root' : parentPath;
          const parentFolder = folderStructure.get(parent);
          if (parentFolder) {
            parentFolder.children.push(currentPath);
          }
        }
      }
      
      // Add file to its parent folder's children
      const parentPath = parts.length > 0 ? parts.join('/') : 'root';
      const parent = folderStructure.get(parentPath);
      if (parent) {
        const filePath = path;
        parent.children.push(filePath);
        
        // Add file entry to structure
        folderStructure.set(filePath, {
          isFolder: false,
          name: fileName,
          path: filePath,
          children: []
        });
      }
    });
    
    // Process each file and set content
    filesToProcess.forEach(({ path, file }) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const content = e.target.result as string;
          
          // Update the file entry with its content
          const fileEntry = folderStructure.get(path);
          if (fileEntry) {
            fileEntry.content = content;
            
            // Create file with full path preserved
            createFile(path, content)
              .catch(err => console.error(`Error creating file ${path}:`, err));
          }
        }
      };
      reader.readAsText(file);
    });
    
    console.log('Folder structure uploaded successfully');
  };
  
  // Get appropriate file icon based on file type
  const getFileIconComponent = (fileName: string) => {
    const fileType = getFileIcon(fileName);
    
    if (fileName.endsWith('.html')) {
      return <FileCode className="h-4 w-4 mr-1.5 text-[#e44d26]" />;
    } else if (fileName.endsWith('.css')) {
      return <FileCode className="h-4 w-4 mr-1.5 text-[#264de4]" />;
    } else if (fileName.endsWith('.js')) {
      return <FileCode className="h-4 w-4 mr-1.5 text-[#f7df1e]" />;
    } else if (fileName.endsWith('.json')) {
      return <FileJson className="h-4 w-4 mr-1.5 text-[#8bc34a]" />;
    } else {
      return <FileCog className="h-4 w-4 mr-1.5 text-[#75beff]" />;
    }
  };

  // Group files by folder for display
  interface FileNode {
    name: string;
    path: string;
    isFolder: boolean;
    content?: string;
    children: FileNode[];
    expanded: boolean;
  }

  // State to track which folders are expanded
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'root': true, // Root is expanded by default
  });

  // Toggle folder expansion
  const toggleFolder = (path: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Function to organize files into a tree structure
  const buildFileTree = (): FileNode => {
    const root: FileNode = {
      name: 'root',
      path: '',
      isFolder: true,
      children: [],
      expanded: true
    };
    
    const folderMap: Record<string, FileNode> = { '': root };
    
    // Sort files to ensure folders come first and then alphabetically
    const sortedFiles = [...files].sort((a, b) => {
      const aParts = a.name.split('/');
      const bParts = b.name.split('/');
      
      // Compare each path segment
      for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
        if (aParts[i] !== bParts[i]) {
          return aParts[i].localeCompare(bParts[i]);
        }
      }
      
      // If one path is a prefix of the other, the shorter one comes first
      return aParts.length - bParts.length;
    });
    
    // First pass: create folder nodes
    sortedFiles.forEach(file => {
      const parts = file.name.split('/');
      let currentPath = '';
      
      // Create/find parent folders
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!folderMap[currentPath]) {
          const newFolder: FileNode = {
            name: part,
            path: currentPath,
            isFolder: true,
            children: [],
            expanded: expandedFolders[currentPath] !== undefined ? expandedFolders[currentPath] : false
          };
          folderMap[currentPath] = newFolder;
          
          // Add to parent
          const parent = folderMap[parentPath];
          if (parent) {
            parent.children.push(newFolder);
          }
        }
      }
      
      // Create file node
      const fileName = parts[parts.length - 1];
      const filePath = file.name;
      const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
      
      const fileNode: FileNode = {
        name: fileName,
        path: filePath,
        isFolder: false,
        content: file.content,
        children: [],
        expanded: false
      };
      
      // Add to parent folder
      const parent = folderMap[parentPath];
      if (parent) {
        parent.children.push(fileNode);
      } else {
        // If no parent folder (root level file)
        root.children.push(fileNode);
      }
    });
    
    return root;
  };
  
  // Recursively render file tree
  const renderFileTree = (node: FileNode, level: number = 0) => {
    if (!node.isFolder && node.name.startsWith('.')) {
      // Skip hidden files
      return null;
    }
    
    return (
      <div key={node.path} style={{ marginLeft: level > 0 ? `${level * 0.5}rem` : 0 }}>
        {node.isFolder ? (
          <>
            <div 
              className="py-1 flex items-center justify-between hover:bg-[#37373d] cursor-pointer group"
              onClick={(e) => toggleFolder(node.path, e)}
            >
              <div className="flex items-center">
                <ChevronDown 
                  className={`h-4 w-4 mr-1 transition-transform ${expandedFolders[node.path] ? '' : '-rotate-90'}`} 
                />
                <FolderIcon className="h-4 w-4 mr-1.5 text-[#c09553]" />
                <span className="text-xs tracking-wide">{node.name}</span>
              </div>
              {level > 0 && (
                <div className="flex">
                  <button
                    className="p-1 text-[#cccccc] opacity-0 group-hover:opacity-100 hover:bg-[#505050] rounded mr-1"
                    onClick={(e) => handleDeleteFolder(node.path, e)}
                    title="Delete Folder"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[#f14c4c]" />
                  </button>
                  <button
                    className="p-1 text-[#cccccc] opacity-0 group-hover:opacity-100 hover:bg-[#505050] rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Close folder (remove it and all children from view)
                      setExpandedFolders(prev => {
                        const newState = { ...prev };
                        // Close this folder and any subfolders
                        delete newState[node.path];
                        // Search for and delete any child paths
                        Object.keys(newState).forEach(key => {
                          if (key.startsWith(node.path + '/')) {
                            delete newState[key];
                          }
                        });
                        return newState;
                      });
                    }}
                    title="Close Folder"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            {expandedFolders[node.path] && (
              <div className="pl-3">
                {node.children.map(child => renderFileTree(child, level + 1))}
                {node.children.length === 0 && (
                  <div className="py-2 px-2 text-xs text-[#a0a0a0] italic">
                    Empty folder
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div 
            className="py-1 px-2 flex items-center justify-between hover:bg-[#37373d] group"
            draggable
            onDragStart={(e) => handleDragStart(node.path, e)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
          >
            <div 
              className="flex items-center flex-grow overflow-hidden cursor-pointer"
              onClick={() => node.content && handleFileClick(node.path, node.content)}
            >
              {getFileIconComponent(node.name)}
              <span className="truncate">{node.name}</span>
            </div>
            <div className="flex items-center">
              <div className="relative">
                <button
                  className="p-1 text-[#cccccc] opacity-0 group-hover:opacity-100 hover:bg-[#37373d] rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveFileMenu(activeFileMenu === node.path ? null : node.path);
                  }}
                  title="More Actions"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
                
                {activeFileMenu === node.path && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setActiveFileMenu(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 bg-[#252526] border border-[#474747] shadow-lg z-50 w-32 py-1 rounded-sm">
                      <button
                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#094771] flex items-center"
                        onClick={(e) => handleRenameFile(node.path, e)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-2" />
                        Rename
                      </button>
                      <button
                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#094771] flex items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (node.content) {
                            navigator.clipboard.writeText(node.content);
                          }
                          setActiveFileMenu(null);
                        }}
                      >
                        <Copy className="h-3.5 w-3.5 mr-2" />
                        Copy Content
                      </button>
                      <div className="border-t border-[#474747] my-1"></div>
                      <button
                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#094771] text-[#f14c4c] flex items-center"
                        onClick={(e) => handleDeleteFile(node.path, e)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const rootNode = buildFileTree();

  const renderFileExplorer = () => (
    <>
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="text-xs font-semibold tracking-wider text-[#cccccc]">EXPLORER</div>
        <div className="flex space-x-1">
          <button 
            onClick={handleOpenFolder}
            className="p-1 text-[#cccccc] hover:bg-[#37373d] rounded"
            title="Open Folder"
          >
            <FolderUp className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={handleCreateFile}
            className="p-1 text-[#cccccc] hover:bg-[#37373d] rounded"
            title="New File"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 text-sm text-[#cccccc]">
        <div 
          className="py-1 px-4 flex items-center justify-between hover:bg-[#37373d] cursor-pointer"
          onClick={() => setFolderExpanded(!folderExpanded)}
        >
          <div className="flex items-center">
            <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${folderExpanded ? '' : '-rotate-90'}`} />
            <span className="text-xs tracking-wide">HTML EDITOR</span>
          </div>
        </div>
        
        {folderExpanded && (
          <div className="pl-7">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              onChange={handleFolderUpload} 
            />
            
            {/* Render hierarchical file structure */}
            {rootNode.children.map(node => renderFileTree(node))}
            
            {files.length === 0 && (
              <div className="py-2 px-2 text-xs text-[#a0a0a0] italic">
                No files yet. Create a new file or open a folder to get started.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <aside className={cn("flex flex-row", className)}>
      <div className="w-12 flex-shrink-0 bg-[#333333] flex flex-col items-center py-2 border-r border-[#474747]">
        <button 
          className={cn(
            "w-12 h-12 flex items-center justify-center mb-2 relative",
            activeTab === 'explorer' ? "text-white after:absolute after:left-0 after:top-0 after:h-full after:w-[2px] after:bg-[#007acc]" : "text-[#858585] hover:text-white"
          )}
          onClick={() => setActiveTab('explorer')}
          title="Explorer"
        >
          <FolderIcon className="h-6 w-6" />
        </button>
        <button 
          className={cn(
            "w-12 h-12 flex items-center justify-center mb-2 relative",
            activeTab === 'search' ? "text-white after:absolute after:left-0 after:top-0 after:h-full after:w-[2px] after:bg-[#007acc]" : "text-[#858585] hover:text-white"
          )}
          onClick={() => setActiveTab('search')}
          title="Search"
        >
          <Search className="h-6 w-6" />
        </button>
        <button 
          className={cn(
            "w-12 h-12 flex items-center justify-center mb-2 relative",
            activeTab === 'source' ? "text-white after:absolute after:left-0 after:top-0 after:h-full after:w-[2px] after:bg-[#007acc]" : "text-[#858585] hover:text-white"
          )}
          onClick={() => setActiveTab('source')}
          title="Source Control"
        >
          <GitBranchIcon className="h-6 w-6" />
        </button>
        <button 
          className={cn(
            "w-12 h-12 flex items-center justify-center mb-2 relative",
            activeTab === 'extensions' ? "text-white after:absolute after:left-0 after:top-0 after:h-full after:w-[2px] after:bg-[#007acc]" : "text-[#858585] hover:text-white"
          )}
          onClick={() => setActiveTab('extensions')}
          title="Extensions"
        >
          <Package className="h-6 w-6" />
        </button>
      </div>
      
      <div className="flex-grow bg-[#252526] border-r border-[#474747] w-[240px] flex flex-col">
        {activeTab === 'explorer' && renderFileExplorer()}
        {activeTab === 'search' && (
          <div className="p-4 text-[#cccccc]">
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-[#3c3c3c] border border-[#5f5f5f] rounded-sm px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#007acc]"
            />
            <div className="mt-4 text-xs text-[#a0a0a0]">
              Type to search in files
            </div>
          </div>
        )}
        {activeTab === 'source' && (
          <div className="p-4 text-[#cccccc] overflow-y-auto h-full">
            <div className="text-xs font-semibold mb-2">SOURCE CONTROL</div>
            
            {/* Dynamically import GitHub components to avoid circular dependencies */}
            <React.Suspense fallback={<div className="text-xs text-[#9e9e9e] mt-2">Loading GitHub integration...</div>}>
              <GitHubLoginLazy />
              <GitHubImportExportLazy />
              <GitHubReposLazy />
              <GitHubGistsLazy />
            </React.Suspense>
          </div>
        )}
        {activeTab === 'extensions' && (
          <div className="p-4 text-[#cccccc]">
            <div className="text-xs font-semibold mb-2">EXTENSIONS</div>
            <div className="mt-2 text-xs text-[#a0a0a0]">
              Extension support coming soon
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
