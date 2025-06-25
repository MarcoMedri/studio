'use client';

import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { Button } from './ui/button';
import type { RefObject } from 'react';

interface MarkdownToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement>;
  content: string;
  onContentChange: (newContent: string) => void;
}

export function MarkdownToolbar({ textareaRef, content, onContentChange }: MarkdownToolbarProps) {
  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    const newContent =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    onContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = end + before.length;
      } else {
        textarea.selectionStart = textarea.selectionEnd = start + before.length;
      }
    }, 0);
  };
  
  const insertList = (type: 'ul' | 'ol') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentLineStart = content.lastIndexOf('\n', start - 1) + 1;
    let prefix = '';

    if (type === 'ul') {
        prefix = '- ';
    } else {
        const linesBefore = content.substring(0, currentLineStart).split('\n');
        const lastLine = linesBefore[linesBefore.length - 1];
        const listMatch = lastLine.match(/^(\d+)\.\s/);
        if(listMatch) {
            prefix = `${parseInt(listMatch[1]) + 1}. `;
        } else {
            prefix = '1. ';
        }
    }
    
    const newContent = content.substring(0, currentLineStart) + prefix + content.substring(currentLineStart);
    onContentChange(newContent);
    
    setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + prefix.length;
    }, 0)
  }

  return (
    <div className="flex items-center gap-1 p-2 border-t bg-muted/50">
      <Button variant="ghost" size="icon" onClick={() => insertText('**', '**')} title="Bold">
        <Bold className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => insertText('*', '*')} title="Italic">
        <Italic className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => insertList('ul')} title="Unordered List">
        <List className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => insertList('ol')} title="Ordered List">
        <ListOrdered className="h-4 w-4" />
      </Button>
    </div>
  );
}
