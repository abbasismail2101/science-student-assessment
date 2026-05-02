(function (global) {
  global.SSAViews = global.SSAViews || {};

  global.SSAViews.classView = function (root, classId) {
    const { el, navigate, route, formatDate } = global.SSAApp;
    const { computeOverall, levelClass } = global.SSARubric;
    const cls = global.SSAStorage.getClass(classId);

    if (!cls) {
      root.appendChild(el("div", { class: "card" }, [
        el("h2", null, "Class not found"),
        el("p", null, [el("a", { href: "#/" }, "Back to classes")]),
      ]));
      return;
    }

    const assessments = global.SSAStorage.getAssessmentsForClass(classId);

    // Header
    root.appendChild(
      el("div", null, [
        el("div", { class: "crumbs no-print" }, [
          el("a", { href: "#/" }, "Classes"),
          " / ",
          cls.name,
        ]),
        el("div", { class: "page-header" }, [
          el("h1", null, cls.name),
          el("div", { class: "actions" }, [
            el("button", {
              onClick: function () {
                const a = global.SSAStorage.addAssessment(classId, prompt("Topic / unit?", "New assessment") || "Untitled", new Date().toISOString().slice(0, 10));
                navigate(`#/class/${classId}/assessment/${a.id}`);
              },
            }, "+ New assessment"),
          ]),
        ]),
      ])
    );

    // Students card
    const studentsCard = el("div", { class: "card" }, [el("h2", null, "Students")]);
    const addInput = el("input", { type: "text", placeholder: "Student name" });
    studentsCard.appendChild(
      el("div", { class: "form-row" }, [
        el("div", null, [el("label", null, "Add student"), addInput]),
        el("button", {
          onClick: function () {
            const name = (addInput.value || "").trim();
            if (!name) return;
            global.SSAStorage.addStudent(classId, name);
            route();
          },
        }, "Add"),
      ])
    );
    if (cls.students.length === 0) {
      studentsCard.appendChild(el("div", { class: "empty" }, "No students yet. Add one above."));
    } else {
      const ul = el("ul", { class: "list" });
      cls.students.forEach((s) => {
        ul.appendChild(
          el("li", null, [
            el("a", { href: `#/class/${classId}/student/${s.id}` }, s.name),
            el("div", { class: "actions" }, [
              el("button", {
                class: "ghost",
                onClick: function () {
                  const newName = prompt("Rename student", s.name);
                  if (newName && newName.trim()) {
                    global.SSAStorage.updateStudent(classId, s.id, { name: newName.trim() });
                    route();
                  }
                },
              }, "Rename"),
              el("button", {
                class: "danger",
                onClick: function () {
                  if (confirm(`Remove "${s.name}" and their ratings from this class?`)) {
                    global.SSAStorage.deleteStudent(classId, s.id);
                    route();
                  }
                },
              }, "Remove"),
            ]),
          ])
        );
      });
      studentsCard.appendChild(ul);
    }

    // Assessments card
    const assessmentsCard = el("div", { class: "card" }, [el("h2", null, "Assessments")]);
    if (assessments.length === 0) {
      assessmentsCard.appendChild(el("div", { class: "empty" }, "No assessments yet. Click “+ New assessment” to create one."));
    } else {
      const ul = el("ul", { class: "list" });
      assessments.forEach((a) => {
        ul.appendChild(
          el("li", null, [
            el("div", null, [
              el("div", null, [el("a", { href: `#/class/${classId}/assessment/${a.id}` }, a.topic)]),
              el("div", { class: "meta" }, formatDate(a.date)),
            ]),
            el("div", { class: "actions" }, [
              el("button", { class: "secondary", onClick: () => navigate(`#/class/${classId}/assessment/${a.id}`) }, "Open"),
              el("button", {
                class: "danger",
                onClick: function () {
                  if (confirm(`Delete assessment "${a.topic}"?`)) {
                    global.SSAStorage.deleteAssessment(a.id);
                    route();
                  }
                },
              }, "Delete"),
            ]),
          ])
        );
      });
      assessmentsCard.appendChild(ul);
    }

    // Overview table
    const overviewCard = el("div", { class: "card" }, [el("h2", null, "Class overview")]);
    if (cls.students.length === 0 || assessments.length === 0) {
      overviewCard.appendChild(el("div", { class: "empty" }, "Add students and at least one assessment to see the overview."));
    } else {
      const recent = assessments.slice(0, 5).reverse();
      const table = el("table", { class: "overview-table" });
      const thead = el("thead");
      const headRow = el("tr", null, [el("th", { class: "student-col" }, "Student")]);
      recent.forEach((a) => {
        headRow.appendChild(el("th", null, [a.topic, el("div", { class: "meta" }, formatDate(a.date))]));
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = el("tbody");
      cls.students.forEach((s) => {
        const tr = el("tr");
        tr.appendChild(el("td", null, el("a", { href: `#/class/${classId}/student/${s.id}` }, s.name)));
        recent.forEach((a) => {
          const rating = a.ratings && a.ratings[s.id];
          const overall = computeOverall(rating);
          tr.appendChild(
            el("td", null,
              overall
                ? el("span", { class: `level-pill ${levelClass(overall)}` }, overall)
                : el("span", { class: "level-pill none" }, "—")
            )
          );
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      overviewCard.appendChild(table);
    }

    root.appendChild(studentsCard);
    root.appendChild(assessmentsCard);
    root.appendChild(overviewCard);
  };
})(window);
