(function (global) {
  global.SSAViews = global.SSAViews || {};

  global.SSAViews.assessment = function (root, classId, assessmentId) {
    const { el, navigate, formatDate, debounce } = global.SSAApp;
    const { LEVELS, FACTORS, computeOverall, levelClass } = global.SSARubric;

    const cls = global.SSAStorage.getClass(classId);
    const assessment = global.SSAStorage.getAssessment(assessmentId);

    if (!cls || !assessment) {
      root.appendChild(el("div", { class: "card" }, [
        el("h2", null, "Assessment not found"),
        el("p", null, [el("a", { href: `#/class/${classId}` }, "Back to class")]),
      ]));
      return;
    }

    function ensureRating(studentId) {
      if (!assessment.ratings[studentId]) {
        assessment.ratings[studentId] = {
          writing: { level: null, notes: "" },
          oral: { level: null, notes: "" },
          observation: { level: null, notes: "" },
        };
      }
      return assessment.ratings[studentId];
    }

    // Header
    const topicInput = el("input", { type: "text", value: assessment.topic });
    const dateInput = el("input", { type: "date", value: assessment.date });

    const saveMeta = debounce(function () {
      global.SSAStorage.updateAssessment(assessmentId, {
        topic: (topicInput.value || "Untitled").trim() || "Untitled",
        date: dateInput.value || assessment.date,
      });
    }, 300);
    topicInput.addEventListener("input", saveMeta);
    dateInput.addEventListener("change", saveMeta);

    root.appendChild(
      el("div", null, [
        el("div", { class: "crumbs no-print" }, [
          el("a", { href: "#/" }, "Classes"),
          " / ",
          el("a", { href: `#/class/${classId}` }, cls.name),
          " / ",
          assessment.topic,
        ]),
        el("div", { class: "page-header" }, [
          el("h1", null, "Assessment"),
          el("div", { class: "actions" }, [
            el("button", { class: "ghost", onClick: () => navigate(`#/class/${classId}`) }, "Back to class"),
          ]),
        ]),
      ])
    );

    const metaCard = el("div", { class: "card" }, [
      el("div", { class: "form-row" }, [
        el("div", null, [el("label", null, "Topic / unit"), topicInput]),
        el("div", null, [el("label", null, "Date"), dateInput]),
      ]),
    ]);
    root.appendChild(metaCard);

    if (cls.students.length === 0) {
      root.appendChild(el("div", { class: "card" }, [
        el("div", { class: "empty" }, [
          "No students in this class yet. ",
          el("a", { href: `#/class/${classId}` }, "Add students first"),
          ".",
        ]),
      ]));
      return;
    }

    // Build editor
    const card = el("div", { class: "card" }, [el("h2", null, "Rate each student")]);
    const table = el("table", { class: "assessment-table" });
    const thead = el("thead");
    const headRow = el("tr", null, [el("th", null, "Student")]);
    FACTORS.forEach((f) => headRow.appendChild(el("th", { class: "factor-cell" }, f.label)));
    headRow.appendChild(el("th", null, "Overall"));
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = el("tbody");
    cls.students.forEach((s) => {
      const rating = ensureRating(s.id);
      const tr = el("tr", { "data-student": s.id });
      tr.appendChild(el("td", null, el("a", { href: `#/class/${classId}/student/${s.id}` }, s.name)));

      FACTORS.forEach((f) => {
        const cell = el("td", { class: "factor-cell" });
        const buttonsWrap = el("div", { class: "rubric-buttons" });
        const buttons = {};
        LEVELS.forEach((lv) => {
          const btn = el("button", {
            type: "button",
            class: rating[f.key].level === lv ? `selected ${levelClass(lv)}` : "",
            onClick: function () {
              setLevel(s.id, f.key, lv);
            },
          }, lv);
          buttons[lv] = btn;
          buttonsWrap.appendChild(btn);
        });
        cell.appendChild(buttonsWrap);

        const notes = el("textarea", { placeholder: "Notes (optional)" });
        notes.value = rating[f.key].notes || "";
        const onNotesInput = debounce(function () {
          global.SSAStorage.updateRating(assessmentId, s.id, f.key, { notes: notes.value });
          assessment.ratings[s.id][f.key].notes = notes.value;
          if (f.key === "observation") triggerSuggestion(s.id, notes.value, suggestionBox, buttons, overallCell);
        }, 700);
        notes.addEventListener("input", onNotesInput);
        cell.appendChild(notes);

        // Suggestion box (observation only)
        let suggestionBox = null;
        if (f.key === "observation") {
          suggestionBox = el("div", { class: "suggestion", style: "display:none;" });
          cell.appendChild(suggestionBox);
          if (notes.value.trim()) {
            triggerSuggestion(s.id, notes.value, suggestionBox, buttons, null);
          }
        }

        // Cache references for setLevel reuse via row map
        tr["__factor_" + f.key] = { buttons, notes };
        tr.appendChild(cell);
      });

      const overallCell = el("td");
      tr.appendChild(overallCell);
      renderOverall(overallCell, rating);
      tr.__overallCell = overallCell;

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    card.appendChild(table);
    root.appendChild(card);

    function renderOverall(cellEl, rating) {
      const overall = computeOverall(rating);
      cellEl.innerHTML = "";
      cellEl.appendChild(
        overall
          ? el("span", { class: `level-pill ${levelClass(overall)}` }, overall)
          : el("span", { class: "level-pill none" }, "—")
      );
    }

    function setLevel(studentId, factorKey, level) {
      const tr = tbody.querySelector(`tr[data-student="${studentId}"]`);
      if (!tr) return;
      const ref = tr["__factor_" + factorKey];
      if (!ref) return;
      LEVELS.forEach((lv) => {
        const b = ref.buttons[lv];
        b.className = lv === level ? `selected ${levelClass(lv)}` : "";
      });
      global.SSAStorage.updateRating(assessmentId, studentId, factorKey, { level });
      assessment.ratings[studentId][factorKey].level = level;
      renderOverall(tr.__overallCell, assessment.ratings[studentId]);
    }

    const debouncedSuggest = debounce(async function (studentId, text, box, buttons) {
      if (!text.trim()) {
        box.style.display = "none";
        return;
      }
      box.className = "suggestion loading";
      box.style.display = "";
      box.textContent = "Thinking…";
      try {
        const result = await global.SSAEvaluator.evaluateObservation(text);
        if (!result) {
          box.className = "suggestion";
          box.textContent = "No clear cues found — please rate manually.";
          return;
        }
        renderSuggestion(box, result, () => {
          setLevel(studentId, "observation", result.level);
          box.style.display = "none";
        });
      } catch (e) {
        box.className = "suggestion error";
        box.textContent = "Suggestion error: " + e.message;
      }
    }, 800);

    function triggerSuggestion(studentId, text, box, buttons) {
      if (!box) return;
      debouncedSuggest(studentId, text, box, buttons);
    }

    function renderSuggestion(box, result, onAccept) {
      box.className = "suggestion";
      box.innerHTML = "";
      box.appendChild(
        el("div", null, [
          el("strong", null, `Suggested: ${result.level}`),
          " ",
          el("span", { class: "meta" }, result.source === "ai" ? "(Claude)" : "(local)"),
        ])
      );
      if (result.reason) {
        box.appendChild(el("div", { class: "meta", style: "margin-top:4px;" }, result.reason));
      }
      box.appendChild(
        el("div", { class: "suggestion-actions" }, [
          el("button", { onClick: onAccept }, "Accept"),
          el("button", {
            class: "ghost",
            onClick: function () {
              box.style.display = "none";
            },
          }, "Dismiss"),
        ])
      );
    }
  };
})(window);
