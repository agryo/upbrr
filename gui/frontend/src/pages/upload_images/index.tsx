// Copyright (c) 2025-2026, Audionut and the autobrr contributors.
// SPDX-License-Identifier: GPL-2.0-or-later

import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "../../i18n";
import { Button } from "../../components/ui/button";
import type {
  ScreenshotLinkedImage,
  ScreenshotPreviewImage,
  UploadedImageLink,
  UploadImageHostFailure,
} from "../../types";
import { cn } from "../../utils/cn";
import { handleExternalLinkClick } from "../../utils/externalLinks";

type UploadedByHost = { host: string; items: UploadedImageLink[] };

type Props = Readonly<{
  path: string;
  uploadHost: string;
  setUploadHost: Dispatch<SetStateAction<string>>;
  configuredImageHosts: string[];
  resolveImageHostLabel: (value: string) => string;
  uploadImagesLoading: boolean;
  uploadProgress: { current: number; total: number };
  setAllUploadSelections: (value: boolean) => void;
  handleUploadImages: (selected: ScreenshotPreviewImage[]) => void;
  uploadImagesError: string;
  uploadImageFailures: UploadImageHostFailure[];
  uploadCandidates: ScreenshotPreviewImage[];
  uploadSelections: Record<string, boolean>;
  toggleUploadSelection: (imagePath: string) => void;
  setLightboxImage: Dispatch<SetStateAction<string>>;
  setLightboxAlt: Dispatch<SetStateAction<string>>;
  uploadedRecordByPath: Map<string, UploadedImageLink>;
  uploadedImages: UploadedImageLink[];
  uploadedImageRecords: UploadedImageLink[];
  trackerImageLinks: ScreenshotLinkedImage[];
  trackerImageURLs: string[];
  handleDeleteUploadedImage: (imagePath: string, host: string) => void;
  handleDeleteTrackerImage: (url: string) => void;
}>;

