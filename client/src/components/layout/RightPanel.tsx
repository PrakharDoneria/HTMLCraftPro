import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { generateOutline } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface RightPanelProps {
  className?: string;
  htmlContent: string;
}

interface OutlineItem {
  tag: string;
  level: number;
  expanded: boolean;
}

const RightPanel: React.FC<RightPanelProps> = ({ className = '', htmlContent }) => {
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<'outline' | 'problems'>('outline');
  const { activeTab } = useEditorStore();

  useEffect(() => {
    if (htmlContent) {
      try {
        const generatedOutline = generateOutline(htmlContent);
        setOutline(generatedOutline);
        
        // Basic HTML validation
        const newErrors: string[] = [];
        
        // Check for missing lang attribute
        if (htmlContent.includes('<html') && !htmlContent.includes('lang=')) {
          newErrors.push('Consider adding a `lang` attribute to the HTML start tag to declare the language of this document.');
        }
        
        // Check for missing alt attributes on images
        if (htmlContent.includes('<img') && !htmlContent.includes('alt=')) {
          newErrors.push('Image tags should include an `alt` attribute for accessibility.');
        }
        
        // Check for missing viewport meta tag
        if (htmlContent.includes('<head') && !htmlContent.includes('viewport')) {
          newErrors.push('Consider adding a viewport meta tag for responsive design.');
        }
        
        setValidationErrors(newErrors);
      } catch (error) {
        console.error('Error generating outline:', error);
      }
    }
  }, [htmlContent]);

  const toggleItemExpand = (index: number) => {
    const newOutline = [...outline];
    newOutline[index].expanded = !newOutline[index].expanded;
    setOutline(newOutline);
  };

  const getTreeIcon = (item: OutlineItem) => {
    // If it's a self-closing tag or doesn't have children, don't show expand/collapse icon
    const selfClosingTags = ['img', 'input', 'br', 'hr', 'meta', 'link'];
    if (selfClosingTags.includes(item.tag)) {
      return <span className="tree-item-icon"></span>;
    }
    
    // Check if this item has any children at a deeper level
    const hasChildren = outline.some(other => other.level > item.level);
    
    if (!hasChildren) {
      return <span className="tree-item-icon"></span>;
    }
    
    return (
      <span className="tree-item-icon cursor-pointer">
        {item.expanded ? '▼' : '▶'}
      </span>
    );
  };

  return (
    <aside className={cn("w-64 bg-secondary border-l border-border flex flex-col", className)}>
      <div className="p-2 border-b border-border">
        <div className="flex space-x-4">
          <button 
            className={cn("text-sm font-medium", activeSection === 'outline' ? 'text-white' : 'text-gray-400')}
            onClick={() => setActiveSection('outline')}
          >
            OUTLINE
          </button>
          <button 
            className={cn("text-sm font-medium", activeSection === 'problems' ? 'text-white' : 'text-gray-400')}
            onClick={() => setActiveSection('problems')}
          >
            PROBLEMS
          </button>
        </div>
      </div>
      
      {activeSection === 'outline' && (
        <div className="overflow-auto flex-1 text-sm p-2">
          {outline.map((item, index) => (
            <div 
              key={index}
              className="html-outline-item flex items-center py-0.5"
              style={{ paddingLeft: `${item.level * 12}px` }}
              onClick={() => toggleItemExpand(index)}
            >
              {getTreeIcon(item)}
              <span className="text-blue-400">&lt;{item.tag}&gt;</span>
            </div>
          ))}
        </div>
      )}
      
      {activeSection === 'problems' && (
        <div className="p-2 text-xs overflow-auto flex-1">
          {validationErrors.length > 0 ? (
            validationErrors.map((error, index) => (
              <div key={index} className="flex items-start mb-2">
                <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span dangerouslySetInnerHTML={{ __html: error }} />
              </div>
            ))
          ) : (
            <div className="text-gray-400">No problems detected.</div>
          )}
        </div>
      )}
    </aside>
  );
};

export default RightPanel;
