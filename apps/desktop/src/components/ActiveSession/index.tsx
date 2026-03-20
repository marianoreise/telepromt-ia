// ActiveSession/index.tsx — Container de la sesión activa

import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalSize } from '@tauri-apps/api/dpi';
import type { Session, Transcript, AIMessage, AppScreen } from '../../types';
import { Toolbar } from './Toolbar';
import { TranscriptStrip } from './TranscriptStrip';
import { AnswerPanel } from './AnswerPanel';
import { ChatPanel } from './ChatPanel';

interface ActiveSessionProps {
  session: Session;
  transcript: Transcript;
  aiMessages: AIMessage[];
  isListening: boolean;
  wsRef: React.MutableRefObject<WebSocket | null>;
  accessToken: string;
  userEmail: string;
  autoGenerate: boolean;
  onSetTranscript: (t: Transcript) => void;
  onAddAIMessage: (msg: AIMessage) => void;
  onSetAIMessages: (msgs: AIMessage[]) => void;
  onSetIsListening: (v: boolean) => void;
  onToggleAutoGenerate: () => void;
  onStop: () => void;
  onCollapse: () => void;
  onSetScreen?: (screen: AppScreen) => void;
  onLogout: () => void;
}

// Mapea el idioma de la sesión al código que espera el backend
function toLanguageCode(lang: string): string {
  if (lang === 'ingles') return 'en';
  return 'es'; // castellano y cast-eng → es
}

