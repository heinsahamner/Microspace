import React from 'react';
import Markdown from 'react-markdown';
import { Highlight } from './Highlight';

interface RichTextProps {
  text: string;
  className?: string;
  highlightTerm?: string;
}

export const RichTextRenderer: React.FC<RichTextProps> = ({ text, className, highlightTerm }) => {
  if (!text) return null;

  const processChildren = (children: React.ReactNode) => {
      return React.Children.map(children, child => {
          if (typeof child === 'string') {
              return <Highlight text={child} term={highlightTerm} />;
          }
          return child;
      });
  };

  return (
    <div className={`markdown-preview ${className}`}>
        <Markdown
            components={{
                h1: ({node, children, ...props}) => <h1 className="text-xl font-bold mb-2 mt-4 text-gray-900 dark:text-white" {...props}>{processChildren(children)}</h1>,
                h2: ({node, children, ...props}) => <h2 className="text-lg font-bold mb-2 mt-3 text-gray-800 dark:text-gray-100" {...props}>{processChildren(children)}</h2>,
                h3: ({node, children, ...props}) => <h3 className="text-base font-bold mb-1 mt-2 text-gray-800 dark:text-gray-200" {...props}>{processChildren(children)}</h3>,
                p: ({node, children, ...props}) => <p className="mb-2 leading-relaxed" {...props}>{processChildren(children)}</p>,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                li: ({node, children, ...props}) => <li className="pl-1" {...props}>{processChildren(children)}</li>,
                blockquote: ({node, children, ...props}) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 my-2 italic text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-r" {...props}>{processChildren(children)}</blockquote>,
                code: ({node, ...props}) => <code className="bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 text-sm font-mono text-pink-600 dark:text-pink-400" {...props} />,
                pre: ({node, ...props}) => <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto mb-3 text-sm font-mono" {...props} />,
                a: ({node, ...props}) => <a className="text-[#7900c5] hover:underline font-medium break-all" target="_blank" rel="noopener noreferrer" {...props} />,
                hr: ({node, ...props}) => <hr className="my-4 border-gray-200 dark:border-gray-700" {...props} />,
                strong: ({node, children, ...props}) => <strong className="font-bold text-gray-900 dark:text-white" {...props}>{processChildren(children)}</strong>,
            }}
        >
            {text}
        </Markdown>
    </div>
  );
};