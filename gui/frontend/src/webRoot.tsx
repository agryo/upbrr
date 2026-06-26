// Copyright (c) 2025-2026, Audionut and the autobrr contributors.
// SPDX-License-Identifier: GPL-2.0-or-later

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "./i18n";
import App from "./app";
import { Checkbox } from "./components/ui/checkbox";
import {
  browserAuth,
  initializeBrowserBridge,
  isBrowserMode,
  updateBrowserCSRFToken,
} from "./utils/runtime";

type AuthStatus = {
  authenticated: boolean;
  needsSetup: boolean;
  username: string;
  csrfToken: string;
  nativeBrowseEnabled: boolean;
  caseInsensitivePaths: boolean;
  browseRoot: string;
  allowUnrestrictedBrowse: boolean;
  needsBrowsePolicy: boolean;
};

const initialStatus: AuthStatus = {
  authenticated: false,
  needsSetup: false,
  username: "",
  csrfToken: "",
  nativeBrowseEnabled: false,
  caseInsensitivePaths: false,
  browseRoot: "",
  allowUnrestrictedBrowse: false,
  needsBrowsePolicy: false,
};

export default function WebRoot() {
  const { t, ready } = useTranslation();
  const browserMode = isBrowserMode();
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [retainLogin, setRetainLogin] = useState(false);
  const [browseRoot, setBrowseRoot] = useState("");
  const [allowUnrestrictedBrowse, setAllowUnrestrictedBrowse] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!browserMode) {
      setStatus({ ...initialStatus, authenticated: true });
      return;
    }
    browserAuth
      .status()
      .then((payload) => {
        const next = { ...initialStatus, ...payload };
        setStatus(next);
        setBrowseRoot(next.browseRoot || "");
        setAllowUnrestrictedBrowse(!!next.allowUnrestrictedBrowse);
        initializeBrowserBridge(
          next.csrfToken || "",
          !!next.nativeBrowseEnabled,
          !!next.caseInsensitivePaths,
        );
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        setError(`${t("common.error")}: ${message}`);
        setStatus(initialStatus);
        initializeBrowserBridge("", false);
      });
  }, [browserMode, t]);

  if (!ready) {
    return (
      <div className="web-auth-shell">
        <div className="web-auth-card">{"webRoot.loading"}</div>
      </div>
    );
  }

  if (status === null) {
    return (
      <div className="web-auth-shell">
        <div className="web-auth-card">{t("webRoot.loading")}</div>
      </div>
    );
  }

  if (!browserMode) {
    return <App />;
  }

  if (status.authenticated) {
    const submitBrowsePolicy = async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (submitting || (!allowUnrestrictedBrowse && !browseRoot.trim())) {
        return;
      }
      setSubmitting(true);
      setError("");
      try {
        const payload = await browserAuth.saveBrowsePolicy(browseRoot, allowUnrestrictedBrowse);
        const next = { ...initialStatus, ...(payload as Partial<AuthStatus>) };
        setStatus(next);
        setBrowseRoot(next.browseRoot || "");
        setAllowUnrestrictedBrowse(!!next.allowUnrestrictedBrowse);
        updateBrowserCSRFToken(next.csrfToken || "", !!next.caseInsensitivePaths);
        initializeBrowserBridge(
          next.csrfToken || "",
          !!next.nativeBrowseEnabled,
          !!next.caseInsensitivePaths,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`${t("common.error")}: ${message}`);
      } finally {
        setSubmitting(false);
      }
    };

    if (status.needsBrowsePolicy) {
      return (
        <div className="web-auth-shell">
          <div className="web-auth-card">
            <p className="web-auth-card__eyebrow">{t("webRoot.upbrrWeb")}</p>
            <h1>{t("webRoot.setBrowseAccess")}</h1>
            <p className="web-auth-card__copy">{t("webRoot.browsePolicySubtitle")}</p>
            <form onSubmit={submitBrowsePolicy}>
              <label>
                <span>{t("webRoot.browseRoot")}</span>
                <input
                  value={browseRoot}
                  onChange={(event) => setBrowseRoot(event.target.value)}
                  disabled={allowUnrestrictedBrowse}
                  placeholder={t("webRoot.browseRootPlaceholder")}
                />
              </label>
              <div className="web-auth-card__checkbox">
                <Checkbox
                  id="allow-unrestricted-browse"
                  checked={allowUnrestrictedBrowse}
                  onCheckedChange={setAllowUnrestrictedBrowse}
                />
                <label htmlFor="allow-unrestricted-browse">
                  {t("webRoot.allowUnrestrictedBrowse")}
                </label>
              </div>
              {error ? <p className="web-auth-card__error">{error}</p> : null}
              <button
                type="submit"
                disabled={submitting || (!allowUnrestrictedBrowse && !browseRoot.trim())}
              >
                {submitting ? t("webRoot.saving") : t("webRoot.continue")}
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="web-shell">
        <div className="auth-bar">
          <span className="auth-username">{status.username}</span>
          <button
            type="button"
            className="auth-logout"
            onClick={async () => {
              await browserAuth.logout();
              updateBrowserCSRFToken("");
              window.location.reload();
            }}
          >
            {t("webRoot.logout")}
          </button>
        </div>
        <App />
      </div>
    );
  }

  const submit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (submitting || !username.trim() || !password.trim()) {
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = status.needsSetup
        ? await browserAuth.bootstrap(username, password, retainLogin)
        : await browserAuth.login(username, password, retainLogin);
      const next = { ...initialStatus, ...(payload as Partial<AuthStatus>) };
      setStatus(next);
      setBrowseRoot(next.browseRoot || "");
      setAllowUnrestrictedBrowse(!!next.allowUnrestrictedBrowse);
      updateBrowserCSRFToken(next.csrfToken || "", !!next.caseInsensitivePaths);
      initializeBrowserBridge(
        next.csrfToken || "",
        !!next.nativeBrowseEnabled,
        !!next.caseInsensitivePaths,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`${t("common.error")}: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="web-auth-shell">
      <div className="web-auth-card">
        <p className="web-auth-card__eyebrow">{t("webRoot.upbrrWeb")}</p>
        <h1>{status.needsSetup ? t("webRoot.setupTitle") : t("webRoot.loginTitle")}</h1>
        <p className="web-auth-card__copy">
          {status.needsSetup ? t("webRoot.setupSubtitle") : t("webRoot.authSubtitle")}
        </p>
        <form onSubmit={submit}>
          <label>
            <span>{t("webRoot.username")}</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </label>
          <label>
            <span>{t("webRoot.password")}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={status.needsSetup ? "new-password" : "current-password"}
            />
          </label>
          <div className="web-auth-card__checkbox">
            <Checkbox id="retain-login" checked={retainLogin} onCheckedChange={setRetainLogin} />
            <label htmlFor="retain-login">{t("webRoot.retainLogin")}</label>
          </div>
          {error ? <p className="web-auth-card__error">{error}</p> : null}
          <button type="submit" disabled={submitting || !username.trim() || !password.trim()}>
            {submitting
              ? t("webRoot.working")
              : status.needsSetup
                ? t("webRoot.createAccount")
                : t("webRoot.signIn")}
          </button>
        </form>
      </div>
    </div>
  );
}
