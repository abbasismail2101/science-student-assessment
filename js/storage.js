(function (global) {
  const DATA_KEY = "ssa_data_v1";
  const SETTINGS_KEY = "ssa_settings_v1";

  function emptyData() {
    return { classes: [], assessments: [] };
  }

  function defaultSettings() {
    return { apiKey: "", aiEnabled: true };
  }

  function uid(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 7)
    );
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (!raw) return emptyData();
      const parsed = JSON.parse(raw);
      if (!parsed.classes) parsed.classes = [];
      if (!parsed.assessments) parsed.assessments = [];
      return parsed;
    } catch (e) {
      console.error("Failed to load data, starting fresh", e);
      return emptyData();
    }
  }

  function saveData(data) {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return defaultSettings();
      return Object.assign(defaultSettings(), JSON.parse(raw));
    } catch (e) {
      return defaultSettings();
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function exportJSON() {
    return JSON.stringify({ data: loadData(), exportedAt: new Date().toISOString() }, null, 2);
  }

  function importJSON(text) {
    const parsed = JSON.parse(text);
    const data = parsed && parsed.data ? parsed.data : parsed;
    if (!data || !Array.isArray(data.classes) || !Array.isArray(data.assessments)) {
      throw new Error("Invalid file format");
    }
    saveData(data);
    return data;
  }

  // --- Classes ---
  function addClass(name) {
    const data = loadData();
    const cls = { id: uid("c"), name: name.trim(), createdAt: Date.now(), students: [] };
    data.classes.push(cls);
    saveData(data);
    return cls;
  }

  function updateClass(classId, updates) {
    const data = loadData();
    const cls = data.classes.find((c) => c.id === classId);
    if (!cls) return null;
    Object.assign(cls, updates);
    saveData(data);
    return cls;
  }

  function deleteClass(classId) {
    const data = loadData();
    data.classes = data.classes.filter((c) => c.id !== classId);
    data.assessments = data.assessments.filter((a) => a.classId !== classId);
    saveData(data);
  }

  function getClass(classId) {
    return loadData().classes.find((c) => c.id === classId) || null;
  }

  // --- Students ---
  function addStudent(classId, name) {
    const data = loadData();
    const cls = data.classes.find((c) => c.id === classId);
    if (!cls) return null;
    const student = { id: uid("s"), name: name.trim() };
    cls.students.push(student);
    saveData(data);
    return student;
  }

  function updateStudent(classId, studentId, updates) {
    const data = loadData();
    const cls = data.classes.find((c) => c.id === classId);
    if (!cls) return null;
    const student = cls.students.find((s) => s.id === studentId);
    if (!student) return null;
    Object.assign(student, updates);
    saveData(data);
    return student;
  }

  function deleteStudent(classId, studentId) {
    const data = loadData();
    const cls = data.classes.find((c) => c.id === classId);
    if (!cls) return;
    cls.students = cls.students.filter((s) => s.id !== studentId);
    data.assessments
      .filter((a) => a.classId === classId)
      .forEach((a) => {
        if (a.ratings && a.ratings[studentId]) delete a.ratings[studentId];
      });
    saveData(data);
  }

  // --- Assessments ---
  function addAssessment(classId, topic, date) {
    const data = loadData();
    const a = {
      id: uid("a"),
      classId,
      topic: (topic || "").trim() || "Untitled",
      date: date || new Date().toISOString().slice(0, 10),
      ratings: {},
    };
    data.assessments.push(a);
    saveData(data);
    return a;
  }

  function getAssessment(assessmentId) {
    return loadData().assessments.find((a) => a.id === assessmentId) || null;
  }

  function getAssessmentsForClass(classId) {
    return loadData()
      .assessments.filter((a) => a.classId === classId)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  function updateAssessment(assessmentId, updates) {
    const data = loadData();
    const a = data.assessments.find((x) => x.id === assessmentId);
    if (!a) return null;
    Object.assign(a, updates);
    saveData(data);
    return a;
  }

  function deleteAssessment(assessmentId) {
    const data = loadData();
    data.assessments = data.assessments.filter((a) => a.id !== assessmentId);
    saveData(data);
  }

  function updateRating(assessmentId, studentId, factor, fields) {
    const data = loadData();
    const a = data.assessments.find((x) => x.id === assessmentId);
    if (!a) return null;
    if (!a.ratings[studentId]) {
      a.ratings[studentId] = {
        writing: { level: null, notes: "" },
        oral: { level: null, notes: "" },
        observation: { level: null, notes: "" },
      };
    }
    const cell = a.ratings[studentId][factor];
    Object.assign(cell, fields);
    saveData(data);
    return a.ratings[studentId];
  }

  global.SSAStorage = {
    loadData,
    saveData,
    loadSettings,
    saveSettings,
    exportJSON,
    importJSON,
    addClass,
    updateClass,
    deleteClass,
    getClass,
    addStudent,
    updateStudent,
    deleteStudent,
    addAssessment,
    getAssessment,
    getAssessmentsForClass,
    updateAssessment,
    deleteAssessment,
    updateRating,
  };
})(window);
