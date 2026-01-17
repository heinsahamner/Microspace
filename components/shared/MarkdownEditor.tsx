import React, { useState, useRef } from 'react';
import { Icons } from '../Icons';
import { RichTextRenderer } from './RichTextRenderer';

interface MarkdownEditorProps {
    value: string;
    onChange: (val: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
    const [mode, setMode] = useState<'write' | 'preview'>('write');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertAtCursor = (before: string, after: string = '') => {
        if (!textareaRef.current) return;
        
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const currentText = value;
        const selectedText = currentText.substring(start, end);

        let newText = '';
        let newCursorPos = 0;

        if (selectedText.length > 0) {
            newText = currentText.substring(0, start) + before + selectedText + after + currentText.substring(end);
            newCursorPos = end + before.length + after.length;
        } else {
            newText = currentText.substring(0, start) + before + after + currentText.substring(end);
            newCursorPos = start + before.length;
        }

        onChange(newText);
        
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    const insertBlock = (prefix: string) => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        
        const before = value.substring(0, lineStart);
        const after = value.substring(lineStart);
        
        const newText = before + prefix + after;
        onChange(newText);
        
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newPos = start + prefix.length;
                textareaRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900 flex flex-col h-full shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-[#7900c5]/50">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-2 py-2 gap-2 overflow-x-auto no-scrollbar">
                <div className="flex space-x-1 shrink-0">
                    <button type="button" onClick={() => setMode('write')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'write' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                        Escrever
                    </button>
                    <button type="button" onClick={() => setMode('preview')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'preview' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                        Visualizar
                    </button>
                </div>
                
                {mode === 'write' && (
                    <div className="flex space-x-1 border-l border-gray-200 dark:border-gray-700 pl-2 shrink-0">
                        <button type="button" onClick={() => insertBlock('# ')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Título H1">
                            <Icons.Heading className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => insertAtCursor('**', '**')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Negrito">
                            <Icons.Bold className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => insertAtCursor('*', '*')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Itálico">
                            <Icons.Italic className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 self-center mx-1"></div>
                        <button type="button" onClick={() => insertBlock('- ')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Lista">
                            <Icons.List className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => insertBlock('1. ')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Lista Numerada">
                            <Icons.ListOrdered className="w-4 h-4" />
                        </button>
                         <button type="button" onClick={() => insertBlock('> ')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Citação">
                            <Icons.Quote className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 self-center mx-1"></div>
                        <button type="button" onClick={() => insertAtCursor('`', '`')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Código">
                            <Icons.Code className="w-4 h-4" />
                        </button>
                         <button type="button" onClick={() => insertAtCursor('[', '](url)')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Link">
                            <Icons.Link className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => insertBlock('---\n')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Divisória">
                            <Icons.Minus className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 relative min-h-[300px] bg-white dark:bg-gray-900">
                {mode === 'write' ? (
                    <textarea 
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-full p-4 bg-transparent border-none focus:ring-0 resize-none font-mono text-sm text-gray-800 dark:text-gray-200 leading-relaxed outline-none"
                        placeholder="# Título do Resumo&#10;&#10;Escreva aqui seu conteúdo...&#10;- Suporta listas&#10;- **Negrito** e *Itálico*&#10;- [Links](https://...)"
                    />
                ) : (
                    <div className="w-full h-full p-4 overflow-y-auto">
                        {value ? <RichTextRenderer text={value} /> : <div className="h-full flex flex-col items-center justify-center text-gray-400 italic space-y-2"><Icons.FileText className="w-8 h-8 opacity-50" /><span>Nada para visualizar.</span></div>}
                    </div>
                )}
            </div>
        </div>
    );
};