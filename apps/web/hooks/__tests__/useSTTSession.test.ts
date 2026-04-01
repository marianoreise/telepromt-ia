/**
 * Tests for useSTTSession hook.
 *
 * WebSocket, AudioContext and navigator.mediaDevices are all mocked because
 * they are browser-only APIs unavailable in jsdom.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSTTSession } from '../useSTTSession'

// ── WebSocket mock ────────────────────────────────────────────────────────────

type WSHandler = ((event: MessageEvent | Event | CloseEvent) => void) | null

class MockWebSocket {
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState: number = MockWebSocket.OPEN
  onopen: WSHandler = null
  onmessage: WSHandler = null
  onerror: WSHandler = null
  onclose: WSHandler = null
  sentMessages: Array<string | ArrayBuffer> = []

  send(data: string | ArrayBuffer) { this.sentMessages.push(data) }

  close() {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.(new CloseEvent('close'))
  }

  simulateOpen() { this.onopen?.(new Event('open')) }
  simulateMessage(data: object) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }))
  }
  simulateError() { this.onerror?.(new Event('error')) }
}

let mockWs: MockWebSocket

const MockWS = class extends MockWebSocket {
  constructor(_url: string) {
    super()
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    mockWs = this
  }
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
}

vi.stubGlobal('WebSocket', MockWS)

// ── AudioContext mock — must be a class so new AudioContext() works ───────────

const mockProcessor = {
  onaudioprocess: null as ((e: AudioProcessingEvent) => void) | null,
  connect: vi.fn(),
  disconnect: vi.fn(),
}

const mockSource = { connect: vi.fn() }

class MockAudioContext {
  sampleRate = 16000
  destination = {}
  createMediaStreamSource() { return mockSource }
  createScriptProcessor() { return mockProcessor }
  close = vi.fn()
}

vi.stubGlobal('AudioContext', MockAudioContext)

// ── MediaDevices mock ─────────────────────────────────────────────────────────

const mockTrack = { stop: vi.fn() }
const mockStream = { getTracks: vi.fn(() => [mockTrack]) }

const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream)
const mockGetDisplayMedia = vi.fn().mockResolvedValue(mockStream)

Object.defineProperty(globalThis.navigator, 'mediaDevices', {
  configurable: true,
  value: {
    getUserMedia: mockGetUserMedia,
    getDisplayMedia: mockGetDisplayMedia,
  },
})

// ── Helper: render + connect + get "connected" state ─────────────────────────

async function setupConnected() {
  const hook = renderHook(() => useSTTSession())
  await act(async () => { hook.result.current.connect('token', 'es') })
  act(() => { mockWs.simulateOpen() })
  act(() => {
    mockWs.simulateMessage({ type: 'connected', session_id: 'sess-1', balance: 5 })
  })
  return hook
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('useSTTSession — initial state', () => {
  it('starts with status idle', () => {
    const { result } = renderHook(() => useSTTSession())
    expect(result.current.state.status).toBe('idle')
  })

  it('starts with null error', () => {
    const { result } = renderHook(() => useSTTSession())
    expect(result.current.state.error).toBeNull()
  })

  it('starts with empty transcript history', () => {
    const { result } = renderHook(() => useSTTSession())
    expect(result.current.state.transcriptHistory).toHaveLength(0)
  })

  it('starts with empty AI response history', () => {
    const { result } = renderHook(() => useSTTSession())
    expect(result.current.state.aiResponseHistory).toHaveLength(0)
  })

  it('starts with isAIThinking false', () => {
    const { result } = renderHook(() => useSTTSession())
    expect(result.current.state.isAIThinking).toBe(false)
  })

  it('starts with null balance', () => {
    const { result } = renderHook(() => useSTTSession())
    expect(result.current.state.balance).toBeNull()
  })
})

describe('useSTTSession — connect', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('sets status to connecting immediately on connect call', async () => {
    const { result } = renderHook(() => useSTTSession())
    act(() => { result.current.connect('t', 'es') })
    expect(result.current.state.status).toBe('connecting')
  })

  it('sends token + language handshake on WebSocket open', async () => {
    const { result } = renderHook(() => useSTTSession())
    await act(async () => { result.current.connect('tok-xyz', 'en') })
    act(() => { mockWs.simulateOpen() })
    const sent = JSON.parse(mockWs.sentMessages[0] as string)
    expect(sent.token).toBe('tok-xyz')
    expect(sent.language).toBe('en')
  })

  it('sets status connected + sessionId + balance on "connected" message', async () => {
    const { result } = renderHook(() => useSTTSession())
    await act(async () => { result.current.connect('t', 'es') })
    act(() => { mockWs.simulateOpen() })
    act(() => {
      mockWs.simulateMessage({ type: 'connected', session_id: 'abc', balance: 10 })
    })
    expect(result.current.state.status).toBe('connected')
    expect(result.current.state.sessionId).toBe('abc')
    expect(result.current.state.balance).toBe(10)
  })

  it('sets status to error on WebSocket error', async () => {
    const { result } = renderHook(() => useSTTSession())
    await act(async () => { result.current.connect('t', 'es') })
    act(() => { mockWs.simulateError() })
    expect(result.current.state.status).toBe('error')
    expect(result.current.state.error).toBeTruthy()
  })

  it('does not open a second connection when already connected', async () => {
    const { result } = renderHook(() => useSTTSession())
    await act(async () => { result.current.connect('t', 'es') })
    act(() => { mockWs.simulateOpen() })
    const firstInstance = mockWs
    // Calling connect again should be a no-op
    await act(async () => { result.current.connect('t2', 'en') })
    expect(mockWs).toBe(firstInstance)
  })
})

describe('useSTTSession — transcript messages', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('updates currentTranscript for non-final transcripts', async () => {
    const { result } = await setupConnected()
    act(() => {
      mockWs.simulateMessage({ type: 'transcript', text: 'hola', is_final: false })
    })
    expect(result.current.state.currentTranscript).toBe('hola')
    expect(result.current.state.transcriptHistory).toHaveLength(0)
  })

  it('moves finalized text to transcriptHistory', async () => {
    const { result } = await setupConnected()
    act(() => {
      mockWs.simulateMessage({ type: 'transcript', text: 'Texto final.', is_final: true })
    })
    expect(result.current.state.transcriptHistory).toHaveLength(1)
    expect(result.current.state.transcriptHistory[0].text).toBe('Texto final.')
    expect(result.current.state.transcriptHistory[0].isFinal).toBe(true)
    expect(result.current.state.currentTranscript).toBe('')
  })

  it('clears currentTranscript when a final transcript arrives', async () => {
    const { result } = await setupConnected()
    act(() => {
      mockWs.simulateMessage({ type: 'transcript', text: 'interim', is_final: false })
    })
    act(() => {
      mockWs.simulateMessage({ type: 'transcript', text: 'interim definitivo', is_final: true })
    })
    expect(result.current.state.currentTranscript).toBe('')
  })

  it('ignores final transcript that is only whitespace', async () => {
    const { result } = await setupConnected()
    act(() => {
      mockWs.simulateMessage({ type: 'transcript', text: '   ', is_final: true })
    })
    expect(result.current.state.transcriptHistory).toHaveLength(0)
  })

  it('accumulates multiple final transcripts', async () => {
    const { result } = await setupConnected()
    act(() => {
      mockWs.simulateMessage({ type: 'transcript', text: 'Primera oración.', is_final: true })
    })
    act(() => {
      mockWs.simulateMessage({ type: 'transcript', text: 'Segunda oración.', is_final: true })
    })
    expect(result.current.state.transcriptHistory).toHaveLength(2)
  })
})

describe('useSTTSession — AI response streaming', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('sets isAIThinking true and clears currentAIResponse on ai_start', async () => {
    const { result } = await setupConnected()
    act(() => { mockWs.simulateMessage({ type: 'ai_start' }) })
    expect(result.current.state.isAIThinking).toBe(true)
    expect(result.current.state.currentAIResponse).toBe('')
  })

  it('appends chunks to currentAIResponse on ai_chunk', async () => {
    const { result } = await setupConnected()
    act(() => { mockWs.simulateMessage({ type: 'ai_start' }) })
    act(() => { mockWs.simulateMessage({ type: 'ai_chunk', chunk: 'Hola ' }) })
    act(() => { mockWs.simulateMessage({ type: 'ai_chunk', chunk: 'mundo.' }) })
    expect(result.current.state.currentAIResponse).toBe('Hola mundo.')
  })

  it('finalizes response and clears isAIThinking on ai_done', async () => {
    const { result } = await setupConnected()
    act(() => { mockWs.simulateMessage({ type: 'ai_start' }) })
    act(() => { mockWs.simulateMessage({ type: 'ai_chunk', chunk: 'Respuesta completa.' }) })
    act(() => { mockWs.simulateMessage({ type: 'ai_done' }) })
    expect(result.current.state.isAIThinking).toBe(false)
    expect(result.current.state.aiResponseHistory).toHaveLength(1)
    expect(result.current.state.aiResponseHistory[0].text).toBe('Respuesta completa.')
  })

  it('accumulates multiple AI responses in history', async () => {
    const { result } = await setupConnected()
    for (const text of ['Primera.', 'Segunda.']) {
      act(() => { mockWs.simulateMessage({ type: 'ai_start' }) })
      act(() => { mockWs.simulateMessage({ type: 'ai_chunk', chunk: text }) })
      act(() => { mockWs.simulateMessage({ type: 'ai_done' }) })
    }
    expect(result.current.state.aiResponseHistory).toHaveLength(2)
  })
})

describe('useSTTSession — credit warning and out_of_credits', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('sets status out_of_credits on server message', async () => {
    const { result } = await setupConnected()
    act(() => { mockWs.simulateMessage({ type: 'out_of_credits' }) })
    expect(result.current.state.status).toBe('out_of_credits')
  })
})

describe('useSTTSession — server error message', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('sets status error and error text on "error" type message', async () => {
    const { result } = await setupConnected()
    act(() => {
      mockWs.simulateMessage({ type: 'error', message: 'token inválido' })
    })
    expect(result.current.state.status).toBe('error')
    expect(result.current.state.error).toBe('token inválido')
  })
})

describe('useSTTSession — startListening mic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUserMedia.mockResolvedValue(mockStream)
  })

  it('sets status to listening after mic access is granted', async () => {
    const { result } = await setupConnected()
    await act(async () => { await result.current.startListening('mic') })
    expect(result.current.state.status).toBe('listening')
  })

  it('calls getUserMedia with audio:true', async () => {
    const { result } = await setupConnected()
    await act(async () => { await result.current.startListening('mic') })
    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true })
  })

  it('sets NotAllowedError message when mic is denied', async () => {
    mockGetUserMedia.mockRejectedValueOnce(
      Object.assign(new Error('denied'), { name: 'NotAllowedError' })
    )
    const { result } = renderHook(() => useSTTSession())
    await act(async () => { await result.current.startListening('mic') })
    expect(result.current.state.status).toBe('error')
    expect(result.current.state.error).toBe('Permiso de micrófono denegado')
  })

  it('sets generic error message for non-permission errors', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('hardware failure'))
    const { result } = renderHook(() => useSTTSession())
    await act(async () => { await result.current.startListening('mic') })
    expect(result.current.state.error).toBe('No se pudo acceder al audio')
  })
})

describe('useSTTSession — startListening system audio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetDisplayMedia.mockResolvedValue(mockStream)
  })

  it('calls getDisplayMedia when source is "system"', async () => {
    const { result } = await setupConnected()
    await act(async () => { await result.current.startListening('system') })
    expect(mockGetDisplayMedia).toHaveBeenCalled()
  })

  it('sets status to listening on system audio success', async () => {
    const { result } = await setupConnected()
    await act(async () => { await result.current.startListening('system') })
    expect(result.current.state.status).toBe('listening')
  })
})

describe('useSTTSession — stopListening', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUserMedia.mockResolvedValue(mockStream)
  })

  it('calls processor.disconnect and track.stop', async () => {
    const { result } = await setupConnected()
    await act(async () => { await result.current.startListening('mic') })
    act(() => { result.current.stopListening() })
    expect(mockProcessor.disconnect).toHaveBeenCalled()
    expect(mockTrack.stop).toHaveBeenCalled()
  })

  it('returns status to connected after stopping mic', async () => {
    const { result } = await setupConnected()
    await act(async () => { await result.current.startListening('mic') })
    expect(result.current.state.status).toBe('listening')
    act(() => { result.current.stopListening() })
    // WS is still OPEN so status reverts to connected
    expect(result.current.state.status).toBe('connected')
  })
})

describe('useSTTSession — requestAI', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('sends { type: "request_ai" } over the WebSocket', async () => {
    const { result } = await setupConnected()
    act(() => { result.current.requestAI() })
    const lastMsg = mockWs.sentMessages.at(-1) as string
    expect(JSON.parse(lastMsg)).toEqual({ type: 'request_ai' })
  })
})

describe('useSTTSession — disconnect', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('resets all state to initial values', async () => {
    const { result } = await setupConnected()
    act(() => { result.current.disconnect() })
    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.sessionId).toBeNull()
    expect(result.current.state.balance).toBeNull()
    expect(result.current.state.transcriptHistory).toHaveLength(0)
    expect(result.current.state.aiResponseHistory).toHaveLength(0)
  })
})

describe('useSTTSession — robustness', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('does not throw on malformed (non-JSON) WebSocket message', async () => {
    const { result } = await setupConnected()
    expect(() => {
      act(() => {
        const event = new MessageEvent('message', { data: 'NOT-JSON {{' })
        mockWs.onmessage?.(event)
      })
    }).not.toThrow()
  })

  it('does not throw on unknown message type', async () => {
    const { result } = await setupConnected()
    expect(() => {
      act(() => { mockWs.simulateMessage({ type: 'unknown_future_type', payload: 42 }) })
    }).not.toThrow()
  })
})
