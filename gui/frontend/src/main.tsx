// Copyright (c) 2025-2026, Audionut and the autobrr contributors.
// SPDX-License-Identifier: GPL-2.0-or-later

import React from "react";
import ReactDOM from "react-dom/client";
import WebRoot from "./webRoot";
import { I18nProvider } from "./i18n";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <I18nProvider>
      <WebRoot />
    </I18nProvider>
  </React.StrictMode>,
);
