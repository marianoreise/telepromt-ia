'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

function getWsUrl(): string {
  return API_URL.replace(/^https?/, (m) => (m === 'https' ? 'wss' : 'ws')) + '/ws/stt'
}

function floatToInt16(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length)
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]))
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return output
}

export type AudioSource = 'mic' | 'system'

export type STTStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'error'
  | 'out_of_credits'

export interface TranscriptEntry {
  text: string
  isFinal: boolean
  timestamp: number
}

export interface AIResponseEntry {
  text: string
  timestamp: number
}

export interface STTSessionState {
  status: STTStatus
  currentTranscript: string
  transcriptHistory: TranscriptEntry[]
  currentAIResponse: string
  aiResponseHistory: AIResponseEntry[]
  isAIThinking: boolean
  balance: number | null
  error: string | null
  sessionId: string | null
  displayStream: MediaStream | null
}

const INITIAL_STATE: STTSessionState = {
  status: 'idle',
  currentTranscript: '',
  transcriptHistory: [],
  currentAIResponse: '',
  aiResponseHistory: [],
  isAIThinking: false,
  balance: null,
  error: null,
  sessionId: null,
  displayStream: null,
}

export function useSTTSession() {
  const [state, setState] = useState<STTSessionState>(INITIAL_STATE)

  const wsRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const aiBufferRef = useRef<string>('')

  const updateState = useCallback((patch: Partial<STTSessionState>) => {
    setState((prev) => ({ ...prev, ...patch }))
  }, [])

  // ── Connect to backend WebSocket ─────────────────────────────────────────
  const connect = useCallback(
    async (
      token: string,
      language: string,
      sessionConfig?: {
        company?: string
        job_title?: string
        extra_context?: string
        ai_model?: string
        auto_generate?: boolean
      }
    ) => {
      if (wsRef.current) return

      updateState({ status: 'connecting', error: null })

      const ws = new WebSocket(getWsUrl())
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({ token, language, ...sessionConfig }))
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string)

          if (msg.type === 'connected') {
            updateState({
              status: 'connected',
              sessionId: msg.session_id as string,
              balance: msg.balance as number,
            })
          } else if (msg.type === 'transcript') {
            const text = msg.text as string
            const isFinal = msg.is_final as boolean
            if (isFinal && text.trim()) {
              setState((prev) => ({
                ...prev,
                currentTranscript: '',
                transcriptHistory: [
                  ...prev.transcriptHistory,
                  { text, isFinal: true, timestamp: Date.now() },
                ],
              }))
            } else if (!isFinal) {
              updateState({ currentTranscript: text })
            }
          } else if (msg.type === 'ai_start') {
            aiBufferRef.current = ''
            updateState({ isAIThinking: true, currentAIResponse: '' })
          } else if (msg.type === 'ai_chunk') {
            aiBufferRef.current += msg.chunk as string
            updateState({ currentAIResponse: aiBufferRef.current })
          } else if (msg.type === 'ai_done') {
            const full = aiBufferRef.current
            setState((prev) => ({
              ...prev,
              isAIThinking: false,
              currentAIResponse: full,
              aiResponseHistory: [
                ...prev.aiResponseHistory,
                { text: full, timestamp: Date.now() },
              ],
            }))
            aiBufferRef.current = ''
          } else if (msg.type === 'warn') {
            if (typeof msg.seconds_remaining === 'number') {
              updateState({ balance: null }) // force UI refresh
            }
          } else if (msg.type === 'out_of_credits') {
            updateState({ status: 'out_of_credits' })
            stopListening()
          } else if (msg.type === 'error') {
            updateState({ status: 'error', error: msg.message as string })
          }
        } catch {
          // non-JSON message, ignore
        }
      }

      ws.onerror = () => {
        updateState({ status: 'error', error: 'Error de conexión con el servidor' })
      }

      ws.onclose = () => {
        if (state.status !== 'out_of_credits') {
          updateState({ status: 'idle' })
        }
        wsRef.current = null
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateState]
  )

  // ── Start audio capture ───────────────────────────────────────────────────
  const startListening = useCallback(async (source: AudioSource = 'mic', existingStream?: MediaStream) => {
    try {
      let stream: MediaStream

      if (existingStream) {
        stream = existingStream
      } else if (source === 'system') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          audio: true,
          video: true,
        } as DisplayMediaStreamOptions)
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      }

      streamRef.current = stream
      // Expose the stream so the UI can render the video track
      const isDisplayShare = source === 'system' || !!existingStream
      updateState({ displayStream: isDisplayShare ? stream : null })

      const audioCtx = new AudioContext({ sampleRate: 16000 })
      audioCtxRef.current = audioCtx

      const source_node = audioCtx.createMediaStreamSource(stream)
      // ScriptProcessorNode is deprecated but widely supported (MVP1)
      // eslint-disable-next-line deprecation/deprecation
      const processor = audioCtx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        const ws = wsRef.current
        if (!ws || ws.readyState !== WebSocket.OPEN) return
        const pcm = floatToInt16(e.inputBuffer.getChannelData(0))
        ws.send(pcm.buffer)
      }

      source_node.connect(processor)
      processor.connect(audioCtx.destination)

      updateState({ status: 'listening', error: null })
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Permiso de micrófono denegado'
          : 'No se pudo acceder al audio'
      updateState({ status: 'error', error: msg })
    }
  }, [updateState])

  // ── Stop audio capture ────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    processorRef.current?.disconnect()
    processorRef.current = null

    audioCtxRef.current?.close()
    audioCtxRef.current = null

    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null

    // Only revert to 'connected' if actively listening — do not overwrite
    // terminal states such as 'out_of_credits' or 'error'.
    setState((prev) => {
      if (prev.status === 'listening' && wsRef.current?.readyState === WebSocket.OPEN) {
        return { ...prev, status: 'connected', displayStream: null }
      }
      return { ...prev, displayStream: null }
    })
  }, [])

  // ── Request AI manually ────────────────────────────────────────────────────
  const requestAI = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'request_ai' }))
  }, [])

  // ── Disconnect WebSocket ──────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    stopListening()
    if (wsRef.current) {
      wsRef.current.send('stop')
      wsRef.current.close()
      wsRef.current = null
    }
    setState(INITIAL_STATE)
  }, [stopListening])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening()
      wsRef.current?.close()
    }
  }, [stopListening])

  return { state, connect, startListening, stopListening, requestAI, disconnect }
}
