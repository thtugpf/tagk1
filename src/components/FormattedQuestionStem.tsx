import React from 'react';

/**
 * Renders question stems with exact underlines matching the PDF source document:
 * - Supports explicit `<u>...</u>` tags in the stem string
 * - Supports error-identification markers `word (A)` / `phrase (B)` where the words preceding `(A)`, `(B)`, `(C)`, `(D)` are underlined.
 */
export const FormattedQuestionStem: React.FC<{ text: string }> = ({ text }) => {
  if (!text.includes('<u>')) {
    return <>{text}</>;
  }

  const parts = text.split(/(<u>.*?<\/u>)/g);
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('<u>') && part.endsWith('</u>')) {
          const inner = part.slice(3, -4);
          return (
            <u
              key={idx}
              className="underline decoration-2 underline-offset-4 decoration-slate-900 font-bold"
            >
              {inner}
            </u>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </>
  );
};
