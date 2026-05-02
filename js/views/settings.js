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

    const apiInput = el("input", { type: "password", placeholder: "sk-ant-...", value: settings.apiKey || "" });
    const aiToggle = el("input", { type: "checkbox" });
    aiToggle.checked = settings.aiEnabled;

    const card = el("div", { class: "card" }, [
      el("h2", null, "Observation evaluator"),
      el("p", { class: "meta" },
        "When you write an observation note, the app suggests a rubric level. " +
        "If you set a Claude API key below, suggestions use Claude. Otherwise the app uses a built-in keyword scorer that works offline."
      ),
      el("div", { class: "form-row", style: "margin-top:8px;" }, [
        el("div", { style: "flex:1 1 320px;" }, [
          el("label", null, "Anthropic API key (optional)"),
          apiInput,
        ]),
        el("button", {
          onClick: function () {
            const next = Object.assign({}, settings, {
              apiKey: (apiInput.value || "").trim(),
              aiEnabled: aiToggle.checked,
            });
            global.SSAStorage.saveSettings(next);
            alert("Settings saved.");
          },
        }, "Save"),
        el("button", {
          class: "danger",
          onClick: function () {
            apiInput.value = "";
            const next = Object.assign({}, settings, { apiKey: "" });
            global.SSAStorage.saveSettings(next);
            alert("API key cleared.");
          },
        }, "Clear key"),
      ]),
      el("label", { style: "display:flex; gap:8px; align-items:center; margin-top:14px; color:var(--text);" }, [
        aiToggle, el("span", null, "Enable AI / local suggestions"),
      ]),
      el("div", { class: "settings-warning" },
        "Heads-up: your API key is stored in this browser's localStorage. Anyone with access to this device can read it. Use the “Clear key” button when you're done on shared computers."
      ),
    ]);
    root.appendChild(card);

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
