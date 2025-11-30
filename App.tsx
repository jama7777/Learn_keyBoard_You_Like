import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, RotateCcw, Keyboard, Activity, Brain, Volume2 } from 'lucide-react';

import { LessonConfig, LessonMode, Stats } from './types';
import { PRESET_LESSONS, CHAR_TO_KEY_MAP } from './constants';
import { audioService } from './services/audioService';
import { generateLessonContent } from './services/geminiService';
import { generateLessonText } from './services/lessonGenerator';

import VirtualKeyboard from './components/VirtualKeyboard';
import Hands from './components/Hands';
import TypingArea from './components/TypingArea';

const App: React.FC = () => {
  // Application State
  const [currentLesson, setCurrentLesson] = useState<LessonConfig | null>(null);
  const [text, setText] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isError, setIsError] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customTopic, setCustomTopic] = useState<string>('');

  // Stats State
  const [stats, setStats] = useState<Stats>({
    wpm: 0,
    accuracy: 100,
    errors: 0,
    progress: 0,
    timeElapsed: 0
  });

  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Initialize Audio Context on first interaction
  useEffect(() => {
    const unlockAudio = () => {
      // Ensure the audio service is ready
      audioService.playClick(); 
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Timer for WPM
  useEffect(() => {
    if (hasStarted && !isCompleted) {
      intervalRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          const elapsedMin = (Date.now() - startTimeRef.current) / 60000;
          // Avoid division by zero
          const safeMin = elapsedMin > 0 ? elapsedMin : 0.0001; 
          const wpm = Math.round((currentIndex / 5) / safeMin); 
          setStats(prev => ({ ...prev, wpm, timeElapsed: Math.round(elapsedMin * 60) }));
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasStarted, isCompleted, currentIndex]);

  const startLesson = async (lesson: LessonConfig) => {
    setIsLoading(true);
    let lessonText = '';

    // If AI mode, fetch content
    if (lesson.mode === LessonMode.AI_CUSTOM) {
      try {
        lessonText = await generateLessonContent(customTopic || 'technology');
      } catch (err) {
        lessonText = "Error loading content. Please try again.";
      }
    } else {
      // Use local generator for dynamic practice content
      // This ensures every time a lesson is selected, the content is new/randomized
      lessonText = generateLessonText(lesson.mode);
      
      // Fallback to static content if generator fails (rare)
      if (!lessonText && lesson.content) {
        lessonText = lesson.content;
      }
    }

    setText(lessonText);
    setCurrentLesson(lesson);
    setCurrentIndex(0);
    setStats({ wpm: 0, accuracy: 100, errors: 0, progress: 0, timeElapsed: 0 });
    setHasStarted(false);
    setIsCompleted(false);
    setIsError(false);
    startTimeRef.current = null;
    setIsLoading(false);
  };

  const resetLesson = () => {
    // For "Retry", let's keep the same text to allow mastery of that specific sequence.
    if (currentLesson) {
       // Just reset state variables, keep text
       setCurrentIndex(0);
       setStats({ wpm: 0, accuracy: 100, errors: 0, progress: 0, timeElapsed: 0 });
       setHasStarted(false);
       setIsCompleted(false);
       setIsError(false);
       startTimeRef.current = null;
    }
  };
  
  // New function to generate a fresh lesson of the same type
  const newRandomLesson = () => {
      if (currentLesson) {
          startLesson(currentLesson);
      }
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!currentLesson || isCompleted || isLoading) return;

    // Ignore modifiers
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta' || e.key === 'CapsLock') return;

    if (!hasStarted) {
      setHasStarted(true);
      startTimeRef.current = Date.now();
    }

    const targetChar = text[currentIndex];

    // Check if the key pressed matches the target character
    if (e.key === targetChar) {
      // Correct Key
      audioService.playClick();
      setIsError(false);
      
      const nextIndex = currentIndex + 1;
      const progress = Math.round((nextIndex / text.length) * 100);
      
      setCurrentIndex(nextIndex);
      setStats(prev => ({ ...prev, progress }));

      if (nextIndex >= text.length) {
        setIsCompleted(true);
        audioService.playClick(); // Celebration sound
      }
    } else {
      // Wrong Key
      audioService.playError();
      setIsError(true);
      
      setStats(prev => {
        const newErrors = prev.errors + 1;
        const totalAttempts = currentIndex + newErrors;
        const accuracy = totalAttempts > 0 
          ? Math.max(0, Math.round((currentIndex / totalAttempts) * 100))
          : 100;
        return { ...prev, errors: newErrors, accuracy };
      });
      // Do NOT advance currentIndex (Stop on error)
    }
  }, [currentLesson, isCompleted, isLoading, text, currentIndex, hasStarted]);

  // Global Key Listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);


  // Determine current active finger
  const nextChar = text[currentIndex] || '';
  const activeFinger = CHAR_TO_KEY_MAP[nextChar]?.finger || null;

  // -- RENDER HELPERS --

  const renderMenu = () => (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4 tracking-tight">
          TypeMaster AI
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Elevate your typing speed with intelligent, adaptive lessons. 
          Follow the visual guides and master touch typing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRESET_LESSONS.map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => startLesson(lesson)}
            className="group relative p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-blue-500 hover:bg-slate-800/80 transition-all duration-300 text-left shadow-lg hover:shadow-blue-500/10"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Keyboard size={20} className="text-blue-400" />
              {lesson.title}
            </h3>
            <p className="text-slate-400 text-sm">{lesson.description}</p>
          </button>
        ))}

        {/* AI Custom Card */}
        <div className="group relative p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-indigo-500/30 hover:border-indigo-500 transition-all duration-300 text-left shadow-lg col-span-1 md:col-span-2 lg:col-span-1">
           <div className="absolute top-0 right-0 p-3">
             <Brain className="text-indigo-400" size={24} />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">AI Generator</h3>
           <p className="text-slate-400 text-sm mb-4">Generate a unique lesson based on your interests.</p>
           <div className="flex gap-2">
             <input 
               type="text" 
               placeholder="Enter topic (e.g. Space, React, Biology)" 
               className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
               value={customTopic}
               onChange={(e) => setCustomTopic(e.target.value)}
               onKeyDown={(e) => e.stopPropagation()} // Prevent triggering typing logic while typing topic
             />
             <button 
               onClick={() => startLesson({ id: 'custom', title: 'AI Custom', description: 'Generated by Gemini', mode: LessonMode.AI_CUSTOM })}
               className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
             >
               Gen
             </button>
           </div>
        </div>
      </div>
    </div>
  );

  const renderPractice = () => (
    <div className="min-h-screen flex flex-col items-center justify-start py-8 px-4 max-w-7xl mx-auto">
      {/* Header / Nav */}
      <div className="w-full flex justify-between items-center mb-8">
        <button 
          onClick={() => setCurrentLesson(null)}
          className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
        >
          &larr; Back to Menu
        </button>
        <div className="flex items-center gap-6 bg-slate-800/50 px-6 py-2 rounded-full border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-emerald-400" />
            <span className="text-xl font-bold text-white font-mono">{stats.wpm}</span>
            <span className="text-xs text-slate-400 uppercase font-semibold">WPM</span>
          </div>
          <div className="w-px h-6 bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold text-white font-mono">{stats.accuracy}%</div>
            <span className="text-xs text-slate-400 uppercase font-semibold">ACC</span>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
            onClick={resetLesson}
            className="text-slate-400 hover:text-blue-400 transition-colors p-2 rounded hover:bg-slate-800"
            title="Retry Same Text"
            >
            <RotateCcw size={20} />
            </button>
            <button 
            onClick={newRandomLesson}
            className="text-slate-400 hover:text-green-400 transition-colors p-2 rounded hover:bg-slate-800"
            title="New Random Text"
            >
            <Brain size={20} />
            </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 animate-pulse">
           <Brain className="text-indigo-500 mb-4" size={48} />
           <p className="text-slate-300">Generating lesson...</p>
        </div>
      ) : (
        <>
          {/* Main Typing Area */}
          <TypingArea fullText={text} currentIndex={currentIndex} isError={isError} />

          {/* Hands & Keyboard Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl mt-4">
             <div className="flex justify-center items-start pt-4">
                <VirtualKeyboard nextChar={nextChar} errorChar={isError} />
             </div>
             <div className="flex flex-col items-center">
                <h4 className="text-slate-500 text-sm uppercase tracking-widest font-semibold mb-2">Finger Guide</h4>
                <Hands activeFinger={activeFinger} />
             </div>
          </div>
        </>
      )}

      {/* Completion Modal */}
      {isCompleted && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl transform scale-100 transition-all">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Lesson Complete! 🎉</h2>
              <p className="text-slate-400">Great work on {currentLesson?.title}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-1">{stats.wpm}</div>
                <div className="text-xs text-slate-500 uppercase">WPM</div>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">{stats.accuracy}%</div>
                <div className="text-xs text-slate-500 uppercase">Accuracy</div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={resetLesson}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} /> Retry Same Text
              </button>
              <button 
                onClick={newRandomLesson}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Brain size={18} /> New Random Text
              </button>
              <button 
                onClick={() => setCurrentLesson(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        {!currentLesson ? renderMenu() : renderPractice()}
      </div>
    </div>
  );
};

export default App;