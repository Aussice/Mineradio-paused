import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ToolButton } from "./ToolButton";
import { presets, type ArtKaleidoscopePreset } from "../presets";
import {
  createStateFromPreset,
  uploadedImagePresetId,
  useKaleidoscope,
  type KaleidoscopeState,
} from "../store/kaleidoscopeStore";
import { useKaleidoscopeThumbnail } from "./useKaleidoscopeThumbnail";

export function PresetBar() {
  const { activateUploadedImageMode, applyPreset, settings } =
    useKaleidoscope();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const scrollGallery = (direction: -1 | 1) => {
    trackRef.current?.scrollBy({
      left: direction * 520,
      behavior: "smooth",
    });
  };

  return (
    <nav
      className={`preset-gallery ${isOpen ? "is-open" : ""}`}
      aria-label="作品库"
    >
      <div className="preset-gallery-head">
        <button
          className="gallery-toggle"
          type="button"
          aria-expanded={isOpen}
          aria-controls="gallery-content"
          onClick={() => setIsOpen((open) => !open)}
        >
          <span>作品集</span>
          <span className="gallery-count">
            {String(presets.length + (settings.uploadedImage ? 1 : 0)).padStart(
              2,
              "0",
            )}
          </span>
          {isOpen ? (
            <ChevronDown size={16} strokeWidth={1.5} />
          ) : (
            <ChevronUp size={16} strokeWidth={1.5} />
          )}
        </button>
        <div className="gallery-nav" aria-label="浏览作品">
          <ToolButton
            label="向左浏览作品"
            disabled={!isOpen}
            onClick={() => scrollGallery(-1)}
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
          </ToolButton>
          <ToolButton
            label="向右浏览作品"
            disabled={!isOpen}
            onClick={() => scrollGallery(1)}
          >
            <ArrowRight size={16} strokeWidth={1.5} />
          </ToolButton>
        </div>
      </div>

      <div
        id="gallery-content"
        className="gallery-content"
        inert={!isOpen}
        aria-hidden={!isOpen}
      >
        <div className="preset-viewport">
          <div className="preset-track" ref={trackRef}>
            {settings.uploadedImage ? (
              <PresetCard
                isActive={settings.selectedPresetId === uploadedImagePresetId}
                kicker="Image Work"
                onClick={activateUploadedImageMode}
                settings={settings}
                subtitle="上传照片生成的独立万花筒"
                title="影像花镜"
                thumbnailKey={`${uploadedImagePresetId}-${settings.uploadedImage.url}`}
              />
            ) : null}

            {presets.map((preset) => (
              <PresetCard
                isActive={settings.selectedPresetId === preset.id}
                key={preset.id}
                kicker={petalModeLabel(preset.petalMode)}
                onClick={() => applyPreset(preset.id)}
                preset={preset}
                subtitle={shortenSubtitle(preset.subtitle)}
                title={preset.title}
                thumbnailKey={preset.id}
              />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

function PresetCard({
  isActive,
  kicker,
  onClick,
  preset,
  settings,
  subtitle,
  title,
  thumbnailKey,
}: {
  isActive: boolean;
  kicker: string;
  onClick: () => void;
  preset?: ArtKaleidoscopePreset;
  settings?: KaleidoscopeState;
  subtitle: string;
  title: string;
  thumbnailKey: string;
}) {
  const thumbnailSettings = useMemo(
    () => settings ?? (preset ? createStateFromPreset(preset) : null),
    [preset, settings],
  );
  const thumbnail = useKaleidoscopeThumbnail(thumbnailKey, thumbnailSettings);

  return (
    <button
      className={`preset-card ${isActive ? "is-active" : ""}`}
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
    >
      <span className="preset-cover">
        {thumbnail ? (
          <img
            className="preset-preview"
            src={thumbnail}
            alt=""
            draggable={false}
          />
        ) : (
          <span className="preset-preview preset-preview-loading" />
        )}
      </span>
      <span className="preset-copy">
        <span className="preset-title">
          <strong>{title}</strong>
          {isActive ? (
            <Check size={14} strokeWidth={1.5} aria-hidden="true" />
          ) : null}
        </span>
        <span className="preset-kicker">{kicker}</span>
        <small>{subtitle}</small>
      </span>
    </button>
  );
}

function petalModeLabel(mode: "six" | "seven" | "eight") {
  if (mode === "six") {
    return "六瓣作品";
  }

  if (mode === "seven") {
    return "七瓣作品";
  }

  return "八瓣作品";
}

function shortenSubtitle(subtitle: string) {
  return subtitle.length > 24 ? `${subtitle.slice(0, 24)}...` : subtitle;
}
