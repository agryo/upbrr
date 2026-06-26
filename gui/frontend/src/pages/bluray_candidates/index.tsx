// Copyright (c) 2025-2026, Audionut and the autobrr contributors.
// SPDX-License-Identifier: GPL-2.0-or-later

import { useTranslation } from "../../i18n";
import type { BlurayReleaseCandidate, MetadataPreview } from "../../types";
import { handleExternalLinkClick } from "../../utils/externalLinks";

type Props = {
  preview: MetadataPreview;
  selecting: boolean;
  error: string;
  onSelect: (releaseID: string) => void;
  setLightboxImage: (url: string) => void;
  setLightboxAlt: (alt: string) => void;
};

const scoreLabel = (candidate: BlurayReleaseCandidate) => `${candidate.Score.toFixed(1)}/100`;

export default function BlurayCandidatesPage(props: Props) {
  const { preview, selecting, error, onSelect, setLightboxImage, setLightboxAlt } = props;
  const { t } = useTranslation();
  const bluray = preview.Bluray;
  const candidates = bluray?.Candidates || [];
  const selectedID = bluray?.SelectedReleaseID || "";

  return (
    <section className="flex flex-col gap-3">
      <header className="max-w-3xl">
        <p className="eyebrow">{t("bluray.eyebrow")}</p>
        <h1>{t("bluray.title")}</h1>
        <p className="subtitle">{t("bluray.subtitle")}</p>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {!bluray ? (
        <section className="panel">
          <p className="muted">{t("bluray.noCandidates", { path: "" })}</p>
        </section>
      ) : (
        <>
          <section className="panel grid gap-2 py-3">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
              <div>
                <p className="label">{t("bluray.bestScore")}</p>
                <p className="value">{bluray.BestScore.toFixed(1)}</p>
              </div>
              <div>
                <p className="label">{t("bluray.requiredScore")}</p>
                <p className="value">{bluray.Threshold.toFixed(1)}</p>
              </div>
              <div>
                <p className="label">{t("bluray.autoSelected")}</p>
                <p className="value">{bluray.AutoSelected ? t("common.yes") : t("common.no")}</p>
              </div>
              <div>
                <p className="label">{t("bluray.candidates")}</p>
                <p className="value">{candidates.length}</p>
              </div>
            </div>
            {bluray.SearchURL ? (
              <a
                className="tracker-link w-fit"
                href={bluray.SearchURL}
                target="_blank"
                rel="noreferrer"
                onAuxClick={handleExternalLinkClick}
                onClick={handleExternalLinkClick}
              >
                {t("bluray.openSearch")}
              </a>
            ) : null}
            {!selectedID && bluray.SelectionReason ? (
              <p className="m-0 rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[0.82rem] text-amber-100">
                {bluray.SelectionReason}
              </p>
            ) : null}
          </section>

          {candidates.length === 0 ? (
            <section className="panel">
              <p className="muted">{t("input.noCandidates")}</p>
            </section>
          ) : (
            <div className="grid gap-3">
              {candidates.map((candidate) => {
                const selected = candidate.ReleaseID === selectedID || candidate.Accepted;
                const hasReleaseID = Boolean(candidate.ReleaseID);
                return (
                  <section
                    className={`panel grid gap-3 ${selected ? "border-[var(--sidebar-active-border)]" : ""}`}
                    key={candidate.ReleaseID || candidate.URL}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="[overflow-wrap:anywhere]">{candidate.Title || "-"}</h2>
                        <p className="muted [overflow-wrap:anywhere]">
                          {[candidate.MovieTitle, candidate.MovieYear].filter(Boolean).join(" ")}
                        </p>
                      </div>
                      <button
                        className={selected ? "primary" : "ghost"}
                        type="button"
                        disabled={selecting || selected || !hasReleaseID}
                        onClick={() => {
                          if (hasReleaseID) onSelect(candidate.ReleaseID);
                        }}
                      >
                        {selected ? t("bluray.selected") : selecting ? t("bluray.selecting") : t("bluray.select")}
                      </button>
                    </div>

                    <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
                      <div>
                        <p className="label">{t("bluray.score")}</p>
                        <p className="value">{scoreLabel(candidate)}</p>
                      </div>
                      <div>
                        <p className="label">{t("bluray.country")}</p>
                        <p className="value">{candidate.Country || "-"}</p>
                      </div>
                      <div>
                        <p className="label">{t("bluray.region")}</p>
                        <p className="value">{candidate.Region || "-"}</p>
                      </div>
                      <div>
                        <p className="label">{t("bluray.publisher")}</p>
                        <p className="value">{candidate.Publisher || "-"}</p>
                      </div>
                      <div>
                        <p className="label">{t("bluray.disc")}</p>
                        <p className="value">{candidate.Specs?.Discs?.Format || "-"}</p>
                      </div>
                    </div>

                    {candidate.URL ? (
                      <a
                        className="tracker-link w-fit"
                        href={candidate.URL}
                        target="_blank"
                        rel="noreferrer"
                        onAuxClick={handleExternalLinkClick}
                        onClick={handleExternalLinkClick}
                      >
                        {t("bluray.openRelease")}
                      </a>
                    ) : null}

                    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2">
                      <div>
                        <p className="label">{t("bluray.video")}</p>
                        <p className="value">
                          {[candidate.Specs?.Video?.Codec, candidate.Specs?.Video?.Resolution]
                            .filter(Boolean)
                            .join(" ") || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="label">{t("bluray.audio")}</p>
                        <p className="value [overflow-wrap:anywhere]">
                          {(candidate.Specs?.Audio || []).slice(0, 3).join("; ") || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="label">{t("bluray.subtitles")}</p>
                        <p className="value [overflow-wrap:anywhere]">
                          {(candidate.Specs?.Subtitles || []).slice(0, 6).join(", ") || "-"}
                        </p>
                      </div>
                    </div>

                    {candidate.MatchNotes?.length ? (
                      <div>
                        <p className="label">{t("bluray.scoreNotes")}</p>
                        <p className="value [overflow-wrap:anywhere]">
                          {candidate.MatchNotes.slice(0, 5).join(" | ")}
                        </p>
                      </div>
                    ) : null}

                    {candidate.CoverImages?.length ? (
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,160px))] gap-2">
                        {candidate.CoverImages.map((image) => (
                          <button
                            className="cursor-pointer border-0 bg-transparent p-0"
                            type="button"
                            key={`${candidate.ReleaseID}-${image.Kind}-${image.URL}`}
                            onClick={() => {
                              setLightboxImage(image.URL);
                              setLightboxAlt(`${candidate.Title} ${image.Kind}`);
                            }}
                          >
                            <img
                              className="w-full rounded-md border border-white/10"
                              src={image.URL}
                              alt={image.Kind || t("bluray.coverImage")}
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
