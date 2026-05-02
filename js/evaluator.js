(function (global) {
  const { LEVELS, DEFINITIONS } = global.SSARubric;

  // --- Local rule-based fallback ---
  const KEYWORDS = {
    Beginner: [
      "struggle", "struggled", "struggles", "struggling",
      "confused", "confusion",
      "off-task", "off task",
      "couldn't", "could not", "cannot",
      "didn't understand", "did not understand",
      "no idea", "blank", "lost",
      "incorrect", "wrong",
      "unable", "guessed",
    ],
    Developing: [
      "tried", "trying", "attempted",
      "partially", "partial",
      "with help", "with prompting", "with support", "needed help", "needed a prompt",
      "starting to", "beginning to",
      "some understanding", "some idea",
      "improving", "getting there",
      "mostly", "somewhat",
    ],
    Proficient: [
      "explains", "explained", "explain",
      "demonstrates", "demonstrated", "demonstrate",
      "applies", "applied", "apply",
      "correctly identifies", "identifies correctly", "correctly",
      "understands", "understood", "understanding",
      "accurate", "accurately",
      "clear", "clearly",
      "completed", "successfully",
    ],
    Advanced: [
      "extends", "extended",
      "asks deep questions", "asked deep questions", "insightful question",
      "connects", "connected", "links",
      "teaches others", "helped others", "helping others",
      "predicts", "predicted", "hypothesizes", "hypothesised", "hypothesized",
      "creative", "original",
      "beyond", "advanced",
      "without prompting", "independently", "on their own",
      "synthesises", "synthesizes", "synthesis",
    ],
  };

  function localScore(text) {
    if (!text || !text.trim()) return null;
    const t = text.toLowerCase();
    const hits = {};
    let totalHits = 0;
    let matchedTerms = {};
    for (const level of LEVELS) {
      hits[level] = 0;
      matchedTerms[level] = [];
      for (const kw of KEYWORDS[level]) {
        if (t.includes(kw)) {
          hits[level] += 1;
          totalHits += 1;
          matchedTerms[level].push(kw);
        }
      }
    }
    if (totalHits === 0) return null;
    let best = LEVELS[0];
    for (const level of LEVELS) {
      if (hits[level] > hits[best]) best = level;
    }
    const matched = matchedTerms[best].slice(0, 3).join(", ");
    return {
      level: best,
      reason: `Matched cues: ${matched}.`,
      source: "local",
    };
  }

  // --- Claude API ---
  async function aiScore(text, apiKey) {
    const definitions = LEVELS.map((l) => `- ${l}: ${DEFINITIONS[l]}`).join("\n");
    const system =
      "You are an assistant that helps a science teacher classify a student's level " +
      "of understanding from a brief written observation. Respond with ONLY a single " +
      "JSON object (no prose, no code fences) of the form: " +
      `{"level":"<one of: ${LEVELS.join(", ")}>","reason":"<one short sentence>"}.`;

    const user =
      `Rubric levels:\n${definitions}\n\n` +
      `Teacher's observation:\n"""${text}"""\n\n` +
      "Pick the single best-fitting level and give a one-sentence reason.";

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${errText.slice(0, 200)}`);
    }

    const body = await res.json();
    const textOut = (body.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    let parsed;
    try {
      const jsonMatch = textOut.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : textOut);
    } catch (e) {
      throw new Error("Could not parse model response as JSON");
    }
    if (!LEVELS.includes(parsed.level)) {
      throw new Error("Model returned an invalid level");
    }
    return {
      level: parsed.level,
      reason: parsed.reason || "",
      source: "ai",
    };
  }

  // Returns { level, reason, source } or null when there's nothing to suggest.
  async function evaluateObservation(text) {
    if (!text || !text.trim()) return null;
    const settings = global.SSAStorage.loadSettings();
    if (!settings.aiEnabled) {
      return localScore(text);
    }
    if (settings.apiKey) {
      try {
        return await aiScore(text, settings.apiKey);
      } catch (e) {
        console.warn("AI evaluation failed, falling back to local scorer:", e);
        const local = localScore(text);
        if (local) {
          local.reason = `(AI unavailable — using local scorer) ${local.reason}`;
        }
        return local;
      }
    }
    return localScore(text);
  }

  global.SSAEvaluator = { evaluateObservation, localScore };
})(window);
