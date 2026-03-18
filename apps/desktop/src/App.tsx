import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";

// ── Types ────────────────────────────────────────────────────────────────────

type AppState = "hidden" | "listening" | "thinking" | "showing";

interface Transcript {
  text: string;
  isFinal: boolean;
}

interface AIResponse {
  text: string;
  isStreaming: boolean;
}

// ── Styles (inline — no CSS file to avoid flash) ─────────────────────────────

const styles = {
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    padding: "12px",
    gap: "8px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: "13px",
    color: "#fff",
    userSelect: "none" as const,
    pointerEvents: "none" as const,
  },
  panel: {
    background: "rgba(10, 10, 20, 0.82)",
    backdropFilter: "blur(12px)",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "10px 14px",
    pointerEvents: "auto" as const,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "4px",
  },
  dot: (color: string) => ({
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: color,
    display: "inline-block",
    marginRight: "6px",
  }),
  label: {
    fontSize: "10px",
    fontWeight: 600 as const,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    opacity: 0.5,
  },
  text: {
    lineHeight: 1.5,
    opacity: 0.9,
    wordBreak: "break-word" as const,
  },
  controls: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap" as const,
    pointerEvents: "auto" as const,
  },
  btn: (active?: boolean, danger?: boolean) => ({
    padding: "4px 10px",
    borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: danger
      ? "rgba(220,50,50,0.35)"
      : active
      ? "rgba(100,200,120,0.35)"
      : "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: "11px",
    cursor: "pointer",
    fontWeight: 500 as const,
    transition: "background 0.15s",
  }),
  shortcut: {
    fontSize: "9px",
    opacity: 0.4,
    marginLeft: "4px",
  },
};

// ── State dots ────────────────────────────────────────────────────────────────

const STATE_COLORS: Record<AppState, string> = {
  hidden: "#666",
  listening: "#4ade80",
  thinking: "#facc15",
  showing: "#60a5fa",
};

const STATE_LABELS: Record<AppState, string> = {
  hidden: "Inactivo",
  listening: "Escuchando",
  thinking: "Procesando",
  showing: "Respuesta lista",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function App() {
  const [appState, setAppState] = useState<AppState>("hidden");
  const [visible, setVisible] = useState(true);
  const [mousePassthrough, setMousePassthrough] = useState(true);
  const [transcript, setTranscript] = useState<Transcript>({ text: "", isFinal: false });
  const [aiResponse, setAiResponse] = useState<AIResponse>({ text: "", isStreaming: false });
  const [opacity, setOpacity] = useState(0.85);
  const [version, setVersion] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  // Load version
  useEffect(() => {
    invoke<string>("get_app_version").then(setVersion).catch(() => {});
  }, []);

  // Global shortcuts
  useEffect(() => {
    const shortcuts = [
      // Ctrl+Shift+T → toggle overlay visibility
      {
        key: "CommandOrControl+Shift+T",
        handler: () => toggleVisible(),
      },
      // Ctrl+Shift+M → toggle mouse passthrough
      {
        key: "CommandOrControl+Shift+M",
        handler: () => toggleMouse(),
      },
      // Ctrl+Shift+C → clear response
      {
        key: "CommandOrControl+Shift+C",
        handler: () => clearResponse(),
      },
    ];

    shortcuts.forEach(({ key, handler }) => {
      register(key, handler).catch(() => {});
    });

    return () => {
      shortcuts.forEach(({ key }) => {
        unregister(key).catch(() => {});
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const toggleVisible = useCallback(() => {
    setVisible((v) => {
      const next = !v;
      invoke("set_overlay_visible", { visible: next }).catch(() => {});
      return next;
    });
  }, []);

  const toggleMouse = useCallback(() => {
    setMousePassthrough((v) => {
      const next = !v;
      invoke("set_ignore_mouse", { ignore: next }).catch(() => {});
      return next;
    });
  }, []);

  const clearResponse = useCallback(() => {
    setTranscript({ text: "", isFinal: false });
    setAiResponse({ text: "", isStreaming: false });
    setAppState("hidden");
  }, []);

  const connectAudio = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
      setAppState("hidden");
      return;
    }

    // Connect to backend STT WebSocket
    const backendUrl = import.meta.env.VITE_BACKEND_WS_URL || "ws://localhost:8000";
    const ws = new WebSocket(`${backendUrl}/ws/stt`);
    wsRef.current = ws;

    ws.onopen = () => setAppState("listening");
    ws.onclose = () => setAppState("hidden");
    ws.onerror = () => setAppState("hidden");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "transcript") {
          setTranscript({ text: data.text, isFinal: data.is_final });
          if (data.is_final && data.text.trim()) {
            setAppState("thinking");
          }
        }

        if (data.type === "ai_start") {
          setAiResponse({ text: "", isStreaming: true });
          setAppState("showing");
        }

        if (data.type === "ai_chunk") {
          setAiResponse((prev) => ({ text: prev.text + data.chunk, isStreaming: true }));
        }

        if (data.type === "ai_done") {
          setAiResponse((prev) => ({ text: prev.text, isStreaming: false }));
        }
      } catch {
        // ignore malformed messages
      }
    };
  }, []);

  // ── Opacity control via wheel on panel ──────────────────────────────────────

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setOpacity((o) => Math.min(1, Math.max(0.2, o - e.deltaY * 0.001)));
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!visible) return null;

  const isConnected = appState !== "hidden";

  return (
    <div style={{ ...styles.container, opacity }}>
      {/* Status bar */}
      <div style={styles.panel} onWheel={handleWheel}>
        <div style={styles.header}>
          <span>
            <span style={styles.dot(STATE_COLORS[appState])} />
            <span style={{ fontWeight: 600 }}>{STATE_LABELS[appState]}</span>
          </span>
          {version && <span style={styles.label}>v{version}</span>}
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <button style={styles.btn(isConnected)} onClick={connectAudio}>
            {isConnected ? "⏹ Detener" : "▶ Iniciar"}
            <span style={styles.shortcut}>Ctrl+Shift+T</span>
          </button>

          <button style={styles.btn(mousePassthrough)} onClick={toggleMouse}>
            {mousePassthrough ? "🖱 Mouse: Off" : "🖱 Mouse: On"}
            <span style={styles.shortcut}>Ctrl+Shift+M</span>
          </button>

          <button style={styles.btn(false, true)} onClick={clearResponse}>
            ✕ Limpiar
            <span style={styles.shortcut}>Ctrl+Shift+C</span>
          </button>
        </div>
      </div>

      {/* Transcript panel */}
      {transcript.text && (
        <div style={styles.panel}>
          <div style={styles.label}>
            <span style={styles.dot("#94a3b8")} />
            Transcripción
            {!transcript.isFinal && " •••"}
          </div>
          <p style={{ ...styles.text, opacity: transcript.isFinal ? 0.9 : 0.55, marginTop: "4px" }}>
            {transcript.text}
          </p>
        </div>
      )}

      {/* AI Response panel */}
      {aiResponse.text && (
        <div style={{ ...styles.panel, borderColor: "rgba(96,165,250,0.3)" }}>
          <div style={styles.label}>
            <span style={styles.dot("#60a5fa")} />
            Respuesta IA
            {aiResponse.isStreaming && " •••"}
          </div>
          <p style={{ ...styles.text, marginTop: "4px" }}>{aiResponse.text}</p>
        </div>
      )}
    </div>
  );
}
