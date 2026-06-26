// Copyright (c) 2025-2026, Audionut and the autobrr contributors.
// SPDX-License-Identifier: GPL-2.0-or-later

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "../../i18n";
import type { HistoryEntry, HistoryOverview } from "../../types";
import { cn } from "../../utils/cn";

const formatDate = (value: string) => {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

const isUploadedStatus = (value: string) => {
  const normalized = value?.trim().toLowerCase();
  return normalized === "uploaded" || normalized === "success" || normalized === "completed";
};

const formatLastUpload = (
  latestUploadStatus: string,
  statusLabel: string,
  latestUploadAt: string,
  t: (key: string) => string,
) => {
  if (!isUploadedStatus(latestUploadStatus) && !isUploadedStatus(statusLabel)) {
    return t("common.never");
  }
  if (!latestUploadAt) {
    return t("common.never");
  }
  return formatDate(latestUploadAt);
};

const releaseLabel = (entry: HistoryEntry, t: (key: string) => string) => {
  const title = entry.ReleaseTitle?.trim() || t("history.untitledRelease");
  const source = entry.ReleaseSource?.trim();
  const resolution = entry.ReleaseResolution?.trim();
  const extras = [source, resolution].filter(Boolean).join(" • ");
  return extras ? `${title} (${extras})` : title;
};

const releaseLabelFromOverview = (overview: HistoryOverview, t: (key: string) => string) => {
  const title = overview.ReleaseTitle?.trim() || t("history.untitledRelease");
  const source = overview.ReleaseSource?.trim();
  const resolution = overview.ReleaseResolution?.trim();
  const extras = [source, resolution].filter(Boolean).join(" • ");
  return extras ? `${title} (${extras})` : title;
};

type Props = {
  onReleaseDeleted?: (sourcePath: string) => void;
};

export default function HistoryPage({ onReleaseDeleted }: Props) {
  const { t } = useTranslation();

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [overview, setOverview] = useState<HistoryOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const listHistory = globalThis.go?.guiapp?.App?.ListHistory;
    if (!listHistory) {
      setError("History is unavailable in this build.");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await listHistory();
        setEntries(result || []);
        if (result?.length) {
          setSelectedPath((current) => current || result[0].SourcePath);
        } else {
          setSelectedPath("");
          setOverview(null);
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return entries;
    }
    return entries.filter((entry) => {
      const title = entry.ReleaseTitle?.trim().toLowerCase() || "";
      return title.includes(query);
    });
  }, [entries, searchQuery]);

  useEffect(() => {
    if (!filteredEntries.length) {
      setSelectedPath("");
      setOverview(null);
      return;
    }
    const selectionStillVisible = filteredEntries.some(
      (entry) => entry.SourcePath === selectedPath,
    );
    if (!selectionStillVisible) {
      setSelectedPath(filteredEntries[0].SourcePath);
    }
  }, [filteredEntries, selectedPath]);

  useEffect(() => {
    if (!selectedPath) {
      setOverview(null);
      return;
    }
    const getHistoryOverview = globalThis.go?.guiapp?.App?.GetHistoryOverview;
    if (!getHistoryOverview) {
      setError("History overview is unavailable in this build.");
      return;
    }

    const loadDetail = async () => {
      setDetailLoading(true);
      setError("");
      try {
        const next = await getHistoryOverview(selectedPath);
        setOverview(next);
      } catch (err) {
        setError(String(err));
      } finally {
        setDetailLoading(false);
      }
    };

    void loadDetail();
  }, [selectedPath]);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.SourcePath === selectedPath) || null,
    [entries, selectedPath],
  );

  const descriptionOverrides = useMemo(() => {
    if (!overview) {
      return [];
    }
    return Array.isArray(overview.DescriptionOverrides) ? overview.DescriptionOverrides : [];
  }, [overview]);

  const handleDeleteRelease = async () => {
    if (!selectedPath) {
      return;
    }
    const deleteHistoryRelease = globalThis.go?.guiapp?.App?.DeleteHistoryRelease;
    const listHistory = globalThis.go?.guiapp?.App?.ListHistory;
    if (!deleteHistoryRelease || !listHistory) {
      setError("Delete is unavailable in this build.");
      return;
    }
    const confirmed = window.confirm(t("history.confirmDelete"));
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      const deletedPath = selectedPath;
      await deleteHistoryRelease(deletedPath);
      onReleaseDeleted?.(deletedPath);
      const refreshed = (await listHistory()) || [];
      setEntries(refreshed);
      if (!refreshed.length) {
        setSelectedPath("");
        setOverview(null);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="content-stack">
      <header className="hero">
        <p className="eyebrow">upbrr</p>
        <h1>{t("navigation.history")}</h1>
        <p className="subtitle">{t("history.subtitle")}</p>
      </header>

      <section className="panel grid min-h-[560px] gap-3 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
        <aside className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="mb-2">
            <p className="label">{t("history.storedReleases")}</p>
            <p className="helper">{t("history.mostRecentFirst")}</p>
            <label className="mt-2 grid gap-1.5">
              <span className="label">{t("history.searchByTitle")}</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("history.filterTitles")}
              />
            </label>
          </div>

          {loading ? <p className="muted">{t("history.loading")}</p> : null}
          {!loading && entries.length === 0 ? (
            <p className="muted">{t("history.noStoredReleases")}</p>
          ) : null}
          {!loading && entries.length > 0 && filteredEntries.length === 0 ? (
            <p className="muted">{t("history.noMatches")}</p>
          ) : null}

          <div className="grid max-h-[520px] gap-1.5 overflow-y-auto">
            {filteredEntries.map((entry) => (
              <button
                key={entry.SourcePath}
                type="button"
                className={cn(
                  "grid w-full gap-1 rounded-md border px-3 py-2 text-left transition",
                  entry.SourcePath === selectedPath
                    ? "border-[var(--accent-2)] bg-[rgba(53,194,193,0.16)] text-[var(--text)] shadow-[inset_3px_0_0_var(--accent-2),0_0_16px_rgba(53,194,193,0.16)]"
                    : "border-white/10 bg-black/15 text-[var(--muted)] hover:border-white/20 hover:bg-white/5 hover:text-[var(--text)]",
                )}
                onClick={() => setSelectedPath(entry.SourcePath)}
              >
                <span
                  className={cn(
                    "font-semibold",
                    entry.SourcePath === selectedPath ? "text-[var(--text)]" : "text-inherit",
                  )}
                >
                  {releaseLabel(entry, t)}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {entry.LatestUploadStatus || t("history.statusStored")}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {t("common.updated")} {formatDate(entry.MetadataUpdatedAt)}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-3">
          {detailLoading ? <p className="muted">{t("history.loadingOverview")}</p> : null}

          {!detailLoading && !overview ? (
            <p className="muted">{t("history.selectRelease")}</p>
          ) : null}

          {overview ? (
            <div className="grid gap-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  className="ghost border-red-400/45 text-[var(--danger)]"
                  disabled={deleting || detailLoading || !selectedPath}
                  onClick={() => {
                    void handleDeleteRelease();
                  }}
                >
                  {deleting ? t("history.removing") : t("history.removeFromDatabase")}
                </button>
              </div>

              <div className="summary">
                <div>
                  <p className="label">{t("history.release")}</p>
                  <p className="value">
                    {selectedEntry
                      ? releaseLabel(selectedEntry, t)
                      : releaseLabelFromOverview(overview, t)}
                  </p>
                </div>
                <div>
                  <p className="label">{t("common.status")}</p>
                  <p className="value">{overview.StatusLabel || t("history.statusStored")}</p>
                </div>
                <div>
                  <p className="label">{t("history.metadataUpdated")}</p>
                  <p className="value">{formatDate(overview.MetadataUpdatedAt)}</p>
                </div>
                <div>
                  <p className="label">{t("history.lastUpload")}</p>
                  <p className="value">
                    {formatLastUpload(
                      overview.LatestUploadStatus,
                      overview.StatusLabel,
                      overview.LatestUploadAt,
                      t,
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2 [&_h3]:mb-2 [&_h3]:mt-0 [&_h3]:text-sm">
                <article className="rounded-lg border border-white/10 bg-[var(--panel-light)] p-2.5">
                  <h3>{t("common.path")}</h3>
                  <p className="mono">{overview.SourcePath}</p>
                </article>

                <article className="rounded-lg border border-white/10 bg-[var(--panel-light)] p-2.5 [&_p]:mb-1 [&_p]:mt-0">
                  <h3>{t("history.externalIDs")}</h3>
                  <p>
                    {t("trackerData.tmdb")}: {overview.ExternalIDs?.TMDBID || 0}
                  </p>
                  <p>
                    {t("trackerData.imdb")}: {overview.ExternalIDs?.IMDBID || 0}
                  </p>
                  <p>
                    {t("trackerData.tvdb")}: {overview.ExternalIDs?.TVDBID || 0}
                  </p>
                  <p>
                    {t("trackerData.tvmazeId")}: {overview.ExternalIDs?.TVmazeID || 0}
                  </p>
                </article>

                <article className="rounded-lg border border-white/10 bg-[var(--panel-light)] p-2.5 [&_p]:mb-1 [&_p]:mt-0">
                  <h3>{t("history.counts")}</h3>
                  <p>
                    {t("history.trackerMetadataCount", {
                      count: overview.TrackerMetadata?.length || 0,
                    })}
                  </p>
                  <p>
                    {t("history.ruleFailuresCount", {
                      count: overview.TrackerRuleFailures?.length || 0,
                    })}
                  </p>
                  <p>
                    {t("history.screenshotsCount", { count: overview.Screenshots?.length || 0 })}
                  </p>
                  <p>
                    {t("history.finalSelectionsCount", {
                      count: overview.FinalSelections?.length || 0,
                    })}
                  </p>
                  <p>
                    {t("history.uploadedImagesCount", {
                      count: overview.UploadedImages?.length || 0,
                    })}
                  </p>
                  <p>
                    {t("history.uploadHistoryCount", {
                      count: overview.UploadHistory?.length || 0,
                    })}
                  </p>
                </article>

                <article className="col-span-full rounded-lg border border-white/10 bg-[var(--panel-light)] p-2.5">
                  <h3>{t("history.descriptionOverrides")}</h3>
                  {descriptionOverrides.length ? (
                    <ul className="m-0 grid gap-1 pl-4">
                      {descriptionOverrides.map((override, index) => {
                        const groupKey = override.GroupKey?.trim() || "default";
                        return (
                          <li key={`${groupKey}-${override.UpdatedAt}-${index}`}>
                            <strong>{groupKey}</strong>
                            <pre className="m-0 max-h-[220px] overflow-auto whitespace-pre-wrap rounded-md bg-black/10 p-2 text-xs [overflow-wrap:anywhere]">
                              {override.Description?.trim() || t("history.empty")}
                            </pre>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="muted">{t("history.empty")}</p>
                  )}
                </article>

                <article className="col-span-full rounded-lg border border-white/10 bg-[var(--panel-light)] p-2.5">
                  <h3>{t("history.uploadHistory")}</h3>
                  {overview.UploadHistory?.length ? (
                    <ul className="m-0 grid gap-1 pl-4">
                      {overview.UploadHistory.map((row, index) => (
                        <li key={`${row.Tracker}-${row.CreatedAt}-${index}`}>
                          <strong>{row.Tracker || "UNKNOWN"}</strong> —{" "}
                          {row.Status || t("common.unknown")} — {formatDate(row.CreatedAt)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">{t("history.noUploadRecords")}</p>
                  )}
                </article>

                <article className="col-span-full rounded-lg border border-white/10 bg-[var(--panel-light)] p-2.5">
                  <h3>{t("history.trackerRuleFailures")}</h3>
                  {overview.TrackerRuleFailures?.length ? (
                    <ul className="m-0 grid gap-1 pl-4">
                      {overview.TrackerRuleFailures.map((failure, index) => (
                        <li key={`${failure.Tracker}-${failure.Rule}-${index}`}>
                          <strong>{failure.Tracker || "UNKNOWN"}</strong>: {failure.Rule}{" "}
                          {failure.Reason ? `— ${failure.Reason}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">{t("history.noRuleFailures")}</p>
                  )}
                </article>

                <article className="col-span-full rounded-lg border border-white/10 bg-[var(--panel-light)] p-2.5">
                  <h3>{t("history.externalMetadataRaw")}</h3>
                  <pre className="m-0 max-h-[220px] overflow-auto whitespace-pre-wrap rounded-md bg-black/10 p-2 text-xs [overflow-wrap:anywhere]">
                    {JSON.stringify(overview.ExternalMetadata || {}, null, 2)}
                  </pre>
                </article>

                <article className="col-span-full rounded-lg border border-white/10 bg-[var(--panel-light)] p-2.5">
                  <h3>{t("history.releaseOverridesRaw")}</h3>
                  <pre className="m-0 max-h-[220px] overflow-auto whitespace-pre-wrap rounded-md bg-black/10 p-2 text-xs [overflow-wrap:anywhere]">
                    {JSON.stringify(overview.ReleaseNameOverrides || {}, null, 2)}
                  </pre>
                </article>

                <article className="col-span-full rounded-lg border border-white/10 bg-[var(--panel-light)] p-2.5">
                  <h3>{t("history.metadataRaw")}</h3>
                  <pre className="m-0 max-h-[220px] overflow-auto whitespace-pre-wrap rounded-md bg-black/10 p-2 text-xs [overflow-wrap:anywhere]">
                    {JSON.stringify(overview.Metadata || {}, null, 2)}
                  </pre>
                </article>
              </div>
            </div>
          ) : null}

          {error ? <p className="error">{error}</p> : null}
        </div>
      </section>
    </div>
  );
}
