// Copyright (c) 2025-2026, Audionut and the autobrr contributors.
// SPDX-License-Identifier: GPL-2.0-or-later

import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "../../i18n";
import { Switch } from "../../components/ui/switch";
import type {
  ConfigMap,
  ConfigValue,
  ScreenshotImage,
  ScreenshotPlan,
  ScreenshotPreviewImage,
  ScreenshotResult,
  ScreenshotSelection,
} from "../../types";

type Props = Readonly<{
  path: string;
  screenshotPlan: ScreenshotPlan | null;
  screenshotsLoading: boolean;
  screenshotsError: string;
  loadScreenshotPlan: (revealSelections?: boolean) => void;
  handleGenerateScreenshots: () => void;
  screenshotConfig: ConfigMap | null;
  updateScreenshotConfigValue: (key: string, value: ConfigValue) => void;
  loadSettings: () => void;
  settingsLoading: boolean;
  applyScreenshotSettings: () => void;
  settingsDirty: boolean;
  screenshotsSettingsSaving: boolean;
  livePreviewSeconds: number;
  setLivePreviewSeconds: Dispatch<SetStateAction<number>>;
  livePreviewFrame: number;
  previewDuration: number;
  previewFrameRate: number;
  clampPreviewSeconds: (value: number) => number;
  stepLivePreview: (direction: number) => void;
  runLivePreview: () => void;
  livePreviewLoading: boolean;
  liveCaptureLoading: boolean;
  handleCapturePreviewFrame: () => void;
  livePreviewError: string;
  livePreviewImage: string;
  setLightboxImage: Dispatch<SetStateAction<string>>;
  setLightboxAlt: Dispatch<SetStateAction<string>>;
  trackerImageURLs: string[];
  handleDeleteAllTrackerImageURLs: () => void;
  handleDeleteTrackerImage: (url: string) => void;
  existingImages: ScreenshotPreviewImage[];
  addFinalSelection: (item: ScreenshotPreviewImage) => void;
  isFinalImageSelected: (pathValue: string) => boolean;
  removeFinalSelection: (imagePath: string) => void;
  handleDeleteAllExistingImages: () => void;
  existingTrackerImages: ScreenshotPreviewImage[];
  handleDeleteAllTrackerImages: () => void;
  handleDeleteExistingImage: (image: ScreenshotImage) => void;
  showFrameSelections: boolean;
  screenshotSelections: ScreenshotSelection[];
  updateSelectionTime: (index: number, value: string) => void;
  updateSelectionFrame: (index: number, value: string) => void;
  handlePreviewSelection: (selection: ScreenshotSelection) => void;
  previewLoadingIndex: number | null;
  previewImages: ScreenshotPreviewImage[];
  handleDeleteAllPreviewImages: () => void;
  finalImages: ScreenshotPreviewImage[];
  finalDragIndex: number | null;
  setFinalDragIndex: Dispatch<SetStateAction<number | null>>;
  reorderFinalSelections: (fromIndex: number, toIndex: number) => void;
  finalResult: ScreenshotResult | null;
  handleDeleteAllFinalImages: () => void;
}>;

