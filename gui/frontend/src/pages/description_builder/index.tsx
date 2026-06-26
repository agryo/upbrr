// Copyright (c) 2025-2026, Audionut and the autobrr contributors.
// SPDX-License-Identifier: GPL-2.0-or-later

import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "../../i18n";
import RenderedDescription from "../../components/RenderedDescription";
import { TrackerIconImage } from "../../components/ui/tracker-icon";
import type { TrackerIconCache } from "../../hooks/useTrackerIcons";
import { trackerIconFor } from "../../hooks/useTrackerIcons";
import type { DescriptionBuilderPreview } from "../../types";

type Props = {
  path: string;
  builderPreview: DescriptionBuilderPreview;
  builderRawByGroup: Record<string, string>;
  builderRenderedByGroup: Record<string, string>;
  builderExpandedGroups: Record<string, boolean>;
  builderLoading: boolean;
  builderSaving: boolean;
  builderRenderLoading: boolean;
  builderRefreshing: boolean;
  builderProgressMessage: string;
  builderError: string;
  builderSaved: string;
  useFavicons?: boolean;
  faviconOnly?: boolean;
  trackerIconSrcByName?: TrackerIconCache;
  refreshDescriptionBuilder: () => void;
  setBuilderRawByGroup: Dispatch<SetStateAction<Record<string, string>>>;
  setBuilderDirtyByGroup: Dispatch<SetStateAction<Record<string, boolean>>>;
  setBuilderExpandedGroups: Dispatch<SetStateAction<Record<string, boolean>>>;
  resetBuilderDescription: (groupKey: string) => void;
  renderBuilderDescription: (groupKey: string) => void;
  saveBuilderDescription: (groupKey: string) => void;
};

const groupLabel = (groupKey: string, trackers: string[], t: (key: string) => string) => {
  if (trackers.length > 0) return trackers.join(", ");
  if (groupKey === "unit3d") return t("descriptionBuilder.unit3d");
  return groupKey || t("descriptionBuilder.description");
};

