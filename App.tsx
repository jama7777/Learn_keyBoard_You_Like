import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, RotateCcw, Keyboard, Activity, Brain, Volume2, VolumeX, FileText, AlertCircle, Upload, FileUp, Loader2, History, Trash2, Clock, X, Wand2, Sparkles, Music, Music2, Mic2, Plus, FileAudio } from 'lucide-react';

import { LessonConfig, LessonMode, Stats, Song } from './types';
import { PRESET_LESSONS, CHAR_TO_KEY_MAP, PRESET_SONGS } from './constants';
import { audioService } from './services/audioService';
import { generateLessonContent, processFileContent, fixGrammar, generateSong, extractMelodyFromAudio } from './services/geminiService';
import { generateLessonText } from './services/lessonGenerator';
import { historyService, SearchHistoryItem } from './services/historyService';

import VirtualKeyboard from './components/VirtualKeyboard';
import Hands from './components/Hands';
import TypingArea from './components/TypingArea';

interface Mistake {
  expected: string;
  actual: string;
  index: number;
}

// Utility to ensure text contains only standard keyboard characters
const sanitizeText = (text: string): string => {
  return text
    .replace(/[\u2018\u2019]/g, "'") // Smart quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/[\u2013\u2014]/g, "-") // Dashes
    .replace(/…/g, "...")
    // Convert Tabs to 2 spaces to avoid focus trapping and standardize layout
    .replace(/\t/g, "  ")
    .replace(/\r\n/g, "\n")
    // Normalize space characters
    .replace(/\u00A0/g, " ");
};

