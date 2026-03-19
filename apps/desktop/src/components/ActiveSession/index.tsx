// ActiveSession/index.tsx — Container de la sesión activa

import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Session, Transcript, AIMessage, AppScreen } from '../../types';
import { Toolbar } from './Toolbar';
import { TranscriptPanel } from './TranscriptPanel';
import { AnswerPanel } from './AnswerPanel';
import { ChatPanel } from './ChatPanel';

interface ActiveSessionProps {
  session: Session;
  transcript: Transcript;
  aiMessages: AIMessage[];
  isListening: boolean;
  wsRef: React.MutableRefObject<WebSocket | null>;
  onSetTranscript: (t: Transcript) => void;
  onAddAIMessage: (msg: AIMessage) => void;
  onSetAIMessages: (msgs: AIMessage[]) => void;
  onSetIsListening: (v: boolean) => void;
  onStop: () => void;
  onCollapse: () => void;
  onSetScreen?: (screen: AppScreen) => void;
  onLogout: () => void;
}

export function ActiveSession({
  session,
  transcript,
  aiMessages,
  isListening: _isListening,
  wsRef,
  onSetTranscript,
  onAddAIMessage,
  onSetAIMessages,
  onSetIsListening,
  onStop,
  onCollapse,
  onSetScreen: _onSetScreen,
  onLogout,
}: ActiveSessionProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [isSystemAudioOn, setIsSystemAudioOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(false);
  const [currentAnswerIndex, setCurrentAnswerIndex] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  // Refs para los valores de streaming (evita stale closures en onmessage)
  const streamingQuestionRef = useRef('');
  const streamingTextRef = useRef('');

  // Timer
  const [elapsed, setElapsed] = useState(0); // segundos
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFree = session.type === 'free';
  const maxSeconds = isFree ? 10 * 60 : 0; // 10 min para free

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

    ws.onopen = () => onSetIsListeningRef.current(true);
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

  const handleRequestAI = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'request_ai' }));
    }
    setShowAnswers(true);
    setCurrentAnswerIndex(aiMessages.length);
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

  const handleClearTranscript = () => {
    onSetTranscript({ text: '', isFinal: false });
  };

  const handleClearAnswers = () => {
    onSetAIMessages([]);
    setShowAnswers(false);
    setStreamingText('');
    setIsStreaming(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', userSelect: 'none' }}>
      {/* Barra principal */}
      <Toolbar
        session={session}
        timerDisplay={timerDisplay}
        isSystemAudioOn={isSystemAudioOn}
        isMicOn={isMicOn}
        showTranscript={showTranscript}
        showChat={showChat}
        onToggleTranscript={() => setShowTranscript((v) => !v)}
        onToggleSystemAudio={() => setIsSystemAudioOn((v) => !v)}
        onToggleMic={() => setIsMicOn((v) => !v)}
        onRequestAI={handleRequestAI}
        onScreenshot={handleScreenshot}
        onToggleChat={() => setShowChat((v) => !v)}
        onStop={onStop}
        onCollapse={onCollapse}
        onLogout={onLogout}
      />

      {/* Panel de transcripción */}
      {showTranscript && (
        <TranscriptPanel
          transcript={transcript}
          onClear={handleClearTranscript}
          onCollapse={() => setShowTranscript(false)}
          onClose={() => setShowTranscript(false)}
        />
      )}

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
