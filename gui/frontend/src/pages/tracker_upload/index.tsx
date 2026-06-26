// Copyright (c) 2025-2026, Audionut and the autobrr contributors.
// SPDX-License-Identifier: GPL-2.0-or-later

import { useEffect, useMemo, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "../../i18n";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Switch } from "../../components/ui/switch";
import { TrackerIconImage } from "../../components/ui/tracker-icon";
import type { TrackerIconCache } from "../../hooks/useTrackerIcons";
import { trackerIconFor } from "../../hooks/useTrackerIcons";
import type {
  MetadataPreview,
  TrackerDryRunPreview,
  TrackerUploadItem,
  TrackerUploadSnapshot,
  UploadProgressUpdate,
} from "../../types";
import { cn } from "../../utils/cn";

type Props = {
  trackerUploadItems: TrackerUploadItem[];
  releasePageTrackerSelection: Record<string, boolean>;
  dupedTrackerSet: Set<string>;
  ruleSkipReasons: Record<string, string>;
  ruleSkippedTrackerSet: Set<string>;
  failedDupeTrackerSet: Set<string>;
  uploadToggles: Record<string, boolean>;
  setUploadToggles: Dispatch<SetStateAction<Record<string, boolean>>>;
  skipClientInjection: boolean;
  setSkipClientInjection: Dispatch<SetStateAction<boolean>>;
  namingOverrides: Array<[string, unknown]>;
  preview: MetadataPreview;
  formatLabel: (value: string) => string;
  uploadRunning: boolean;
  uploadError: string;
  uploadSnapshot: TrackerUploadSnapshot | null;
  dryRunLoading: boolean;
  dryRunError: string;
  dryRunProgress: UploadProgressUpdate | null;
  dryRunPreview: TrackerDryRunPreview;
  trackerQuestionnaireAnswers: Record<string, Record<string, string>>;
  useFavicons?: boolean;
  faviconOnly?: boolean;
  trackerIconSrcByName: TrackerIconCache;
  onQuestionnaireAnswerChange: (tracker: string, key: string, value: string) => void;
  onRunDryRun: () => void;
  onStartUpload: () => void;
  onCancelUpload: () => void;
  onRetryFailed: () => void;
};

const statusClass = (status: string) => {
  const normalized = status.replaceAll("_", "-");
  if (["running", "queued", "ready"].includes(normalized)) {
    return "border-blue-400/45 text-blue-100";
  }
  if (["success", "completed"].includes(normalized)) {
    return "border-emerald-400/45 text-emerald-100";
  }
  if (["failed", "completed-with-errors", "canceled", "blocked"].includes(normalized)) {
    return "border-red-400/45 text-red-100";
  }
  return "border-white/15 text-[var(--muted)]";
};

const subtleBox = "rounded-md border border-white/10 bg-white/5 px-2 py-1.5";
const blockReasonClass =
  "inline-flex h-5 items-center rounded border border-red-400/30 bg-red-500/10 px-1.5 text-[11px] font-semibold leading-none text-red-700 dark:text-red-100";
const formatStatusText = (value: string) => value.replaceAll("_", " ");
const trimName = (value: unknown) => String(value || "").trim();

