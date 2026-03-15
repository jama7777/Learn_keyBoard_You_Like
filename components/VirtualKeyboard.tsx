import React, { useState, useEffect, useRef } from 'react';
import { KEYBOARD_ROWS, FINGER_COLORS, CHAR_TO_KEY_MAP } from '../constants';
import { FingerName } from '../types';

interface VirtualKeyboardProps {
  nextChar: string;
  errorChar: boolean;
}

const FINGER_LIST: FingerName[] = ['L_PINKY', 'L_RING', 'L_MIDDLE', 'L_INDEX', 'L_THUMB', 'R_THUMB', 'R_INDEX', 'R_MIDDLE', 'R_RING', 'R_PINKY'];

const HOME_POSITIONS: Record<FingerName, string> = {
  'L_PINKY': 'KeyA',
  'L_RING': 'KeyS',
  'L_MIDDLE': 'KeyD',
  'L_INDEX': 'KeyF',
  'L_THUMB': 'SpaceLeft',
  'R_PINKY': 'Semicolon',
  'R_RING': 'KeyL',
  'R_MIDDLE': 'KeyK',
  'R_INDEX': 'KeyJ',
  'R_THUMB': 'SpaceRight'
};

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ nextChar, errorChar }) => {
  const targetKeyData = CHAR_TO_KEY_MAP[nextChar] || { code: null, finger: null, shift: false };
  const { code: targetCode, finger: targetFinger, shift: needsShift } = targetKeyData;

  const [keyPositions, setKeyPositions] = useState<Record<string, {x: number, y: number}>>({});
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePositions = () => {
      if (!wrapperRef.current) return;
      
      // Need a small timeout to ensure DOM is fully laid out
      setTimeout(() => {
          if (!wrapperRef.current) return;
          const rectBase = wrapperRef.current.getBoundingClientRect();
          const newPos: Record<string, {x: number, y: number}> = {};
          
          const elements = wrapperRef.current.querySelectorAll('.virtual-key');
          elements.forEach(el => {
             const code = el.getAttribute('data-code');
             if (code) {
                 const rect = el.getBoundingClientRect();
                 let cx = rect.left - rectBase.left + rect.width / 2;
                 let cy = rect.top - rectBase.top + rect.height / 2;
                 
                 // If it's space, make two fake keys for thumbs
                 if (code === 'Space') {
                     newPos['SpaceLeft'] = { x: cx - 60, y: cy };
                     newPos['SpaceRight'] = { x: cx + 60, y: cy };
                     newPos[code] = { x: cx, y: cy };
                 } else if (code === 'ShiftLeft' || code === 'ShiftRight') {
                     // For Shift keys, center the finger slightly more towards the inside
                     newPos[code] = { x: cx + (code === 'ShiftLeft' ? 20 : -20), y: cy };
                 } else {
                     newPos[code] = { x: cx, y: cy };
                 }
             }
          });
          setKeyPositions(newPos);
      }, 50);
    };

    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, []);

  const getKeyStyle = (code: string, finger: FingerName) => {
    const isTarget = code === targetCode;
    const isShift = (code === 'ShiftLeft' || code === 'ShiftRight') && needsShift;
    
    let borderColor = 'border-slate-700';
    let bgColor = 'bg-slate-800';
    let textColor = 'text-slate-400';
    let shadow = 'shadow-sm';

    // Highlight key if it is the target OR if it is Shift and needed
    if (isTarget) {
      // Use the finger color for the border and glow
      const color = FINGER_COLORS[finger];
      return {
        borderColor: color,
        boxShadow: `0 0 15px ${color}`,
        backgroundColor: '#334155', // slate-700
        color: '#fff',
        transform: 'translateY(2px)'
      };
    } else if (isShift) {
        // Only glow the opposite shift key
        const shouldGlowLeftShift = targetFinger && targetFinger.startsWith('R_') && code === 'ShiftLeft';
        const shouldGlowRightShift = targetFinger && targetFinger.startsWith('L_') && code === 'ShiftRight';

        if (shouldGlowLeftShift || shouldGlowRightShift) {
            const shiftFingerName: FingerName = code === 'ShiftLeft' ? 'L_PINKY' : 'R_PINKY';
            const color = FINGER_COLORS[shiftFingerName];
            return {
                borderColor: color,
                boxShadow: `0 0 15px ${color}`,
                backgroundColor: '#334155', // slate-700
                color: '#fff',
                transform: 'translateY(2px)'
            };
        }
    }

    return {};
  };

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-2 p-6 bg-slate-900/50 rounded-xl border border-slate-800 select-none max-w-4xl mx-auto shadow-2xl overflow-hidden">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1.5 relative z-0">
          {row.map((key) => {
            const dynamicStyles = getKeyStyle(key.code, key.finger);
            
            return (
              <div
                key={key.code}
                data-code={key.code}
                className={`virtual-key
                  flex items-center justify-center rounded-lg border-b-4 transition-all duration-100 font-mono text-sm sm:text-base font-bold
                  bg-slate-800 border-slate-700 text-slate-400 z-0
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
      
      {/* Animated Fingers Overlay */}
      {Object.keys(keyPositions).length > 0 && FINGER_LIST.map(fingerName => {
         const isTarget = targetFinger === fingerName;
         
         // If a shift key is needed, we usually use the pinky of the opposite hand of the target key
         // A simplified approach: If left hand typing (target is R_*), Left Pinky hits ShiftLeft.
         // If right hand typing (target is L_*), Right Pinky hits ShiftRight.
         let isShiftFinger = false;
         let shiftCodeToHit = null;
         
         if (needsShift && targetFinger) {
             if (targetFinger.startsWith('R_') && fingerName === 'L_PINKY') {
                 isShiftFinger = true;
                 shiftCodeToHit = 'ShiftLeft';
             } else if (targetFinger.startsWith('L_') && fingerName === 'R_PINKY') {
                 isShiftFinger = true;
                 shiftCodeToHit = 'ShiftRight';
             }
         }

         let posKey = HOME_POSITIONS[fingerName];
         let pressing = false;
         
         if (isTarget && targetCode) {
            posKey = targetCode;
            pressing = true;
         } else if (isShiftFinger && shiftCodeToHit) {
            posKey = shiftCodeToHit;
            pressing = true;
         }

         const pos = keyPositions[posKey];
         if (!pos) return null; // Fallback if layout hasn't measured this key yet

         const color = FINGER_COLORS[fingerName];

         let fHeight = 90;
         if (fingerName.includes('INDEX') || fingerName.includes('RING')) fHeight = 80;
         if (fingerName.includes('PINKY')) fHeight = 65;
         if (fingerName.includes('THUMB')) fHeight = 55;

         return (
             <div 
                 key={fingerName}
                 className="absolute pointer-events-none z-20 flex items-center justify-center"
                 style={{
                     left: pos.x,
                     top: pos.y,
                     width: '40px',
                     height: `${fHeight}px`,
                     transform: `translate(-50%, ${pressing ? '-30%' : '-10%'})`,
                     transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring-like feel 
                     opacity: pressing ? 0.7 : 0.3
                 }}
             >
                <svg width="40" height={fHeight} viewBox={`0 0 40 ${fHeight}`} className="drop-shadow-lg">
                    {/* Finger Shape */}
                    <path 
                        d={`M10,${fHeight} L10,20 Q10,5 20,5 Q30,5 30,20 L30,${fHeight} Z`}
                        fill={color} 
                        opacity="0.8"
                        stroke="#ffffff"
                        strokeWidth="2"
                    />
                    {/* Fingernail/Tip indicator */}
                    <path 
                         d="M15,20 Q20,15 25,20 L25,30 Q20,35 15,30 Z" 
                         fill="#ffffff" 
                         opacity="0.6" 
                    />
                </svg>
             </div>
         );
      })}

    </div>
  );
};

export default VirtualKeyboard;