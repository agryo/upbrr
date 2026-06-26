// Copyright (c) 2025-2026, Audionut and the autobrr contributors.
// SPDX-License-Identifier: GPL-2.0-or-later

import LogSettingsPanel from "../../components/LogSettingsPanel";
import { useTranslation } from "../../i18n";
import type { ConfigMap, ConfigValue, FieldMeta } from "../../types";

type Props = Readonly<{
  configData: ConfigMap | null;
  settingsLoading: boolean;
  settingsDirty: boolean;
  settingsSaved: string;
  settingsError: string;
  loadSettings: () => void;
  handleSaveSettings: () => void;
  renderField: (label: string, value: ConfigValue, path: string[], meta?: FieldMeta) => JSX.Element;
  updateConfigValue: (path: string[], value: ConfigValue) => void;
  sectionFieldMeta: Record<string, Record<string, FieldMeta>>;
}>;

export default function LoggingPage(props: Props) {
  const {
    configData,
    settingsLoading,
    settingsDirty,
    settingsSaved,
    settingsError,
    loadSettings,
    handleSaveSettings,
    renderField,
    updateConfigValue,
    sectionFieldMeta,
  } = props;

  const { t } = useTranslation();

  return (
    <div className="content-stack">
      <header className="hero">
        <p className="eyebrow">upbrr</p>
        <h1>{t("logging.title")}</h1>
        <p className="subtitle">{t("logging.subtitle")}</p>
      </header>

      <section className="panel">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="label">{t("logging.controls")}</p>
            <p className="helper">{t("logging.controlsSubtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="ghost"
              type="button"
              onClick={loadSettings}
              disabled={settingsLoading}
            >
              {t("common.reload")}
            </button>
            <button
              className="primary"
              type="button"
              onClick={handleSaveSettings}
              disabled={settingsLoading || !settingsDirty}
            >
              {t("common.save")}
            </button>
          </div>
        </div>

        <div className="min-w-0">
          {configData ? (
            <div className="flex flex-col gap-3">
              <LogSettingsPanel
                configData={configData}
                renderField={renderField}
                updateConfigValue={updateConfigValue}
                fieldMeta={sectionFieldMeta.Logging || {}}
              />
            </div>
          ) : (
            <p className="muted">{t("common.loading")}</p>
          )}
        </div>

        {settingsSaved ? <p className="settings-saved">{settingsSaved}</p> : null}
        {settingsError ? <p className="error">{settingsError}</p> : null}
      </section>
    </div>
  );
}
