import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { useEditorStore } from '@/store/editorStore';
import { debounce } from '@/lib/utils';

// Define Monaco environment to handle worker requests
window.MonacoEnvironment = {
  getWorker: function() {
    // Create a proper worker-like object with all required methods
    return Promise.resolve({
      postMessage: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      onmessage: null,
      onerror: null,
      terminate: () => {}
    } as unknown as Worker);
  }
};

// Define custom VS Code-like theme once
monaco.editor.defineTheme('vs-dark-custom', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'tag', foreground: '569CD6' },
    { token: 'attribute.name', foreground: '9CDCFE' },
    { token: 'attribute.value', foreground: 'CE9178' },
    { token: 'comment', foreground: '6A9955' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'keyword', foreground: '569CD6' },
    { token: 'number', foreground: 'B5CEA8' }
  ],
  colors: {
    'editor.background': '#1E1E1E',
    'editor.foreground': '#D4D4D4',
    'editorLineNumber.foreground': '#858585',
    'editor.selectionBackground': '#264F78',
    'editorIndentGuide.background': '#404040',
  }
});

interface MonacoEditorProps {
  language?: string;
  value: string;
  onChange: (value: string) => void;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  language = 'html',
  value,
  onChange,
  options = {},
  onMount
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const prevValueRef = useRef(value);
  const theme = useEditorStore(state => state.theme);

  // Create editor on mount
  useEffect(() => {
    if (!editorRef.current) return;
    
    // Set the editor theme based on current theme state
    const editorTheme = theme === 'dark' ? 'vs-dark-custom' : 'vs';
    
    // Create editor instance
    const editor = monaco.editor.create(editorRef.current, {
      value,
      language,
      theme: editorTheme,
      minimap: { enabled: true },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      lineNumbers: 'on',
      tabSize: 2,
      fontSize: 14,
      ...options
    });
    
    editorInstanceRef.current = editor;
    prevValueRef.current = value;
    
    // Setup change handler with debounce
    const debouncedOnChange = debounce((val: string) => {
      if (val !== prevValueRef.current) {
        prevValueRef.current = val;
        onChange(val);
      }
    }, 300);

    // Listen for content changes
    const changeDisposable = editor.onDidChangeModelContent(() => {
      const newValue = editor.getValue();
      debouncedOnChange(newValue);
    });
    
    // Call onMount callback if provided
    if (onMount) {
      onMount(editor);
    }
    
    // Cleanup on unmount
    return () => {
      changeDisposable.dispose();
      editor.dispose();
    };
  }, []);
  
  // Handle theme changes 
  useEffect(() => {
    if (!editorInstanceRef.current) return;
    
    const editorTheme = theme === 'dark' ? 'vs-dark-custom' : 'vs';
    editorInstanceRef.current.updateOptions({ theme: editorTheme });
  }, [theme]);
  
  // Handle language changes
  useEffect(() => {
    if (!editorInstanceRef.current) return;
    
    const model = editorInstanceRef.current.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, language);
    }
  }, [language]);
  
  // Handle external value changes
  useEffect(() => {
    if (!editorInstanceRef.current || value === prevValueRef.current) return;

    const editor = editorInstanceRef.current;
    const currentValue = editor.getValue();
    
    if (value !== currentValue) {
      editor.setValue(value);
      prevValueRef.current = value;
      
      // Reset cursor position after content change
      editor.setPosition({ lineNumber: 1, column: 1 });
    }
  }, [value]);
  
  return <div ref={editorRef} className="h-full w-full" />;
};

export default MonacoEditor;