export default function DescriptionBuilderPage(props: Props) {
  const { t } = useTranslation();
  const {
    path,
    builderPreview,
    builderRawByGroup,
    builderRenderedByGroup,
    builderExpandedGroups,
    builderLoading,
    builderSaving,
    builderRenderLoading,
    builderRefreshing,
    builderProgressMessage,
    builderError,
    builderSaved,
    useFavicons = true,
    faviconOnly = false,
    trackerIconSrcByName = {},
    refreshDescriptionBuilder,
    setBuilderRawByGroup,
    setBuilderDirtyByGroup,
    setBuilderExpandedGroups,
    resetBuilderDescription,
    renderBuilderDescription,
    saveBuilderDescription,
  } = props;

  const groups = builderPreview.Groups || [];

  return (
    <section className="flex flex-col gap-3">
      <header className="max-w-3xl">
        <p className="eyebrow">{t("descriptionBuilder.title")}</p>
        <h1>{t("descriptionBuilder.title")}</h1>
        <p className="subtitle">{t("descriptionBuilder.subtitle")}</p>
      </header>

      <section className="panel flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <p className="label">{t("descriptionBuilder.sourcePath")}</p>
          <p className="value [overflow-wrap:anywhere] text-sm">
            {path || t("descriptionBuilder.noPathSelected")}
          </p>
        </div>
        <button
          className="ghost"
          type="button"
          onClick={refreshDescriptionBuilder}
          disabled={builderLoading || builderSaving || builderRenderLoading || !path.trim()}
        >
          {builderRefreshing ? t("descriptionBuilder.refreshing") : t("descriptionBuilder.refresh")}
        </button>
        {builderProgressMessage ? (
          <p className="m-0 basis-full text-right text-[0.82rem] text-[var(--muted)]">
            {builderProgressMessage}
          </p>
        ) : null}
      </section>

      {builderError ? <p className="error">{builderError}</p> : null}
      {builderSaved ? <p className="success">{builderSaved}</p> : null}

      {builderLoading && groups.length === 0 ? (
        <section className="panel">
          <div className="mb-2 flex flex-col gap-1">
            <h2>{t("descriptionBuilder.buildingTitle")}</h2>
          </div>
          <p className="muted">
            {builderProgressMessage || t("descriptionBuilder.buildingSubtitle")}
          </p>
        </section>
      ) : groups.length === 0 ? (
        <section className="panel">
          <p className="muted">{t("descriptionBuilder.noDescriptions")}</p>
        </section>
      ) : (
        groups.map((group, i) => {
          const groupKey = group.GroupKey;
          const reactKey = groupKey || `default-${i}`;
          const seededRaw = group.RawDescription || "";
          const raw = builderRawByGroup[groupKey] ?? seededRaw;
          const seededRendered = group.RawDescriptionHTML || "";
          const renderedHTML = builderRenderedByGroup[groupKey] ?? seededRendered;
          const expanded = builderExpandedGroups[groupKey] ?? false;
          const trackers = (group.Trackers || []).map((tracker) => tracker.trim()).filter(Boolean);
          const label = groupLabel(groupKey, trackers, t);
          const hideTrackerNames = faviconOnly && useFavicons && trackers.length > 0;
          const imageHostWarnings = group.ImageHost?.Warnings || [];

          return (
            <section className="panel grid gap-3" key={reactKey}>
              <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2>
                    <span
                      aria-label={hideTrackerNames ? label : undefined}
                      className="inline-flex flex-wrap items-center gap-1.5"
                    >
                      {trackers.map((tracker) => (
                        <TrackerIconImage
                          tracker={tracker}
                          iconSrc={trackerIconFor(trackerIconSrcByName, tracker)}
                          enabled={useFavicons}
                          key={`${groupKey}-${tracker}`}
                        />
                      ))}
                      {hideTrackerNames ? null : label}
                    </span>
                  </h2>
                  <p className="muted">
                    {group.HasOverride
                      ? t("descriptionBuilder.savedOverride")
                      : t("descriptionBuilder.generatedDescription")}
                  </p>
                  {group.ImageHost?.Reuploaded && group.ImageHost?.Message ? (
                    <p className="muted">{group.ImageHost.Message}</p>
                  ) : null}
                  {group.ImageHost?.Status === "warning" && group.ImageHost?.Message ? (
                    <p className="m-0 mt-1 rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[0.82rem] text-amber-100 [overflow-wrap:anywhere]">
                      {group.ImageHost.Message}
                    </p>
                  ) : null}
                  {imageHostWarnings.map((warning, index) => {
                    const host = String(warning.Host || "").trim();
                    const message = String(warning.Message || "").trim();
                    if (!host && !message) return null;
                    return (
                      <p
                        className="m-0 mt-1 rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[0.82rem] text-amber-100 [overflow-wrap:anywhere]"
                        key={`${host || "host"}-${index}`}
                      >
                        {host
                          ? t("descriptionBuilder.imageHostFailed", { host })
                          : t("descriptionBuilder.imageHostWarning")}
                        {message ? `: ${message}` : ""}
                      </p>
                    );
                  })}
                </div>
                <button
                  className="ghost"
                  type="button"
                  onClick={() =>
                    setBuilderExpandedGroups((prev) => ({
                      ...prev,
                      [groupKey]: !expanded,
                    }))
                  }
                >
                  {expanded ? t("descriptionBuilder.collapse") : t("descriptionBuilder.expand")}
                </button>
              </div>

              {expanded ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="ghost"
                      type="button"
                      onClick={() => resetBuilderDescription(groupKey)}
                      disabled={builderLoading || builderSaving || !path.trim()}
                    >
                      {builderLoading
                        ? t("descriptionBuilder.resetting")
                        : t("descriptionBuilder.resetGroup")}
                    </button>
                    <button
                      className="ghost"
                      type="button"
                      onClick={() => renderBuilderDescription(groupKey)}
                      disabled={builderRenderLoading}
                    >
                      {builderRenderLoading
                        ? t("descriptionBuilder.rendering")
                        : t("descriptionBuilder.render")}
                    </button>
                    <button
                      className="primary"
                      type="button"
                      onClick={() => saveBuilderDescription(groupKey)}
                      disabled={builderSaving || !path.trim()}
                    >
                      {builderSaving
                        ? t("descriptionBuilder.saving")
                        : t("descriptionBuilder.saveGroup")}
                    </button>
                  </div>

                  <section className="panel">
                    <div className="mb-2 flex flex-col gap-1">
                      <h2>{t("descriptionBuilder.rawDescription")}</h2>
                      <p className="muted">
                        {t("descriptionBuilder.rawDescriptionSubtitle", {
                          label: hideTrackerNames ? t("common.thisGroup") : label,
                        })}
                      </p>
                    </div>
                    <textarea
                      className="min-h-[170px] w-full resize-y rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[0.95rem] leading-6 text-[var(--text)]"
                      value={raw}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setBuilderRawByGroup((prev) => ({ ...prev, [groupKey]: nextValue }));
                        setBuilderDirtyByGroup((prev) => ({ ...prev, [groupKey]: true }));
                      }}
                    />
                  </section>

                  <section className="panel">
                    <div className="mb-2 flex flex-col gap-1">
                      <h2>{t("descriptionBuilder.previewTitle")}</h2>
                    </div>
                    {renderedHTML ? (
                      <RenderedDescription html={renderedHTML} />
                    ) : (
                      <p className="muted">{t("descriptionBuilder.noPreview")}</p>
                    )}
                  </section>
                </>
              ) : null}
            </section>
          );
        })
      )}
    </section>
  );
}
