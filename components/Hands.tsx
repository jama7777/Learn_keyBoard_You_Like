import React from 'react';
import { FingerName } from '../types';
import { FINGER_COLORS } from '../constants';

interface HandsProps {
  activeFinger: FingerName | null;
}

const Hands: React.FC<HandsProps> = ({ activeFinger }) => {
  // Helper to determine fill color based on active finger
  const getFill = (fingerName: FingerName) => {
    return activeFinger === fingerName ? FINGER_COLORS[fingerName] : '#334155'; // Active color or Slate 700
  };

  const getOpacity = (fingerName: FingerName) => {
    return activeFinger === fingerName ? 1 : 0.3;
  };

  return (
    <div className="flex justify-center items-center space-x-12 mt-8 opacity-80">
      {/* Left Hand */}
      <svg width="200" height="220" viewBox="0 0 200 220" className="transform scale-90 sm:scale-100">
         {/* L_PINKY */}
        <path d="M20,100 Q15,80 25,60 L35,60 Q45,80 40,100 L40,160 Z" fill={getFill('L_PINKY')} opacity={getOpacity('L_PINKY')} stroke="#94a3b8" strokeWidth="2" />
        <circle cx="30" cy="55" r="8" fill={getFill('L_PINKY')} opacity={activeFinger === 'L_PINKY' ? 0.8 : 0} />
        
        {/* L_RING */}
        <path d="M50,90 Q45,50 60,30 L70,30 Q85,50 80,90 L80,160 Z" fill={getFill('L_RING')} opacity={getOpacity('L_RING')} stroke="#94a3b8" strokeWidth="2" />
        <circle cx="65" cy="25" r="8" fill={getFill('L_RING')} opacity={activeFinger === 'L_RING' ? 0.8 : 0} />

        {/* L_MIDDLE */}
        <path d="M90,85 Q85,20 105,10 L115,10 Q135,20 130,85 L130,160 Z" fill={getFill('L_MIDDLE')} opacity={getOpacity('L_MIDDLE')} stroke="#94a3b8" strokeWidth="2" />
        <circle cx="110" cy="15" r="8" fill={getFill('L_MIDDLE')} opacity={activeFinger === 'L_MIDDLE' ? 0.8 : 0} />

        {/* L_INDEX */}
        <path d="M140,95 Q135,50 150,40 L160,40 Q175,50 170,95 L170,160 Z" fill={getFill('L_INDEX')} opacity={getOpacity('L_INDEX')} stroke="#94a3b8" strokeWidth="2" />
        <circle cx="155" cy="35" r="8" fill={getFill('L_INDEX')} opacity={activeFinger === 'L_INDEX' ? 0.8 : 0} />

        {/* L_THUMB */}
        <path d="M180,150 Q200,130 190,180 L140,210 Z" fill={getFill('L_THUMB')} opacity={getOpacity('L_THUMB')} stroke="#94a3b8" strokeWidth="2" />
        
        {/* Palm Base */}
        <path d="M40,160 L170,160 Q160,210 100,210 Q40,210 40,160 Z" fill="#334155" opacity="0.3" stroke="#94a3b8" strokeWidth="2"/>
        
        {/* Labels */}
        <text x="30" y="240" fill="#94a3b8" fontSize="12" textAnchor="middle">Left</text>
      </svg>

      {/* Right Hand */}
      <svg width="200" height="220" viewBox="0 0 200 220" className="transform scale-90 sm:scale-100">
        {/* R_PINKY */}
        <path d="M180,100 Q185,80 175,60 L165,60 Q155,80 160,100 L160,160 Z" fill={getFill('R_PINKY')} opacity={getOpacity('R_PINKY')} stroke="#94a3b8" strokeWidth="2" />
        <circle cx="170" cy="55" r="8" fill={getFill('R_PINKY')} opacity={activeFinger === 'R_PINKY' ? 0.8 : 0} />

        {/* R_RING */}
        <path d="M150,90 Q155,50 140,30 L130,30 Q115,50 120,90 L120,160 Z" fill={getFill('R_RING')} opacity={getOpacity('R_RING')} stroke="#94a3b8" strokeWidth="2" />
        <circle cx="135" cy="25" r="8" fill={getFill('R_RING')} opacity={activeFinger === 'R_RING' ? 0.8 : 0} />

        {/* R_MIDDLE */}
        <path d="M110,85 Q115,20 95,10 L85,10 Q65,20 70,85 L70,160 Z" fill={getFill('R_MIDDLE')} opacity={getOpacity('R_MIDDLE')} stroke="#94a3b8" strokeWidth="2" />
        <circle cx="90" cy="15" r="8" fill={getFill('R_MIDDLE')} opacity={activeFinger === 'R_MIDDLE' ? 0.8 : 0} />

        {/* R_INDEX */}
        <path d="M60,95 Q65,50 50,40 L40,40 Q25,50 30,95 L30,160 Z" fill={getFill('R_INDEX')} opacity={getOpacity('R_INDEX')} stroke="#94a3b8" strokeWidth="2" />
        <circle cx="45" cy="35" r="8" fill={getFill('R_INDEX')} opacity={activeFinger === 'R_INDEX' ? 0.8 : 0} />

        {/* R_THUMB */}
        <path d="M20,150 Q0,130 10,180 L60,210 Z" fill={getFill('R_THUMB')} opacity={getOpacity('R_THUMB')} stroke="#94a3b8" strokeWidth="2" />

        {/* Palm Base */}
        <path d="M160,160 L30,160 Q40,210 100,210 Q160,210 160,160 Z" fill="#334155" opacity="0.3" stroke="#94a3b8" strokeWidth="2"/>
      </svg>
    </div>
  );
};

export default Hands;