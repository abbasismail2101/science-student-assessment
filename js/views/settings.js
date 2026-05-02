(function (global) {
  global.SSAViews = global.SSAViews || {};

  global.SSAViews.settings = function (root) {
    const { el, route } = global.SSAApp;
    const settings = global.SSAStorage.loadSettings();

    root.appendChild(
      el("div", { class: "page-header" }, [
        el("h1", null, "Settings"),
        el("div", { class: "actions" }, [
          el("a", { href: "#/", class: "btn ghost" }, "Back to classes"),
        ]),
      ])
    );

    const providerSelect = el("select", null, [
      el("option", { value: "local" }, "Local scorer (no setup, works offline)"),
      el("option", { value: "gemini" }, "Google Gemini (free key)"),
      el("option", { value: "claude" }, "Anthropic Claude (paid key)"),
    ]);
    providerSelect.value = settings.provider || "local";

    const geminiInput = el("input", { type: "password", placeholder: "AIza...", value: settings.geminiKey || "" });
    const claudeInput = el("input", { type: "password", placeholder: "sk-ant-...", value: settings.apiKey || "" });

    const geminiRow = el("div", { class: "form-row", style: "margin-top:8px;" }, [
      el("div", { style: "flex:1 1 320px;" }, [
        el("label", null, [
          "Google Gemini API key — get one free at ",
          el("a", { href: "https://aistudio.google.com/app/apikey", target: "_blank", rel: "noopener" }, "aistudio.google.com"),
        ]),
        geminiInput,
      ]),
    ]);

    const claudeRow = el("div", { class: "form-row", style: "margin-top:8px;" }, [
      el("div", { style: "flex:1 1 320px;" }, [
        el("label", null, [
          "Anthropic API key — get one at ",
          el("a", { href: "https://console.anthropic.com", target: "_blank", rel: "noopener" }, "console.anthropic.com"),
        ]),
        claudeInput,
      ]),
    ]);

    function syncVisibility() {
      const p = providerSelect.value;
      geminiRow.style.display = p === "gemini" ? "" : "none";
      claudeRow.style.display = p === "claude" ? "" : "none";
    }
    providerSelect.addEventListener("change", syncVisibility);

    const aiToggle = el("input", { type: "checkbox" });
    aiToggle.checked = settings.aiEnabled;

    const actionsRow = el("div", { class: "form-row", style: "margin-top:14px;" }, [
      el("button", {
        onClick: function () {
          const next = Object.assign({}, settings, {
            provider: providerSelect.value,
            geminiKey: (geminiInput.value || "").trim(),
            apiKey: (claudeInput.value || "").trim(),
            aiEnabled: aiToggle.checked,
          });
          global.SSAStorage.saveSettings(next);
          alert("Settings saved.");
        },
      }, "Save"),
      el("button", {
        class: "danger",
        onClick: function () {
          if (!confirm("Clear both saved API keys from this browser?")) return;
          geminiInput.value = "";
          claudeInput.value = "";
          const next = Object.assign({}, settings, { geminiKey: "", apiKey: "" });
          global.SSAStorage.saveSettings(next);
          alert("API keys cleared.");
        },
      }, "Clear keys"),
    ]);

    const card = el("div", { class: "card" }, [
      el("h2", null, "Observation evaluator"),
      el("p", { class: "meta" },
        "When you write an observation note, the app suggests a rubric level. " +
        "Pick a provider — the local scorer works without any account, Gemini is free with a Google account, and Claude is paid pay-as-you-go."
      ),
      el("div", { class: "form-row", style: "margin-top:8px;" }, [
        el("div", { style: "flex:1 1 320px;" }, [
          el("label", null, "Provider"),
          providerSelect,
        ]),
      ]),
      geminiRow,
      claudeRow,
      actionsRow,
      el("label", { style: "display:flex; gap:8px; align-items:center; margin-top:14px; color:var(--text);" }, [
        aiToggle, el("span", null, "Enable suggestions"),
      ]),
      el("div", { class: "settings-warning" },
        "Heads-up: API keys are stored in this browser's localStorage. Anyone with access to this device can read them. Use the “Clear keys” button on shared computers."
      ),
    ]);
    root.appendChild(card);

    syncVisibility();

    const dataCard = el("div", { class: "card" }, [
      el("h2", null, "Data"),
      el("p", { class: "meta" }, "All student data is stored in this browser. Use Export on the Classes page to back it up."),
      el("button", {
        class: "danger",
        onClick: function () {
          if (confirm("Erase ALL classes, students, and assessments from this browser? This cannot be undone.")) {
            global.SSAStorage.saveData({ classes: [], assessments: [] });
            alert("Data cleared.");
            route();
          }
        },
      }, "Erase all data"),
    ]);
    root.appendChild(dataCard);
  };
})(window);
