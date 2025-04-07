declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module 'monaco-editor' {
  export * from 'monaco-editor/esm/vs/editor/editor.api';
}

declare interface Window {
  monaco: typeof import('monaco-editor');
}
