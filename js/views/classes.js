(function (global) {
  global.SSAViews = global.SSAViews || {};

  global.SSAViews.classes = function (root) {
    const { el, navigate, route, formatDate } = global.SSAApp;
    const data = global.SSAStorage.loadData();

    function lastAssessmentDate(classId) {
      const list = global.SSAStorage.getAssessmentsForClass(classId);
      return list.length ? list[0].date : null;
    }

    const header = el("div", { class: "page-header" }, [
      el("h1", null, "Classes"),
      el("div", { class: "actions" }, [
        el("button", { class: "secondary", onClick: handleExport }, "Export data"),
        el("button", { class: "ghost", onClick: handleImport }, "Import data"),
      ]),
    ]);

    // Add class form
    const addCard = el("div", { class: "card" }, [
      el("h2", null, "Add a class"),
      (function () {
        const input = el("input", { type: "text", placeholder: "e.g., Grade 7 Science" });
        const row = el("div", { class: "form-row" }, [
          (function () {
            const wrap = el("div", null, [el("label", null, "Class name"), input]);
            return wrap;
          })(),
          el("button", {
            onClick: function () {
              const name = (input.value || "").trim();
              if (!name) return;
              global.SSAStorage.addClass(name);
              input.value = "";
              route();
            },
          }, "Add class"),
        ]);
        return row;
      })(),
    ]);

    // Classes list
    const listCard = el("div", { class: "card" }, [el("h2", null, "Your classes")]);
    if (data.classes.length === 0) {
      listCard.appendChild(el("div", { class: "empty" }, "No classes yet. Add your first one above to get started."));
    } else {
      const ul = el("ul", { class: "list" });
      data.classes.forEach((c) => {
        const last = lastAssessmentDate(c.id);
        ul.appendChild(
          el("li", null, [
            el("div", null, [
              el("div", null, [
                el("a", { href: `#/class/${c.id}` }, c.name),
              ]),
              el("div", { class: "meta" },
                `${c.students.length} student${c.students.length === 1 ? "" : "s"} · ` +
                (last ? `last assessment ${formatDate(last)}` : "no assessments yet")
              ),
            ]),
            el("div", { class: "actions" }, [
              el("button", { class: "secondary", onClick: () => navigate(`#/class/${c.id}`) }, "Open"),
              el("button", {
                class: "danger",
                onClick: () => {
                  if (confirm(`Delete class "${c.name}" and all its assessments? This cannot be undone.`)) {
                    global.SSAStorage.deleteClass(c.id);
                    route();
                  }
                },
              }, "Delete"),
            ]),
          ])
        );
      });
      listCard.appendChild(ul);
    }

    root.appendChild(header);
    root.appendChild(addCard);
    root.appendChild(listCard);

    function handleExport() {
      const blob = new Blob([global.SSAStorage.exportJSON()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ssa-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function handleImport() {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json";
      input.onchange = function () {
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function () {
          try {
            global.SSAStorage.importJSON(String(reader.result || ""));
            alert("Import successful.");
            route();
          } catch (e) {
            alert("Import failed: " + e.message);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }
  };
})(window);
