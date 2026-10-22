import { X } from "lucide-react";
import { useMemo } from "react";
import { ToolButton } from "./ToolButton";
import {
  createStateFromPreset,
  uploadedImagePresetId,
  useKaleidoscope,
} from "../store/kaleidoscopeStore";
import { useKaleidoscopeThumbnail } from "./useKaleidoscopeThumbnail";

type ArtworkInfoProps = {
  isOpen: boolean;
  onClose: () => void;
};

const petalModeLabels = {
  six: "六瓣",
  seven: "七瓣",
  eight: "八瓣",
};

export function ArtworkInfo({ isOpen, onClose }: ArtworkInfoProps) {
  const { currentPreset, settings } = useKaleidoscope();
  const materials = currentPreset.materialObjects.slice(0, 5);
  const isUploadedImageWork =
    settings.selectedPresetId === uploadedImagePresetId &&
    Boolean(settings.uploadedImage);
  const previewSettings = useMemo(() => {
    if (!isOpen) {
      return null;
    }

    return isUploadedImageWork
      ? settings
      : createStateFromPreset(currentPreset);
  }, [currentPreset, isOpen, isUploadedImageWork, settings]);
  const thumbnail = useKaleidoscopeThumbnail(
    isUploadedImageWork
      ? `${uploadedImagePresetId}-${settings.uploadedImage?.url ?? ""}`
      : currentPreset.id,
    previewSettings,
  );

  return (
    <aside
      id="artwork-info"
      className={`artwork-drawer ${isOpen ? "is-open" : ""}`}
      aria-hidden={!isOpen}
      inert={!isOpen}
      aria-label="作品信息"
    >
      <div className="drawer-card">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">{currentPreset.inspirationName}</p>
            <h2>{currentPreset.title}</h2>
          </div>
          <ToolButton label="关闭作品信息" onClick={onClose}>
            <X size={18} strokeWidth={1.5} />
          </ToolButton>
        </div>

        <div className="artwork-preview">
          {thumbnail ? (
            <img
              className="artwork-preview-image"
              src={thumbnail}
              alt=""
              draggable={false}
            />
          ) : (
            <div className="artwork-preview-placeholder" />
          )}
          <span>{petalModeLabels[currentPreset.petalMode]}</span>
        </div>

        <p className="artwork-subtitle">{currentPreset.subtitle}</p>
        <p className="artwork-story">{currentPreset.backgroundStory}</p>

        <div className="material-chips" aria-label="材质组合">
          {materials.map((material) => (
            <span key={material.type}>{material.label}</span>
          ))}
        </div>
      </div>
    </aside>
  );
}