export default function TrackerUploadPage(props: Readonly<Props>) {
  const { t } = useTranslation();

  const {
    trackerUploadItems,
    releasePageTrackerSelection,
    dupedTrackerSet,
    ruleSkipReasons,
    ruleSkippedTrackerSet,
    failedDupeTrackerSet,
    uploadToggles,
    setUploadToggles,
    skipClientInjection,
    setSkipClientInjection,
    namingOverrides,
    preview,
    formatLabel,
    uploadRunning,
    uploadError,
    uploadSnapshot,
    dryRunLoading,
    dryRunError,
    dryRunProgress,
    dryRunPreview,
    trackerQuestionnaireAnswers,
    useFavicons = true,
    faviconOnly = false,
    trackerIconSrcByName,
    onQuestionnaireAnswerChange,
    onRunDryRun,
    onStartUpload,
    onCancelUpload,
    onRetryFailed,
  } = props;

  /**
   * Mapeamento para traduzir os labels do payload do dry run.
   * As chaves são os nomes dos campos vindos do backend, os valores são as chaves de tradução.
   */
  const PAYLOAD_LABEL_MAP: Record<string, string> = {
    "3d": "trackerUpload.payload.3d",
    adulto: "trackerUpload.payload.adulto",
    altura: "trackerUpload.payload.altura",
    anonymous: "trackerUpload.payload.anonymous",
    ano: "trackerUpload.payload.ano",
    audio: "trackerUpload.payload.audio",
    audio_c: "trackerUpload.payload.audio_c",
    auth: "trackerUpload.payload.auth",
    bitrate: "trackerUpload.payload.bitrate",
    capa: "trackerUpload.payload.capa",
    codecaudio: "trackerUpload.payload.codecaudio",
    codecvideo: "trackerUpload.payload.codecvideo",
    desc: "trackerUpload.payload.desc",
    descr: "trackerUpload.payload.descr",
    diretor: "trackerUpload.payload.diretor",
    duracao: "trackerUpload.payload.duracao",
    episodio: "trackerUpload.payload.episodio",
    especificas: "trackerUpload.payload.especificas",
    extencao: "trackerUpload.payload.extencao",
    format: "trackerUpload.payload.format",
    genre: "trackerUpload.payload.genre",
    idioma_ori: "trackerUpload.payload.idioma_ori",
    image: "trackerUpload.payload.image",
    imdb: "trackerUpload.payload.imdb",
    imdb_input: "trackerUpload.payload.imdb_input",
    lang: "trackerUpload.payload.lang",
    largura: "trackerUpload.payload.largura",
    layout: "trackerUpload.payload.layout",
    legenda: "trackerUpload.payload.legenda",
    mediainfo: "trackerUpload.payload.mediainfo",
    name: "trackerUpload.payload.name",
    nfo: "trackerUpload.payload.nfo",
    nota_imdb: "trackerUpload.payload.nota_imdb",
    ntorrent: "trackerUpload.payload.ntorrent",
    p2p: "trackerUpload.payload.p2p",
    qualidade: "trackerUpload.payload.qualidade",
    reqid: "trackerUpload.payload.reqid",
    resolucao_1: "trackerUpload.payload.resolucao_1",
    resolucao_2: "trackerUpload.payload.resolucao_2",
    screen: "trackerUpload.payload.screen",
    screens1: "trackerUpload.payload.screens1",
    screens2: "trackerUpload.payload.screens2",
    screens3: "trackerUpload.payload.screens3",
    screens4: "trackerUpload.payload.screens4",
    section: "trackerUpload.payload.section",
    sinopse: "trackerUpload.payload.sinopse",
    submit: "trackerUpload.payload.submit",
    subtitles: "trackerUpload.payload.subtitles",
    tags: "trackerUpload.payload.tags",
    takeupload: "trackerUpload.payload.takeupload",
    temporada_e: "trackerUpload.payload.temporada_e",
    title: "trackerUpload.payload.title",
    title_br: "trackerUpload.payload.title_br",
    tresd: "trackerUpload.payload.tresd",
    tube: "trackerUpload.payload.tube",
    type: "trackerUpload.payload.type",
    unrar: "trackerUpload.payload.unrar",
    video_c: "trackerUpload.payload.video_c",
    year: "trackerUpload.payload.year",
    youtube: "trackerUpload.payload.youtube",
    // Para chaves compostas como "file_input", "file", etc.
    file_input: "trackerUpload.payload.file_input",
    file: "trackerUpload.payload.file",
    torrent: "trackerUpload.payload.torrent",
    // Para a chave "common.message" que aparece no payload
    "common.message": "common.message",
  };

  /**
   * Traduz uma chave do payload para o label correspondente.
   * Se não houver mapeamento, retorna a chave formatada (capitalizada).
   */
  const translatePayloadLabel = (key: string): string => {
    const translationKey = PAYLOAD_LABEL_MAP[key];
    if (translationKey) {
      // Se for "common.message", usa t diretamente
      if (translationKey === "common.message") {
        return t("common.message");
      }
      return t(translationKey);
    }
    // Fallback: capitaliza a chave
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  /**
   * Traduz mensagens de progresso que vêm do backend.
   * Mantém a parte dinâmica (ex: "[46 MiB/s] 83% (1120/1355 pieces)").
   */
  const translateProgressMessage = (message: string): string => {
    const patterns: Record<string, string> = {
      "Hashing pieces...": t("progress.hashingPieces"),
      "Creating torrent...": t("progress.creatingTorrent"),
      "Uploading...": t("progress.uploading"),
      "Checking files...": t("progress.checkingFiles"),
      "Connecting to tracker...": t("progress.connectingTracker"),
      "Injecting to client...": t("progress.injectingClient"),
      "Building torrent...": t("progress.buildingTorrent"),
      "Reading files...": t("progress.readingFiles"),
      "Writing torrent...": t("progress.writingTorrent"),
      "Scanning files...": t("progress.scanningFiles"),
      "Starting upload...": t("progress.startingUpload"),
      "Completing upload...": t("progress.completingUpload"),
    };

    for (const [pattern, translation] of Object.entries(patterns)) {
      if (message.startsWith(pattern)) {
        return message.replace(pattern, translation);
      }
    }
    return message;
  };

  /**
   * Traduz o status de um tracker (ex: "ready" -> "Pronto").
   */
  const translateStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      ready: t("trackerUpload.statusReady"),
      running: t("trackerUpload.statusRunning"),
      queued: t("trackerUpload.statusQueued"),
      success: t("trackerUpload.statusSuccess"),
      completed: t("trackerUpload.statusCompleted"),
      failed: t("trackerUpload.statusFailed"),
      "completed-with-errors": t("trackerUpload.statusCompletedWithErrors"),
      canceled: t("trackerUpload.statusCanceled"),
      blocked: t("trackerUpload.statusBlocked"),
      disabled: t("trackerUpload.statusDisabled"),
    };
    const normalized = status.toLowerCase().trim();
    return statusMap[normalized] || formatStatusText(status);
  };

  const visibleTrackers = useMemo(
    () => trackerUploadItems.filter((tracker) => releasePageTrackerSelection[tracker.name]),
    [trackerUploadItems, releasePageTrackerSelection],
  );

  const trackerBlockState = useMemo(() => {
    const next: Record<string, { blocked: boolean; reasons: string[]; hardBlocked: boolean }> = {};
    visibleTrackers.forEach((tracker) => {
      const normalized = tracker.name.toLowerCase().trim();
      const reasons: string[] = [];
      const hasFailedDupe = failedDupeTrackerSet.has(normalized);
      const hasDupes = dupedTrackerSet.has(normalized);
      const hasRuleSkip = ruleSkippedTrackerSet.has(normalized);
      if (hasFailedDupe) {
        reasons.push(t("trackerUpload.dupeCheckFailed"));
      }
      if (hasDupes) {
        reasons.push(t("trackerUpload.dupesFound"));
      }
      if (hasRuleSkip) {
        reasons.push(ruleSkipReasons[normalized] || t("trackerUpload.ruleCheckFailed"));
      }
      next[tracker.name] = {
        blocked: reasons.length > 0,
        reasons,
        hardBlocked: hasFailedDupe,
      };
    });
    return next;
  }, [
    visibleTrackers,
    failedDupeTrackerSet,
    dupedTrackerSet,
    ruleSkippedTrackerSet,
    ruleSkipReasons,
    t,
  ]);

  const availableTrackers = useMemo(
    () => visibleTrackers.filter((tracker) => !trackerBlockState[tracker.name]?.blocked),
    [visibleTrackers, trackerBlockState],
  );

  const blockedTrackers = useMemo(
    () => visibleTrackers.filter((tracker) => trackerBlockState[tracker.name]?.blocked),
    [visibleTrackers, trackerBlockState],
  );

  const selectedTrackerCount = useMemo(
    () =>
      availableTrackers.filter((tracker) => {
        const normalized = tracker.name.toLowerCase().trim();
        if (!uploadToggles[tracker.name]) return false;
        if (dupedTrackerSet.has(normalized)) return false;
        if (ruleSkippedTrackerSet.has(normalized)) return false;
        if (failedDupeTrackerSet.has(normalized)) return false;
        return true;
      }).length,
    [
      availableTrackers,
      uploadToggles,
      dupedTrackerSet,
      ruleSkippedTrackerSet,
      failedDupeTrackerSet,
    ],
  );

  const trackerStatusMap = useMemo(() => {
    const next: Record<
      string,
      {
        status: string;
        task: string;
        taskStatus: string;
        message: string;
        percent: number;
        totalPieces: number;
      }
    > = {};
    (uploadSnapshot?.trackers || []).forEach((entry) => {
      if (!entry?.tracker) return;
      next[entry.tracker] = {
        status: String(entry.status || "").toLowerCase(),
        task: String(entry.task || "").toLowerCase(),
        taskStatus: String(entry.taskStatus || "").toLowerCase(),
        message: entry.message || "",
        percent: Number(entry.percent || 0),
        totalPieces: Number(entry.totalPieces || 0),
      };
    });
    return next;
  }, [uploadSnapshot]);

  const uploadStatus = String(uploadSnapshot?.status || "").toLowerCase();
  const activeProgress =
    dryRunLoading && dryRunProgress
      ? {
          task: String(dryRunProgress.task || "").toLowerCase(),
          status: String(dryRunProgress.status || "").toLowerCase(),
          message: dryRunProgress.message || "",
          percent: Number(dryRunProgress.percent || 0),
          totalPieces: Number(dryRunProgress.totalPieces || 0),
        }
      : {
          task: String(uploadSnapshot?.currentTask || "").toLowerCase(),
          status: String(uploadSnapshot?.currentTaskStatus || "").toLowerCase(),
          message: uploadSnapshot?.currentMessage || "",
          percent: Number(uploadSnapshot?.currentPercent || 0),
          totalPieces: Number(uploadSnapshot?.currentTotalPieces || 0),
        };
  const currentTask = activeProgress.task;
  const currentTaskStatus = activeProgress.status;
  const currentMessage = activeProgress.message;
  const currentPercent = activeProgress.percent;
  const currentTotalPieces = activeProgress.totalPieces;
  const canRetry = !uploadRunning && (uploadSnapshot?.failedTrackers?.length || 0) > 0;
  const lastDryRunSelectionKey = useRef("");
  const dryRunMap = useMemo(() => {
    const next: Record<string, (typeof dryRunPreview.Trackers)[number]> = {};
    (dryRunPreview?.Trackers || []).forEach((entry) => {
      const key = String(entry?.Tracker || "")
        .toLowerCase()
        .trim();
      if (!key) return;
      next[key] = entry;
    });
    return next;
  }, [dryRunPreview]);
  const selectedTrackerKey = useMemo(
    () =>
      availableTrackers
        .filter((tracker) => Boolean(uploadToggles[tracker.name]))
        .map((tracker) => tracker.name.toLowerCase().trim())
        .sort()
        .join("|"),
    [availableTrackers, uploadToggles],
  );
  const namingOverrideKey = useMemo(() => JSON.stringify(namingOverrides), [namingOverrides]);

  useEffect(() => {
    const refreshKey = `${selectedTrackerKey}:${namingOverrideKey}`;
    if (!dryRunPreview?.Trackers?.length || !selectedTrackerKey) {
      lastDryRunSelectionKey.current = refreshKey;
      return;
    }
    if (!lastDryRunSelectionKey.current) {
      lastDryRunSelectionKey.current = refreshKey;
      return;
    }
    if (lastDryRunSelectionKey.current === refreshKey) return;

    if (dryRunLoading || uploadRunning) return;

    const timeout = window.setTimeout(() => {
      lastDryRunSelectionKey.current = refreshKey;
      onRunDryRun();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [
    dryRunLoading,
    dryRunPreview,
    namingOverrideKey,
    onRunDryRun,
    selectedTrackerKey,
    uploadRunning,
  ]);

  const renderQuestionnaireField = (
    trackerName: string,
    field: NonNullable<(typeof dryRunPreview.Trackers)[number]["Questionnaire"]>["Fields"][number],
    value: string,
  ) => {
    if (field.Kind === "textarea") {
      return (
        <textarea
          className="text-input min-h-24 w-full resize-y"
          value={value}
          placeholder={field.Placeholder || ""}
          onChange={(event) =>
            onQuestionnaireAnswerChange(trackerName, field.Key, event.target.value)
          }
          rows={4}
        />
      );
    }

    if (field.Kind === "select" && field.Options?.length) {
      return (
        <select
          className="text-input w-full appearance-auto"
          value={value}
          onChange={(event) =>
            onQuestionnaireAnswerChange(trackerName, field.Key, event.target.value)
          }
        >
          <option value="">{field.Placeholder || t("trackerUpload.selectOption")}</option>
          {field.Options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (field.Kind === "boolean") {
      const checked = value === "true";
      const checkboxId = `questionnaire-${trackerName}-${field.Key}`;
      return (
        <div className="inline-flex items-center gap-2 text-sm text-[var(--text)]">
          <Checkbox
            id={checkboxId}
            checked={checked}
            onCheckedChange={(nextChecked) =>
              onQuestionnaireAnswerChange(trackerName, field.Key, nextChecked ? "true" : "false")
            }
          />
          <label className="cursor-pointer" htmlFor={checkboxId}>
            {field.Placeholder || t("trackerUpload.enabled")}
          </label>
        </div>
      );
    }

    return (
      <input
        className="text-input w-full"
        type="text"
        value={value}
        placeholder={field.Placeholder || ""}
        onChange={(event) =>
          onQuestionnaireAnswerChange(trackerName, field.Key, event.target.value)
        }
      />
    );
  };

  return (
    <section className="flex flex-col gap-2.5">
      <header className="max-w-3xl">
        <p className="eyebrow">upbrr</p>
        <h1>{t("trackerUpload.title")}</h1>
        <p className="subtitle">{t("trackerUpload.subtitle")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="primary"
            onClick={onStartUpload}
            disabled={uploadRunning || selectedTrackerCount === 0}
          >
            {uploadRunning ? t("trackerUpload.uploading") : t("trackerUpload.startUpload")}
          </Button>
          <Button
            type="button"
            onClick={onRunDryRun}
            disabled={dryRunLoading || uploadRunning || selectedTrackerCount === 0}
          >
            {dryRunLoading ? t("trackerUpload.runningDryRun") : t("trackerUpload.runDryRun")}
          </Button>
          <Button type="button" onClick={onCancelUpload} disabled={!uploadRunning}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={onRetryFailed} disabled={!canRetry}>
            {t("trackerUpload.retryFailed")}
          </Button>
          <label
            className="inline-flex items-center gap-2 text-sm text-[var(--text)]"
            htmlFor="skip-client-injection"
          >
            <Checkbox
              id="skip-client-injection"
              checked={skipClientInjection}
              disabled={uploadRunning}
              onCheckedChange={setSkipClientInjection}
            />
            <span>{t("trackerUpload.skipClient")}</span>
          </label>
          <p className="m-0 text-xs text-[var(--muted)]">
            {t("trackerUpload.selectedUploaded", {
              selected: selectedTrackerCount,
              uploaded: uploadSnapshot?.uploadedCount || 0,
            })}
          </p>
          {uploadStatus ? (
            <p className="m-0 text-xs text-[var(--muted)]">
              {t("trackerUpload.jobStatus", { status: formatStatusText(uploadStatus) })}
            </p>
          ) : null}
        </div>
        {currentTask || currentMessage ? (
          <div
            className="mt-2 grid gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs"
            role="status"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[var(--text)]">
                {t("trackerUpload.currentTask")}
              </span>
              {currentTask ? (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 capitalize",
                    statusClass(currentTaskStatus || uploadStatus || "running"),
                  )}
                >
                  {translateStatus(currentTask)}
                </span>
              ) : null}
              {currentMessage ? (
                <span className="text-[var(--muted)] [overflow-wrap:anywhere]">
                  {translateProgressMessage(currentMessage)}
                </span>
              ) : null}
            </div>
            {currentTotalPieces > 0 ? (
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-[width]"
                  style={{ width: `${Math.max(0, Math.min(100, currentPercent))}%` }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
        {uploadError ? <p className="error">{uploadError}</p> : null}
        {dryRunError ? <p className="error">{dryRunError}</p> : null}
      </header>

      {visibleTrackers.length === 0 ? (
        <p className="muted">{t("trackerUpload.noTrackersFound")}</p>
      ) : (
        <div className="grid gap-1.5">
          {blockedTrackers.length > 0 ? (
            <details className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
              <summary className="cursor-pointer list-none text-sm font-semibold marker:content-[''] [&::-webkit-details-marker]:hidden">
                {t("trackerUpload.blockedTrackers", { count: blockedTrackers.length })}
              </summary>
              <div className="mt-2 grid gap-1">
                {blockedTrackers.map((tracker) => {
                  const state = trackerBlockState[tracker.name];
                  const iconSrc = trackerIconFor(trackerIconSrcByName, tracker.name);
                  return (
                    <div
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5"
                      key={tracker.name}
                    >
                      <span className="value text-sm leading-5 flex items-center gap-1.5">
                        <TrackerIconImage
                          tracker={tracker.name}
                          iconSrc={iconSrc}
                          enabled={useFavicons}
                        />
                        {faviconOnly && useFavicons ? null : tracker.name}
                      </span>
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {state?.reasons.map((reason) => (
                          <span className={blockReasonClass} key={`${tracker.name}-${reason}`}>
                            {reason}
                          </span>
                        ))}
                        {state?.hardBlocked ? (
                          <span className="text-xs text-[var(--muted)]">
                            {t("trackerUpload.notUploadable")}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          ) : null}

          {availableTrackers.map((tracker) => {
            const normalizedTrackerName = tracker.name.toLowerCase().trim();
            const selected = Boolean(uploadToggles[tracker.name]);
            const enabled = selected;
            const trackerStatus = trackerStatusMap[tracker.name];
            const dryRun = selected ? dryRunMap[normalizedTrackerName] : undefined;
            const imageHost = dryRun?.ImageHost;
            const imageHostWarnings = imageHost?.Warnings || [];
            const iconSrc = trackerIconFor(trackerIconSrcByName, tracker.name);
            const imageHostStatus = String(imageHost?.Status || "").toLowerCase();
            const questionnaire = dryRun?.Questionnaire;
            const questionnaireAnswers =
              trackerQuestionnaireAnswers[tracker.name.toUpperCase().trim()] || {};
            const originalReleaseName = trimName(
              dryRun?.OriginalReleaseName || preview.ReleaseName,
            );
            const uploadReleaseName = trimName(dryRun?.UploadReleaseName || dryRun?.ReleaseName);
            const releaseNameChanged =
              Boolean(dryRun?.ReleaseNameChanged) ||
              (Boolean(originalReleaseName) &&
                Boolean(uploadReleaseName) &&
                originalReleaseName !== uploadReleaseName);
            let statusLabel = trackerStatus?.status || "";
            if (!statusLabel) {
              statusLabel = enabled ? "ready" : "disabled";
            }
            // Traduz o status label para exibição
            const translatedStatusLabel = translateStatus(statusLabel);

            return (
              <article
                className="grid gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2"
                key={tracker.name}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <TrackerIconImage
                      tracker={tracker.name}
                      iconSrc={iconSrc}
                      enabled={useFavicons}
                    />
                    {faviconOnly && useFavicons ? null : (
                      <p className="value text-base leading-5">{tracker.name}</p>
                    )}
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize",
                        statusClass(statusLabel),
                      )}
                    >
                      {translatedStatusLabel}
                    </span>
                  </div>
                  <Switch
                    aria-label={t("trackerUpload.enableUpload", { tracker: tracker.name })}
                    checked={selected}
                    onChange={(event) =>
                      setUploadToggles((prev) => ({
                        ...prev,
                        [tracker.name]: event.target.checked,
                      }))
                    }
                  />
                </div>

                {trackerStatus?.task || trackerStatus?.message ? (
                  <div className="grid gap-1">
                    <p className="m-0 flex flex-wrap items-center gap-1.5 text-xs text-[var(--muted)]">
                      {trackerStatus.task ? (
                        <span
                          className={cn(
                            "inline-flex items-center rounded border px-1.5 py-0.5 capitalize",
                            statusClass(trackerStatus.taskStatus || trackerStatus.status),
                          )}
                        >
                          {translateStatus(trackerStatus.task)}
                        </span>
                      ) : null}
                      {trackerStatus.message ? (
                        <span className="[overflow-wrap:anywhere]">{trackerStatus.message}</span>
                      ) : null}
                    </p>
                    {trackerStatus.totalPieces > 0 ? (
                      <div className="h-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[var(--accent)] transition-[width]"
                          style={{
                            width: `${Math.max(0, Math.min(100, trackerStatus.percent))}%`,
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {imageHost?.Message &&
                (imageHostWarnings.length > 0 || imageHostStatus === "warning") ? (
                  <p className="m-0 rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-xs text-amber-100 [overflow-wrap:anywhere]">
                    {imageHost.Message}
                  </p>
                ) : null}
                {imageHostWarnings.map((warning, index) => {
                  const host = String(warning.Host || "").trim();
                  const message = String(warning.Message || "").trim();
                  if (!host && !message) return null;
                  return (
                    <p
                      className="m-0 rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-xs text-amber-100 [overflow-wrap:anywhere]"
                      key={`${tracker.name}-${host || "host"}-${index}`}
                    >
                      {host
                        ? t("descriptionBuilder.imageHostFailed", { host })
                        : t("descriptionBuilder.imageHostWarning")}
                      {message ? `: ${message}` : ""}
                    </p>
                  );
                })}

                {releaseNameChanged ? (
                  <div className="grid gap-1 rounded-md border border-amber-300/55 bg-amber-300/12 px-2.5 py-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center rounded border border-amber-300/50 px-1.5 py-0.5 text-[11px] font-semibold uppercase leading-none text-amber-100">
                        {t("trackerUpload.nameChanged")}
                      </span>
                      {dryRun?.ReleaseNameChangeReason ? (
                        <span className="text-xs text-amber-100/80">
                          {dryRun.ReleaseNameChangeReason}
                        </span>
                      ) : null}
                    </div>
                    <div className="grid gap-1 text-xs">
                      <p className="m-0 text-[var(--muted)] [overflow-wrap:anywhere]">
                        {t("trackerUpload.original")}:{" "}
                        <span className="mono text-[var(--text)]">{originalReleaseName}</span>
                      </p>
                      <p className="m-0 text-amber-100 [overflow-wrap:anywhere]">
                        {t("trackerUpload.upload")}:{" "}
                        <span className="mono font-semibold">{uploadReleaseName}</span>
                      </p>
                    </div>
                  </div>
                ) : null}

                <details>
                  <summary className="cursor-pointer list-none text-sm font-semibold marker:content-[''] [&::-webkit-details-marker]:hidden">
                    {t("trackerUpload.dryRunData")}
                  </summary>
                  <div className="mt-2 grid gap-1.5">
                    {dryRun ? (
                      <>
                        <div>
                          <p className="label">{t("common.status")}</p>
                          <p className="value mono">{translateStatus(dryRun.Status || "ready")}</p>
                        </div>
                        {dryRun.Message ? (
                          <div>
                            <p className="label">{t("common.message")}</p>
                            <p className="value">{dryRun.Message}</p>
                          </div>
                        ) : null}
                        {dryRun.ReleaseName ? (
                          <div>
                            <p className="label">{t("trackerUpload.releaseName")}</p>
                            <p className="value mono">{dryRun.ReleaseName}</p>
                          </div>
                        ) : null}
                        {dryRun.DescriptionGroup ? (
                          <div>
                            <p className="label">{t("trackerUpload.descriptionGroup")}</p>
                            <p className="value mono">{dryRun.DescriptionGroup}</p>
                          </div>
                        ) : null}
                        {dryRun.Endpoint ? (
                          <div>
                            <p className="label">{t("trackerUpload.endpoint")}</p>
                            <p className="value mono">{dryRun.Endpoint}</p>
                          </div>
                        ) : null}
                        {dryRun.Files?.length ? (
                          <div className="grid gap-1.5">
                            {dryRun.Files.map((file) => (
                              <div className={subtleBox} key={`${file.Field}-${file.Path}`}>
                                <p className="label">
                                  {t("trackerUpload.fileLabel", { field: file.Field })}
                                </p>
                                <p className="value mono">
                                  {file.Path || t("trackerUpload.missing")}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {Object.keys(dryRun.Payload || {}).length ? (
                          <div className="grid gap-1.5">
                            {Object.entries(dryRun.Payload)
                              .sort(([left], [right]) => left.localeCompare(right))
                              .map(([key, value]) => (
                                <div className={subtleBox} key={key}>
                                  <p className="label">{translatePayloadLabel(key)}</p>
                                  <p className="value mono">{String(value)}</p>
                                </div>
                              ))}
                          </div>
                        ) : null}
                        {questionnaire?.Fields?.length ? (
                          <div>
                            <p className="label">{t("trackerUpload.questionnaire")}</p>
                            <div className="grid gap-1.5">
                              {questionnaire.Fields.map((field) => (
                                <label className={subtleBox} key={field.Key}>
                                  <p className="label">
                                    {field.Label || field.Key}
                                    {field.Required ? " *" : ""}
                                  </p>
                                  {renderQuestionnaireField(
                                    tracker.name,
                                    field,
                                    questionnaireAnswers[field.Key] ?? field.Value ?? "",
                                  )}
                                  {field.Help ? <p className="muted">{field.Help}</p> : null}
                                </label>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="muted">{t("trackerUpload.runDryRunForPayload")}</p>
                    )}
                  </div>
                </details>

                {namingOverrides.length > 0 ? (
                  <details>
                    <summary className="cursor-pointer list-none text-sm font-semibold marker:content-[''] [&::-webkit-details-marker]:hidden">
                      {t("trackerUpload.namingChanges")}
                    </summary>
                    <div className="mt-2 grid gap-1.5">
                      <div>
                        <p className="label">{t("input.releaseName")}</p>
                        <p className="value mono">
                          {preview.ReleaseName || t("input.noReleaseName")}
                        </p>
                      </div>
                      <div className="grid gap-1.5">
                        {namingOverrides.map(([key, value]) => (
                          <div className={subtleBox} key={key}>
                            <p className="label">{formatLabel(key)}</p>
                            <p className="value mono">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
