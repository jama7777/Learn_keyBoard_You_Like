import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, RotateCcw, Keyboard, Activity, Brain, Volume2, VolumeX, FileText, AlertCircle, Upload, FileUp, Loader2, History, Trash2, Clock, X, Cloud, CloudLightning, LogOut, CheckCircle2, Wand2, Sparkles, Music, Music2, Mic2, Plus, FileAudio } from 'lucide-react';

import { LessonConfig, LessonMode, Stats, Song } from './types';
import { PRESET_LESSONS, CHAR_TO_KEY_MAP, PRESET_SONGS } from './constants';
import { audioService } from './services/audioService';
import { generateLessonContent, processFileContent, fixGrammar, generateSong, extractMelodyFromAudio } from './services/geminiService';
import { generateLessonText } from './services/lessonGenerator';
import { historyService, SearchHistoryItem } from './services/historyService';
import { cloudService } from './services/cloudService';

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
  const [customMusicVibe, setCustomMusicVibe] = useState<string>(''); // New state for music input
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  
  // Cloud Auth
  const [cloudUser, setCloudUser] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginInput, setLoginInput] = useState<string>('');
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

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
      // Small silent click to unlock audio context
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

  // Load Local History on Mount (if not logged in)
  useEffect(() => {
    if (!cloudUser) {
      setSearchHistory(historyService.getHistory());
    }
  }, [cloudUser]);

  // Dynamic Auto-Correction Effect
  useEffect(() => {
    // Only run if text exists, is substantial, and not currently processing something else
    if (!customInputText || customInputText.length < 5 || isFileProcessing || isLoading) return;

    const timeoutId = setTimeout(async () => {
      setIsAutoFixing(true);
      try {
        const fixedText = await fixGrammar(customInputText);
        // Only update if the text has actually changed (avoids cursor jumps on valid text)
        // We trim to ensure we don't fix just trailing whitespace differences aggressively
        if (fixedText && fixedText.trim() !== customInputText.trim()) {
           setCustomInputText(fixedText);
        }
      } catch (err) {
        console.error("Auto-fix failed", err);
      } finally {
        setIsAutoFixing(false);
      }
    }, 2000); // 2 second pause trigger

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
  };

  const handleCloudLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) return;
    
    setIsCloudLoading(true);
    try {
        const username = loginInput.trim();
        const history = await cloudService.connect(username);
        setCloudUser(username);
        setSearchHistory(history);
        setShowLoginModal(false);
        setLoginInput('');
    } catch (err) {
        console.error("Login failed", err);
    } finally {
        setIsCloudLoading(false);
    }
  };

  const handleCloudLogout = () => {
      setCloudUser(null);
      setSearchHistory(historyService.getHistory()); // Revert to local
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

    setCustomMusicVibe(`Uploading: ${file.name}...`);
    setIsLoading(true);
    
    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Data = e.target?.result as string;
            if (base64Data) {
               // Use a separate helper to not block the text generation
               const song = await extractMelodyFromAudio(base64Data, file.type);
               if (song) {
                   setActiveSong(song);
                   setCustomMusicVibe(song.title);
               } else {
                   setCustomMusicVibe("Failed to process audio.");
               }
            }
            setIsLoading(false);
        };
        reader.readAsDataURL(file);
    } catch (err) {
        console.error(err);
        setCustomMusicVibe("Error uploading audio.");
        setIsLoading(false);
    }
  };

  const handleSongGeneration = async () => {
      if (!songPrompt.trim()) return;
      setIsGeneratingSong(true);
      try {
          const newSong = await generateSong(songPrompt);
          if (newSong) {
              setActiveSong(newSong);
              setShowMusicModal(false);
              setSongPrompt('');
          }
      } catch (err) {
          console.error("Song generation failed", err);
      } finally {
          setIsGeneratingSong(false);
      }
  };

  const startCustomInput = () => {
    if (!customInputText.trim()) return;
    
    // Create a temporary lesson config
    const lesson: LessonConfig = {
      id: 'custom-input',
      title: 'Custom Text / Code',
      description: 'Your uploaded content',
      mode: LessonMode.AI_CUSTOM // Reuse AI mode logic for custom handling
    };

    // Preset the text state so startLesson uses it
    setText(sanitizeText(customInputText));
    startLesson(lesson, true);
  };

  // Unified Handler for creating a session with custom text AND optional music
  const handleCreateCustomSession = async () => {
    if (!customTopic.trim() && !customMusicVibe.trim() && !activeSong) return;

    const topic = customTopic.trim() || 'Interesting facts';
    
    setIsLoading(true);

    try {
        // Parallel generation: Text and Song
        // If user already uploaded a song (activeSong exists) we don't regenerate unless they changed the vibe text
        const shouldGenerateSong = customMusicVibe.trim() && (!activeSong || activeSong.title !== customMusicVibe);
        
        const promises: [Promise<string>, Promise<Song | null>] = [
            generateLessonContent(topic, customFormat),
            shouldGenerateSong ? generateSong(customMusicVibe.trim()) : Promise.resolve(null)
        ];

        const [generatedText, generatedSongResult] = await Promise.all(promises);

        // Update Music
        if (generatedSongResult) {
            setActiveSong(generatedSongResult);
        } else if (!activeSong && customMusicVibe.trim()) {
            // Fallback if song gen fails but was requested
            setActiveSong(PRESET_SONGS[0]); 
        }

        // Save History (Local + Cloud)
        if (customTopic) {
             const newItem: SearchHistoryItem = {
                 id: Date.now().toString(),
                 topic: topic,
                 format: customFormat,
                 timestamp: Date.now()
             };
             
             setSearchHistory(prev => [newItem, ...prev.filter(i => i.topic !== newItem.topic || i.format !== newItem.format)].slice(0,20));

             if (cloudUser) {
                setIsSyncing(true);
                cloudService.uploadItem(cloudUser, newItem).then(() => setIsSyncing(false));
             } else {
                historyService.addToHistory(topic, customFormat);
             }
        }

        // Start Lesson
        const lesson: LessonConfig = {
            id: 'custom-ai',
            title: customFormat === 'Code (Python)' ? 'Python Drill' : 'AI Session',
            description: topic,
            mode: LessonMode.AI_CUSTOM
        };

        // Reset state
        setTypedHistory('');
        setStats({ wpm: 0, accuracy: 100, errors: 0, progress: 0, timeElapsed: 0 });
        setMistakes([]); 
        setHasStarted(false);
        setIsCompleted(false);
        // Do NOT reset song index here conceptually, but since we restart typing, we start from 0 index text.
        startTimeRef.current = null;
        setCurrentLesson(lesson);
        setText(sanitizeText(generatedText || "Error loading content."));

    } catch (err) {
        console.error("Session generation failed", err);
    } finally {
        setIsLoading(false);
    }
  };

  const startLesson = async (lesson: LessonConfig, isRetry = false) => {
    setIsLoading(true);
    // Reset state immediately
    setTypedHistory('');
    setStats({ wpm: 0, accuracy: 100, errors: 0, progress: 0, timeElapsed: 0 });
    setMistakes([]); 
    setHasStarted(false);
    setIsCompleted(false);
    // Song index resets because it's tied to typedHistory.length implicitly now
    startTimeRef.current = null;
    setCurrentLesson(lesson);

    let lessonText = '';

    if (lesson.id === 'custom-input' && customInputText) {
        // Use the text we already set or from the custom input area
        lessonText = customInputText;
    } else if (lesson.mode === LessonMode.AI_CUSTOM) {
      // AI Mode via Quick Start buttons (re-using old logic if needed, but mostly superseded by custom session handler)
       // This branch might be hit if we "retry" an AI lesson
      try {
        if (!isRetry || !text) {
            // If we are here, it's likely a retry or direct call without content
            // We'll just generate text again if needed
             lessonText = await generateLessonContent(customTopic || 'technology', customFormat);
        } else {
             lessonText = text;
        }
      } catch (err) {
        lessonText = "Error loading content. Please try again.";
      }
    } else {
      // Preset Mode
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
    
    if (cloudUser) {
        setIsSyncing(true);
        cloudService.deleteItem(cloudUser, id).then(() => setIsSyncing(false));
    } else {
        const updated = historyService.deleteItem(id);
        setSearchHistory(updated);
    }
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
      setHasStarted(true);
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

      // Play Sound Logic
      // Key Change: Note index is tied to the text index (currentIndex).
      // If correct: Play note at current index.
      // If wrong: Play error (Skip the note that belonged to this index).
      if (activeSong && activeSong.notes.length > 0) {
         const noteIndex = currentIndex % activeSong.notes.length;
         if (isCorrect) {
             audioService.playTone(activeSong.notes[noteIndex]);
         } else {
             // "Skip that sound": We play error instead of the melody note.
             audioService.playError();
         }
      } else {
         // No song active, just click or clack
         if (isCorrect) {
             audioService.playClick();
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
         {cloudUser ? (
             <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-2 rounded-full border border-indigo-500/30">
                 <div className="flex items-center gap-1.5 text-indigo-400">
                    {isSyncing ? <Loader2 size={16} className="animate-spin"/> : <CloudLightning size={16} />}
                    <span className="text-xs font-bold font-mono uppercase tracking-wide">{cloudUser}</span>
                 </div>
                 <div className="w-px h-4 bg-slate-700 mx-1" />
                 <button 
                   onClick={handleCloudLogout}
                   className="text-slate-400 hover:text-red-400 transition-colors"
                   title="Logout"
                 >
                   <LogOut size={16} />
                 </button>
             </div>
         ) : (
            <button 
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors border border-slate-700/50 backdrop-blur-sm text-sm font-medium group"
            >
                <Cloud size={18} className="text-slate-500 group-hover:text-indigo-400 transition-colors"/>
                <span>Cloud Sync</span>
            </button>
         )}
         
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
                    {cloudUser ? <CloudLightning size={14} className="text-indigo-400"/> : <Clock size={14} />} 
                    {cloudUser ? `Cloud History` : `Recent Searches`}
                    {isSyncing && <Loader2 size={12} className="animate-spin text-slate-500 ml-auto"/>}
                </p>
                <div className="h-40 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                    {searchHistory.length === 0 ? (
                        <p className="text-xs text-slate-500 italic text-center py-4">
                            {isCloudLoading ? "Syncing..." : "No history found."}
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
                            className="w-1/3 bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                        >
                            <option value="Paragraph">Text</option>
                            <option value="Code (Python)">Python</option>
                            <option value="Code (JS)">JS</option>
                            <option value="Story">Story</option>
                        </select>
                         <div className="flex-1 relative">
                            <input 
                                type="text" 
                                placeholder="Song Name or Vibe..." 
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 truncate"
                                value={customMusicVibe}
                                onChange={(e) => setCustomMusicVibe(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()} 
                            />
                            <button 
                                onClick={() => audioInputRef.current?.click()}
                                className="absolute right-1 top-1 p-1 hover:text-pink-400 text-slate-500 transition-colors"
                                title="Upload Audio to Extract Melody"
                            >
                                <FileAudio size={14} />
                            </button>
                            <input 
                                type="file" 
                                ref={audioInputRef} 
                                className="hidden" 
                                accept="audio/*"
                                onChange={handleAudioUpload}
                            />
                         </div>
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

      {/* Cloud Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Cloud className="text-indigo-400" size={24} /> 
                    Connect Cloud
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                    Enter a Cloud ID to sync your AI search history across sessions on this device.
                </p>
                
                <form onSubmit={handleCloudLogin} className="flex flex-col gap-3">
                    <input 
                        type="text"
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        placeholder="e.g. user123"
                        autoFocus
                        className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <div className="flex gap-2 justify-end mt-2">
                         <button 
                            type="button" 
                            onClick={() => setShowLoginModal(false)}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isCloudLoading || !loginInput.trim()}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           {isCloudLoading ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>}
                           Connect
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

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

                  <div className="grid grid-cols-2 gap-3 mb-6">
                      <button 
                          onClick={() => setActiveSong(null)}
                          className={`p-3 rounded-lg border text-sm font-medium transition-all ${activeSong === null ? 'bg-slate-700 border-white text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                      >
                          🔇 No Melody (Clicks)
                      </button>
                      {PRESET_SONGS.map(song => (
                          <button 
                              key={song.id}
                              onClick={() => setActiveSong(song)}
                              className={`p-3 rounded-lg border text-sm font-medium transition-all ${activeSong?.id === song.id ? 'bg-pink-500/20 border-pink-500 text-pink-200' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-pink-500/50'}`}
                          >
                              🎵 {song.title}
                          </button>
                      ))}
                  </div>
                  
                  <div className="border-t border-slate-800 pt-5">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wide block mb-2 flex items-center gap-2">
                         <Sparkles size={12} className="text-indigo-400"/> AI Composer
                      </label>
                      <div className="flex gap-2">
                          <input 
                              type="text"
                              value={songPrompt}
                              onChange={(e) => setSongPrompt(e.target.value)}
                              placeholder="e.g. 'A mysterious sad melody' or 'Upbeat 8-bit'"
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                              onKeyDown={(e) => e.key === 'Enter' && handleSongGeneration()}
                          />
                          <button 
                              onClick={handleSongGeneration}
                              disabled={isGeneratingSong || !songPrompt.trim()}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              {isGeneratingSong ? <Loader2 size={16} className="animate-spin"/> : <Wand2 size={16}/>}
                          </button>
                      </div>
                      {activeSong && activeSong.id.startsWith('ai_') && (
                          <div className="mt-3 p-2 bg-indigo-500/10 border border-indigo-500/30 rounded text-xs text-indigo-300 flex items-center gap-2">
                              <Music2 size={14} /> Currently playing generated song: "{activeSong.title}"
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
    </div>
  );
};

export default App;