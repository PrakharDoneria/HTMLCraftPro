import React, { useState } from 'react';
import { FolderIcon, Search, Package, GitBranchIcon, PlusIcon, Maximize2 } from 'lucide-react';
import { useFileStore } from '@/store/fileStore';
import { useEditorStore } from '@/store/editorStore';
import { getFileIcon } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const { files, createFile } = useFileStore();
  const { openFile } = useEditorStore();
  const [activeTab, setActiveTab] = useState<string>('explorer');

  const handleFileClick = (fileName: string, content: string) => {
    openFile(fileName, content);
  };

  const handleCreateFile = () => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      createFile(fileName, '');
    }
  };

  const renderFileExplorer = () => (
    <>
      <div className="p-2 border-b border-border">
        <div className="text-sm font-medium mb-2">EXPLORER</div>
        <div className="text-xs uppercase text-gray-500 mb-1 flex items-center justify-between">
          <span>HTML EDITOR</span>
          <div className="flex">
            <button 
              className="p-1 hover:bg-opacity-20 hover:bg-white rounded"
              onClick={handleCreateFile}
              title="New File"
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
            <button className="p-1 hover:bg-opacity-20 hover:bg-white rounded" title="Collapse All">
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 text-sm">
        <div className="py-1 px-2 hover:bg-opacity-10 hover:bg-white cursor-pointer">
          <div className="flex items-center">
            <FolderIcon className="h-4 w-4 mr-1 text-blue-400" />
            <span>project</span>
          </div>
        </div>
        
        {files.map((file) => (
          <div 
            key={file.name}
            className="pl-6 py-1 px-2 hover:bg-opacity-10 hover:bg-white cursor-pointer"
            onClick={() => handleFileClick(file.name, file.content)}
          >
            <div className="flex items-center">
              <span className="h-4 w-4 mr-1 text-orange-400">
                {getFileIcon(file.name) === 'file-text' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {getFileIcon(file.name) === 'file-css' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {getFileIcon(file.name) === 'file-js' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </span>
              <span>{file.name}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <aside className={`w-64 bg-secondary border-r border-border flex flex-col ${className}`}>
      {activeTab === 'explorer' && renderFileExplorer()}
      
      <div className="p-1 border-t border-border flex justify-around">
        <button 
          className={`p-1.5 ${activeTab === 'explorer' ? 'bg-opacity-20 bg-white' : 'hover:bg-opacity-20 hover:bg-white'} rounded`}
          onClick={() => setActiveTab('explorer')}
          title="Explorer"
        >
          <FolderIcon className="h-5 w-5" />
        </button>
        <button 
          className={`p-1.5 ${activeTab === 'search' ? 'bg-opacity-20 bg-white' : 'hover:bg-opacity-20 hover:bg-white'} rounded`}
          onClick={() => setActiveTab('search')}
          title="Search"
        >
          <Search className="h-5 w-5" />
        </button>
        <button 
          className={`p-1.5 ${activeTab === 'extensions' ? 'bg-opacity-20 bg-white' : 'hover:bg-opacity-20 hover:bg-white'} rounded`}
          onClick={() => setActiveTab('extensions')}
          title="Extensions"
        >
          <Package className="h-5 w-5" />
        </button>
        <button 
          className={`p-1.5 ${activeTab === 'source' ? 'bg-opacity-20 bg-white' : 'hover:bg-opacity-20 hover:bg-white'} rounded`}
          onClick={() => setActiveTab('source')}
          title="Source Control"
        >
          <GitBranchIcon className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
