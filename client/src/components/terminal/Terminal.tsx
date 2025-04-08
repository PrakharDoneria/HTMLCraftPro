import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, X, TerminalSquare, RefreshCw, ChevronDown, Clipboard, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TerminalProps {
  className?: string;
  visible: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isMaximized: boolean;
}

type CommandHistory = {
  command: string;
  output: string;
  isError?: boolean;
};

const Terminal: React.FC<TerminalProps> = ({
  className = '',
  visible,
  onClose,
  onMinimize,
  onMaximize,
  isMaximized,
}) => {
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([
    { 
      command: '', 
      output: 'Windows Terminal v1.0.0\nHTML Editor Terminal - This is a simulated terminal environment.\nType "help" for available commands.\n' 
    }
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [historyCursor, setHistoryCursor] = useState(-1);
  const [commandsHistory, setCommandsHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when terminal is opened
  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  // Auto-scroll to bottom when command history changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);

  // Reset copy state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const handleCommand = () => {
    if (!currentCommand.trim()) return;

    // Add to commands history for up/down navigation
    setCommandsHistory(prev => [currentCommand, ...prev]);
    setHistoryCursor(-1);

    // Process command
    const newEntry: CommandHistory = {
      command: currentCommand,
      output: processCommand(currentCommand),
    };

    setCommandHistory(prev => [...prev, newEntry]);
    setCurrentCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand();
    } else if (e.key === 'ArrowUp') {
      // Navigate command history (up)
      e.preventDefault();
      if (commandsHistory.length > 0) {
        const newCursor = Math.min(historyCursor + 1, commandsHistory.length - 1);
        setHistoryCursor(newCursor);
        setCurrentCommand(commandsHistory[newCursor]);
      }
    } else if (e.key === 'ArrowDown') {
      // Navigate command history (down)
      e.preventDefault();
      if (historyCursor > 0) {
        const newCursor = historyCursor - 1;
        setHistoryCursor(newCursor);
        setCurrentCommand(commandsHistory[newCursor]);
      } else if (historyCursor === 0) {
        setHistoryCursor(-1);
        setCurrentCommand('');
      }
    } else if (e.key === 'Tab') {
      // Simple tab completion
      e.preventDefault();
      const suggestions = getCommandSuggestions(currentCommand);
      if (suggestions.length === 1) {
        setCurrentCommand(suggestions[0]);
      } else if (suggestions.length > 1) {
        // Show multiple suggestions in output
        const newEntry: CommandHistory = {
          command: currentCommand,
          output: `Suggestions: ${suggestions.join(', ')}`,
        };
        setCommandHistory(prev => [...prev, newEntry]);
      }
    }
  };

  const clearTerminal = () => {
    setCommandHistory([{ 
      command: '', 
      output: 'Terminal cleared.\n' 
    }]);
  };

  const copyToClipboard = () => {
    const text = commandHistory
      .map(entry => {
        if (!entry.command && entry.output) {
          return entry.output;
        }
        return entry.command ? `$ ${entry.command}\n${entry.output}` : '';
      })
      .join('\n');
    
    navigator.clipboard.writeText(text);
    setCopied(true);
  };

  // Simple command processor for simulated terminal
  const processCommand = (cmd: string): string => {
    const lowerCmd = cmd.toLowerCase().trim();
    const parts = lowerCmd.split(' ');
    const mainCommand = parts[0];
    
    switch (mainCommand) {
      case 'help':
        return `
Available commands:
  - help           Show this help message
  - clear          Clear terminal
  - echo [text]    Display text
  - date           Show current date and time
  - ls             List files (simulated)
  - cd [dir]       Change directory (simulated)
  - mkdir [dir]    Create directory (simulated)
  - html [args]    HTML utilities
  - version        Show terminal version
`;
      
      case 'clear':
        // We'll handle this separately to completely clear the history
        setTimeout(clearTerminal, 0);
        return 'Clearing terminal...';
        
      case 'echo':
        return parts.slice(1).join(' ');
        
      case 'date':
        return new Date().toString();
        
      case 'ls':
        return `
index.html
styles.css
script.js
images/
  logo.png
  banner.jpg
assets/
  fonts/
    roboto.woff
    opensans.woff
`;
      
      case 'cd':
        if (parts.length === 1) {
          return 'Current directory: /project';
        }
        return `Changed directory to: ${parts[1]}`;
        
      case 'mkdir':
        if (parts.length === 1) {
          return 'Error: Directory name required';
        }
        return `Created directory: ${parts[1]}`;
        
      case 'html':
        if (parts.length === 1) {
          return 'HTML utility - usage: html [validate|format|template]';
        }
        
        switch (parts[1]) {
          case 'validate':
            return 'HTML validation tool (simulated): No errors found';
          case 'format':
            return 'HTML formatter (simulated): Document formatted successfully';
          case 'template':
            return `
Created HTML template:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  
</body>
</html>
`;
          default:
            return `Unknown HTML command: ${parts[1]}`;
        }
        
      case 'version':
        return 'HTML Editor Terminal v1.0.0 (Windows)';
        
      default:
        return `Command not found: ${mainCommand}. Type 'help' for available commands.`;
    }
  };

  // Simple command suggestions for tab completion
  const getCommandSuggestions = (prefix: string): string[] => {
    const availableCommands = [
      'help', 'clear', 'echo', 'date', 'ls', 'cd', 'mkdir', 
      'html validate', 'html format', 'html template', 'version'
    ];
    
    return availableCommands.filter(cmd => cmd.startsWith(prefix));
  };

  if (!visible) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-[#474747] text-[#cccccc] z-50 transition-all duration-200",
        isMaximized ? "top-0" : "h-64",
        className
      )}
    >
      <div className="flex items-center justify-between bg-[#252526] px-3 py-1.5 border-b border-[#474747]">
        <div className="flex items-center space-x-2">
          <TerminalSquare className="h-4 w-4 text-[#75beff]" />
          <span className="text-xs font-semibold">TERMINAL</span>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            className="p-1 text-[#cccccc] hover:bg-[#2a2d2e] rounded"
            onClick={clearTerminal}
            title="Clear Terminal"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button 
            className="p-1 text-[#cccccc] hover:bg-[#2a2d2e] rounded"
            onClick={copyToClipboard}
            title="Copy Terminal Content"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Clipboard className="h-3.5 w-3.5" />}
          </button>
          <button 
            className="p-1 text-[#cccccc] hover:bg-[#2a2d2e] rounded"
            onClick={onMinimize}
            title="Minimize Terminal"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button 
            className="p-1 text-[#cccccc] hover:bg-[#2a2d2e] rounded"
            onClick={onMaximize}
            title={isMaximized ? "Restore Terminal" : "Maximize Terminal"}
          >
            {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button 
            className="p-1 text-[#cccccc] hover:bg-[#2a2d2e] rounded"
            onClick={onClose}
            title="Close Terminal"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      <div 
        className="font-mono text-xs p-2 overflow-auto h-[calc(100%-32px)]"
        ref={terminalRef}
      >
        {commandHistory.map((entry, index) => (
          <div key={index} className="mb-1">
            {entry.command && (
              <div className="flex items-start">
                <span className="text-[#75beff] mr-1">$</span>
                <span>{entry.command}</span>
              </div>
            )}
            <div className={cn("ml-2 whitespace-pre-wrap", entry.isError ? "text-[#f14c4c]" : "text-[#cccccc]")}>
              {entry.output}
            </div>
          </div>
        ))}
        
        <div className="flex items-center mt-1">
          <span className="text-[#75beff] mr-1">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none outline-none flex-1 text-[#cccccc] font-mono text-xs"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};

export default Terminal;