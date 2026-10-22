import {
  ImagePlus,
  RotateCcw,
  Shuffle,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import { ToolButton } from "./ToolButton";
import {
  parameterLimits,
  useKaleidoscope,
  type UploadedImageSettings,
  type VisualParameters,
} from "../store/kaleidoscopeStore";

type ControlKey = keyof VisualParameters;
type UploadControlKey = keyof UploadedImageSettings;

type ControlDefinition<T extends string> = {
  key: T;
  label: string;
  hint: string;
  min?: number;
  max?: number;
  step?: number;
};

export function ControlPanel() {
  const {
    settings,
    updateSettings,
    setUploadedImage,
    updateUploadedImageSettings,
    resetSettings,
    randomizeSettings,
  } = useKaleidoscope();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const controls = useMemo<ControlDefinition<ControlKey>[]>(
    () => [
      {
        key: "segments",
        label: "镜面",
        hint: "控制六、七、八瓣及更多镜面重复数量",
      },
      { key: "rotation", label: "旋转", hint: "调整镜筒整体角度" },
      { key: "zoom", label: "焦距", hint: "改变画面主体占比与密度" },
      { key: "speed", label: "速度", hint: "控制动态流动速度" },
      { key: "colorShift", label: "色移", hint: "轻微改变预设色彩相位" },
      { key: "brightness", label: "亮度", hint: "控制整体曝光" },
      { key: "contrast", label: "对比", hint: "控制玻璃与暗部层次" },
      { key: "centerPull", label: "中心", hint: "改变中心聚合力度" },
    ],
    [],
  );
  const uploadControls = useMemo<ControlDefinition<UploadControlKey>[]>(
    () => [
      {
        key: "strength",
        label: "图像",
        hint: "上传图片在万花筒中的可见强度",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "scale",
        label: "主体",
        hint: "上传图片主体大小",
        min: 0.35,
        max: 2.2,
        step: 0.01,
      },
      {
        key: "coverage",
        label: "覆盖",
        hint: "上传图片扩展到外圈的比例",
        min: 0,
        max: 1,
        step: 0.01,
      },
    ],
    [],
  );

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const updateControl = (key: ControlKey, rawValue: string) => {
    const value =
      key === "segments" ? Math.round(Number(rawValue)) : Number(rawValue);
    updateSettings({ [key]: value });
  };

  const updateUploadControl = (key: UploadControlKey, rawValue: string) => {
    updateUploadedImageSettings({ [key]: Number(rawValue) });
  };

  const uploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setUploadedImage({
      url,
      name: file.name,
    });
  };

  const clearImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setUploadedImage(null);
  };

  return (
    <aside
      className={`control-panel glass-panel ${isDrawerOpen ? "is-open" : ""}`}
    >
      <button
        className="drawer-handle"
        type="button"
        aria-label={isDrawerOpen ? "收起调校面板" : "打开调校面板"}
        aria-expanded={isDrawerOpen}
        aria-controls="control-content"
        onClick={() => setIsDrawerOpen((current) => !current)}
      >
        <span>画面调校</span>
        {isDrawerOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      <div id="control-content" className="control-content">
        <div className="panel-heading">
          <div>
            <h2>画面调校</h2>
          </div>
          <div className="panel-actions">
            <ToolButton label="重置参数" onClick={resetSettings}>
              <RotateCcw size={16} strokeWidth={1.5} aria-hidden="true" />
            </ToolButton>
            <ToolButton label="随机探索" onClick={randomizeSettings}>
              <Shuffle size={16} strokeWidth={1.5} aria-hidden="true" />
            </ToolButton>
          </div>
        </div>

        <div className="control-stack">
          {controls.map((control, index) => {
            const limit = parameterLimits[control.key];
            const value = settings[control.key];

            return (
              <div key={control.key}>
                {index === 0 || index === 4 ? (
                  <p className="control-section-title">
                    {index === 0 ? "构形" : "光色"}
                  </p>
                ) : null}
                <SliderControl
                  control={{ ...control, ...limit }}
                  value={value}
                  onUpdate={(rawValue) => updateControl(control.key, rawValue)}
                />
              </div>
            );
          })}
        </div>

        <div className="upload-panel">
          <div className="upload-panel-head">
            <div>
              <h3>影像创作</h3>
            </div>
            {settings.uploadedImage ? (
              <span className="upload-state">已载入</span>
            ) : null}
          </div>

          {settings.uploadedImage ? (
            <p className="upload-note">{settings.uploadedImage.name}</p>
          ) : null}

          <div className="upload-actions">
            <label className="upload-button">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={uploadImage}
              />
              <ImagePlus size={16} strokeWidth={1.5} aria-hidden="true" />
              {settings.uploadedImage ? "更换图片" : "导入图片"}
            </label>
            {settings.uploadedImage ? (
              <ToolButton label="移除图片" onClick={clearImage}>
                <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
              </ToolButton>
            ) : null}
          </div>

          {settings.uploadedImage ? (
            <div className="upload-control-stack">
              {uploadControls.map((control) => {
                const value = settings.uploadedImageSettings[control.key];

                return (
                  <SliderControl
                    control={control}
                    key={control.key}
                    value={value}
                    onUpdate={(rawValue) =>
                      updateUploadControl(control.key, rawValue)
                    }
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function SliderControl<T extends string>({
  control,
  value,
  onUpdate,
}: {
  control: ControlDefinition<T>;
  value: number;
  onUpdate: (rawValue: string) => void;
}) {
  return (
    <label className="control-row" title={control.hint}>
      <span>{control.label}</span>
      <output>{formatValue(value)}</output>
      <input
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        value={value}
        aria-label={control.label}
        style={
          {
            "--range-progress": `${((value - (control.min ?? 0)) / ((control.max ?? 1) - (control.min ?? 0))) * 100}%`,
          } as CSSProperties
        }
        onChange={(event) => onUpdate(event.currentTarget.value)}
      />
    </label>
  );
}

function formatValue(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}