const App: React.FC = () => {
  // Application State
  const [currentLesson, setCurrentLesson] = useState<LessonConfig | null>(null);
  const [text, setText] = useState<string>('');
  const [typedHistory, setTypedHistory] = useState<string>(''); // Tracks what user typed
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFileProcessing, setIsFileProcessing] = useState<boolean>(false);
  
  // AI Generator & Cloud State
  const [customTopic, setCustomTopic] = useState<string>('');
  const [customFormat, setCustomFormat] = useState<string>('Paragraph');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Custom Input State
  const [customInputText, setCustomInputText] = useState<string>('');
  const [isAutoFixing, setIsAutoFixing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Music State
  const [showMusicModal, setShowMusicModal] = useState<boolean>(false);
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [songPrompt, setSongPrompt] = useState<string>('');
  const [isGeneratingSong, setIsGeneratingSong] = useState<boolean>(false);
  const [songError, setSongError] = useState<string>('');
  const [backgroundAudioUrl, setBackgroundAudioUrl] = useState<string | null>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);

  // Error Tracking
  const [mistakes, setMistakes] = useState<Mistake[]>([]);

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

  // Derived state for current position
  const currentIndex = typedHistory.length;

  // Initialize Audio Context on first interaction
  useEffect(() => {
    const unlockAudio = () => {
      // Chime or silent play to unlock audio context
      audioService.playStart(); 
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

  // Load Local History on Mount
  useEffect(() => {
    setSearchHistory(historyService.getHistory());
  }, []);

  // Dynamic Auto-Correction Effect
  useEffect(() => {
    if (!customInputText || customInputText.length < 5 || isFileProcessing || isLoading) return;

    const timeoutId = setTimeout(async () => {
      setIsAutoFixing(true);
      try {
        const fixedText = await fixGrammar(customInputText);
        if (fixedText && fixedText.trim() !== customInputText.trim()) {
           setCustomInputText(fixedText);
        }
      } catch (err) {
        console.error("Auto-fix failed", err);
      } finally {
        setIsAutoFixing(false);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [customInputText, isFileProcessing, isLoading]);

  // Timer for WPM
  useEffect(() => {
    if (hasStarted && !isCompleted) {
      intervalRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          const elapsedMin = (Date.now() - startTimeRef.current) / 60000;
          const safeMin = elapsedMin > 0 ? elapsedMin : 0.0001; 
          const wpm = Math.round((typedHistory.length / 5) / safeMin); 
          setStats(prev => ({ ...prev, wpm, timeElapsed: Math.round(elapsedMin * 60) }));
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasStarted, isCompleted, typedHistory]);

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    audioService.setMuted(newState);
    if (backgroundAudioRef.current) {
        backgroundAudioRef.current.muted = newState;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset current text
    setCustomInputText('');
    
    // Check if it is a simple text file that we can read directly
    const simpleTextTypes = ['text/plain', 'text/html', 'text/javascript', 'application/json', 'text/markdown', 'application/x-typescript'];
    const isSimpleText = simpleTextTypes.some(type => file.type.includes(type)) || file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.py');

    if (isSimpleText) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) setCustomInputText(content);
      };
      reader.readAsText(file);
    } else {
      // It's likely an Image or PDF, use Gemini to transcribe
      setIsFileProcessing(true);
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Data = e.target?.result as string;
          if (base64Data) {
             const extractedText = await processFileContent(base64Data, file.type);
             setCustomInputText(extractedText);
          }
          setIsFileProcessing(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error(err);
        setCustomInputText("Error processing file.");
        setIsFileProcessing(false);
      }
    }
  };
  
  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSongError(`Uploading: ${file.name}...`);
    setIsLoading(true);
    
    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Data = e.target?.result as string;
            if (base64Data) {
               // Also set as background audio
               const blob = await (await fetch(base64Data)).blob();
               const url = URL.createObjectURL(blob);
               setBackgroundAudioUrl(url);

               const song = await extractMelodyFromAudio(base64Data, file.type);
               if (song) {
                   setActiveSong(song);
                   setSongError('');
               } else {
                   setSongError('');
                   // If AI fails to extract melody, we still have the background audio ready
                   setActiveSong({ id: `raw_${Date.now()}`, title: file.name, notes: [] }); 
               }
            }
            setIsLoading(false);
        };
        reader.readAsDataURL(file);
    } catch (err) {
        console.error(err);
        setSongError("Error uploading audio.");
        setIsLoading(false);
    }
  };

  const handleSongGeneration = async () => {
      if (!songPrompt.trim()) return;
      setIsGeneratingSong(true);
      setSongError('');
      try {
          const newSong = await generateSong(songPrompt);
          if (newSong) {
              setActiveSong(newSong);
              setShowMusicModal(false);
              setSongPrompt('');
              setSongError('');
          } else {
              setSongError(`Could not generate melody for "${songPrompt}". Try a different song name or vibe.`);
          }
      } catch (err) {
          console.error("Song generation failed", err);
          setSongError('An error occurred. Please try again.');
      } finally {
          setIsGeneratingSong(false);
      }
  };
  const startCustomInput = () => {
    if (!customInputText.trim()) return;
    const lesson: LessonConfig = {
      id: 'custom-input',
      title: 'Custom Text / Code',
      description: 'Your uploaded content',
      mode: LessonMode.AI_CUSTOM
    };
    setText(sanitizeText(customInputText));
    startLesson(lesson, true);
  };

  const handleCreateCustomSession = async () => {
    if (!customTopic.trim() && !songPrompt.trim() && !activeSong) return;
    const topic = customTopic.trim() || 'Interesting facts';
    setIsLoading(true);

    try {
        const generatedText = await generateLessonContent(topic, customFormat);

        if (customTopic) {
             const newItem: SearchHistoryItem = {
                 id: Date.now().toString(),
                 topic: topic,
                 format: customFormat,
                 timestamp: Date.now()
             };
             setSearchHistory(prev => [newItem, ...prev.filter(i => i.topic !== newItem.topic || i.format !== newItem.format)].slice(0,20));
             historyService.addToHistory(topic, customFormat);
        }

        const lesson: LessonConfig = {
            id: 'custom-ai',
            title: customFormat === 'Code (Python)' ? 'Python Drill' : 'AI Session',
            description: topic,
            mode: LessonMode.AI_CUSTOM
        };

        setTypedHistory('');
        setStats({ wpm: 0, accuracy: 100, errors: 0, progress: 0, timeElapsed: 0 });
        setMistakes([]); 
        setHasStarted(false);
        setIsCompleted(false);
        startTimeRef.current = null;
        setCurrentLesson(lesson);
        setText(sanitizeText(generatedText || "Error loading content."));
        setShowMusicModal(false);
    } catch (err) {
        console.error("Session generation failed", err);
    } finally {
        setIsLoading(false);
    }
  };

  const startLesson = async (lesson: LessonConfig, isRetry = false) => {
    setIsLoading(true);
    setTypedHistory('');
    setStats({ wpm: 0, accuracy: 100, errors: 0, progress: 0, timeElapsed: 0 });
    setMistakes([]); 
    setHasStarted(false);
    setIsCompleted(false);
    startTimeRef.current = null;
    setCurrentLesson(lesson);

    let lessonText = '';

    if (lesson.id === 'custom-input' && customInputText) {
        lessonText = customInputText;
    } else if (lesson.mode === LessonMode.AI_CUSTOM) {
      try {
        if (!isRetry || !text) {
             lessonText = await generateLessonContent(customTopic || 'technology', customFormat);
        } else {
             lessonText = text;
        }
      } catch (err) {
        lessonText = "Error loading content. Please try again.";
      }
    } else {
      if (!isRetry && (lesson as any).defaultSongId) {
          const dSong = PRESET_SONGS.find(s => s.id === (lesson as any).defaultSongId);
          if (dSong) setActiveSong(dSong);
      }
      if (isRetry && text) {
          lessonText = text;
      } else {
          lessonText = generateLessonText(lesson.mode);
          if (!lessonText && lesson.content) {
            lessonText = lesson.content;
          }
      }
    }

    setText(sanitizeText(lessonText));
    setIsLoading(false);
  };

  const resetLesson = () => {
    if (currentLesson) {
       startLesson(currentLesson, true);
    }
  };
  
  const newRandomLesson = () => {
      if (currentLesson) {
          if (currentLesson.id === 'custom-input') {
              // Can't generate random for custom input, just reset
              resetLesson();
          } else {
              startLesson(currentLesson, false);
          }
      }
  }

  const handleBackToMenu = () => {
    if (typedHistory.length > 0 && !isCompleted) {
        // If user has started typing but hasn't finished, show summary
        setIsCompleted(true);
    } else {
        // Otherwise (hasn't started typing or just viewing), go back immediately
        setCurrentLesson(null);
    }
  };

  // Helper to use history item
  const useHistoryItem = (item: SearchHistoryItem) => {
    setCustomTopic(item.topic);
    setCustomFormat(item.format);
    setShowHistory(false);
  };

  // Helper to delete history item
  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Optimistic UI update
    setSearchHistory(prev => prev.filter(i => i.id !== id));
    
    const updated = historyService.deleteItem(id);
    setSearchHistory(updated);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!currentLesson || isCompleted || isLoading) return;

    // Ignore modifiers
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta' || e.key === 'CapsLock') return;

    // Prevent default scrolling/tabbing behavior if we are in practice mode
    if (['Tab', ' '].includes(e.key)) {
        e.preventDefault();
    }
    // Prevent Enter from scrolling if applicable (rare but safe)
    if (e.key === 'Enter') e.preventDefault();

    if (!hasStarted) {
      startTimeRef.current = Date.now();
    }

    // Handle Backspace (Allow correction)
    if (e.key === 'Backspace') {
       if (typedHistory.length > 0) {
           setTypedHistory(prev => prev.slice(0, -1));
       }
       return;
    }

    // Handle Typing
    const targetChar = text[currentIndex];
    
    // Check if key matches target
    // Special handling for Enter key vs \n char
    let isCorrect = false;
    let isTypingKey = false;

    if (e.key === 'Enter' && targetChar === '\n') {
        isCorrect = true;
        isTypingKey = true;
    } else if (e.key.length === 1) {
        // Standard char
        isTypingKey = true;
        isCorrect = e.key === targetChar;
    }

    if (isTypingKey) {
      // Update history
      // If it was Enter, we store \n in history to match text
      const charToAdd = (e.key === 'Enter' && targetChar === '\n') ? '\n' : e.key;
      const newHistory = typedHistory + charToAdd;
      setTypedHistory(newHistory);
      
      // Calculate Stats
      const nextIndex = currentIndex + 1;
      const progress = Math.round((nextIndex / text.length) * 100);

      if (activeSong && activeSong.notes.length > 0) {
         const noteIndex = currentIndex % activeSong.notes.length;
         if (isCorrect) {
             // Play start chime on the very first correct note
             if (!hasStarted) {
                 audioService.playStart();
                 setHasStarted(true);
                 if (backgroundAudioUrl && backgroundAudioRef.current) {
                    backgroundAudioRef.current.play().catch(e => console.warn("Audio play blocked", e));
                 }
             }
             audioService.playTone(activeSong.notes[noteIndex]);
         } else {
             audioService.playError();
         }
      } else {
         if (isCorrect) {
             if (!hasStarted) {
                audioService.playStart();
                setHasStarted(true);
                if (backgroundAudioUrl && backgroundAudioRef.current) {
                    backgroundAudioRef.current.play().catch(e => console.warn("Audio play blocked", e));
                 }
             }
             // Clicks removed as requested
         } else {
             audioService.playError();
         }
      }

      if (!isCorrect) {
        // Log mistake
        setMistakes(prev => [...prev, {
            expected: targetChar === ' ' ? 'Space' : targetChar === '\n' ? 'Enter' : targetChar,
            actual: e.key,
            index: currentIndex
        }]);
      }
      
      // Update global stats
      setStats(prev => {
        const newErrors = isCorrect ? prev.errors : prev.errors + 1;
        // Accuracy
        const accuracy = Math.round(((nextIndex - newErrors) / nextIndex) * 100);
        return { ...prev, errors: newErrors, accuracy: Math.max(0, accuracy), progress };
      });

      // Completion Check
      if (nextIndex >= text.length) {
        setIsCompleted(true);
        
        // Stop background audio
        if (backgroundAudioRef.current) {
            backgroundAudioRef.current.pause();
        }

        // Play a simple completion flourish if music mode
        if (activeSong) {
            setTimeout(() => audioService.playTone(523.25), 200); // C5
            setTimeout(() => audioService.playTone(659.25), 400); // E5
            setTimeout(() => audioService.playTone(783.99), 600); // G5
        } else {
            audioService.playClick(); 
        }
      }
    }
  }, [currentLesson, isCompleted, isLoading, text, currentIndex, hasStarted, typedHistory, activeSong]); // removed currentNoteIndex dep

  // Global Key Listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);


  const nextChar = text[currentIndex] || '';
  const activeFinger = CHAR_TO_KEY_MAP[nextChar]?.finger || null;

  // -- RENDER HELPERS --

  const renderMenu = () => (
    <div className="max-w-6xl mx-auto px-4 py-12 relative">
      <div className="absolute top-4 right-4 flex gap-2">
         
         <button 
            onClick={() => setShowMusicModal(true)}
            className={`p-3 bg-slate-800/50 hover:bg-slate-700 rounded-full transition-colors border border-slate-700/50 backdrop-blur-sm shadow-lg group relative ${activeSong ? 'text-pink-400 border-pink-500/50' : 'text-slate-400 hover:text-white'}`}
            title="Music Settings"
         >
             {activeSong ? <Music2 size={20} className="animate-pulse" /> : <Music size={20} className="group-hover:scale-110 transition-transform" />}
             {activeSong && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full"></span>}
         </button>

         <button 
           onClick={toggleMute}
           className="p-3 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors border border-slate-700/50 backdrop-blur-sm shadow-lg group"
           title={isMuted ? "Unmute" : "Mute"}
         >
           {isMuted ? <VolumeX size={20} className="group-hover:scale-110 transition-transform"/> : <Volume2 size={20} className="group-hover:scale-110 transition-transform"/>}
         </button>
      </div>

      <div className="text-center mb-16">
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4 tracking-tight">
          TypeMaster AI
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Elevate your typing speed with intelligent lessons, code practice, and custom texts. 
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRESET_LESSONS.map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => startLesson(lesson, false)}
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
        <div className="group relative p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-indigo-500/30 hover:border-indigo-500 transition-all duration-300 text-left shadow-lg overflow-hidden">
           <div className="absolute top-0 right-0 p-3 flex gap-2">
             <button 
               onClick={() => setShowHistory(!showHistory)} 
               className={`p-1.5 rounded-full hover:bg-slate-700 transition-colors ${showHistory ? 'text-indigo-400 bg-slate-700' : 'text-slate-400'}`}
               title="Search History"
             >
                {showHistory ? <X size={18} /> : <History size={18} />}
             </button>
             <Brain className="text-indigo-400" size={24} />
           </div>
           
           <h3 className="text-xl font-bold text-white mb-2">Custom Session</h3>
           
           {showHistory ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                    <Clock size={14} /> 
                    Recent Searches
                </p>
                <div className="h-40 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                    {searchHistory.length === 0 ? (
                        <p className="text-xs text-slate-500 italic text-center py-4">
                            No history found.
                        </p>
                    ) : (
                        searchHistory.map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => useHistoryItem(item)}
                                className="group/item flex items-center justify-between p-2 rounded bg-slate-950/50 border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-950 cursor-pointer transition-all"
                            >
                                <div className="flex flex-col truncate pr-2">
                                    <span className="text-sm text-slate-200 truncate font-medium">{item.topic}</span>
                                    <span className="text-[10px] text-slate-500 uppercase">{item.format}</span>
                                </div>
                                <button 
                                    onClick={(e) => deleteHistoryItem(e, item.id)}
                                    className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
              </div>
           ) : (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-slate-400 text-sm mb-4">Create your perfect practice session.</p>
                <div className="flex flex-col gap-3">
                    <input 
                        type="text" 
                        placeholder="What to type? (e.g. 'a,s,d,f' or 'Space')" 
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()} 
                    />
                    
                     <div className="flex gap-2">
                        <select 
                            value={customFormat}
                            onChange={(e) => setCustomFormat(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                        >
                            <option value="Paragraph">Text</option>
                            <option value="Code (Python)">Python</option>
                            <option value="Code (JS)">JS</option>
                            <option value="Story">Story</option>
                        </select>
                     </div>
                    
                    <button 
                        onClick={handleCreateCustomSession}
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin"/> : <Wand2 size={16} />}
                        Create Session
                    </button>
                </div>
              </div>
           )}
        </div>

        {/* Upload / Paste Card */}
        <div className="group relative p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-emerald-500/30 hover:border-emerald-500 transition-all duration-300 text-left shadow-lg">
           <div className="absolute top-0 right-0 p-3 flex gap-2">
             {isAutoFixing && (
                <div className="flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full animate-pulse">
                    <Sparkles size={12} /> Auto-fixing
                </div>
             )}
             <FileUp className="text-emerald-400" size={24} />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">Your Content</h3>
           <p className="text-slate-400 text-sm mb-4">Type freely. AI will automatically fix grammar.</p>
           
           <div className="flex flex-col gap-3">
              <input 
                 type="file" 
                 ref={fileInputRef}
                 className="hidden"
                 accept=".txt,.js,.ts,.py,.html,.css,.json,.md,.pdf,.png,.jpg,.jpeg,.webp"
                 onChange={handleFileUpload}
              />
              <div className="relative">
                <textarea 
                   value={customInputText}
                   onChange={(e) => setCustomInputText(e.target.value)}
                   onKeyDown={(e) => e.stopPropagation()}
                   placeholder={isFileProcessing ? "Processing..." : "Type or paste text..."}
                   disabled={isFileProcessing}
                   className="w-full h-16 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 resize-none font-mono disabled:opacity-50 transition-all duration-300"
                   style={{
                       borderColor: isAutoFixing ? '#6366f1' : undefined, // Indigo border when fixing
                       boxShadow: isAutoFixing ? '0 0 10px rgba(99, 102, 241, 0.1)' : undefined
                   }}
                />
                {isFileProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px] rounded-lg">
                     <Loader2 className="animate-spin text-emerald-400" size={24} />
                  </div>
                )}
              </div>
             <div className="flex gap-2">
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 disabled={isFileProcessing}
                 className="px-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                 title="Upload File"
               >
                 <Upload size={14} />
               </button>
               <button 
                 onClick={startCustomInput}
                 disabled={!customInputText.trim() || isFileProcessing}
                 className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-2 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
               >
                 <Play size={14} /> Start
               </button>
             </div>
           </div>
        </div>

      </div>


      {/* Music Settings Modal */}
      {showMusicModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <Music className="text-pink-400" size={24} /> 
                          Melody Typing
                      </h3>
                      <button onClick={() => setShowMusicModal(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                  </div>
                  
                  <p className="text-slate-400 text-sm mb-6">
                      Every correct keystroke plays the next note of the song. Choose a melody or generate one!
                  </p>
                  <div className="max-h-72 overflow-y-auto pr-2 custom-scrollbar mb-6">
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={() => setActiveSong(null)}
                            className={`p-4 rounded-xl border-2 text-left font-bold transition-all flex items-center justify-between ${activeSong === null ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                        >
                            <span className="flex items-center gap-3">
                                {activeSong === null ? <VolumeX className="text-indigo-400" size={20} /> : <Volume2 size={20} />}
                                No Background Melody (Default Clicks)
                            </span>
                            {activeSong === null && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>}
                        </button>
                        {PRESET_SONGS.map(song => (
                            <button 
                                key={song.id}
                                onClick={() => setActiveSong(song)}
                                className={`p-4 rounded-xl border-2 text-left font-bold transition-all flex items-center justify-between ${activeSong?.id === song.id ? 'bg-pink-500/10 border-pink-500 text-pink-200' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-pink-500/50'}`}
                            >
                                <span className="flex items-center gap-3">
                                    <Music2 size={20} className={activeSong?.id === song.id ? "text-pink-400" : "text-slate-500"} />
                                    {song.title}
                                </span>
                                {activeSong?.id === song.id && <div className="w-2.5 h-2.5 bg-pink-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.5)]"></div>}
                            </button>
                        ))}
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-800 pt-5">
                      {/* Active Song Info */}
                      {activeSong && !songError && (
                           <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-slate-800 ring-1 ring-pink-500/20">
                               <div className="flex items-center justify-between mb-3">
                                   <div className="flex items-center gap-2 text-xs text-pink-300 font-extrabold uppercase tracking-widest">
                                       <Music2 size={16} className="text-pink-500" /> Currently Active
                                   </div>
                                    <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-[10px] text-pink-400 font-bold">READY</span>
                               </div>
                               <h4 className="text-lg font-bold text-white mb-1 line-clamp-1">{activeSong.title}</h4>
                               <p className="text-xs text-slate-500 font-mono">
                                   {activeSong.notes.length} notes extracted. Each correct keystroke plays a note from the song.
                               </p>
                           </div>
                       )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );

  const renderPractice = () => (
    <div className="min-h-screen flex flex-col items-center justify-start py-8 px-4 max-w-7xl mx-auto">
      {/* Header / Nav */}
      <div className="w-full flex justify-between items-center mb-8">
        <button 
          onClick={handleBackToMenu}
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
            {activeSong && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-pink-500/10 border border-pink-500/30 rounded-full text-xs text-pink-300 mr-2">
                    <Music2 size={14} /> {activeSong.title}
                </div>
            )}
            <button 
              onClick={toggleMute}
              className="text-slate-400 hover:text-indigo-400 transition-colors p-2 rounded hover:bg-slate-800"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button 
            onClick={resetLesson}
            className="text-slate-400 hover:text-blue-400 transition-colors p-2 rounded hover:bg-slate-800"
            title="Retry Same Text"
            >
            <RotateCcw size={20} />
            </button>
            <button 
            onClick={newRandomLesson}
            className={`text-slate-400 hover:text-green-400 transition-colors p-2 rounded hover:bg-slate-800 ${currentLesson?.id === 'custom-input' ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="New Random Text"
            disabled={currentLesson?.id === 'custom-input'}
            >
            <Brain size={20} />
            </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 animate-pulse">
           <Brain className="text-indigo-500 mb-4" size={48} />
           <p className="text-slate-300">Consulting AI...</p>
        </div>
      ) : (
        <>
          <TypingArea fullText={text} typedHistory={typedHistory} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl mt-4">
             <div className="flex justify-center items-start pt-4">
                {/* errorChar is no longer blocking, passing false to keep standard colors */}
                <VirtualKeyboard nextChar={nextChar} errorChar={false} />
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
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-2xl w-full shadow-2xl transform scale-100 transition-all flex flex-col max-h-[90vh]">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">
                {typedHistory.length === text.length ? "Lesson Complete! 🎉" : "Session Summary"}
              </h2>
              <p className="text-slate-400">{currentLesson?.title}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-1">{stats.wpm}</div>
                <div className="text-xs text-slate-500 uppercase">WPM</div>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">{stats.accuracy}%</div>
                <div className="text-xs text-slate-500 uppercase">Accuracy</div>
              </div>
            </div>

            {/* Error Analysis Section */}
            <div className="flex-1 overflow-y-auto mb-6 bg-slate-950/50 rounded-xl p-4 border border-slate-800">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                 <AlertCircle size={16} /> Mistake Analysis
               </h3>
               {mistakes.length === 0 ? (
                 <div className="text-emerald-400 text-center py-4 font-medium">
                   Perfect! Zero mistakes. You are a machine! 🤖
                   {typedHistory.length !== text.length && <span className="block text-xs text-emerald-600 mt-1">(so far)</span>}
                 </div>
               ) : (
                 <div className="space-y-2">
                   {/* Summary of mistakes */}
                   <div className="text-xs text-slate-500 mb-2">Total Mistakes: {mistakes.length}</div>
                   {mistakes.map((m, idx) => (
                     <div key={idx} className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800 text-sm">
                       <span className="text-slate-400">
                         Char #{m.index + 1}
                       </span>
                       <div className="flex items-center gap-3">
                         <span className="text-emerald-400 font-mono font-bold bg-emerald-900/30 px-2 rounded">
                           Expected: "{m.expected === '\n' ? '↵' : m.expected}"
                         </span>
                         <span className="text-slate-600">&rarr;</span>
                         <span className="text-red-400 font-mono font-bold bg-red-900/30 px-2 rounded">
                           Typed: "{m.actual === 'Enter' ? '↵' : m.actual}"
                         </span>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
              <button 
                onClick={resetLesson}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} /> Retry Same
              </button>
              <button 
                onClick={newRandomLesson}
                className={`flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${currentLesson?.id === 'custom-input' ? 'hidden' : ''}`}
              >
                <Brain size={18} /> New Random
              </button>
              <button 
                onClick={() => setCurrentLesson(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}
      {backgroundAudioUrl && (
        <audio 
          ref={backgroundAudioRef} 
          src={backgroundAudioUrl} 
          loop 
          className="hidden" 
        />
      )}
    </div>
  );

  return currentLesson ? renderPractice() : renderMenu();
};

export default App;