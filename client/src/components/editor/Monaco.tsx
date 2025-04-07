import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { useEditorStore } from '@/store/editorStore';
import { debounce } from '@/lib/utils';

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
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const theme = useEditorStore(state => state.theme);

  // Set up Monaco editor theme
  useEffect(() => {
    monaco.editor.defineTheme('vs-dark-custom', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'tag', foreground: '569CD6' },
        { token: 'attribute.name', foreground: '9CDCFE' },
        { token: 'attribute.value', foreground: 'CE9178' },
        { token: 'comment', foreground: '6A9955' }
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editorLineNumber.foreground': '#858585',
        'editor.lineHighlightBackground': '#2A2D2E50',
        'editorCursor.foreground': '#AEAFAD',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
        'editorIndentGuide.background': '#404040',
      }
    });

    monaco.editor.setTheme(theme === 'dark' ? 'vs-dark-custom' : 'vs');
  }, [theme]);

  // Initialize editor
  useEffect(() => {
    if (editorRef.current) {
      const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
        value,
        language,
        theme: theme === 'dark' ? 'vs-dark-custom' : 'vs',
        minimap: { enabled: true },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        colorDecorators: true,
        fixedOverflowWidgets: true,
        folding: true,
        tabSize: 2,
        fontSize: 14,
        scrollbar: {
          useShadows: false,
          verticalHasArrows: false,
          horizontalHasArrows: false,
          vertical: 'auto',
          horizontal: 'auto',
        },
        ...options,
      };

      // Create editor instance
      const editor = monaco.editor.create(editorRef.current, editorOptions);
      monacoEditorRef.current = editor;

      // Set up change event handler
      const debouncedOnChange = debounce((val: string) => {
        onChange(val);
      }, 300);

      editor.onDidChangeModelContent(() => {
        debouncedOnChange(editor.getValue());
      });

      // Call onMount callback if provided
      if (onMount) {
        onMount(editor);
      }

      // Setup basic HTML intellisense
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

            const htmlTags = [
              'html', 'head', 'title', 'body', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
              'p', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'form', 'input',
              'button', 'select', 'option', 'textarea', 'header', 'footer', 'nav', 'section',
              'article', 'aside', 'main', 'figure', 'figcaption', 'script', 'style', 'link', 'meta'
            ];
            
            const completions = htmlTags.map(tag => ({
              label: tag,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: tag,
              range
            }));

            return { suggestions: completions };
          }
        });
      }

      return () => {
        editor.dispose();
      };
    }
  }, [language, options, theme, onMount]);

  // Update editor value when value prop changes
  useEffect(() => {
    if (monacoEditorRef.current) {
      const currentValue = monacoEditorRef.current.getValue();
      if (value !== currentValue) {
        monacoEditorRef.current.setValue(value);
      }
    }
  }, [value]);

  return <div ref={editorRef} className="h-full w-full" />;
};

export default MonacoEditor;
