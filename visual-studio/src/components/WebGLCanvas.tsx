import { useEffect, useRef } from 'react';
import { KaleidoscopeRenderer } from '../engine/KaleidoscopeRenderer';
import { useKaleidoscope } from '../store/kaleidoscopeStore';

export function WebGLCanvas() {
  const { settings } = useKaleidoscope();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<KaleidoscopeRenderer | null>(null);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    const renderer = new KaleidoscopeRenderer(hostRef.current, settings);
    rendererRef.current = renderer;
    renderer.start();

    return () => {
      rendererRef.current = null;
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.setSettings(settings);
  }, [settings]);

  return <div className="webgl-stage" ref={hostRef} aria-hidden="true" />;
}
