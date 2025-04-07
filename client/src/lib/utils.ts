import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileName(fileName: string): string {
  return fileName.split('/').pop() || fileName;
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
}

export function getLanguageFromFileName(fileName: string): string {
  const ext = getFileExtension(fileName).toLowerCase();
  
  switch (ext) {
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'js':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
}

export function getFileIcon(fileName: string): string {
  const ext = getFileExtension(fileName).toLowerCase();
  
  switch (ext) {
    case 'html':
    case 'htm':
      return 'file-text';
    case 'css':
      return 'file-css';
    case 'js':
      return 'file-js';
    case 'ts':
      return 'file-ts';
    case 'json':
      return 'file-json';
    case 'md':
      return 'file-md';
    default:
      return 'file';
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function parseHtml(html: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

export function beautifyHtml(html: string): string {
  const options = { indent_size: 2, space_in_empty_paren: true };
  
  // Simple HTML beautifier
  let formatted = '';
  let indent = 0;
  
  html = html.replace(/>\s*</g, '>\n<')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/\n\s*\n/g, '\n');
  
  const lines = html.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.match(/^<\/[^>]+>$/)) {
      indent--;
    }
    
    formatted += ' '.repeat(indent * 2) + line + '\n';
    
    if (line.match(/^<[^\/]+>$/) && !line.match(/<(img|br|hr|input|link|meta|area|base|col|command|embed|keygen|param|source|track|wbr)/)) {
      indent++;
    }
  }
  
  return formatted.trim();
}

export function generateOutline(html: string): Array<{ tag: string, level: number, expanded: boolean }> {
  const doc = parseHtml(html);
  const outline: Array<{ tag: string, level: number, expanded: boolean }> = [];
  
  function processNode(node: Element, level: number) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      outline.push({
        tag: node.tagName.toLowerCase(),
        level,
        expanded: true
      });
      
      for (let i = 0; i < node.children.length; i++) {
        processNode(node.children[i] as Element, level + 1);
      }
    }
  }
  
  processNode(doc.documentElement, 0);
  return outline;
}
