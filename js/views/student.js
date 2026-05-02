(function (global) {
  global.SSAViews = global.SSAViews || {};

  global.SSAViews.student = function (root, classId, studentId) {
    const { el, navigate, formatDate } = global.SSAApp;
    const { FACTORS, computeOverall, levelClass } = global.SSARubric;

    const cls = global.SSAStorage.getClass(classId);
    const student = cls && cls.students.find((s) => s.id === studentId);
    if (!cls || !student) {
      root.appendChild(el("div", { class: "card" }, [
        el("h2", null, "Student not found"),
        el("p", null, [el("a", { href: "#/" }, "Back to classes")]),
      ]));
      return;
    }

    const assessments = global.SSAStorage.getAssessmentsForClass(classId);

    root.appendChild(
      el("div", { class: "report-card" }, [
        el("div", { class: "crumbs no-print" }, [
          el("a", { href: "#/" }, "Classes"),
          " / ",
          el("a", { href: `#/class/${classId}` }, cls.name),
          " / ",
          student.name,
        ]),
        el("div", { class: "page-header" }, [
          el("h1", null, student.name),
          el("div", { class: "actions no-print" }, [
            el("button", { class: "ghost", onClick: () => navigate(`#/class/${classId}`) }, "Back to class"),
            el("button", { onClick: () => window.print() }, "Print report card"),
          ]),
        ]),
        el("div", { class: "meta" }, `${cls.name} · ${student.name}`),
      ])
    );

    if (assessments.length === 0) {
      root.appendChild(el("div", { class: "card" }, [
        el("div", { class: "empty" }, "No assessments for this class yet."),
      ]));
      return;
    }

    const card = el("div", { class: "card" }, [el("h2", null, "Assessment history")]);
    const table = el("table");
    const thead = el("thead");
    const headRow = el("tr", null, [
      el("th", null, "Date"),
      el("th", null, "Topic"),
    ]);
    FACTORS.forEach((f) => headRow.appendChild(el("th", null, f.label)));
    headRow.appendChild(el("th", null, "Overall"));
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = el("tbody");
    let anyRated = false;
    assessments
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .forEach((a) => {
        const rating = a.ratings && a.ratings[studentId];
        const overall = computeOverall(rating);
        if (overall) anyRated = true;

        const tr = el("tr");
        tr.appendChild(el("td", null, formatDate(a.date)));
        tr.appendChild(el("td", null, a.topic));
        FACTORS.forEach((f) => {
          const lvl = rating && rating[f.key] && rating[f.key].level;
          const notes = rating && rating[f.key] && rating[f.key].notes;
          const cell = el("td", null, [
            lvl
              ? el("span", { class: `level-pill ${levelClass(lvl)}` }, lvl)
              : el("span", { class: "level-pill none" }, "—"),
          ]);
          if (notes && notes.trim()) {
            cell.appendChild(el("div", { class: "meta", style: "margin-top:4px;" }, notes));
          }
          tr.appendChild(cell);
        });
        tr.appendChild(
          el("td", null,
            overall
              ? el("span", { class: `level-pill ${levelClass(overall)}` }, overall)
              : el("span", { class: "level-pill none" }, "—")
          )
        );
        tbody.appendChild(tr);
      });
    table.appendChild(tbody);
    card.appendChild(table);

    if (!anyRated) {
      card.appendChild(el("div", { class: "empty" }, "No ratings recorded yet for this student."));
    }
    root.appendChild(card);
  };
})(window);