export default function ScreenshotsPage(props: Props) {
  const { t } = useTranslation();

  const {
    path,
    screenshotPlan,
    screenshotsLoading,
    screenshotsError,
    loadScreenshotPlan,
    handleGenerateScreenshots,
    screenshotConfig,
    updateScreenshotConfigValue,
    loadSettings,
    settingsLoading,
    applyScreenshotSettings,
    settingsDirty,
    screenshotsSettingsSaving,
    livePreviewSeconds,
    setLivePreviewSeconds,
    livePreviewFrame,
    previewDuration,
    previewFrameRate,
    clampPreviewSeconds,
    stepLivePreview,
    runLivePreview,
    livePreviewLoading,
    liveCaptureLoading,
    handleCapturePreviewFrame,
    livePreviewError,
    livePreviewImage,
    setLightboxImage,
    setLightboxAlt,
    trackerImageURLs,
    handleDeleteAllTrackerImageURLs,
    handleDeleteTrackerImage,
    existingImages,
    addFinalSelection,
    isFinalImageSelected,
    removeFinalSelection,
    handleDeleteAllExistingImages,
    existingTrackerImages,
    handleDeleteAllTrackerImages,
    handleDeleteExistingImage,
    showFrameSelections,
    screenshotSelections,
    updateSelectionTime,
    updateSelectionFrame,
    handlePreviewSelection,
    previewLoadingIndex,
    previewImages,
    handleDeleteAllPreviewImages,
    finalImages,
    finalDragIndex,
    setFinalDragIndex,
    reorderFinalSelections,
    finalResult,
    handleDeleteAllFinalImages,
  } = props;

  const previewTimingDisabled = previewDuration <= 0 || previewFrameRate <= 0;

  return (
    <section className="screens-panel">
      <header className="screens-header">
        <p className="eyebrow">upbrr</p>
        <h1>{t("screenshots.planAndCapture")}</h1>
        <p className="subtitle">{t("screenshots.pageSubtitle")}</p>
      </header>

      <section className="panel screens-actions">
        <div>
          <p className="label">{t("input.sourcePath")}</p>
          <p className="value dupe-path">{path || t("common.noPathSelected")}</p>
          {screenshotPlan ? (
            <div className="screens-meta">
              <p className="muted">
                {t("screenshots.duration", { seconds: screenshotPlan.DurationSeconds.toFixed(1) })}
              </p>
              <p className="muted">
                {t("screenshots.frameRate", { rate: screenshotPlan.FrameRate.toFixed(3) })}
              </p>
              {screenshotPlan.DiscType ? (
                <p className="muted">
                  {t("screenshots.discType", { type: screenshotPlan.DiscType })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="screens-actions__buttons">
          <button
            className="ghost"
            type="button"
            onClick={() => loadScreenshotPlan(true)}
            disabled={screenshotsLoading || !path.trim()}
          >
            {screenshotsLoading ? t("common.loading") : t("screenshots.loadSuggestions")}
          </button>
          <button
            className="primary"
            type="button"
            onClick={handleGenerateScreenshots}
            disabled={screenshotsLoading || !path.trim()}
          >
            {screenshotsLoading ? t("screenshots.capturing") : t("screenshots.generate")}
          </button>
        </div>
      </section>

      <section className="panel screens-settings">
        <details>
          <summary>{t("screenshots.settingsSummary")}</summary>
          {screenshotConfig ? (
            <div className="screens-settings__grid">
              <label className="settings-field">
                <span>{t("screenshots.count")}</span>
                <input
                  type="number"
                  value={
                    typeof screenshotConfig.Screens === "number" ? screenshotConfig.Screens : 0
                  }
                  onChange={(event) =>
                    updateScreenshotConfigValue("Screens", Number(event.target.value))
                  }
                />
              </label>
              <div className="settings-toggle">
                <span>{t("screenshots.tonemapHdr")}</span>
                <Switch
                  aria-label={t("screenshots.tonemapHdr")}
                  checked={Boolean(screenshotConfig.ToneMap)}
                  onChange={(event) => updateScreenshotConfigValue("ToneMap", event.target.checked)}
                />
              </div>
              <div className="settings-toggle">
                <span>{t("screenshots.useLibplacebo")}</span>
                <Switch
                  aria-label={t("screenshots.useLibplacebo")}
                  checked={Boolean(screenshotConfig.UseLibplacebo)}
                  onChange={(event) =>
                    updateScreenshotConfigValue("UseLibplacebo", event.target.checked)
                  }
                />
              </div>
              <div className="settings-toggle">
                <span>{t("screenshots.frameOverlay")}</span>
                <Switch
                  aria-label={t("screenshots.frameOverlay")}
                  checked={Boolean(screenshotConfig.FrameOverlay)}
                  onChange={(event) =>
                    updateScreenshotConfigValue("FrameOverlay", event.target.checked)
                  }
                />
              </div>
              <label className="settings-field">
                <span>{t("screenshots.overlayTextSize")}</span>
                <input
                  type="number"
                  value={
                    typeof screenshotConfig.OverlayTextSize === "number"
                      ? screenshotConfig.OverlayTextSize
                      : 0
                  }
                  onChange={(event) =>
                    updateScreenshotConfigValue("OverlayTextSize", Number(event.target.value))
                  }
                />
              </label>
              <label className="settings-field">
                <span>{t("screenshots.ffmpegCompression")}</span>
                <input
                  type="number"
                  value={
                    typeof screenshotConfig.FFmpegCompression === "number"
                      ? screenshotConfig.FFmpegCompression
                      : 0
                  }
                  onChange={(event) =>
                    updateScreenshotConfigValue("FFmpegCompression", Number(event.target.value))
                  }
                />
              </label>
              <label className="settings-field">
                <span>{t("screenshots.tonemapAlgorithm")}</span>
                <input
                  type="text"
                  value={
                    typeof screenshotConfig.TonemapAlgorithm === "string"
                      ? screenshotConfig.TonemapAlgorithm
                      : ""
                  }
                  onChange={(event) =>
                    updateScreenshotConfigValue("TonemapAlgorithm", event.target.value)
                  }
                />
              </label>
              <label className="settings-field">
                <span>{t("screenshots.desat")}</span>
                <input
                  type="number"
                  step="0.01"
                  value={typeof screenshotConfig.Desat === "number" ? screenshotConfig.Desat : 0}
                  onChange={(event) =>
                    updateScreenshotConfigValue("Desat", Number(event.target.value))
                  }
                />
              </label>
              <div className="settings-toggle">
                <span>{t("screenshots.limitFfmpegConcurrency")}</span>
                <Switch
                  aria-label={t("screenshots.limitFfmpegConcurrency")}
                  checked={Boolean(screenshotConfig.FFmpegLimit)}
                  onChange={(event) =>
                    updateScreenshotConfigValue("FFmpegLimit", event.target.checked)
                  }
                />
              </div>
              <label className="settings-field">
                <span>{t("screenshots.ffmpegConcurrency")}</span>
                <input
                  type="number"
                  value={
                    typeof screenshotConfig.ProcessLimit === "number"
                      ? screenshotConfig.ProcessLimit
                      : 1
                  }
                  onChange={(event) =>
                    updateScreenshotConfigValue("ProcessLimit", Number(event.target.value))
                  }
                />
              </label>
            </div>
          ) : (
            <p className="muted">{t("screenshots.loadSettingsToEdit")}</p>
          )}
          <div className="screens-settings__actions">
            <button
              className="ghost"
              type="button"
              onClick={loadSettings}
              disabled={settingsLoading}
            >
              {settingsLoading ? t("common.loading") : t("common.reload")}
            </button>
            <button
              className="primary"
              type="button"
              onClick={applyScreenshotSettings}
              disabled={settingsLoading || screenshotsSettingsSaving || !settingsDirty}
            >
              {screenshotsSettingsSaving
                ? t("screenshots.applying")
                : t("screenshots.applySettings")}
            </button>
          </div>
        </details>
      </section>

      {screenshotsError ? <p className="error">{screenshotsError}</p> : null}

      {screenshotPlan?.RequiresManualFrames ? (
        <p className="muted">{t("screenshots.missingDuration")}</p>
      ) : null}

      <section className="panel screens-preview">
        <div className="screens-gallery__header">
          <h2>{t("screenshots.livePreview")}</h2>
          <p className="muted">{t("screenshots.livePreviewSubtitle")}</p>
        </div>
        {screenshotPlan ? (
          <div className="screens-preview__body">
            <div className="screens-preview__controls">
              <label className="screens-field">
                <span>{t("screenshots.seconds")}</span>
                <input
                  type="number"
                  step="0.1"
                  value={Number.isFinite(livePreviewSeconds) ? livePreviewSeconds : 0}
                  onChange={(event) =>
                    setLivePreviewSeconds(clampPreviewSeconds(Number(event.target.value)))
                  }
                />
              </label>
              <label className="screens-field">
                <span>{t("screenshots.frame")}</span>
                <input
                  type="number"
                  step="1"
                  value={livePreviewFrame}
                  onChange={(event) => {
                    const nextFrame = Number(event.target.value);
                    if (Number.isFinite(nextFrame) && previewFrameRate > 0) {
                      setLivePreviewSeconds(clampPreviewSeconds(nextFrame / previewFrameRate));
                    } else {
                      setLivePreviewSeconds(0);
                    }
                  }}
                />
              </label>
              <div className="screens-preview__slider">
                <input
                  type="range"
                  min={0}
                  max={Math.max(previewDuration, 0)}
                  step={1 / previewFrameRate}
                  value={clampPreviewSeconds(livePreviewSeconds)}
                  onChange={(event) =>
                    setLivePreviewSeconds(clampPreviewSeconds(Number(event.target.value)))
                  }
                  disabled={previewTimingDisabled}
                />
                <div className="screens-preview__meta">
                  <span className="muted">
                    {t("screenshots.duration", { seconds: previewDuration.toFixed(1) })}
                  </span>
                  <span className="muted">
                    {t("screenshots.frameRate", { rate: previewFrameRate.toFixed(3) })}
                  </span>
                </div>
              </div>
              <div className="screens-preview__buttons">
                <button
                  className="ghost"
                  type="button"
                  onClick={() => stepLivePreview(-1)}
                  disabled={previewTimingDisabled}
                >
                  {t("screenshots.prevFrame")}
                </button>
                <button
                  className="ghost"
                  type="button"
                  onClick={() => stepLivePreview(1)}
                  disabled={previewTimingDisabled}
                >
                  {t("screenshots.nextFrame")}
                </button>
                <button
                  className="ghost"
                  type="button"
                  onClick={runLivePreview}
                  disabled={previewTimingDisabled || livePreviewLoading}
                >
                  {livePreviewLoading ? t("common.loading") : t("screenshots.runPreview")}
                </button>
                <button
                  className="primary"
                  type="button"
                  onClick={handleCapturePreviewFrame}
                  disabled={previewTimingDisabled || liveCaptureLoading}
                >
                  {liveCaptureLoading
                    ? t("screenshots.capturing")
                    : t("screenshots.capturePreview")}
                </button>
              </div>
            </div>
            {livePreviewError ? <p className="error">{livePreviewError}</p> : null}
            <div className="screens-preview__image">
              {livePreviewImage ? (
                <div style={{ position: "relative" }}>
                  <button
                    className="screens-thumb"
                    type="button"
                    onClick={() => {
                      setLightboxImage(livePreviewImage);
                      setLightboxAlt(t("screenshots.livePreviewAlt"));
                    }}
                    style={livePreviewLoading ? { opacity: 0.6 } : {}}
                  >
                    <img src={livePreviewImage} alt={t("screenshots.livePreviewAlt")} />
                  </button>
                  {livePreviewLoading && (
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                        color: "white",
                        textShadow: "0 0 4px black",
                        fontWeight: "bold",
                      }}
                    >
                      {t("common.loading")}
                    </div>
                  )}
                </div>
              ) : livePreviewLoading ? (
                <p className="muted">{t("common.loading")}</p>
              ) : (
                <p className="muted">{t("screenshots.noPreview")}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="muted">{t("screenshots.loadSuggestionsForPreview")}</p>
        )}
      </section>

      {trackerImageURLs.length > 0 ? (
        <section className="panel screens-gallery">
          <div className="screens-gallery__header">
            <h2>{t("screenshots.trackerImages")}</h2>
            <p className="muted">{t("screenshots.trackerImagesSubtitle")}</p>
            <button className="ghost" type="button" onClick={handleDeleteAllTrackerImageURLs}>
              {t("screenshots.deleteAll")}
            </button>
          </div>
          <div className="screens-grid">
            {trackerImageURLs.map((url, index) => (
              <div className="screens-thumb-card" key={`${url}-${index}`}>
                <button
                  className="screens-thumb"
                  type="button"
                  onClick={() => {
                    setLightboxImage(url);
                    setLightboxAlt(t("screenshots.trackerImageAlt"));
                  }}
                >
                  <img src={url} alt={t("screenshots.trackerImageAlt")} loading="lazy" />
                </button>
                <button
                  className="screens-thumb-delete"
                  type="button"
                  onClick={() => handleDeleteTrackerImage(url)}
                >
                  {t("common.delete")}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {existingImages.length > 0 ? (
        <section className="panel screens-gallery">
          <div className="screens-gallery__header">
            <h2>{t("screenshots.existingCaptures")}</h2>
            <p className="muted">{t("screenshots.existingSubtitle")}</p>
            <button className="ghost" type="button" onClick={handleDeleteAllExistingImages}>
              {t("screenshots.deleteAll")}
            </button>
          </div>
          <div className="screens-grid">
            {existingImages.map((item) => (
              <div
                className="screens-thumb-card"
                key={`existing-${item.image.Path || item.image.Index}`}
              >
                <button
                  className="screens-thumb"
                  type="button"
                  onClick={() => {
                    setLightboxImage(item.dataUri);
                    setLightboxAlt(
                      t("screenshots.existingImageAlt", { number: item.image.Index + 1 }),
                    );
                  }}
                >
                  <img
                    src={item.dataUri}
                    alt={t("screenshots.existingImageAlt", { number: item.image.Index + 1 })}
                  />
                </button>
                <button
                  className="ghost"
                  type="button"
                  onClick={() => addFinalSelection(item)}
                  disabled={isFinalImageSelected(item.image.Path)}
                >
                  {isFinalImageSelected(item.image.Path)
                    ? t("screenshots.added")
                    : t("screenshots.addToFinal")}
                </button>
                <button
                  className="screens-thumb-delete"
                  type="button"
                  onClick={() => removeFinalSelection(item.image.Path)}
                >
                  {t("common.remove")}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {existingTrackerImages.length > 0 ? (
        <section className="panel screens-gallery">
          <div className="screens-gallery__header">
            <h2>{t("screenshots.trackerTempImages")}</h2>
            <p className="muted">{t("screenshots.trackerTempSubtitle")}</p>
            <button className="ghost" type="button" onClick={handleDeleteAllTrackerImages}>
              {t("screenshots.deleteAll")}
            </button>
          </div>
          <div className="screens-grid">
            {existingTrackerImages.map((item) => (
              <div
                className="screens-thumb-card"
                key={`tracker-${item.image.Path || item.image.Index}`}
              >
                <button
                  className="screens-thumb"
                  type="button"
                  onClick={() => {
                    setLightboxImage(item.dataUri);
                    setLightboxAlt(t("screenshots.trackerTempImageAlt"));
                  }}
                >
                  <img src={item.dataUri} alt={t("screenshots.trackerTempImageAlt")} />
                </button>
                <button
                  className="ghost"
                  type="button"
                  onClick={() => addFinalSelection(item)}
                  disabled={isFinalImageSelected(item.image.Path)}
                >
                  {isFinalImageSelected(item.image.Path)
                    ? t("screenshots.added")
                    : t("screenshots.addToFinal")}
                </button>
                <button
                  className="screens-thumb-delete"
                  type="button"
                  onClick={() => handleDeleteExistingImage(item.image)}
                >
                  {t("common.delete")}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel screens-list">
        <div className="screens-gallery__header">
          <h2>{t("screenshots.frameSelection")}</h2>
          <p className="muted">{t("screenshots.frameSelectionSubtitle")}</p>
        </div>
        {!showFrameSelections ? (
          <p className="muted">{t("screenshots.loadSuggestionsForFrames")}</p>
        ) : screenshotSelections.length === 0 ? (
          <p className="muted">{t("screenshots.noSelections")}</p>
        ) : (
          <div className="screens-rows">
            {screenshotSelections.map((selection) => (
              <div className="screens-row" key={`sel-${selection.Index}`}>
                <div>
                  <p className="label">{t("screenshots.shot", { number: selection.Index + 1 })}</p>
                  <p className="muted">
                    {t("screenshots.source", { source: selection.Source || "auto" })}
                  </p>
                </div>
                <label className="screens-field">
                  <span>{t("screenshots.seconds")}</span>
                  <input
                    type="number"
                    step="0.1"
                    value={
                      Number.isFinite(selection.TimestampSeconds) ? selection.TimestampSeconds : 0
                    }
                    onChange={(event) => updateSelectionTime(selection.Index, event.target.value)}
                  />
                </label>
                <label className="screens-field">
                  <span>{t("screenshots.frame")}</span>
                  <input
                    type="number"
                    step="1"
                    value={Number.isFinite(selection.Frame) ? selection.Frame : 0}
                    onChange={(event) => updateSelectionFrame(selection.Index, event.target.value)}
                  />
                </label>
                <button
                  className="ghost"
                  type="button"
                  onClick={() => handlePreviewSelection(selection)}
                  disabled={previewLoadingIndex === selection.Index}
                >
                  {previewLoadingIndex === selection.Index
                    ? t("screenshots.previewing")
                    : t("screenshots.preview")}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {previewImages.length > 0 ? (
        <section className="panel screens-gallery">
          <div className="screens-gallery__header">
            <h2>{t("screenshots.previewCaptures")}</h2>
            <p className="muted">{t("screenshots.previewCapturesSubtitle")}</p>
            <button className="ghost" type="button" onClick={handleDeleteAllPreviewImages}>
              {t("screenshots.deleteAll")}
            </button>
          </div>
          <div className="screens-grid">
            {previewImages.map((item) => (
              <button
                className="screens-thumb"
                type="button"
                key={`preview-${item.image.Index}`}
                onClick={() => {
                  setLightboxImage(item.dataUri);
                  setLightboxAlt(
                    t("screenshots.previewImageAlt", { number: item.image.Index + 1 }),
                  );
                }}
              >
                <img
                  src={item.dataUri}
                  alt={t("screenshots.previewImageAlt", { number: item.image.Index + 1 })}
                />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {finalImages.length > 0 ? (
        <section className="panel screens-gallery">
          <div className="screens-gallery__header">
            <h2>{t("screenshots.finalCaptures")}</h2>
            <p className="muted">{t("screenshots.finalSubtitle")}</p>
            <button className="ghost" type="button" onClick={handleDeleteAllFinalImages}>
              {t("screenshots.deleteAll")}
            </button>
          </div>
          <div className="screens-grid">
            {finalImages.map((item, index) => (
              <div
                className="screens-thumb-card"
                key={`final-${item.image.Path || item.image.Index}`}
              >
                <button
                  className="screens-thumb"
                  type="button"
                  draggable
                  onDragStart={() => setFinalDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (finalDragIndex === null) return;
                    reorderFinalSelections(finalDragIndex, index);
                    setFinalDragIndex(null);
                  }}
                  onDragEnd={() => setFinalDragIndex(null)}
                  onClick={() => {
                    setLightboxImage(item.dataUri);
                    setLightboxAlt(t("screenshots.finalImageAlt", { number: index + 1 }));
                  }}
                >
                  <img
                    src={item.dataUri}
                    alt={t("screenshots.finalImageAlt", { number: index + 1 })}
                  />
                </button>
                <button
                  className="screens-thumb-delete"
                  type="button"
                  onClick={() => handleDeleteExistingImage(item.image)}
                >
                  {t("common.delete")}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {finalResult?.Errors?.length ? (
        <section className="panel screens-errors">
          <div className="screens-gallery__header">
            <h2>{t("screenshots.captureWarnings")}</h2>
          </div>
          <ul>
            {finalResult.Errors.map((entry, index) => (
              <li key={`err-${entry.Index}-${index}`}>
                {t("screenshots.shotError", { number: entry.Index + 1, message: entry.Message })}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
