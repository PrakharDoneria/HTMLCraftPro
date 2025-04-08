import React, { useState, useRef } from 'react';
import { FolderIcon, Search, Package, GitBranchIcon, PlusIcon, ChevronDown, FileCode, FileCog, FileJson, 
  Trash2, Edit, FolderUp, MoreHorizontal, Copy, X, Menu } from 'lucide-react';
import { useFileStore } from '@/store/fileStore';
import { useEditorStore } from '@/store/editorStore';
import { getFileIcon } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const { files, createFile, deleteFile } = useFileStore();
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

    // Process each file
    filesToProcess.forEach(({ path, file }) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const content = e.target.result as string;
          const fileName = path.split('/').pop() || path; // Use filename only, not full path
          createFile(fileName, content)
            .catch(err => console.error('Error creating file:', err));
        }
      };
      reader.readAsText(file);
    });
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
            {files.map((file, index) => (
              <div 
                key={file.name}
                className="py-1 px-2 flex items-center justify-between hover:bg-[#37373d] group"
                draggable
                onDragStart={(e) => handleDragStart(file.name, e)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(index, e)}
              >
                <div 
                  className="flex items-center flex-grow overflow-hidden cursor-pointer"
                  onClick={() => handleFileClick(file.name, file.content)}
                >
                  {getFileIconComponent(file.name)}
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="flex items-center">
                  <div className="relative">
                    <button
                      className="p-1 text-[#cccccc] opacity-0 group-hover:opacity-100 hover:bg-[#37373d] rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFileMenu(activeFileMenu === file.name ? null : file.name);
                      }}
                      title="More Actions"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                    
                    {activeFileMenu === file.name && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setActiveFileMenu(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 bg-[#252526] border border-[#474747] shadow-lg z-50 w-32 py-1 rounded-sm">
                          <button
                            className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#094771] flex items-center"
                            onClick={(e) => handleRenameFile(file.name, e)}
                          >
                            <Edit className="h-3.5 w-3.5 mr-2" />
                            Rename
                          </button>
                          <button
                            className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#094771] flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(file.content);
                              setActiveFileMenu(null);
                            }}
                          >
                            <Copy className="h-3.5 w-3.5 mr-2" />
                            Copy Content
                          </button>
                          <div className="border-t border-[#474747] my-1"></div>
                          <button
                            className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#094771] text-[#f14c4c] flex items-center"
                            onClick={(e) => handleDeleteFile(file.name, e)}
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
            ))}
            
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
          <div className="p-4 text-[#cccccc]">
            <div className="text-xs font-semibold mb-2">SOURCE CONTROL</div>
            <div className="mt-2 text-xs text-[#a0a0a0]">
              Git support coming soon
            </div>
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
