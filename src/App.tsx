import { useState, useEffect, useRef, ChangeEvent, MouseEvent, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, Camera, ArrowLeft, Play, Pause, Square, 
  Volume2, Upload, Sparkles, Check, CheckSquare, 
  HelpCircle, Loader2, FileText, AlertCircle, RefreshCw, ScanLine,
  ChevronDown, ChevronUp, ExternalLink, Info, ShieldAlert,
  History, Trash2, Clock, ChevronRight,
  User, UserPlus, LogOut, Key, Lock, UserCheck, Users, PlusCircle
} from "lucide-react";
import { SummaryResult, ActiveScreen, HistoryItem, UserAccount } from "./types";
// @ts-ignore
import youtenKunIcon from "./assets/images/youten_kun_icon_1782799107231.jpg";

export default function App() {
  const [screen, setScreen] = useState<ActiveScreen>("home");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isIframe, setIsIframe] = useState<boolean>(false);
  
  // Detect if running inside iframe for microphone permissions safely
  useEffect(() => {
    try {
      setIsIframe(window.self !== window.top);
    } catch (e) {
      // In cross-origin iframe environments, accessing window.top throws a SecurityError
      setIsIframe(true);
    }
  }, []);

  // Accounts & Login state
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [loginTab, setLoginTab] = useState<"login" | "register">("login");
  const [loginId, setLoginId] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [registerId, setRegisterId] = useState<string>("");
  const [registerName, setRegisterName] = useState<string>("");
  const [registerPassword, setRegisterPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessMsg, setLoginSuccessMsg] = useState<string | null>(null);

  // User filter on History screen ("mine" = ログイン中のユーザーのみ, "all_users" = 全員)
  const [userHistoryScope, setUserHistoryScope] = useState<"mine" | "all_users">("mine");
  
  // Speech synthesis states
  const [speechSpeed, setSpeechSpeed] = useState<number>(0.75); // Slower default for better accessibility
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [spokenText, setSpokenText] = useState<string>("");

  // Result state
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [checkedPoints, setCheckedPoints] = useState<Record<number, boolean>>({});

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState<"all" | "conversation" | "scanner">("all");

  // Load accounts, current user, and history from localStorage on initial render
  useEffect(() => {
    try {
      // Load accounts
      const savedAccounts = localStorage.getItem("youtenkun_accounts");
      let accountList: UserAccount[] = [];
      if (savedAccounts) {
        accountList = JSON.parse(savedAccounts);
      } else {
        // Seed default sample accounts for easy testing and family members
        accountList = [
          { id: "taro", name: "たろう (おとうさん)", password: "123", createdAt: Date.now() },
          { id: "hanako", name: "はなこ (おかあさん)", password: "123", createdAt: Date.now() },
          { id: "grandma", name: "おばあちゃん", password: "123", createdAt: Date.now() },
        ];
        localStorage.setItem("youtenkun_accounts", JSON.stringify(accountList));
      }
      setAccounts(accountList);

      // Load current user
      const savedUser = localStorage.getItem("youtenkun_current_user");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      } else if (accountList.length > 0) {
        setCurrentUser(accountList[0]);
        localStorage.setItem("youtenkun_current_user", JSON.stringify(accountList[0]));
      }

      // Load history
      const savedHistory = localStorage.getItem("youtenkun_history");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load accounts/history from localStorage:", e);
    }
  }, []);


  // Format date helper in Japanese
  const formatJapaneseDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}年${month}月${date}日 ${hours}:${minutes}`;
  };

  // Save item to history
  const saveToHistory = (res: SummaryResult, type: "conversation" | "scanner") => {
    const newItem: HistoryItem = {
      id: "hist_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      userId: currentUser ? currentUser.id : "guest",
      timestamp: Date.now(),
      formattedDate: formatJapaneseDate(Date.now()),
      type,
      result: res,
    };
    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, 100); // keep up to 100 items
      try {
        localStorage.setItem("youtenkun_history", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save history to localStorage:", e);
      }
      return updated;
    });
  };

  // Auth Handler Functions
  const handleLogin = (e?: FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    if (!loginId.trim() || !loginPassword.trim()) {
      setLoginError("IDと パスワードを 入力してください。");
      return;
    }
    const found = accounts.find(
      a => a.id.toLowerCase() === loginId.trim().toLowerCase() && a.password === loginPassword.trim()
    );
    if (!found) {
      setLoginError("ID または パスワードが ちがいます。");
      return;
    }
    setCurrentUser(found);
    localStorage.setItem("youtenkun_current_user", JSON.stringify(found));
    setLoginSuccessMsg(`「${found.name}」さんとして ログインしました！`);
    setLoginId("");
    setLoginPassword("");
    setTimeout(() => {
      setLoginSuccessMsg(null);
      setScreen("home");
    }, 1200);
  };

  const handleQuickLogin = (acc: UserAccount) => {
    setCurrentUser(acc);
    localStorage.setItem("youtenkun_current_user", JSON.stringify(acc));
    setLoginSuccessMsg(`「${acc.name}」さんに きりかえました！`);
    setTimeout(() => {
      setLoginSuccessMsg(null);
      setScreen("home");
    }, 1000);
  };

  const handleRegister = (e?: FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    if (!registerId.trim() || !registerName.trim() || !registerPassword.trim()) {
      setLoginError("すべての項目（お名前、ID、パスワード）を 入力してください。");
      return;
    }
    const cleanId = registerId.trim().toLowerCase();
    if (accounts.some(a => a.id.toLowerCase() === cleanId)) {
      setLoginError("このIDは すでに使われています。別のIDにしてください。");
      return;
    }
    const newAcc: UserAccount = {
      id: cleanId,
      name: registerName.trim(),
      password: registerPassword.trim(),
      createdAt: Date.now(),
    };
    const updated = [...accounts, newAcc];
    setAccounts(updated);
    localStorage.setItem("youtenkun_accounts", JSON.stringify(updated));
    setCurrentUser(newAcc);
    localStorage.setItem("youtenkun_current_user", JSON.stringify(newAcc));
    setLoginSuccessMsg(`新しいID（${newAcc.name}）を 作成してログインしました！`);
    setRegisterId("");
    setRegisterName("");
    setRegisterPassword("");
    setTimeout(() => {
      setLoginSuccessMsg(null);
      setScreen("home");
    }, 1200);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("youtenkun_current_user");
    setLoginSuccessMsg("ログアウトしました。");
    setTimeout(() => {
      setLoginSuccessMsg(null);
      setScreen("login");
    }, 800);
  };


  const handleDeleteHistoryItem = (id: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm("この履歴（りれき）を消してもよろしいですか？")) {
      setHistory(prev => {
        const updated = prev.filter(item => item.id !== id);
        try {
          localStorage.setItem("youtenkun_history", JSON.stringify(updated));
        } catch (err) {
          console.error("Failed to update history in localStorage", err);
        }
        return updated;
      });
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm("すべての履歴（りれき）を消してもよろしいですか？")) {
      setHistory([]);
      try {
        localStorage.removeItem("youtenkun_history");
      } catch (e) {
        console.error("Failed to clear history from localStorage", e);
      }
    }
  };

  const handleViewHistoryItem = (item: HistoryItem) => {
    setResult(item.result);
    setCheckedPoints({});
    if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setTimeout(() => {
      handlePlayVoice(item.result.spokenSummary);
    }, 400);
  };

  // Help Modal
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // --- Speech Recognition (Conversation Screen) ---
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [diagStep, setDiagStep] = useState<number>(0); // 0 = start, 1 = iframe, 2 = permission, 3 = browser, 4 = complete
  const recognitionRef = useRef<any>(null);

  // --- Camera Scanner Screen ---
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // base64 jpeg
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop speech when screen changes or on unmount
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }, [screen]);

  // Loading messages rotation
  useEffect(() => {
    if (!loading) return;
    
    const messages = [
      "じっくり 読（よ）みこんでいます。すこし お待ちくださいね...",
      "むずかしい 言葉（ことば）を さがしています...",
      "わかりやすい 言葉に おきかえています...",
      "もうすぐ じゅんびが できます！",
    ];
    
    setLoadingMessage(messages[0]);
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingMessage(messages[index]);
    }, 3500);

    return () => clearInterval(interval);
  }, [loading]);

  // Handle SpeechSynthesis
  const handlePlayVoice = (textToSpeak: string) => {
    if (!textToSpeak) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !window.speechSynthesis) {
      console.warn("SpeechSynthesis is not supported in this browser environment.");
      return;
    }
    
    // If paused, resume
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsSpeaking(true);
      setIsPaused(false);
      return;
    }

    // Stop current
    window.speechSynthesis.cancel();
    setSpokenText(textToSpeak);

    // Filter or clean text slightly for TTS reading (e.g. remove markdown)
    const cleanText = textToSpeak.replace(/[*#`\-]/g, " ");

    if (typeof SpeechSynthesisUtterance === "undefined") {
      console.warn("SpeechSynthesisUtterance is not supported in this browser environment.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ja-JP";
    utterance.rate = speechSpeed;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.error("SpeechSynthesis error:", e);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const handlePauseVoice = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
    setIsSpeaking(false);
    setIsPaused(true);
  };

  const handleStopVoice = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  };

  // Adjust speed during live speech (needs recreation of utterance)
  const changeSpeed = (newSpeed: number) => {
    setSpeechSpeed(newSpeed);
    if (isSpeaking && spokenText) {
      // Re-speak with new speed
      setTimeout(() => {
        handlePlayVoice(spokenText);
      }, 50);
    }
  };

  // --- Web Speech API (Microphone) ---
  const startRecording = () => {
    setError(null);
    setInterimTranscript("");
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("お使いのブラウザは音声入力に対応していません。下の文字入力から直接入力してください。");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "ja-JP";

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        let interimText = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }
        
        setInterimTranscript(interimText);
        
        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript + " ");
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error event:", e.error, e);
        const errType = e.error;
        
        // "aborted" is standard when stop() is called, so we ignore it
        if (errType === "aborted") {
          return;
        }

        if (errType === "not-allowed" || errType === "permission-denied") {
          setError("マイクの使用が許可されていません。ブラウザのアドレスバーにある鍵マーク（設定）からマイクの使用を「許可」にしてください。");
        } else if (errType === "no-speech") {
          setError("しばらくお話がなかったため、マイクを止めました。「マイクで声をきく」ボタンをもう一度おして話しかけてください。");
        } else if (errType === "audio-capture") {
          setError("マイク（音声入力装置）が見つかりません。マイクが正しく接続されているか確認してください。");
        } else if (errType === "network") {
          setError("インターネットとの接続エラーがおきました。インターネットがつながっているか確認してください。");
        } else if (errType === "service-not-allowed") {
          setError("音声認識サービスが利用できません。別のブラウザ（Google Chromeなど）をお試しいただくか、文字入力欄をご利用ください。");
        } else {
          setError(`マイクの準備中にエラーがおきました（${errType || "原因不明"}）。文字入力欄に直接入力することもできます。`);
        }
        
        setIsRecording(false);
        setInterimTranscript("");
      };

      rec.onend = () => {
        setIsRecording(false);
        setInterimTranscript("");
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
      setError("マイクを起動できませんでした。");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setInterimTranscript("");
  };

  const clearTranscript = () => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  };

  // --- Camera / Document Capture ---
  const startCamera = async () => {
    setError(null);
    setCapturedImage(null);
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("このブラウザ環境ではカメラ機能がサポートされていません。");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Camera access notice:", err?.message || err);
      setIsCameraActive(false);
      const errStr = String(err?.message || err).toLowerCase();
      const isPermissionDenied = err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError" || errStr.includes("permission denied") || errStr.includes("not allowed");
      if (isPermissionDenied) {
        setError("カメラの使用許可が確認できないか、ブラウザのセキュリティ制限でカメラが起動できませんでした。下の「写真・画像ファイルを選んでつかう」ボタンからアルバムの画像を選択してください。");
      } else {
        setError("カメラを起動できませんでした。画像・写真ファイルをえらんでアップロードしてください。");
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setCapturedImage(dataUrl);
        stopCamera();
      }
    } catch (err) {
      console.error("Capture photo error:", err);
      setError("写真を撮ることができませんでした。");
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCapturedImage(reader.result);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  // --- API Calls ---
  const handleSummarizeText = async (textToSummarize: string, type: "general" | "conversation") => {
    if (!textToSummarize.trim()) {
      setError("要約する文章が入力されていません。");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setCheckedPoints({});

    try {
      const response = await fetch("/api/summarize-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSummarize, type }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "サーバーエラーがおきました。");
      }

      const data: SummaryResult = await response.json();
      setResult(data);
      saveToHistory(data, "conversation");
      // Auto play speech synthesis once results are loaded!
      setTimeout(() => {
        handlePlayVoice(data.spokenSummary);
      }, 800);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "お話をまとめるのに しっぱいしました。もういちど試してください。");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarizeImage = async () => {
    if (!capturedImage) {
      setError("スキャンする書類のしゃしんがありません。");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setCheckedPoints({});

    try {
      const response = await fetch("/api/summarize-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedImage }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "サーバーでエラーがおきました。");
      }

      const data: SummaryResult = await response.json();
      setResult(data);
      saveToHistory(data, "scanner");
      // Auto play speech synthesis once results are loaded!
      setTimeout(() => {
        handlePlayVoice(data.spokenSummary);
      }, 800);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "書類の文字がよめませんでした。しゃしんを明るく撮りなおすか、別の画像で試してください。");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCheck = (index: number) => {
    setCheckedPoints(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleGoBackHome = () => {
    stopCamera();
    stopRecording();
    handleStopVoice();
    setResult(null);
    setCapturedImage(null);
    setTranscript("");
    setError(null);
    setScreen("home");
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans flex flex-col antialiased">
      {/* Header with Vibrant Palette border and style */}
      <header id="app-header" className="bg-white border-b-4 border-[#FFD100] sticky top-0 z-50 shadow-sm px-4 md:px-12 py-4 md:py-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-[#FFD100] rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-black text-white shadow-inner shrink-0 overflow-hidden border border-amber-300">
            <img 
              id="app-logo"
              src={youtenKunIcon} 
              alt="要" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 id="app-title" className="text-2xl md:text-4xl font-black tracking-tight text-slate-800 flex items-center">
              要点くん 
              <span className="text-xs md:text-xl font-medium text-slate-400 ml-2 hidden sm:inline-block">
                - あなたをたすけるアプリ -
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-bold hidden md:block">
              高次脳機能障害の患者様のための、かんたん読解・会話要約サポーター
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3">
          {/* User Account Login Button */}
          <button 
            id="btn-account-header"
            onClick={() => {
              setResult(null);
              setScreen("login");
            }}
            className="flex items-center space-x-1.5 text-slate-700 hover:text-slate-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-2 rounded-xl text-xs md:text-sm transition-all shadow-2xs cursor-pointer font-bold"
            title="ユーザーID切り替え・ログイン"
          >
            <User className="w-4 h-4 text-purple-600" />
            <span className="max-w-[80px] sm:max-w-[130px] truncate">
              {currentUser ? currentUser.name : "ログイン"}
            </span>
          </button>
          
          <button 
            id="btn-history-header"
            onClick={() => {
              setResult(null);
              setScreen("history");
            }}
            className="flex items-center space-x-1.5 text-slate-700 hover:text-slate-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-xl text-xs md:text-sm transition-all shadow-2xs cursor-pointer font-bold relative"
          >
            <History className="w-4 h-4 text-blue-600" />
            <span>りれき</span>
            {history.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1">
                {history.length}
              </span>
            )}
          </button>

          <button 
            id="btn-help"
            onClick={() => setShowHelp(true)}
            className="flex items-center space-x-1.5 text-slate-700 hover:text-slate-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 rounded-xl text-xs md:text-sm transition-all shadow-2xs cursor-pointer font-bold"
          >
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>つかいかた</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main id="app-main" className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col justify-start">
        
        {/* Iframe warning banner for easy microphone access */}
        {isIframe && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 md:p-6 bg-amber-50 border-2 border-amber-200 rounded-3xl space-y-3.5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 text-amber-700 p-2 rounded-xl shrink-0">
                <Mic className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm md:text-md font-black text-amber-950">
                  ⚠️ マイクの設定（きょか）をかえたい時・つかえない時は：
                </h4>
                <p className="text-xs md:text-sm text-slate-700 font-bold leading-relaxed">
                  いまは、お試し用のちいさな「わく（プレビュー）」の中でうごいています。
                  ブラウザの決まりにより、このままではマイクが使えないことがあります。
                </p>
                <p className="text-xs md:text-sm text-slate-800 font-black leading-relaxed">
                  💡 下の青いボタンをおして<strong>「新しいタブ」</strong>でひらき直すと、かんたんにマイクを許可（オン）にできます！
                </p>
              </div>
            </div>

            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-black rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 border-b-4 border-blue-800 cursor-pointer text-center"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>👉 ここをおして「新しいタブ」でひらく（マイクが使えます）</span>
              </a>
              <button
                onClick={() => {
                  setShowDiagnostics(true);
                  setDiagStep(2);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border-2 border-slate-200 transition-all cursor-pointer"
              >
                <span>詳しい設定のしかた（しんだん）</span>
              </button>
            </div>
          </motion.div>
        )}
        
        {/* HELP MODAL */}
        <AnimatePresence>
          {showHelp && (
            <motion.div 
              id="help-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowHelp(false)}
            >
              <motion.div 
                id="help-modal-content"
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-hidden text-left"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-blue-500" />
                    要点くんの つかいかた
                  </h3>
                  <button 
                    onClick={() => setShowHelp(false)} 
                    className="text-slate-400 hover:text-slate-600 font-bold text-xl px-2 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">
                    「要点くん」は、むずかしい書類や、ながいお話をスッキリまとめてくれるアプリです。
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="bg-blue-100 text-blue-700 font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5 shrink-0">1</span>
                      <p>
                        <strong>「会話を わかりやすくする」:</strong><br />
                        マイクにむかってお話をすると、その内容をかんたんな箇条書きにしてくれます。手で文字を入力することもできます。
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="bg-blue-100 text-blue-700 font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5 shrink-0">2</span>
                      <p>
                        <strong>「書類や 文を スキャンする」:</strong><br />
                        お手紙、説明書、お薬の紙などの写真をパシャッと撮ると、大事なところを自動で抜き出してくれます。
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="bg-blue-100 text-blue-700 font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5 shrink-0">3</span>
                      <p>
                        <strong>おしゃべり音声（読み上げ）:</strong><br />
                        まとめ終わると、やさしい声でゆっくり読み上げます。「おそい」ボタンを押すとさらにゆっくり読み上げてくれます。
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 mt-4">
                    <p className="text-xs text-blue-800 leading-relaxed font-medium">
                      ※ 読み上げは一時停止やストップができます。チェックボックスを使って、読み終えた項目を消していくことができます。
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowHelp(false)}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-center cursor-pointer"
                >
                  わかった！閉じる
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>



        {/* LOADING SHIELD */}
        {loading && (
          <div id="loading-shield" className="fixed inset-0 bg-white/95 flex flex-col items-center justify-center z-40 p-6">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="text-blue-600 mb-6"
            >
              <Loader2 className="w-16 h-16" />
            </motion.div>
            
            <AnimatePresence mode="wait">
              <motion.p 
                key={loadingMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg md:text-xl font-bold text-slate-800 text-center max-w-md leading-relaxed px-4"
              >
                {loadingMessage}
              </motion.p>
            </AnimatePresence>

            <p className="text-sm text-slate-400 mt-4">少し時間がかかることがあります。そのままお待ちください。</p>
          </div>
        )}

        {/* ERROR DISPLAY */}
        {error && (
          <div id="error-alert" className="mb-6 p-5 bg-rose-50 border-2 border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start gap-4 text-rose-900 shadow-xs">
            <div className="bg-rose-100 text-rose-600 p-2 rounded-xl shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-2 text-left">
              <h4 className="font-black text-sm md:text-md text-rose-950 flex items-center gap-1.5">
                <span>
                  {error.includes("カメラ") || error.includes("許可") || error.includes("拒否")
                    ? "カメラまたは機能の準備ができませんでした"
                    : "エラーがおきました"}
                </span>
              </h4>
              <p className="text-xs md:text-sm font-bold leading-relaxed text-rose-800">{error}</p>
              
              {/* Special Troubleshooting Actions if it is a camera error */}
              {(error.includes("カメラ") || error.includes("スキャン") || error.includes("写真")) && (
                <div className="mt-3 p-4 bg-white border border-rose-100 rounded-xl space-y-3">
                  <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>💡 カメラが使えない時の、おすすめ代替手順：</span>
                  </p>
                  <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 leading-relaxed font-bold">
                    <li>
                      スマホやパソコンに保存した写真・画像ファイルを<strong className="text-emerald-700">「アルバムから選ぶ」</strong>ことができます。
                    </li>
                    <li>
                      プレビュー枠の制限の場合は、<strong className="text-blue-600">「新しいタブでひらく」</strong>とカメラ許可ダイアログが表示されるようになります。
                    </li>
                  </ol>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => {
                        setScreen("scanner");
                        setTimeout(() => {
                          fileInputRef.current?.click();
                        }, 150);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 shrink-0" />
                      <span>写真・画像ファイルを選んでつかう</span>
                    </button>

                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 border-b-4 border-blue-800 cursor-pointer text-center"
                    >
                      <ExternalLink className="w-4 h-4 shrink-0" />
                      <span>新しいタブでひらく（カメラ許可を試す）</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Special Troubleshooting Actions if it is a microphone error */}
              {(error.includes("マイク") || error.includes("ききとり")) && !error.includes("カメラ") && (
                <div className="mt-3 p-4 bg-white border border-rose-100 rounded-xl space-y-3">
                  <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>💡 解決（かいけつ）のための、かんたんな手順：</span>
                  </p>
                  <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 leading-relaxed font-bold">
                    <li>
                      画面右上、または下の青いボタンの<strong className="text-blue-600">「新しいタブでひらく」</strong>をおします。
                    </li>
                    <li>
                      新しい画面でひらいたら、<strong className="text-amber-600">「マイクの許可（きょか）」</strong>を求めるメッセージが出るので、<strong className="text-green-600">「許可する」</strong>をえらんでください。
                    </li>
                    <li>
                      もし出ない場合は、画面のうえのほうにある🔒（カギのマーク）をおしてマイクをオンにしてください。
                    </li>
                  </ol>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 border-b-4 border-blue-800 cursor-pointer text-center"
                    >
                      <ExternalLink className="w-4 h-4 shrink-0" />
                      <span>新しいタブでひらく（マイクが使えます）</span>
                    </a>
                    
                    <button
                      onClick={() => {
                        setShowDiagnostics(true);
                        setDiagStep(1);
                        setTimeout(() => {
                          const el = document.getElementById("screen-conversation") || document.getElementById("screen-home");
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
                    >
                      <span>詳しいしんだんを始める</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-1">
                <button 
                  onClick={() => setError(null)} 
                  className="text-xs font-black underline text-rose-700 hover:text-rose-950 block cursor-pointer"
                >
                  エラー表示を消す
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 1: HOME */}
        {screen === "home" && (
          <div id="screen-home" className="space-y-8 py-4">
            
            {/* Friendly Account Banner */}
            <div className="w-full max-w-2xl mx-auto bg-purple-50/90 border-2 border-purple-200 rounded-2xl p-3.5 md:p-4 flex items-center justify-between shadow-2xs gap-3">
              <div className="flex items-center space-x-3 truncate">
                <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center font-bold shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-purple-950 truncate">
                    {currentUser ? (
                      <>
                        <span className="font-black text-sm text-purple-900">{currentUser.name}</span> さん（ID: {currentUser.id}）でログイン中
                      </>
                    ) : (
                      "ログインしていません（ゲストモード）"
                    )}
                  </p>
                  <p className="text-[11px] text-purple-600 font-bold truncate">
                    まとめた履歴（りれき）を IDごとに分類して保存します
                  </p>
                </div>
              </div>

              <button
                onClick={() => setScreen("login")}
                className="bg-white hover:bg-purple-100 text-purple-700 border-2 border-purple-300 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 shadow-2xs"
              >
                {currentUser ? "ID切り替え" : "ログイン"}
              </button>
            </div>

            {/* Friendly Greeting / Title Header based on Design HTML */}
            <div className="text-center space-y-2 mb-2">
              <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-none">
                どちらを つかいますか？
              </h2>
              <p className="text-lg md:text-2xl text-slate-500 font-bold">
                ボタンをえらんで、おしてね。
              </p>
            </div>

            {/* Core Action Cards (Vibrant tactile buttons) */}
            <div className="grid grid-cols-2 gap-4 md:gap-12 w-full max-w-5xl mx-auto">
              
              {/* Option ①: Conversation (会話) */}
              <motion.button
                id="btn-nav-conversation"
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setScreen("conversation")}
                className="group bg-white border-4 border-slate-200 rounded-3xl md:rounded-[4rem] p-4 md:p-12 flex flex-col items-center justify-center gap-4 md:gap-8 shadow-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer active:scale-95 text-center w-full"
              >
                <div className="w-16 h-16 md:w-40 md:h-40 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg group-hover:bg-blue-600 transition-colors">
                  <Mic className="w-8 h-8 md:w-20 md:h-20" />
                </div>
                <div className="space-y-1.5 md:space-y-3">
                  <span className="block text-lg md:text-4xl font-black text-slate-800 tracking-tight leading-none">
                    ① かいわ
                  </span>
                  <span className="block text-xs md:text-xl text-slate-500 font-extrabold">
                    はなしを きく
                  </span>
                  <p className="hidden md:block text-xs text-slate-400 font-medium max-w-xs mx-auto leading-relaxed pt-1">
                    となりの人の話し声や、テレビのむずかしいニュースを聞いて、かんたんにまとめます。
                  </p>
                </div>
              </motion.button>

              {/* Option ②: Camera (カメラ) */}
              <motion.button
                id="btn-nav-scanner"
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setScreen("scanner");
                  startCamera(); // Auto trigger camera to be extremely user friendly!
                }}
                className="group bg-white border-4 border-slate-200 rounded-3xl md:rounded-[4rem] p-4 md:p-12 flex flex-col items-center justify-center gap-4 md:gap-8 shadow-xl hover:border-orange-400 hover:bg-orange-50/50 transition-all cursor-pointer active:scale-95 text-center w-full"
              >
                <div className="w-16 h-16 md:w-40 md:h-40 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg group-hover:bg-orange-600 transition-colors">
                  <Camera className="w-8 h-8 md:w-20 md:h-20" />
                </div>
                <div className="space-y-1.5 md:space-y-3">
                  <span className="block text-lg md:text-4xl font-black text-slate-800 tracking-tight leading-none">
                    ② カメラ
                  </span>
                  <span className="block text-xs md:text-xl text-slate-500 font-extrabold">
                    しょるいを よむ
                  </span>
                  <p className="hidden md:block text-xs text-slate-400 font-medium max-w-xs mx-auto leading-relaxed pt-1">
                    お手紙、お薬の紙、ポスターの写真を撮って、たいせつなポイントをまとめます。
                  </p>
                </div>
              </motion.button>

            </div>

            {/* History Access Card on Home Screen */}
            <div className="w-full max-w-2xl mx-auto">
              <motion.button
                id="btn-nav-history-home"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setResult(null);
                  setScreen("history");
                }}
                className="w-full bg-white border-2 border-slate-200 hover:border-blue-400 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base md:text-lg font-black text-slate-800">
                        ③ これまでのりれきをみる
                      </h3>
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {history.length}件
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">
                      まえにまとめた会話や書類の結果を、いつでも読みかえせます
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-blue-600 font-black text-sm shrink-0">
                  <span className="hidden sm:inline">ひらく</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            </div>

            {/* Quick Tutorial Help Panel with vibrant background color */}
            <div className="bg-amber-50/80 rounded-2xl p-5 border-2 border-amber-200 flex items-start space-x-4 max-w-2xl mx-auto">
              <div className="bg-amber-100 text-amber-700 p-2.5 rounded-xl shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">やさしいサポート</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-bold">
                  むずかしい言葉や書類があれば、いつでも「要点くん」におまかせください。
                  画面の下や右上にある<strong>「つかいかた」</strong>でお助けします。
                </p>
              </div>
            </div>



          </div>
        )}

        {/* SCREEN 2: CONVERSATION MODE */}
        {screen === "conversation" && (
          <div id="screen-conversation" className="space-y-6">
            
            {/* Navigation back and header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <button 
                id="btn-back-to-home"
                onClick={handleGoBackHome}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-950 font-bold text-md px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>もどる</span>
              </button>
              
              <span className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider">
                会話を要約する
              </span>
            </div>

            {/* Main Control Panel */}
            {!result ? (
              <div className="space-y-6">
                {/* Switcher Tab bar inside Next Screen */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>つかいたい機能を いつでもきりかえられます：</span>
                  </div>
                  <div className="bg-slate-100 p-2 rounded-2xl border-2 border-slate-200 flex flex-col sm:flex-row gap-2 shadow-sm">
                    <button 
                      onClick={() => {
                        setScreen("conversation");
                        stopCamera();
                        setError(null);
                      }}
                      className="flex-1 py-3.5 px-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all cursor-pointer bg-blue-600 text-white shadow-md active:scale-95 border-b-4 border-blue-800"
                    >
                      <Mic className="w-5 h-5 shrink-0 animate-bounce" />
                      <span>① かいわ (はなしをきく)</span>
                    </button>
                    <button 
                      onClick={() => {
                        setScreen("scanner");
                        stopRecording();
                        setError(null);
                        startCamera();
                      }}
                      className="flex-1 py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 active:scale-95"
                    >
                      <Camera className="w-5 h-5 shrink-0 text-slate-400" />
                      <span>② カメラ (しょるいをよむ)</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                  
                  <div className="text-center space-y-2 max-w-lg mx-auto">
                    <h3 className="text-lg font-black text-slate-900">
                      マイクにむかって 話しかけてください
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      「マイクで声をきく」ボタンをおすと、マイクがオンになります。<br />
                      お話がおわったら「ストップ」ボタンをおして、要約をはじめてください。
                    </p>
                  </div>

                  {/* Big Interactive Mic Button */}
                  <div className="flex flex-col items-center justify-center py-4 space-y-4">
                    {isRecording ? (
                      <motion.button
                        id="btn-stop-recording"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        onClick={stopRecording}
                        className="bg-rose-500 hover:bg-rose-600 text-white w-24 h-24 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all border-4 border-rose-200 cursor-pointer"
                      >
                        <Square className="w-8 h-8 fill-white" />
                      </motion.button>
                    ) : (
                      <button
                        id="btn-start-recording"
                        onClick={startRecording}
                        className="bg-rose-50 text-rose-600 hover:bg-rose-100 w-24 h-24 rounded-full flex items-center justify-center shadow-xs hover:shadow-md transition-all border-2 border-rose-200 cursor-pointer"
                      >
                        <Mic className="w-10 h-10" />
                      </button>
                    )}
                    
                    <span className={`text-xs font-black tracking-wide ${isRecording ? "text-rose-500" : "text-slate-400"}`}>
                      {isRecording ? "会話（かいわ）を きいています..." : "「マイクで声をきく」をおしてください"}
                    </span>
                  </div>

                  {/* Interactive Speech Diagnosis Tool */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-lg mx-auto shadow-2xs">
                    <button
                      onClick={() => {
                        setShowDiagnostics(!showDiagnostics);
                        if (!showDiagnostics) setDiagStep(0);
                      }}
                      className="w-full flex items-center justify-between text-left text-xs font-black text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span>🎤 声がききとれない・動かないときの診断ツール</span>
                      </span>
                      {showDiagnostics ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {showDiagnostics && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-4">
                        {diagStep === 0 && (
                          <div className="space-y-3 text-xs">
                            <p className="font-bold text-slate-700 leading-relaxed">
                              音声の認識がうまくできない場合、ブラウザの設定やセキュリティの制限が原因であることが多いです。
                              かんたんな診断チェック（全3問）をしてみましょう！
                            </p>
                            <button
                              onClick={() => setDiagStep(1)}
                              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer text-center active:scale-95"
                            >
                              しんだんを はじめる
                            </button>
                          </div>
                        )}

                        {diagStep === 1 && (
                          <div className="space-y-3 text-xs">
                            <div className="font-black text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 leading-relaxed">
                              しんだん ①：画面の右上（またはメニュー）に「新しいタブで開く」というボタンは見えますか？
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setDiagStep(11)}
                                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer transition-all text-slate-700"
                              >
                                はい、見えます
                              </button>
                              <button
                                onClick={() => setDiagStep(2)}
                                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer transition-all text-slate-700"
                              >
                                いいえ（すでに大きな画面）
                              </button>
                            </div>
                          </div>
                        )}

                        {diagStep === 11 && (
                          <div className="space-y-3 text-xs bg-amber-50 border border-amber-200 p-3.5 rounded-xl">
                            <h5 className="font-black text-amber-800 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              【原因が見つかりました！】
                            </h5>
                            <p className="font-bold text-slate-700 leading-relaxed">
                              この小さな枠（プレビュー画面）の中では、ブラウザのセキュリティ制限によりマイクが使えません。
                            </p>
                            <p className="font-bold text-slate-800 leading-relaxed">
                              💡 <strong>解決ほうほう：</strong><br />
                              右上の<strong>「新しいタブで開く」</strong>（または上の地球儀マーク、シェア用URL）をおして、大きなブラウザ画面で使ってください。それだけで使えるようになります！
                            </p>
                            <div className="pt-2 flex gap-2">
                              <button
                                onClick={() => setDiagStep(2)}
                                className="flex-1 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg transition-all cursor-pointer text-center"
                              >
                                つぎのチェックへ
                              </button>
                              <button
                                onClick={() => setDiagStep(0)}
                                className="flex-1 py-2 bg-slate-800 hover:bg-slate-950 text-white font-bold rounded-lg transition-all cursor-pointer text-center"
                              >
                                最初から
                              </button>
                            </div>
                          </div>
                        )}

                        {diagStep === 2 && (
                          <div className="space-y-3 text-xs">
                            <div className="font-black text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 leading-relaxed">
                              しんだん ②：「マイクで声をきく」ボタンをおした時、画面に「マイクの使用を許可しますか？」と出ましたか？
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setDiagStep(3)}
                                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer transition-all text-slate-700"
                              >
                                許可（きょか）した
                              </button>
                              <button
                                onClick={() => setDiagStep(22)}
                                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer transition-all text-slate-700"
                              >
                                出なかった / 禁止した
                              </button>
                            </div>
                          </div>
                        )}

                        {diagStep === 22 && (
                          <div className="space-y-3 text-xs bg-amber-50 border border-amber-200 p-3.5 rounded-xl">
                            <h5 className="font-black text-amber-800 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              【マイクの使用許可が必要です】
                            </h5>
                            <p className="font-bold text-slate-700 leading-relaxed">
                              マイクの許可をオフ（禁止）にしているか、設定画面でブロックされている可能性があります。
                            </p>
                            <p className="font-bold text-slate-800 leading-relaxed">
                              💡 <strong>解決ほうほう：</strong><br />
                              お使いのインターネット画面（ChromeやSafari）の上部にある<strong>カギのマーク🔒（または設定マーク）</strong>を押し、マイクを<strong>「許可」</strong>に切り替えてから、このページを再読み込みしてください。
                            </p>
                            <div className="pt-2 flex gap-2">
                              <button
                                onClick={() => setDiagStep(3)}
                                className="flex-1 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg transition-all cursor-pointer text-center"
                              >
                                つぎのチェックへ
                              </button>
                              <button
                                onClick={() => setDiagStep(0)}
                                className="flex-1 py-2 bg-slate-800 hover:bg-slate-950 text-white font-bold rounded-lg transition-all cursor-pointer text-center"
                              >
                                最初から
                              </button>
                            </div>
                          </div>
                        )}

                        {diagStep === 3 && (
                          <div className="space-y-3 text-xs">
                            <div className="font-black text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 leading-relaxed">
                              しんだん ③：いまお使いのブラウザアプリ（インターネットを開くアプリ）は何ですか？
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setDiagStep(4)}
                                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer transition-all text-slate-700"
                              >
                                Google Chrome / Safari
                              </button>
                              <button
                                onClick={() => setDiagStep(33)}
                                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer transition-all text-slate-700"
                              >
                                LINE・メール内 / その他
                              </button>
                            </div>
                          </div>
                        )}

                        {diagStep === 33 && (
                          <div className="space-y-3 text-xs bg-amber-50 border border-amber-200 p-3.5 rounded-xl">
                            <h5 className="font-black text-amber-800 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              【別のブラウザをお試しください】
                            </h5>
                            <p className="font-bold text-slate-700 leading-relaxed">
                              LINEの画面内や、メールアプリ内などの内蔵ブラウザでは、音声認識システム（Web Speech API）が制限されて動かないことがあります。
                            </p>
                            <p className="font-bold text-slate-800 leading-relaxed">
                              💡 <strong>解決ほうほう：</strong><br />
                              お使いのスマートフォンの標準ブラウザ（iPhoneなら <strong>Safari</strong>、Androidなら <strong>Google Chrome</strong>）で開いてみてください。
                            </p>
                            <div className="pt-2 flex gap-2">
                              <button
                                onClick={() => setDiagStep(4)}
                                className="flex-1 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg transition-all cursor-pointer text-center"
                              >
                                つぎのチェックへ
                              </button>
                              <button
                                onClick={() => setDiagStep(0)}
                                className="flex-1 py-2 bg-slate-800 hover:bg-slate-950 text-white font-bold rounded-lg transition-all cursor-pointer text-center"
                              >
                                最初から
                              </button>
                            </div>
                          </div>
                        )}

                        {diagStep === 4 && (
                          <div className="space-y-3 text-xs bg-green-50 border border-green-200 p-3.5 rounded-xl text-green-900">
                            <h5 className="font-black text-green-800 flex items-center gap-1">
                              <CheckSquare className="w-4 h-4 text-green-600 shrink-0" />
                              【診断チェックが完了しました】
                            </h5>
                            <p className="font-bold leading-relaxed text-slate-700">
                              基本的な動作環境は整っています！マイクにお口を近づけて、少しはっきりと声を出してみてください。
                            </p>
                            <div className="bg-white/80 p-2.5 rounded-lg border border-green-100 text-slate-600 space-y-1 font-medium">
                              <p className="font-bold text-slate-800 text-left">💡 最後の解決ヒント：</p>
                              <ul className="list-disc list-inside space-y-1 text-left">
                                <li><strong>スマホやパソコンを再起動</strong>してみる。</li>
                                <li>マイクの下の枠を押して、<strong>直接手で入力する</strong>ことも可能です。</li>
                              </ul>
                            </div>
                            <button
                              onClick={() => setDiagStep(0)}
                              className="w-full py-2 bg-slate-800 hover:bg-slate-950 text-white font-bold rounded-lg transition-all cursor-pointer text-center"
                            >
                              診断をはじめからやり直す
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Live Real-time Text Area / Transcript */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                        <FileText className="w-4 h-4 text-slate-400" />
                        ききとった言葉（直接書きなおせます）
                      </label>
                      {transcript && (
                        <button 
                          onClick={clearTranscript} 
                          className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          やりなおす
                        </button>
                      )}
                    </div>
                    
                    <textarea
                      id="textarea-transcript"
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      placeholder="マイクから音声がはいります。また、ここへ直接キーボードでむずかしい文章を入力することもできます。"
                      className="w-full h-40 p-4 border-2 border-slate-200 rounded-2xl text-md focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-hidden font-medium leading-relaxed resize-none bg-slate-50/50"
                    />

                    {interimTranscript && (
                      <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 animate-pulse flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                        <span>ききとっている途中（とちゅう）:</span>
                        <span className="font-medium text-slate-700 font-mono italic">「{interimTranscript}」</span>
                      </div>
                    )}
                  </div>

                  {/* Summarize Action Button */}
                  <button
                    id="btn-trigger-summary-text"
                    disabled={!transcript.trim()}
                    onClick={() => handleSummarizeText(transcript, "conversation")}
                    className={`w-full py-4 rounded-2xl text-md font-black shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      transcript.trim() 
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200" 
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>ポイントを まとめる</span>
                  </button>

                </div>
              </div>
            ) : (
              /* RESULT SUMMARY PANEL */
              <SummaryResultView 
                result={result} 
                checkedPoints={checkedPoints} 
                onToggleCheck={handleToggleCheck}
                speechSpeed={speechSpeed}
                onChangeSpeed={changeSpeed}
                isSpeaking={isSpeaking}
                isPaused={isPaused}
                onPlay={handlePlayVoice}
                onPause={handlePauseVoice}
                onStop={handleStopVoice}
                onReset={handleGoBackHome}
                onSelectConversation={() => {
                  setScreen("conversation");
                  stopCamera();
                  setError(null);
                  setResult(null);
                  clearTranscript();
                }}
                onSelectScanner={() => {
                  setScreen("scanner");
                  stopRecording();
                  setError(null);
                  setResult(null);
                  setCapturedImage(null);
                  startCamera();
                }}
              />
            )}

          </div>
        )}

        {/* SCREEN 3: CAMERA SCANNER MODE */}
        {screen === "scanner" && (
          <div id="screen-scanner" className="space-y-6">
            
            {/* Navigation back and header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <button 
                id="btn-back-to-home"
                onClick={handleGoBackHome}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-950 font-bold text-md px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>もどる</span>
              </button>
              
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                書類・文章スキャン
              </span>
            </div>

            {/* Scanning Controls */}
            {!result ? (
              <div className="space-y-6">
                {/* Switcher Tab bar inside Next Screen */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>つかいたい機能を いつでもきりかえられます：</span>
                  </div>
                  <div className="bg-slate-100 p-2 rounded-2xl border-2 border-slate-200 flex flex-col sm:flex-row gap-2 shadow-sm">
                    <button 
                      onClick={() => {
                        setScreen("conversation");
                        stopCamera();
                        setError(null);
                      }}
                      className="flex-1 py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 active:scale-95"
                    >
                      <Mic className="w-5 h-5 shrink-0 text-slate-400" />
                      <span>① かいわ (はなしをきく)</span>
                    </button>
                    <button 
                      onClick={() => {
                        setScreen("scanner");
                        stopRecording();
                        setError(null);
                        startCamera();
                      }}
                      className="flex-1 py-3.5 px-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all cursor-pointer bg-orange-500 text-white shadow-md active:scale-95 border-b-4 border-orange-700"
                    >
                      <Camera className="w-5 h-5 shrink-0 animate-bounce" />
                      <span>② カメラ (しょるいをよむ)</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                  
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-black text-slate-900">
                      書類（しょるい）を カメラでうつしてください
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      お手紙やお薬の説明書など、かんたんにしたい書類の写真を撮るか、アップロードします。
                    </p>
                  </div>

                  {/* Live Camera View Finder or Captured Preview */}
                  <div className="relative w-full aspect-4/3 max-w-lg mx-auto bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex flex-col items-center justify-center">
                    
                    {isCameraActive && !capturedImage && (
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover"
                      />
                    )}

                    {capturedImage && (
                      <img 
                        src={capturedImage} 
                        alt="スキャン画像" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    {!isCameraActive && !capturedImage && (
                      <div className="text-center p-6 space-y-4 text-slate-400">
                        <ScanLine className="w-16 h-16 mx-auto stroke-1" />
                        <p className="text-xs font-semibold">カメラが起動していません</p>
                      </div>
                    )}

                    {/* Top floating control to stop/start camera */}
                    {isCameraActive && (
                      <div className="absolute top-3 right-3 z-10">
                        <button 
                          onClick={stopCamera}
                          className="bg-black/60 hover:bg-black/80 text-white font-bold text-xs px-3 py-1.5 rounded-full backdrop-blur-xs cursor-pointer"
                        >
                          カメラを停止
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action Shutter Controls */}
                  <div className="flex flex-col items-center justify-center space-y-4">
                    {isCameraActive && !capturedImage && (
                      <button
                        id="btn-take-photo"
                        onClick={capturePhoto}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all border-4 border-emerald-200 flex items-center space-x-2 text-md cursor-pointer"
                      >
                        <Camera className="w-5 h-5" />
                        <span>シャッターを おす</span>
                      </button>
                    )}

                    {!isCameraActive && !capturedImage && (
                      <button
                        id="btn-reactivate-camera"
                        onClick={startCamera}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-6 py-3 rounded-full border border-emerald-200 flex items-center space-x-2 text-sm transition-all cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>カメラを つかう</span>
                      </button>
                    )}

                    {capturedImage && (
                      <div className="flex items-center space-x-3 w-full max-w-sm">
                        <button
                          id="btn-retake-photo"
                          onClick={startCamera}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl text-sm transition-all text-center cursor-pointer"
                        >
                          とりなおす
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Upload File Input */}
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 text-center space-y-3 max-w-md mx-auto">
                    <div className="bg-slate-200/60 text-slate-500 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">スマホの写真フォルダから選ぶ</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        すでに撮ったしゃしんや画像ファイルも使えます
                      </p>
                    </div>
                    
                    <label className="inline-block bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-xl border border-slate-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer text-sm">
                      画像ファイルを選択する
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        className="hidden" 
                      />
                    </label>
                  </div>

                  {/* Action Summarize Scanned Image */}
                  <button
                    id="btn-trigger-summary-image"
                    disabled={!capturedImage}
                    onClick={handleSummarizeImage}
                    className={`w-full py-4 rounded-2xl text-md font-black shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      capturedImage 
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200" 
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>この書類（しょるい）を よむ</span>
                  </button>

                </div>
              </div>
            ) : (
              /* RESULT SUMMARY PANEL */
              <SummaryResultView 
                result={result} 
                checkedPoints={checkedPoints} 
                onToggleCheck={handleToggleCheck}
                speechSpeed={speechSpeed}
                onChangeSpeed={changeSpeed}
                isSpeaking={isSpeaking}
                isPaused={isPaused}
                onPlay={handlePlayVoice}
                onPause={handlePauseVoice}
                onStop={handleStopVoice}
                onReset={handleGoBackHome}
                onSelectConversation={() => {
                  setScreen("conversation");
                  stopCamera();
                  setError(null);
                  setResult(null);
                  clearTranscript();
                }}
                onSelectScanner={() => {
                  setScreen("scanner");
                  stopRecording();
                  setError(null);
                  setResult(null);
                  setCapturedImage(null);
                  startCamera();
                }}
              />
            )}

          </div>
        )}

        {/* SCREEN 3: HISTORY MODE */}
        {screen === "history" && (
          <div id="screen-history" className="space-y-6">
            
            {/* Header / Navigation back */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 gap-2 flex-wrap">
              <button 
                id="btn-back-from-history"
                onClick={handleGoBackHome}
                className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 bg-white border-2 border-slate-200 px-4 py-2.5 rounded-2xl text-xs md:text-sm transition-all font-bold cursor-pointer active:scale-95 shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>はじめの画面に もどる</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-blue-600" />
                  <span>りれき一覧 ({history.length}件)</span>
                </span>
                {history.length > 0 && !result && (
                  <button
                    onClick={handleClearAllHistory}
                    className="flex items-center space-x-1 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>すべて消す</span>
                  </button>
                )}
              </div>
            </div>

            {/* If user selected a specific result item from history to view */}
            {result ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center justify-between">
                  <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>保存されたりれきを 表示しています</span>
                  </span>
                  <button
                    onClick={() => {
                      setResult(null);
                      handleStopVoice();
                    }}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                  >
                    ← 履歴一覧にもどる
                  </button>
                </div>

                <SummaryResultView 
                  result={result} 
                  checkedPoints={checkedPoints} 
                  onToggleCheck={handleToggleCheck}
                  speechSpeed={speechSpeed}
                  onChangeSpeed={changeSpeed}
                  isSpeaking={isSpeaking}
                  isPaused={isPaused}
                  onPlay={handlePlayVoice}
                  onPause={handlePauseVoice}
                  onStop={handleStopVoice}
                  onReset={handleGoBackHome}
                  onSelectConversation={() => {
                    setScreen("conversation");
                    stopCamera();
                    setError(null);
                    setResult(null);
                    clearTranscript();
                  }}
                  onSelectScanner={() => {
                    setScreen("scanner");
                    stopRecording();
                    setError(null);
                    setResult(null);
                    setCapturedImage(null);
                    startCamera();
                  }}
                />
              </div>
            ) : (
              /* History Item List */
              <div className="space-y-6">
                
                {/* Title */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
                    <History className="w-7 h-7 text-blue-600" />
                    <span>これまでの まとめ 履歴（りれき）</span>
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 font-bold">
                    過去にまとめられた結果をいつでも読みかえせます。タップすると声でよみあげます。
                  </p>
                </div>

                {/* Filter Tabs */}
                {history.length > 0 && (
                  <div className="space-y-3 max-w-xl mx-auto">
                    {/* User Account Scope Tab */}
                    {currentUser && (
                      <div className="flex justify-center gap-1.5 bg-purple-50/80 p-1 rounded-2xl border border-purple-200">
                        <button
                          onClick={() => setUserHistoryScope("mine")}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            userHistoryScope === "mine"
                              ? "bg-purple-600 text-white shadow-2xs"
                              : "text-purple-700 hover:text-purple-900"
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>{currentUser.name} さんの履歴</span>
                        </button>
                        <button
                          onClick={() => setUserHistoryScope("all_users")}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            userHistoryScope === "all_users"
                              ? "bg-slate-800 text-white shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>全員の履歴を表示</span>
                        </button>
                      </div>
                    )}

                    {/* Content Type Filter */}
                    <div className="flex justify-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                      <button
                        onClick={() => setHistoryFilter("all")}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          historyFilter === "all"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        すべて
                      </button>
                      <button
                        onClick={() => setHistoryFilter("conversation")}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          historyFilter === "conversation"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5" />
                        会話
                      </button>
                      <button
                        onClick={() => setHistoryFilter("scanner")}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          historyFilter === "scanner"
                            ? "bg-orange-500 text-white shadow-2xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        カメラ
                      </button>
                    </div>
                  </div>
                )}

                {/* History Items or Empty state */}
                {history.filter(i => {
                  if (historyFilter !== "all" && i.type !== historyFilter) return false;
                  if (userHistoryScope === "mine" && currentUser) {
                    return i.userId === currentUser.id;
                  }
                  return true;
                }).length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto shadow-2xs">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                      <Clock className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-slate-700">
                        {userHistoryScope === "mine" && currentUser
                          ? `「${currentUser.name}」さんの 履歴がありません`
                          : "まだ 履歴（りれき）がありません"}
                      </h3>
                      <p className="text-xs text-slate-500 font-bold leading-relaxed">
                        「会話」を聞いたり、「カメラ」で書類をよむと、自動でここに結果が保存されます。
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2 max-w-xs mx-auto">
                      <button
                        onClick={() => setScreen("conversation")}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Mic className="w-4 h-4" />
                        <span>① 会話をきく</span>
                      </button>
                      <button
                        onClick={() => {
                          setScreen("scanner");
                          startCamera();
                        }}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>② カメラをつかう</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {history
                      .filter(item => {
                        if (historyFilter !== "all" && item.type !== historyFilter) return false;
                        if (userHistoryScope === "mine" && currentUser) {
                          return item.userId === currentUser.id;
                        }
                        return true;
                      })
                      .map((item) => {
                        const ownerAccount = accounts.find(a => a.id === item.userId);
                        return (
                          <motion.div
                            key={item.id}
                            whileHover={{ y: -2 }}
                            onClick={() => handleViewHistoryItem(item)}
                            className="bg-white border-2 border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 relative group text-left"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                {item.type === "conversation" ? (
                                  <span className="bg-blue-100 text-blue-800 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1 border border-blue-200">
                                    <Mic className="w-3.5 h-3.5 text-blue-600" />
                                    ① 会話（かいわ）
                                  </span>
                                ) : (
                                  <span className="bg-orange-100 text-orange-800 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1 border border-orange-200">
                                    <Camera className="w-3.5 h-3.5 text-orange-600" />
                                    ② カメラ（書類）
                                  </span>
                                )}

                                {/* User Owner Tag */}
                                <span className="bg-purple-100 text-purple-900 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-purple-200">
                                  <User className="w-3 h-3 text-purple-600" />
                                  <span>{ownerAccount ? ownerAccount.name : item.userId || "ゲスト"}</span>
                                </span>

                                <span className="text-xs text-slate-400 font-bold flex items-center gap-1 ml-auto">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {item.formattedDate}
                                </span>
                              </div>

                              <button
                                onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                                className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="この履歴をけす"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                              {item.result.title}
                            </h3>

                            {/* Preview snippet of summary points */}
                            {item.result.summaryPoints && item.result.summaryPoints.length > 0 && (
                              <ul className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5 text-xs text-slate-700 font-bold">
                                {item.result.summaryPoints.slice(0, 2).map((pt, pIdx) => (
                                  <li key={pIdx} className="flex items-start gap-1.5">
                                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5 stroke-[3px]" />
                                    <span className="line-clamp-1">{pt}</span>
                                  </li>
                                ))}
                                {item.result.summaryPoints.length > 2 && (
                                  <li className="text-[10px] text-slate-400 font-semibold pl-5">
                                    ...ほか {item.result.summaryPoints.length - 2} 件のポイント
                                  </li>
                                )}
                              </ul>
                            )}

                            <div className="flex items-center justify-between pt-1 text-xs font-bold border-t border-slate-100 text-slate-500">
                              <span className="flex items-center gap-1 text-blue-600 font-extrabold group-hover:underline">
                                <Play className="w-3.5 h-3.5 fill-blue-600 stroke-none" />
                                タップして声でよみあげる・詳しくみる
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* SCREEN 4: LOGIN / USER ACCOUNT MANAGEMENT MODE */}
        {screen === "login" && (
          <div id="screen-login" className="space-y-6 max-w-2xl mx-auto py-2 w-full">
            
            {/* Navigation back */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <button 
                id="btn-back-from-login"
                onClick={handleGoBackHome}
                className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 bg-white border-2 border-slate-200 px-4 py-2 rounded-2xl text-xs md:text-sm transition-all font-bold cursor-pointer active:scale-95 shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>はじめの画面に もどる</span>
              </button>
            </div>

            {/* Page Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <User className="w-8 h-8" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                ID・パスワード ログイン
              </h2>
              <p className="text-xs md:text-sm text-slate-500 font-bold max-w-md mx-auto">
                個別のIDとパスワードでログインすると、あなただけの要点まとめ履歴を安全に分類・管理できます。
              </p>
            </div>

            {/* Success Message Banner */}
            {loginSuccessMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 text-emerald-900 flex items-center gap-3 font-bold text-sm shadow-xs"
              >
                <UserCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <span>{loginSuccessMsg}</span>
              </motion.div>
            )}

            {/* Current Active Account Status */}
            {currentUser && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-3xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-inner shrink-0">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <span className="bg-purple-200 text-purple-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        現在 ログイン中
                      </span>
                      <h3 className="text-lg font-black text-slate-900">
                        {currentUser.name} <span className="text-xs text-purple-700 font-bold">(ID: {currentUser.id})</span>
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1.5 text-rose-600 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs ml-auto"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ログアウト</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Switch Account List */}
            {accounts.length > 0 && (
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs text-left">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>登録済みアカウント（ワンタップで切り替え）</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {accounts.map((acc) => {
                    const isCurrent = currentUser?.id === acc.id;
                    return (
                      <button
                        key={acc.id}
                        onClick={() => handleQuickLogin(acc)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isCurrent
                            ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                            : "bg-slate-50 hover:bg-purple-50 text-slate-800 border-slate-200 hover:border-purple-300"
                        }`}
                      >
                        <div className="truncate">
                          <span className={`block font-black text-sm truncate ${isCurrent ? "text-white" : "text-slate-900"}`}>
                            {acc.name}
                          </span>
                          <span className={`block text-[11px] font-extrabold truncate ${isCurrent ? "text-purple-200" : "text-slate-400"}`}>
                            ID: {acc.id}
                          </span>
                        </div>
                        {isCurrent && <UserCheck className="w-5 h-5 shrink-0 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Login & Registration Tabs */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              
              {/* Tabs selector */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                  onClick={() => {
                    setLoginTab("login");
                    setLoginError(null);
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    loginTab === "login"
                      ? "bg-white text-purple-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>ID・パスワードで ログイン</span>
                </button>
                <button
                  onClick={() => {
                    setLoginTab("register");
                    setLoginError(null);
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    loginTab === "register"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>新しいIDを 作成</span>
                </button>
              </div>

              {/* Login Error Banner */}
              {loginError && (
                <div className="p-3.5 bg-rose-50 border-2 border-rose-200 rounded-xl text-rose-800 font-bold text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* FORM TAB 1: LOGIN */}
              {loginTab === "login" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-black text-slate-700">
                      ユーザーID （半角英数字）
                    </label>
                    <div className="relative">
                      <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        placeholder="例: taro"
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-black text-slate-700">
                      パスワード
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="パスワードを入力"
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-3.5 rounded-2xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    <span>ログインする</span>
                  </button>
                </form>
              )}

              {/* FORM TAB 2: REGISTER */}
              {loginTab === "register" && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-black text-slate-700">
                      お名前・表示名 （ひらがな・漢字OK）
                    </label>
                    <div className="relative">
                      <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="例: たろう（おとうさん）"
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-black text-slate-700">
                      ご希望の ユーザーID （半角英数字）
                    </label>
                    <div className="relative">
                      <Key className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={registerId}
                        onChange={(e) => setRegisterId(e.target.value)}
                        placeholder="例: taro01"
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-black text-slate-700">
                      パスワード
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="お好きなパスワード"
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-3.5 rounded-2xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>新しいIDを 作成してログイン</span>
                  </button>
                </form>
              )}

            </div>

          </div>
        )}


      </main>

      {/* Footer info bar in the Vibrant Palette style */}
      <footer id="app-footer" className="bg-slate-800 text-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mt-12 rounded-t-[2rem]">
        <button 
          id="btn-footer-help" 
          onClick={() => setShowHelp(true)}
          className="flex items-center gap-4 text-left cursor-pointer hover:opacity-95 transition-all active:scale-95 shrink-0"
        >
          <div className="w-14 h-14 bg-[#FFD100] rounded-full flex items-center justify-center shadow-lg shrink-0 border-2 border-white/20">
            <span className="text-white text-2xl font-black">?</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-300">こまったときは...</p>
            <p className="text-lg md:text-xl font-black text-white leading-tight">このボタンを おしてね</p>
          </div>
        </button>

        <div className="flex gap-4">
          <div className="bg-slate-700 rounded-2xl px-5 py-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">電池 (でんち)</span>
            <span className="text-md font-black text-white">92%</span>
          </div>
          <div className="bg-slate-700 rounded-2xl px-5 py-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">音量 (おんりょう)</span>
            <span className="text-md font-black text-[#FFD100]">ちゅうくらい</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Sub-component: Summary Results visualizer
interface SummaryResultViewProps {
  result: SummaryResult;
  checkedPoints: Record<number, boolean>;
  onToggleCheck: (idx: number) => void;
  speechSpeed: number;
  onChangeSpeed: (spd: number) => void;
  isSpeaking: boolean;
  isPaused: boolean;
  onPlay: (txt: string) => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onSelectConversation: () => void;
  onSelectScanner: () => void;
}

function SummaryResultView({
  result,
  checkedPoints,
  onToggleCheck,
  speechSpeed,
  onChangeSpeed,
  isSpeaking,
  isPaused,
  onPlay,
  onPause,
  onStop,
  onReset,
  onSelectConversation,
  onSelectScanner
}: SummaryResultViewProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      
      {/* Title block styled with Vibrant Golden accents */}
      <div className="bg-amber-50/60 border-4 border-[#FFD100] rounded-3xl p-6 text-center shadow-md">
        <span className="text-xs font-black text-amber-700 bg-amber-100 border border-amber-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
          まとめの 結果（けっか）
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-3 leading-snug">
          {result.title}
        </h2>
      </div>

      {/* Spoken TTS Player (Voice Panel) */}
      <div className="bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-3xl p-5 shadow-md space-y-4">
        
        <div className="flex items-center justify-between border-b border-white/20 pb-3">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5 animate-pulse" />
            <h3 className="font-bold text-md">やさしい声で よみあげる</h3>
          </div>
          {isSpeaking && (
            <div className="flex items-center space-x-1">
              <span className="w-1 h-3 bg-white animate-bounce" style={{ animationDelay: "0s" }}></span>
              <span className="w-1 h-3 bg-white animate-bounce" style={{ animationDelay: "0.15s" }}></span>
              <span className="w-1 h-3 bg-white animate-bounce" style={{ animationDelay: "0.3s" }}></span>
            </div>
          )}
        </div>

        {/* Audio Player Controls */}
        <div className="flex items-center justify-center space-x-4">
          
          {/* Play/Pause */}
          {isSpeaking ? (
            <button
              onClick={onPause}
              className="bg-white text-blue-600 w-14 h-14 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Pause className="w-6 h-6 fill-blue-600 stroke-none" />
            </button>
          ) : (
            <button
              onClick={() => onPlay(result.spokenSummary)}
              className="bg-white text-blue-600 w-14 h-14 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-6 h-6 fill-blue-600 stroke-none translate-x-0.5" />
            </button>
          )}

          {/* Stop */}
          <button
            onClick={onStop}
            className="bg-white/20 hover:bg-white/30 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer"
          >
            <Square className="w-5 h-5 fill-white stroke-none" />
          </button>
        </div>

        {/* Speed Adjustment Buttons (Tactile accessibility!) */}
        <div className="bg-black/10 rounded-2xl p-3 flex flex-col space-y-2">
          <div className="flex justify-between items-center text-xs text-white/90">
            <span className="font-bold">よみあげる スピード</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full font-bold">
              {speechSpeed === 0.6 ? "かなりおそい" : speechSpeed === 0.75 ? "ゆっくり" : "ふつう"}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onChangeSpeed(0.6)}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                speechSpeed === 0.6 
                  ? "bg-white text-blue-600 font-extrabold shadow-sm" 
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              かなり遅い
            </button>
            <button
              onClick={() => onChangeSpeed(0.75)}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                speechSpeed === 0.75 
                  ? "bg-white text-blue-600 font-extrabold shadow-sm" 
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              ゆっくり (おすすめ)
            </button>
            <button
              onClick={() => onChangeSpeed(1.0)}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                speechSpeed === 1.0 
                  ? "bg-white text-blue-600 font-extrabold shadow-sm" 
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              ふつう
            </button>
          </div>
        </div>

        {/* Display speaking text block */}
        <p className="text-xs text-sky-100 italic leading-relaxed text-center px-4 font-medium">
          「{result.spokenSummary.slice(0, 80)}...」
        </p>

      </div>

      {/* Visual Key Points with interactive checkboxes (Saves cognitive task tracing!) */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-500" />
            たいせつなポイント
          </h3>
          <span className="text-xs text-slate-400 font-bold">
            おわったら タップして消せます
          </span>
        </div>

        <div className="space-y-3">
          {result.summaryPoints.map((point, index) => {
            const isChecked = checkedPoints[index];
            return (
              <motion.div
                key={index}
                onClick={() => onToggleCheck(index)}
                className={`p-4 rounded-2xl border-2 transition-all flex items-start space-x-3 cursor-pointer ${
                  isChecked 
                    ? "bg-slate-50 border-slate-200 opacity-60 line-through text-slate-400" 
                    : "bg-white border-slate-200 hover:border-emerald-300"
                }`}
                whileTap={{ scale: 0.99 }}
              >
                <div className={`w-6 h-6 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                  isChecked 
                    ? "border-emerald-500 bg-emerald-500 text-white" 
                    : "border-slate-300 text-transparent"
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                </div>
                
                <p className="text-md leading-relaxed font-bold text-slate-800">
                  {point}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* Simplified Words Glossary (Technical terminology glossary) */}
      {result.simpleExplanations && result.simpleExplanations.length > 0 && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              やさしい言葉（ことば）の 意味
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed font-medium">
              むずかしい言葉を、わかりやすく書きなおしました。
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {result.simpleExplanations.map((item, index) => (
              <div key={index} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                <div className="md:w-1/3 space-y-1">
                  <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                    もとの言葉
                  </span>
                  <h4 className="text-md font-extrabold text-slate-900 leading-snug">
                    {item.original}
                  </h4>
                </div>
                
                <div className="md:w-2/3 space-y-1 bg-amber-50/50 border border-amber-100/50 p-3 rounded-2xl">
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md inline-block">
                    かんたんな言葉
                  </span>
                  <p className="text-md font-bold text-amber-900">
                    {item.simple}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium mt-1 border-t border-amber-200/40 pt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Captured Original OCR Document display (Collapsible details) */}
      <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 space-y-2">
        <details className="group">
          <summary className="text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer list-none flex items-center justify-between">
            <span>もとの文章・よみとった文字をみる</span>
            <span className="transition-transform group-open:rotate-180">▼</span>
          </summary>
          <div className="text-xs text-slate-500 leading-relaxed font-medium mt-3 bg-white p-3 rounded-xl max-h-48 overflow-y-auto whitespace-pre-wrap border border-slate-200">
            {result.originalText}
          </div>
        </details>
      </div>

      {/* Restart/Reset Button with double direct actions */}
      <div className="pt-8 border-t-2 border-dashed border-slate-200 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-lg font-black text-slate-800 flex items-center justify-center gap-1.5">
            <Sparkles className="w-5 h-5 text-[#FFD100]" />
            つぎは なにを わかりやすくしますか？
          </p>
          <p className="text-xs text-slate-400 font-bold">
            ボタンをおして、すぐにつかえます。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <button
            onClick={onSelectConversation}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-6 rounded-2xl text-md shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 border-b-4 border-blue-800"
          >
            <Mic className="w-5 h-5" />
            <span>① かいわ を はじめる</span>
          </button>
          <button
            onClick={onSelectScanner}
            className="bg-orange-500 hover:bg-orange-600 text-white font-black py-4 px-6 rounded-2xl text-md shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 border-b-4 border-orange-700"
          >
            <Camera className="w-5 h-5" />
            <span>② カメラ を つかう</span>
          </button>
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={onReset}
            className="bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-600 font-bold py-3 px-6 rounded-2xl text-sm transition-all flex items-center space-x-2 cursor-pointer hover:text-slate-900"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>はじめの画面に もどる</span>
          </button>
        </div>
      </div>

    </motion.div>
  );
}
