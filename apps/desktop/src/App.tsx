// App.tsx — Entry point + router de pantallas — ListnrIO Desktop
// Windows-only · TypeScript strict · estilos inline

import { useState, useEffect, useCallback, useRef } from 'react';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import { getCurrentWindow, currentMonitor } from '@tauri-apps/api/window';
import { LogicalSize, LogicalPosition } from '@tauri-apps/api/dpi';

import type {
  AppScreen,
  User,
  SessionConfig,
  Session,
  Transcript,
  AIMessage,
  SessionType,
} from './types';
import { baseContainer, FONT, RADIUS, tabBar, tabBtn, btnPrimary } from './theme';

import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { MainScreen } from './components/MainScreen';
import { SessionWizard } from './components/SessionWizard/index';
import { ActivateScreen } from './components/ActivateScreen';
import { ActiveSession } from './components/ActiveSession/index';
import { CollapsedView } from './components/CollapsedView';

// ── Config inicial por defecto ────────────────────────────────────────────────

const DEFAULT_CONFIG: Partial<SessionConfig> = {
  language: 'castellano',
  simpleLanguage: false,
  extraContext: '',
  resumeId: null,
  aiModel: 'claude-sonnet-4-5',
  autoGenerate: false,
  saveTranscript: true,
};

// ── Componente principal ───────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('login');
  const [previousScreen, setPreviousScreen] = useState<AppScreen>('main');
  const [user, setUser] = useState<User | null>(null);
  const [sessionConfig, setSessionConfig] = useState<Partial<SessionConfig>>(DEFAULT_CONFIG);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [transcript, setTranscript] = useState<Transcript>({ text: '', isFinal: false });
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  // Ref para previousScreen — necesario en el handler de shortcuts (sin stale closure)
  const previousScreenRef = useRef<AppScreen>('main');

  // ── Navegación ────────────────────────────────────────────────────────────────

  const handleSetScreen = useCallback(
    (nextScreen: AppScreen) => {
      setPreviousScreen(screen);
      previousScreenRef.current = screen;
      setScreen(nextScreen);
    },
    [screen]
  );

  // ── Auth ──────────────────────────────────────────────────────────────────────

  const handleLogin = useCallback((loggedUser: User) => {
    setUser(loggedUser);
    setScreen('main');
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setScreen('login');
    setSessionConfig(DEFAULT_CONFIG);
    wsRef.current?.close();
    wsRef.current = null;
    setIsListening(false);
    setActiveSession(null);
    setTranscript({ text: '', isFinal: false });
    setAiMessages([]);
  }, []);

  // ── Redimensionar ventana según pantalla ──────────────────────────────────────
  // Sesión activa → barra horizontal delgada en la parte superior
  // Resto → panel compacto 420px

  useEffect(() => {
    const win = getCurrentWindow();
    if (screen === 'session-active') {
      currentMonitor().then((monitor) => {
        const scaleFactor = monitor?.scaleFactor ?? 1;
        const screenWidth = monitor?.size.width ?? 1920;
        const logicalWidth = Math.floor(screenWidth / scaleFactor);
        win.setSize(new LogicalSize(logicalWidth, 56)).catch(() => {});
        win.setPosition(new LogicalPosition(0, 0)).catch(() => {});
      }).catch(() => {});
    } else if (screen === 'collapsed') {
      win.setSize(new LogicalSize(56, 56)).catch(() => {});
    } else {
      // Calcular altura según pantalla
      const heights: Partial<Record<AppScreen, number>> = {
        login: 400,
        main: 360,
        wizard: 520,
        activate: 460,
      };
      const h = heights[screen] ?? 480;
      win.setSize(new LogicalSize(420, h)).catch(() => {});
      win.setPosition(new LogicalPosition(20, 80)).catch(() => {});
    }
  }, [screen]);

  // ── Selección de tipo de sesión desde MainScreen ──────────────────────────────

  const handleSelectType = useCallback(
    (type: SessionType) => {
      setSessionConfig((prev) => ({ ...DEFAULT_CONFIG, ...prev, type }));
      handleSetScreen('wizard');
    },
    [handleSetScreen]
  );

  // ── Wizard ────────────────────────────────────────────────────────────────────

  const handleWizardFinish = useCallback(() => {
    handleSetScreen('activate');
  }, [handleSetScreen]);

  const handleWizardBack = useCallback(() => {
    handleSetScreen('main');
  }, [handleSetScreen]);

  const handleConfigChange = useCallback((partial: Partial<SessionConfig>) => {
    setSessionConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  // ── Activar sesión ────────────────────────────────────────────────────────────

  const handleActivate = useCallback(() => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      company: sessionConfig.company ?? 'Sin empresa',
      language: sessionConfig.language ?? 'castellano',
      status: 'active',
      type: sessionConfig.type ?? 'free',
      createdAt: new Date().toISOString(),
    };
    setActiveSession(newSession);
    setTranscript({ text: '', isFinal: false });
    setAiMessages([]);
    setScreen('session-active');
  }, [sessionConfig]);

  const handleActivateBack = useCallback(() => {
    handleSetScreen('wizard');
  }, [handleSetScreen]);

  // ── Fin de sesión ─────────────────────────────────────────────────────────────

  const handleStopSession = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsListening(false);

    if (activeSession) {
      const completed: Session = { ...activeSession, status: 'completed' };
      setSessions((prev) => [completed, ...prev]);
    }

    setActiveSession(null);
    setScreen('main');
  }, [activeSession]);

  // ── Colapsar / Expandir ───────────────────────────────────────────────────────

  const handleCollapse = useCallback(() => {
    previousScreenRef.current = screen;
    setPreviousScreen(screen);
    setScreen('collapsed');
  }, [screen]);

  const handleExpand = useCallback(() => {
    const target: AppScreen =
      previousScreen === 'collapsed' || previousScreen === 'login' ? 'main' : previousScreen;
    setScreen(target);
  }, [previousScreen]);

  // ── AI Messages ───────────────────────────────────────────────────────────────

  const handleAddAIMessage = useCallback((msg: AIMessage) => {
    setAiMessages((prev) => [...prev, msg]);
  }, []);

  // ── Shortcuts globales ────────────────────────────────────────────────────────
  // Ctrl+Shift+T → colapsar/expandir
  // Ctrl+Shift+M → reservado (sin acción en nueva UI)
  // Ctrl+Shift+C → limpiar transcripción y respuestas

  useEffect(() => {
    const shortcuts: { key: string; handler: () => void }[] = [
      {
        key: 'CommandOrControl+Shift+T',
        handler: () => {
          setScreen((current) => {
            if (current === 'collapsed') {
              const prev = previousScreenRef.current;
              return prev === 'collapsed' ? 'main' : prev;
            }
            previousScreenRef.current = current;
            setPreviousScreen(current);
            return 'collapsed';
          });
        },
      },
      {
        key: 'CommandOrControl+Shift+M',
        handler: () => {
          // Sin acción activa en esta versión
        },
      },
      {
        key: 'CommandOrControl+Shift+C',
        handler: () => {
          setTranscript({ text: '', isFinal: false });
          setAiMessages([]);
        },
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

  // ── Render por pantalla ───────────────────────────────────────────────────────

  // Vista colapsada: sin marco, solo icono/soundwave
  if (screen === 'collapsed') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
        }}
      >
        <CollapsedView isSessionActive={activeSession !== null} onExpand={handleExpand} />
      </div>
    );
  }

  // Pantalla de login
  if (screen === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Sesión activa: layout overlay oscuro
  if (screen === 'session-active' && activeSession !== null) {
    return (
      <div style={{ userSelect: 'none', fontFamily: FONT.family }}>
        <ActiveSession
          session={activeSession}
          transcript={transcript}
          aiMessages={aiMessages}
          isListening={isListening}
          wsRef={wsRef}
          accessToken={user?.accessToken ?? ''}
          onSetTranscript={setTranscript}
          onAddAIMessage={handleAddAIMessage}
          onSetAIMessages={setAiMessages}
          onSetIsListening={setIsListening}
          onStop={handleStopSession}
          onCollapse={handleCollapse}
          onSetScreen={handleSetScreen}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  // Sesión activa pero sin datos (edge case): redirigir a main
  if (screen === 'session-active' && activeSession === null) {
    return (
      <div style={baseContainer}>
        <Header user={user} onSetScreen={handleSetScreen} onLogout={handleLogout} />
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <button
            onClick={() => setScreen('main')}
            style={{ ...btnPrimary, fontFamily: FONT.family, borderRadius: RADIUS.md }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Wizard de creación de sesión
  if (screen === 'wizard') {
    return (
      <div style={{ ...baseContainer }}>
        <Header
          user={user}
          onSetScreen={handleSetScreen}
          onLogout={handleLogout}
          previousScreen={previousScreen}
        />
        {/* Tabs fijadas encima del wizard */}
        <div style={tabBar}>
          <button style={{ ...tabBtn(true), fontFamily: FONT.family }}>Crear</button>
          <button
            style={{ ...tabBtn(false), fontFamily: FONT.family }}
            onClick={() => handleSetScreen('main')}
          >
            Sesiones pasadas
          </button>
        </div>
        <SessionWizard
          config={sessionConfig}
          onChange={handleConfigChange}
          onFinish={handleWizardFinish}
          onBack={handleWizardBack}
        />
      </div>
    );
  }

  // Pantalla de confirmación antes de activar
  if (screen === 'activate') {
    return (
      <div style={{ ...baseContainer }}>
        <Header
          user={user}
          onSetScreen={handleSetScreen}
          onLogout={handleLogout}
          previousScreen={previousScreen}
        />
        <ActivateScreen
          config={sessionConfig}
          onActivate={handleActivate}
          onBack={handleActivateBack}
        />
      </div>
    );
  }

  // ── Pantalla principal ────────────────────────────────────────────────────────
  return (
    <div style={{ ...baseContainer, display: 'flex', flexDirection: 'column' }}>
      <Header
        user={user}
        onSetScreen={handleSetScreen}
        onLogout={handleLogout}
        previousScreen={previousScreen}
      />
      <MainScreen sessions={sessions} onSelectType={handleSelectType} />
    </div>
  );
}