export function ActiveSession({
  session,
  transcript,
  aiMessages,
  isListening: _isListening,
  wsRef,
  accessToken,
  userEmail,
  autoGenerate,
  onSetTranscript,
  onAddAIMessage,
  onSetAIMessages,
  onSetIsListening,
  onToggleAutoGenerate,
  onStop,
  onCollapse,
  onSetScreen: _onSetScreen,
  onLogout,
}: ActiveSessionProps) {
  const [showChat, setShowChat] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [isSystemAudioOn, setIsSystemAudioOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(false);
  const [currentAnswerIndex, setCurrentAnswerIndex] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isRequestingAI, setIsRequestingAI] = useState(false);

  // Refs para los valores de streaming (evita stale closures en onmessage)
  const streamingQuestionRef = useRef('');
  const streamingTextRef = useRef('');

  // Timer
  const [elapsed, setElapsed] = useState(0); // segundos
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFree = session.type === 'free';
  const maxSeconds = isFree ? 10 * 60 : 0; // 10 min para free

  // Asegurar que el overlay siempre sea clickeable (nunca pass-through).
  // set_ignore_mouse(true) haría que ningún botón de la toolbar reciba clics.
  useEffect(() => {
    invoke('set_ignore_mouse', { ignore: false }).catch(() => {});
    return () => {
      invoke('set_ignore_mouse', { ignore: false }).catch(() => {});
    };
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (isFree && next >= maxSeconds) {
          clearInterval(timerRef.current!);
          onStop();
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFree, maxSeconds, onStop]);

  const timerDisplay = (() => {
    const seconds = isFree ? Math.max(0, maxSeconds - elapsed) : elapsed;
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  })();

  // Refs estables para los callbacks (para que onmessage no quede stale)
  const onSetTranscriptRef = useRef(onSetTranscript);
  const onAddAIMessageRef = useRef(onAddAIMessage);
  const onSetIsListeningRef = useRef(onSetIsListening);
  useEffect(() => { onSetTranscriptRef.current = onSetTranscript; }, [onSetTranscript]);
  useEffect(() => { onAddAIMessageRef.current = onAddAIMessage; }, [onAddAIMessage]);
  useEffect(() => { onSetIsListeningRef.current = onSetIsListening; }, [onSetIsListening]);

  // Refs para conteo de aiMessages (sin re-crear el WS)
  const aiMessagesLengthRef = useRef(aiMessages.length);
  useEffect(() => { aiMessagesLengthRef.current = aiMessages.length; }, [aiMessages.length]);

  // Ref para el transcript actual (sin re-crear el WS)
  const transcriptTextRef = useRef(transcript.text);
  useEffect(() => { transcriptTextRef.current = transcript.text; }, [transcript.text]);

  // Conectar WebSocket una sola vez al montar
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const backendUrl = import.meta.env.VITE_BACKEND_WS_URL ?? 'ws://localhost:8000';
    const ws = new WebSocket(`${backendUrl}/ws/stt`);
    wsRef.current = ws;

    ws.onopen = () => {
      // Handshake obligatorio: primer mensaje debe ser { token, language }
      ws.send(JSON.stringify({
        token: accessToken,
        language: toLanguageCode(session.language),
      }));
      onSetIsListeningRef.current(true);
    };
    ws.onclose = () => onSetIsListeningRef.current(false);
    ws.onerror = () => onSetIsListeningRef.current(false);

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as {
          type: string;
          text?: string;
          is_final?: boolean;
          chunk?: string;
        };

        if (data.type === 'transcript') {
          onSetTranscriptRef.current({ text: data.text ?? '', isFinal: data.is_final ?? false });
        }

        if (data.type === 'ai_start') {
          streamingQuestionRef.current = transcriptTextRef.current;
          streamingTextRef.current = '';
          // Cancelar timeout de fallback — ai_start llegó correctamente
          if (aiRequestTimeoutRef.current) {
            clearTimeout(aiRequestTimeoutRef.current);
            aiRequestTimeoutRef.current = null;
          }
          setIsRequestingAI(false);
          setIsStreaming(true);
          setStreamingText('');
          setShowAnswers(true);
          setCurrentAnswerIndex(aiMessagesLengthRef.current);
        }

        if (data.type === 'ai_chunk') {
          const chunk = data.chunk ?? '';
          streamingTextRef.current += chunk;
          setStreamingText((prev) => prev + chunk);
        }

        if (data.type === 'ai_done') {
          setIsStreaming(false);
          onAddAIMessageRef.current({
            question: streamingQuestionRef.current,
            answer: streamingTextRef.current,
            timestamp: Date.now(),
          });
          streamingTextRef.current = '';
          streamingQuestionRef.current = '';
          setStreamingText('');
        }
      } catch {
        // Ignorar mensajes malformados
      }
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aiRequestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRequestAI = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'request_ai' }));
      setIsRequestingAI(true);
      // Timeout de 15s: si ai_start no llega, resetear para que el usuario pueda reintentar
      if (aiRequestTimeoutRef.current) clearTimeout(aiRequestTimeoutRef.current);
      aiRequestTimeoutRef.current = setTimeout(() => {
        setIsRequestingAI(false);
      }, 15000);
    }
  };

  const handleScreenshot = async () => {
    try {
      const imageData = await invoke<string>('capture_screenshot');
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'screenshot', data: imageData }));
      }
    } catch {
      // Sin soporte de screenshot en entorno de desarrollo
    }
  };

  const handleChatSend = (message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'chat', text: message }));
    }
  };


  const handleClearAnswers = () => {
    onSetAIMessages([]);
    setShowAnswers(false);
    setStreamingText('');
    setIsStreaming(false);
  };

  // Auto-ajustar altura de ventana Tauri cuando crece el contenido
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const h = Math.max(56, el.offsetHeight);
      const w = window.innerWidth || 1920;
      getCurrentWindow().setSize(new LogicalSize(w, h)).catch(() => {});
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', userSelect: 'none', width: '100vw' }}>
      {/* Barra principal */}
      <Toolbar
        session={session}
        timerDisplay={timerDisplay}
        isSystemAudioOn={isSystemAudioOn}
        isMicOn={isMicOn}
        showChat={showChat}
        isRequestingAI={isRequestingAI || isStreaming}
        userEmail={userEmail}
        autoGenerate={autoGenerate}
        onToggleSystemAudio={() => setIsSystemAudioOn((v) => !v)}
        onToggleMic={() => setIsMicOn((v) => !v)}
        onRequestAI={handleRequestAI}
        onScreenshot={handleScreenshot}
        onToggleChat={() => setShowChat((v) => !v)}
        onToggleAutoGenerate={onToggleAutoGenerate}
        onStop={onStop}
        onCollapse={onCollapse}
        onLogout={onLogout}
      />

      {/* Strip de transcripción — siempre visible */}
      <TranscriptStrip transcript={transcript} />

      {/* Panel de respuestas IA */}
      {showAnswers && (
        <div style={{ padding: '6px 10px' }}>
          <AnswerPanel
            messages={aiMessages}
            currentIndex={currentAnswerIndex}
            isStreaming={isStreaming}
            streamingText={streamingText}
            onNavigate={setCurrentAnswerIndex}
            onClear={handleClearAnswers}
            onClose={() => setShowAnswers(false)}
          />
        </div>
      )}

      {/* Panel de chat */}
      {showChat && (
        <div style={{ padding: '6px 10px' }}>
          <ChatPanel onSend={handleChatSend} onClose={() => setShowChat(false)} />
        </div>
      )}
    </div>
  );
}
