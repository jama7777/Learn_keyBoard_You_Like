import React from 'react';

interface TypingAreaProps {
  fullText: string;
  currentIndex: number;
  isError: boolean;
}

const TypingArea: React.FC<TypingAreaProps> = ({ fullText, currentIndex, isError }) => {
  const completedText = fullText.slice(0, currentIndex);
  const currentChar = fullText[currentIndex];
  const remainingText = fullText.slice(currentIndex + 1);

  return (
    <div className="relative w-full max-w-4xl mx-auto mb-8">
      <div className={`
        bg-slate-800/80 backdrop-blur-md rounded-2xl p-8 shadow-inner border border-slate-700 min-h-[160px] 
        flex flex-wrap items-center content-center text-3xl font-mono leading-relaxed break-words whitespace-pre-wrap
        transition-all duration-100
        ${isError ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : ''}
      `}>
        {/* Completed Text */}
        <span className="text-slate-500 transition-colors duration-200">
          {completedText}
        </span>

        {/* Current Character (Cursor) */}
        {currentChar && (
          <span
            className={`
              relative inline-block min-w-[0.6em] text-center rounded mx-[1px]
              ${isError ? 'bg-red-500 text-white animate-shake' : 'bg-blue-500/50 text-white'}
              transition-all duration-100
            `}
          >
            {currentChar}
            {/* Blinking Caret Indicator - hide during error shake for clarity */}
            {!isError && (
              <span className="absolute -left-[2px] top-1 bottom-1 w-[2px] bg-blue-400 cursor-blink"></span>
            )}
          </span>
        )}

        {/* Remaining Text */}
        <span className="text-slate-600 opacity-60">
          {remainingText}
        </span>
      </div>
      
      <div className="absolute -top-3 left-4 px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300 font-semibold uppercase tracking-wider">
        Practice Area
      </div>
    </div>
  );
};

export default TypingArea;