export default function UploadImagesPage(props: Props) {
  const { t } = useTranslation();

  const {
    path,
    uploadHost,
    setUploadHost,
    configuredImageHosts,
    resolveImageHostLabel,
    uploadImagesLoading,
    uploadProgress,
    setAllUploadSelections,
    handleUploadImages,
    uploadImagesError,
    uploadImageFailures,
    uploadCandidates,
    uploadSelections,
    toggleUploadSelection,
    setLightboxImage,
    setLightboxAlt,
    uploadedRecordByPath,
    uploadedImages,
    uploadedImageRecords,
    trackerImageLinks,
    trackerImageURLs,
    handleDeleteUploadedImage,
    handleDeleteTrackerImage,
  } = props;

  const uploadCandidateCount = uploadCandidates.length;

  const selectedUploadCandidates = useMemo(() => {
    return uploadCandidates.filter((item) => {
      const pathValue = item.image.Path;
      if (!pathValue) return false;
      if (uploadSelections[pathValue] === undefined) return true;
      return Boolean(uploadSelections[pathValue]);
    });
  }, [uploadCandidates, uploadSelections]);

  const uploadSelectedCount = selectedUploadCandidates.length;

  const previouslyUploadedImages = useMemo(() => {
    return [...uploadedImageRecords].sort((left, right) => {
      const leftTime = left.UploadedAt ? Date.parse(left.UploadedAt) : 0;
      const rightTime = right.UploadedAt ? Date.parse(right.UploadedAt) : 0;
      if (leftTime !== rightTime) return rightTime - leftTime;
      return left.ImagePath.localeCompare(right.ImagePath);
    });
  }, [uploadedImageRecords]);

  const previouslyUploadedByHost: UploadedByHost[] = useMemo(() => {
    const grouped = new Map<string, UploadedImageLink[]>();

    previouslyUploadedImages.forEach((img) => {
      const hostKey = (img.Host || "unknown").trim() || "unknown";
      const bucket = grouped.get(hostKey) || [];
      bucket.push(img);
      grouped.set(hostKey, bucket);
    });

    const trackerURLs = new Set<string>();

    trackerImageLinks.forEach((link) => {
      if (link.URL) {
        trackerURLs.add(link.URL);
      }
      const hostKey = (link.Host || "unknown").trim() || "unknown";
      const bucket = grouped.get(hostKey) || [];
      const uploadedFormat: UploadedImageLink = {
        SourcePath: "",
        ImagePath: link.Path,
        Host: hostKey,
        UsageScope: "global",
        ImgURL: link.URL,
        RawURL: link.URL,
        WebURL: link.URL,
        SizeBytes: 0,
        UploadedAt: "",
      };
      bucket.push(uploadedFormat);
      grouped.set(hostKey, bucket);
    });

    trackerImageURLs.forEach((url) => {
      if (!url || trackerURLs.has(url)) {
        return;
      }
      let hostKey = "tracker";
      try {
        hostKey = new URL(url).hostname || hostKey;
      } catch {
        // Keep generic tracker bucket for malformed URLs.
      }
      const bucket = grouped.get(hostKey) || [];
      bucket.push({
        SourcePath: "",
        ImagePath: url,
        Host: hostKey,
        UsageScope: "global",
        ImgURL: url,
        RawURL: url,
        WebURL: url,
        SizeBytes: 0,
        UploadedAt: "",
      });
      grouped.set(hostKey, bucket);
    });

    const hostIndex = new Map<string, number>();
    configuredImageHosts.forEach((host, index) => {
      hostIndex.set(host, index);
    });
    return Array.from(grouped.entries())
      .map(([host, items]) => ({ host, items }))
      .sort((left, right) => {
        const leftRank = hostIndex.has(left.host)
          ? hostIndex.get(left.host)!
          : Number.MAX_SAFE_INTEGER;
        const rightRank = hostIndex.has(right.host)
          ? hostIndex.get(right.host)!
          : Number.MAX_SAFE_INTEGER;
        if (leftRank !== rightRank) return leftRank - rightRank;
        return left.host.localeCompare(right.host);
      });
  }, [configuredImageHosts, previouslyUploadedImages, trackerImageLinks, trackerImageURLs]);

  return (
    <section className="grid gap-3">
      <header className="max-w-3xl">
        <p className="eyebrow">upbrr</p>
        <h1>{t("uploadImages.title")}</h1>
        <p className="subtitle">{t("uploadImages.subtitle")}</p>
      </header>

      <section className="panel grid gap-2.5">
        <div className="min-w-0">
          <p className="label">{t("input.sourcePath")}</p>
          <p className="value [overflow-wrap:anywhere] text-sm">
            {path || t("common.noPathSelected")}
          </p>
        </div>
        <div className="grid items-end gap-3 md:grid-cols-[minmax(220px,1fr)_auto]">
          <label className="settings-field">
            <span>{t("uploadImages.defaultHost")}</span>
            <select
              value={uploadHost}
              onChange={(event) => setUploadHost(event.target.value)}
              disabled={configuredImageHosts.length === 0}
            >
              {configuredImageHosts.length === 0 ? (
                <option value="">{t("uploadImages.noHosts")}</option>
              ) : null}
              {configuredImageHosts.map((host) => (
                <option key={host} value={host}>
                  {resolveImageHostLabel(host)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={() => setAllUploadSelections(true)}>
              {t("common.selectAll")}
            </Button>
            <Button type="button" onClick={() => setAllUploadSelections(false)}>
              {t("common.selectNone")}
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={() => handleUploadImages(selectedUploadCandidates)}
              disabled={uploadImagesLoading || uploadSelectedCount === 0 || !uploadHost}
            >
              {uploadImagesLoading
                ? t("uploadImages.uploading")
                : t("uploadImages.uploadCount", { count: uploadSelectedCount })}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="muted">
            {t("uploadImages.availableCount", { count: uploadCandidateCount })}
          </span>
          <span className="muted">
            {t("uploadImages.selectedCount", { count: uploadSelectedCount })}
          </span>
        </div>
        {uploadImagesLoading && uploadProgress.total > 0 ? (
          <div className="grid gap-1.5">
            <div className="h-4 w-full overflow-hidden rounded-full border border-white/10 bg-white/10">
              <div
                className="h-full rounded-full bg-[var(--accent-2)] transition-[width]"
                style={{
                  width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%`,
                }}
              />
            </div>
            <p className="m-0 text-center text-sm text-[var(--muted)]">
              {t("uploadImages.uploadingProgress", {
                current: uploadProgress.current,
                total: uploadProgress.total,
              })}
            </p>
          </div>
        ) : null}
        {uploadImagesError ? <p className="error">{uploadImagesError}</p> : null}
        {uploadImageFailures.length > 0 ? (
          <div className="grid gap-1">
            {uploadImageFailures.map((failure, index) => {
              const trackers = (failure.Trackers || []).filter(Boolean);
              const trackerLabel =
                trackers.length > 0
                  ? ` ${t("uploadImages.failureBlocks", { trackers: trackers.join(", ") })}`
                  : "";
              return (
                <p className="error" key={`${failure.Host || "host"}-${index}`}>
                  {t("uploadImages.failureMessage", {
                    host: failure.Host || t("common.unknown"),
                    message: failure.Message || t("uploadImages.failureDefault"),
                  })}
                  {trackerLabel}
                </p>
              );
            })}
          </div>
        ) : null}
      </section>

      {uploadCandidateCount === 0 ? (
        <section className="panel">
          <p className="muted">{t("uploadImages.noScreenshots")}</p>
        </section>
      ) : (
        <section className="panel grid gap-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2>{t("uploadImages.availableTitle")}</h2>
            <p className="muted">{t("uploadImages.availablePrompt")}</p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2">
            {uploadCandidates.map((item) => {
              const pathValue = item.image.Path;
              const selected = pathValue ? uploadSelections[pathValue] !== false : false;
              const record = pathValue ? uploadedRecordByPath.get(pathValue) : undefined;
              const hostLabel = item.image.Host || record?.Host;
              const imgLink = item.image.ImgURL || record?.ImgURL;
              const rawLink = item.image.RawURL || record?.RawURL;
              const isUploaded = Boolean(hostLabel && rawLink);
              return (
                <div
                  className="relative grid gap-1.5"
                  key={`upload-${pathValue || item.image.Index}`}
                >
                  <button
                    className={cn(
                      "screens-thumb",
                      selected &&
                        "border-[var(--accent-2)] shadow-[0_0_0_2px_rgba(53,194,193,0.2)]",
                      isUploaded && "border-emerald-500/60 opacity-85",
                    )}
                    type="button"
                    onClick={() => {
                      setLightboxImage(item.dataUri);
                      setLightboxAlt(t("uploadImages.thumbnailAlt"));
                    }}
                  >
                    <img src={item.dataUri} alt={t("uploadImages.thumbnailAlt")} />
                    {isUploaded ? (
                      <span
                        className="pointer-events-none absolute right-1.5 top-1.5 rounded bg-emerald-800 px-1.5 py-1 text-xs font-semibold text-slate-50"
                        title={t("uploadImages.alreadyUploaded", { host: hostLabel || "" })}
                      >
                        {t("uploadImages.uploadedTag")} {hostLabel}
                      </span>
                    ) : null}
                  </button>
                  <Button
                    className={cn(
                      "h-7 text-xs",
                      selected && "border-[var(--accent-2)] bg-[rgba(53,194,193,0.18)]",
                    )}
                    type="button"
                    onClick={() => pathValue && toggleUploadSelection(pathValue)}
                  >
                    {selected ? t("common.selected") : t("common.select")}
                  </Button>
                  {isUploaded && imgLink ? (
                    <div className="flex justify-center gap-1.5">
                      <a
                        className="inline-flex h-7 items-center justify-center rounded-md border border-white/10 bg-white/5 px-2 text-xs no-underline hover:bg-white/10"
                        href={imgLink}
                        target="_blank"
                        rel="noreferrer"
                        onAuxClick={handleExternalLinkClick}
                        title={t("uploadImages.viewImage")}
                        onClick={handleExternalLinkClick}
                      >
                        {t("uploadImages.viewImage")}
                      </a>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {previouslyUploadedByHost.length > 0 ? (
        <section className="panel grid gap-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2>{t("uploadImages.prevUploadedTitle")}</h2>
            <p className="muted">{t("uploadImages.prevUploadedSubtitle")}</p>
          </div>
          <div className="grid gap-3">
            {previouslyUploadedByHost.map((group) => (
              <div className="grid gap-2" key={`prev-host-${group.host}`}>
                <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
                  {resolveImageHostLabel(group.host)}
                </h3>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2">
                  {group.items.map((img, index) => (
                    <div
                      className="grid min-w-0 gap-1 rounded-lg border border-white/10 bg-[rgba(12,16,26,0.78)] p-2 [&_.tracker-link]:[overflow-wrap:anywhere] [&_.value]:[overflow-wrap:anywhere]"
                      key={`prev-uploaded-${img.ImagePath}-${img.Host}-${index}`}
                    >
                      <p className="label">{t("uploadImages.imageLabel")}</p>
                      <p className="value mono">{img.ImagePath || t("common.unknown")}</p>
                      {img.ImgURL ? (
                        <a
                          className="tracker-link"
                          href={img.ImgURL}
                          target="_blank"
                          rel="noreferrer"
                          onAuxClick={handleExternalLinkClick}
                          onClick={handleExternalLinkClick}
                        >
                          {t("uploadImages.viewImage")}
                        </a>
                      ) : null}
                      {img.RawURL ? (
                        <a
                          className="tracker-link"
                          href={img.RawURL}
                          target="_blank"
                          rel="noreferrer"
                          onAuxClick={handleExternalLinkClick}
                          onClick={handleExternalLinkClick}
                        >
                          {t("uploadImages.rawUrl")}
                        </a>
                      ) : null}
                      {img.WebURL ? (
                        <a
                          className="tracker-link"
                          href={img.WebURL}
                          target="_blank"
                          rel="noreferrer"
                          onAuxClick={handleExternalLinkClick}
                          onClick={handleExternalLinkClick}
                        >
                          {t("uploadImages.webUrl")}
                        </a>
                      ) : null}
                      {img.SourcePath ? (
                        <button
                          className="danger justify-self-start"
                          type="button"
                          onClick={() => handleDeleteUploadedImage(img.ImagePath, img.Host)}
                        >
                          {t("common.delete")}
                        </button>
                      ) : (
                        <button
                          className="danger justify-self-start"
                          type="button"
                          onClick={() => handleDeleteTrackerImage(img.RawURL || img.ImgURL)}
                        >
                          {t("common.remove")}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {uploadedImages.length > 0 ? (
        <section className="panel grid gap-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2>{t("uploadImages.resultsTitle")}</h2>
            <p className="muted">{t("uploadImages.resultsSubtitle")}</p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2">
            {uploadedImages.map((image, index) => (
              <div
                className="grid min-w-0 gap-1 rounded-lg border border-white/10 bg-[rgba(12,16,26,0.78)] p-2 [&_.tracker-link]:[overflow-wrap:anywhere] [&_.value]:[overflow-wrap:anywhere]"
                key={`uploaded-${image.ImagePath}-${index}`}
              >
                <p className="label">{t("uploadImages.imageLabel")}</p>
                <p className="value mono">{image.ImagePath || t("common.unknown")}</p>
                <p className="label">{t("uploadImages.hostLabel")}</p>
                <p className="value mono">{image.Host || uploadHost}</p>
                {image.ImgURL ? (
                  <a
                    className="tracker-link"
                    href={image.ImgURL}
                    target="_blank"
                    rel="noreferrer"
                    onAuxClick={handleExternalLinkClick}
                    onClick={handleExternalLinkClick}
                  >
                    {t("uploadImages.viewImage")}
                  </a>
                ) : null}
                {image.RawURL ? (
                  <a
                    className="tracker-link"
                    href={image.RawURL}
                    target="_blank"
                    rel="noreferrer"
                    onAuxClick={handleExternalLinkClick}
                    onClick={handleExternalLinkClick}
                  >
                    {t("uploadImages.rawUrl")}
                  </a>
                ) : null}
                {image.WebURL ? (
                  <a
                    className="tracker-link"
                    href={image.WebURL}
                    target="_blank"
                    rel="noreferrer"
                    onAuxClick={handleExternalLinkClick}
                    onClick={handleExternalLinkClick}
                  >
                    {t("uploadImages.webUrl")}
                  </a>
                ) : null}
                <button
                  className="danger justify-self-start"
                  type="button"
                  onClick={() =>
                    handleDeleteUploadedImage(image.ImagePath, image.Host || uploadHost)
                  }
                >
                  {t("common.delete")}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
