import { useCallback, useEffect, useRef, useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ArtworkInfo } from './components/ArtworkInfo';
import { PresetBar } from './components/PresetBar';
import { TopBar } from './components/TopBar';
import { WebGLCanvas } from './components/WebGLCanvas';
import { KaleidoscopeProvider } from './store/kaleidoscopeStore';

export default function App() {
  const shellRef = useRef<HTMLElement | null>(null);
  const [isImmersive, setIsImmersive] = useState(false);
  const [isArtworkOpen, setIsArtworkOpen] = useState(false);

  const enterImmersive = useCallback(async () => {
    setIsImmersive(true);

    if (shellRef.current && !document.fullscreenElement) {
      try {
        await shellRef.current.requestFullscreen();
      } catch {
        setIsImmersive(true);
      }
    }
  }, []);

  useEffect(() => {
    const syncFullscreenState = () => {
      if (!document.fullscreenElement) {
        setIsImmersive(false);
      }
    };

    const exitWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsImmersive(false);
      }
    };

    document.addEventListener('fullscreenchange', syncFullscreenState);
    document.addEventListener('keydown', exitWithEscape);

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState);
      document.removeEventListener('keydown', exitWithEscape);
    };
  }, []);

  return (
    <KaleidoscopeProvider>
      <main className={`app-shell ${isImmersive ? 'is-immersive' : ''}`} ref={shellRef}>
        <WebGLCanvas />
        {!isImmersive ? (
          <div className="interface-layer">
            <TopBar
              isArtworkOpen={isArtworkOpen}
              onEnterImmersive={enterImmersive}
              onToggleArtwork={() => setIsArtworkOpen((current) => !current)}
            />
            <ArtworkInfo
              isOpen={isArtworkOpen}
              onClose={() => setIsArtworkOpen(false)}
            />
            <PresetBar />
            <ControlPanel />
          </div>
        ) : null}
      </main>
    </KaleidoscopeProvider>
  );
}
