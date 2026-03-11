import React from 'react';
import { KEYBOARD_ROWS, FINGER_COLORS, CHAR_TO_KEY_MAP } from '../constants';
import { FingerName } from '../types';

interface VirtualKeyboardProps {
  nextChar: string;
  errorChar: boolean;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ nextChar, errorChar }) => {
  const targetKeyData = CHAR_TO_KEY_MAP[nextChar] || { code: null, finger: null, shift: false };
  const { code: targetCode, finger: targetFinger, shift: needsShift } = targetKeyData;

  const getKeyStyle = (code: string, finger: FingerName) => {
    const isTarget = code === targetCode;
    const isShift = (code === 'ShiftLeft' || code === 'ShiftRight') && needsShift;
    
    let borderColor = 'border-slate-700';
    let bgColor = 'bg-slate-800';
    let textColor = 'text-slate-400';
    let shadow = 'shadow-sm';

    // Highlight key if it is the target OR if it is Shift and needed
    if (isTarget || isShift) {
      // Use the finger color for the border and glow
      const color = FINGER_COLORS[finger];
      borderColor = `border-[${color}]`;
      bgColor = 'bg-slate-700';
      textColor = 'text-white';
      shadow = `shadow-[0_0_15px_${color}]`;
      
      // Inline style override because Tailwind arbitrary values with dynamic vars can be tricky in some compilers
      return {
        borderColor: color,
        boxShadow: `0 0 15px ${color}`,
        backgroundColor: '#334155', // slate-700
        color: '#fff',
        transform: 'translateY(2px)'
      };
    }

    return {};
  };

  return (
    <div className="flex flex-col gap-2 p-6 bg-slate-900/50 rounded-xl border border-slate-800 select-none max-w-4xl mx-auto shadow-2xl">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1.5">
          {row.map((key) => {
            const dynamicStyles = getKeyStyle(key.code, key.finger);
            
            return (
              <div
                key={key.code}
                className={`
                  flex items-center justify-center rounded-lg border-b-4 transition-all duration-100 font-mono text-sm sm:text-base font-bold
                  bg-slate-800 border-slate-700 text-slate-400
                `}
                style={{
                  width: `${key.width ? key.width * 3 : 3}rem`, // Base width multiplier
                  height: '3rem',
                  ...dynamicStyles
                }}
              >
                {key.label}
              </div>
            );
          })}
        </div>
      ))}
      
      {/* Visual Hint Text */}
      <div className="text-center mt-2 h-6 text-sm font-medium text-slate-400">
        {targetFinger ? (
          <span style={{ color: FINGER_COLORS[targetFinger] }}>
            Use {targetFinger.replace('_', ' ')} {needsShift ? '+ SHIFT' : ''}
          </span>
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
    </div>
  );
};

export default VirtualKeyboard;