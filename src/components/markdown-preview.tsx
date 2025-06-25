'use client';

import React from 'react';

interface MarkdownPreviewProps {
  content: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  const renderContent = () => {
    // Add a simple rule for bullet points
    return content.split('\n').map((line, index) => {
      // Headings
      if (line.startsWith('# ')) {
        return <h1 key={index} className="font-headline text-4xl font-bold mt-6 mb-4 pb-2 border-b">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="font-headline text-3xl font-bold mt-5 mb-3 pb-2 border-b">{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="font-headline text-2xl font-bold mt-4 mb-2">{line.substring(4)}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={index} className="font-headline text-xl font-bold mt-3 mb-1">{line.substring(5)}</h4>;
      }
       // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return <li key={index} className="mb-1 ml-4 list-disc">{line.trim().substring(2)}</li>;
      }

      // Basic bold and italic using regex
      let processedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>');
      
      if (line.trim() === '') {
        return <div key={index} className="h-4"></div>; // Represent empty line with some space
      }

      return <p key={index} className="mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: processedLine }} />;
    });
  };

  return (
    <div className="prose dark:prose-invert max-w-none font-headline p-8 text-foreground/90">
      {content ? renderContent() : <div className="text-muted-foreground">Preview will appear here.</div>}
    </div>
  );
};

export default MarkdownPreview;
