import React, { useState } from 'react';
import { FolderIcon, Search, Package, GitBranchIcon, PlusIcon, ChevronDown, FileCode, FileCog, FileJson } from 'lucide-react';
import { useFileStore } from '@/store/fileStore';
import { useEditorStore } from '@/store/editorStore';
import { getFileIcon } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const { files, createFile } = useFileStore();
  const { openFile } = useEditorStore();
  const [activeTab, setActiveTab] = useState<string>('explorer');
  const [folderExpanded, setFolderExpanded] = useState(true);

  const handleFileClick = (fileName: string, content: string) => {
    openFile(fileName, content);
  };

  const handleCreateFile = () => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      createFile(fileName, '');
    }
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
      <div className="px-4 py-3">
        <div className="text-xs font-semibold tracking-wider text-[#cccccc]">EXPLORER</div>
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
          <div className="flex">
            <button 
              className="p-0.5 opacity-80 hover:opacity-100 hover:bg-[#37373d] rounded"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateFile();
              }}
              title="New File"
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        
        {folderExpanded && (
          <div className="pl-7">
            {files.map((file) => (
              <div 
                key={file.name}
                className="py-1 px-2 flex items-center hover:bg-[#37373d] cursor-pointer"
                onClick={() => handleFileClick(file.name, file.content)}
              >
                {getFileIconComponent(file.name)}
                <span className="truncate">{file.name}</span>
              </div>
            ))}
            
            {files.length === 0 && (
              <div className="py-2 px-2 text-xs text-[#a0a0a0] italic">
                No files yet. Create a new file to get started.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <aside className={cn("flex flex-col", className)}>
      <div className="w-12 h-full bg-[#333333] flex flex-col items-center py-2 border-r border-[#474747]">
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
      
      <div className="flex-1 bg-[#252526] border-r border-[#474747] min-w-[240px]">
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
