import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { useEditorStore } from '@/store/editorStore';
import { debounce } from '@/lib/utils';

// Monaco editor configuration to work without web workers
// This is a workaround for environments where web workers don't function properly
window.MonacoEnvironment = {
  // Return a mock worker with the minimal API needed to satisfy Monaco
  getWorker: function(_: any, __: any) {
    const proxy = {
      postMessage: function() {},
      addEventListener: function() {}
    };
    return Promise.resolve(proxy as unknown as Worker);
  }
};

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
  const theme = useEditorStore(state => state.theme);
  const isInitializedRef = useRef(false);

  // Initialize editor once
  useEffect(() => {
    if (editorRef.current && !isInitializedRef.current) {
      // Define theme once
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
      
      // Set theme based on user preference
      monaco.editor.setTheme(theme === 'dark' ? 'vs-dark-custom' : 'vs');

      // Basic editor options
      const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
        value,
        language,
        theme: theme === 'dark' ? 'vs-dark-custom' : 'vs',
        minimap: { enabled: true },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        tabSize: 2,
        fontSize: 14,
        ...options,
      };

      // Create editor instance
      const editor = monaco.editor.create(editorRef.current, editorOptions);
      editorInstanceRef.current = editor;

      // Handle changes
      const debouncedOnChange = debounce((val: string) => {
        onChange(val);
      }, 300);

      editor.onDidChangeModelContent(() => {
        debouncedOnChange(editor.getValue());
      });

      // Call onMount if provided
      if (onMount) {
        onMount(editor);
      }

      // Register basic language features for HTML
      if (language === 'html') {
        monaco.languages.registerCompletionItemProvider('html', {
          provideCompletionItems: (model, position) => {
            const wordInfo = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: wordInfo.startColumn,
              endColumn: wordInfo.endColumn
            };
            
            const htmlTags = ['div', 'span', 'p', 'h1', 'h2', 'a', 'img', 'ul', 'li'];
            
            return {
              suggestions: htmlTags.map(tag => ({
                label: tag,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: tag,
                range
              }))
            };
          }
        });
      }

      // Handle resize
      const handleResize = () => {
        editor.layout();
      };
      
      window.addEventListener('resize', handleResize);
      isInitializedRef.current = true;

      return () => {
        window.removeEventListener('resize', handleResize);
        editor.dispose();
        isInitializedRef.current = false;
      };
    }
  }, []); // Empty dependency array ensures this runs only once

  // Update value when it changes externally
  useEffect(() => {
    if (editorInstanceRef.current) {
      const currentValue = editorInstanceRef.current.getValue();
      if (value !== currentValue) {
        editorInstanceRef.current.setValue(value);
      }
    }
  }, [value]);

  // Update language when it changes
  useEffect(() => {
    if (editorInstanceRef.current) {
      const model = editorInstanceRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
      }
    }
  }, [language]);

  // Update theme when it changes
  useEffect(() => {
    monaco.editor.setTheme(theme === 'dark' ? 'vs-dark-custom' : 'vs');
  }, [theme]);

  return <div ref={editorRef} className="h-full w-full" />;
};

export default MonacoEditor;
