(function (global) {
  const LEVELS = ["Beginner", "Developing", "Proficient", "Advanced"];

  const SCORE = { Beginner: 1, Developing: 2, Proficient: 3, Advanced: 4 };

  const FACTORS = [
    { key: "writing", label: "Writing test" },
    { key: "oral", label: "Oral evaluation" },
    { key: "observation", label: "Observation" },
  ];

  // Definitions used in the AI prompt and (lightly) in the UI.
  const DEFINITIONS = {
    Beginner:
      "Shows little or no understanding; struggles with basic ideas; cannot apply concepts.",
    Developing:
      "Shows partial understanding; needs prompts or help; can apply some basic ideas.",
    Proficient:
      "Shows clear understanding; explains concepts accurately; applies them correctly.",
    Advanced:
      "Shows deep understanding; connects ideas, predicts, extends, or teaches others.",
  };

  function levelClass(level) {
    if (!level) return "none";
    return level.toLowerCase();
  }

  function computeOverall(rating) {
    if (!rating) return null;
    const scores = ["writing", "oral", "observation"]
      .map((k) => rating[k] && rating[k].level)
      .filter((l) => l && SCORE[l])
      .map((l) => SCORE[l]);
    if (scores.length === 0) return null;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const idx = Math.min(LEVELS.length - 1, Math.max(0, Math.round(avg) - 1));
    return LEVELS[idx];
  }

  global.SSARubric = { LEVELS, SCORE, FACTORS, DEFINITIONS, levelClass, computeOverall };
})(window);
