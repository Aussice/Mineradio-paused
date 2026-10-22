import { Aperture, Info, Maximize, RotateCw } from "lucide-react";
import { useKaleidoscope } from "../store/kaleidoscopeStore";
import { ToolButton } from "./ToolButton";

type TopBarProps = {
  isArtworkOpen: boolean;
  onEnterImmersive: () => void;
  onToggleArtwork: () => void;
};

export function TopBar({
  isArtworkOpen,
  onEnterImmersive,
  onToggleArtwork,
}: TopBarProps) {
  const { currentPreset, settings, replayIntroAnimation } = useKaleidoscope();

  return (
    <header className="top-bar">
      <div className="brand-lockup">
        <Aperture
          className="brand-symbol"
          size={28}
          strokeWidth={1.25}
          aria-hidden="true"
        />
        <div>
          <h1>
            Kaleidoscope <span>Studio</span>
          </h1>
          <p className="brand-caption">光影之间，万象生花</p>
        </div>
      </div>

      <div className="current-work" aria-live="polite">
        <span>{currentPreset.title}</span>
        <small>{settings.segments} 瓣</small>
      </div>
      <div className="top-actions">
        <ToolButton
          label="作品介绍"
          className={isArtworkOpen ? "is-active" : ""}
          aria-expanded={isArtworkOpen}
          aria-controls="artwork-info"
          onClick={onToggleArtwork}
        >
          <Info size={18} strokeWidth={1.5} aria-hidden="true" />
        </ToolButton>
        <ToolButton label="重新展开" onClick={replayIntroAnimation}>
          <RotateCw size={18} strokeWidth={1.5} aria-hidden="true" />
        </ToolButton>
        <span className="toolbar-divider" aria-hidden="true" />
        <ToolButton label="全屏欣赏" onClick={onEnterImmersive}>
          <Maximize size={18} strokeWidth={1.5} aria-hidden="true" />
        </ToolButton>
      </div>
    </header>
  );
}
