import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  FolderTree,
  Folder,
  FileText,
  Search,
  ExternalLink,
} from 'lucide-react';
import { SOURCE_FILES, SourceFile } from '../data/sourceCodeFiles';

interface CodeExplorerProps {
  onSelectFile?: (file: SourceFile) => void;
}

export const CodeExplorer: React.FC<CodeExplorerProps> = () => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>('app/index.tsx');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentFile =
    SOURCE_FILES.find((f) => f.path === selectedFilePath) || SOURCE_FILES[0];

  const filteredFiles = SOURCE_FILES.filter(
    (f) =>
      f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCurrent = () => {
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    const bundle: Record<string, string> = {};
    SOURCE_FILES.forEach((f) => {
      bundle[f.path] = f.code;
    });
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `motiveate-ai-expo-files-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[760px]">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-slate-100 bg-slate-50/70 gap-3">
        <div className="flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">React Native Expo Router Codebase</h3>
            <p className="text-xs text-slate-500">Cross-Platform iOS & Android Native Architecture</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export All Code
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: File Tree */}
        <div className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-slate-200/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredFiles.map((file) => {
              const isSelected = file.path === selectedFilePath;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs truncate font-mono">{file.path}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-slate-200/60 text-[11px] text-slate-500 bg-white">
            <span className="font-semibold text-slate-700">Expo Router 4.0</span> + TypeScript
          </div>
        </div>

        {/* Main: Code Viewer */}
        <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
          {/* File Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-xs font-bold text-white">{currentFile.path}</span>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-300">
                {currentFile.language}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleDownloadCurrent}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Description banner */}
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>{currentFile.description}</span>
          </div>

          {/* Code Body */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200 select-text">
            <pre className="tab-4">
              <code>{currentFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
