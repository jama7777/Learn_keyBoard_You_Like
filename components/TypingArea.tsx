import React, { useRef, useEffect } from 'react';

interface TypingAreaProps {
  fullText: string;
  typedHistory: string;
}

const TypingArea: React.FC<TypingAreaProps> = ({ fullText, typedHistory }) => {
  const currentIndex = typedHistory.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);

  // Auto-scroll logic to keep the cursor in view
  useEffect(() => {
    if (activeCharRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeChar = activeCharRef.current;

      // Calculate the offset of the active character relative to the container
      const topOffset = activeChar.offsetTop;
      const containerHeight = container.clientHeight;

      // Attempt to position the active line at roughly 35-40% of the container height
      const targetScrollPosition = topOffset - (containerHeight * 0.35);

      container.scrollTo({
        top: Math.max(0, targetScrollPosition),
        behavior: 'smooth'
      });
    }
  }, [currentIndex]); // Re-run whenever the user types

  return (
    <div className="relative w-full max-w-4xl mx-auto mb-8">
      <div 
        ref={containerRef}
        className="
          bg-slate-800/80 backdrop-blur-md rounded-2xl p-8 shadow-inner border border-slate-700 
          h-64 overflow-hidden relative
          text-3xl font-mono leading-relaxed break-words whitespace-pre-wrap
          transition-all duration-100
        "
      >
        {fullText.split('').map((char, index) => {
          const isTyped = index < typedHistory.length;
          const isCorrect = isTyped && typedHistory[index] === char;
          const isError = isTyped && !isCorrect;
          const isCurrent = index === typedHistory.length;

          let className = "relative inline-block min-w-[0.6em] text-center rounded mx-[1px] transition-colors duration-75 ";
          
          if (isCurrent) {
            // Cursor
            className += "bg-blue-500/50 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] ";
          } else if (isCorrect) {
            // Correct
            className += "text-emerald-400 ";
          } else if (isError) {
            // Error
            className += "text-red-400 "; 
            if (char === ' ') {
               className += "bg-red-500/40 ";
            } else if (char === '\n') {
               className += "bg-red-500/40 min-w-[1em] ";
            } else {
               className += "bg-red-500/10 ";
            }
          } else {
            // Pending
            className += "text-slate-500 opacity-90 ";
          }

          // Special rendering for Newlines to make them visible and targetable
          if (char === '\n') {
            return (
                <span 
                    key={index} 
                    ref={isCurrent ? activeCharRef : null}
                    className={className + " w-full block mb-2"} // Force line break but keep the span for cursor
                    style={{ height: 'auto' }}
                >
                    <span className="opacity-30 text-xs align-middle">↵</span>
                    {/* Blinking Cursor Indicator logic mostly handled by style above, but we need the marker */}
                    {isCurrent && (
                        <span className="inline-block w-[2px] h-6 bg-blue-400 cursor-blink ml-1 align-middle"></span>
                    )}
                </span>
            );
          }

          return (
            <span 
              key={index} 
              ref={isCurrent ? activeCharRef : null}
              className={className}
            >
              {char}
              {/* Blinking Cursor Indicator */}
              {isCurrent && (
                <span className="absolute -left-[2px] top-1 bottom-1 w-[2px] bg-blue-400 cursor-blink"></span>
              )}
            </span>
          );
        })}
      </div>
      
      <div className="absolute -top-3 left-4 px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300 font-semibold uppercase tracking-wider">
        Practice Area
      </div>
    </div>
  );
};

export default TypingArea;