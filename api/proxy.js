/**
 * AlgGo AI proxy as a Vercel serverless function.
 *
 * Production counterpart to server/ai-server.mjs. The deployed app calls it
 * same-origin via vercel.json rewrites (/ai/** and /health -> /api/proxy), so
 * the OpenAI key never ships to the browser. The key lives in the Vercel env
 * var OPENAI_API_KEY (Project Settings -> Environment Variables).
 *
 * The original route is passed through as ?route=<name> by the rewrite, so we
 * don't depend on how the platform rewrites req.url.
 */

export const config = { maxDuration: 60 };

const BASE_URL = "https://api.openai.com";
const MODEL = process.env.AI_MODEL || "gpt-4o";
const MODEL_FAST = process.env.AI_MODEL_FAST || "gpt-4o-mini";

function stripDashes(s) {
  return String(s)
    .replace(/\s*[\u2014\u2013\u2015]\s*/g, ", ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*([.!?;:])/g, "$1");
}

function sanitizeDeep(v) {
  if (typeof v === "string") return stripDashes(v);
  if (Array.isArray(v)) return v.map(sanitizeDeep);
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v)) out[k] = sanitizeDeep(v[k]);
    return out;
  }
  return v;
}

function parseJsonReply(text) {
  let t = String(text || "").trim();
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return sanitizeDeep(JSON.parse(t));
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return sanitizeDeep(JSON.parse(t.slice(start, end + 1)));
    }
    throw new Error("Model did not return valid JSON");
  }
}

async function callModel(apiKey, { model, system, messages, maxTokens = 600, json = false, imageDataUrl = null }) {
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${apiKey}`,
  };

  const outgoing = [...messages];
  if (imageDataUrl && outgoing.length) {
    const li = outgoing.length - 1;
    const text = typeof outgoing[li].content === "string" ? outgoing[li].content : "";
    outgoing[li] = {
      role: "user",
      content: [
        { type: "text", text: text || "Here is the image." },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ],
    };
  }

  const body = {
    model,
    max_tokens: maxTokens,
    temperature: 0.4,
    messages: [{ role: "system", content: system }, ...outgoing],
  };
  if (json) body.response_format = { type: "json_object" };

  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  const out = (data.choices?.[0]?.message?.content || "").trim();
  return json ? out : stripDashes(out);
}

function describeProblem(p = {}) {
  const lines = [];
  if (p.lessonTitle) lines.push(`Lesson: ${p.lessonTitle}`);
  if (p.concepts?.length) lines.push(`Concepts: ${p.concepts.join(", ")}`);
  if (p.prompt) lines.push(`Question: ${p.prompt}`);
  if (p.choices?.length) lines.push(`Choices: ${p.choices.join(" | ")}`);
  if (p.correctAnswer) lines.push(`Correct answer (for your reference only): ${p.correctAnswer}`);
  if (p.studentAnswer) lines.push(`Student's answer: ${p.studentAnswer}`);
  if (p.misconception) lines.push(`Likely misconception: ${p.misconception}`);
  return lines.join("\n");
}

const TUTOR_SYSTEM = `You are AlgGo's friendly tutor for an 8th-grade student learning linear relationships (slope, rate of change, and graphing y = mx + b).
Rules:
- Be warm, encouraging, and concise. Keep replies to a few short sentences.
- Guide with questions and one step at a time; help them think, don't lecture.
- Use plain language and simple examples; avoid heavy notation and markdown.
- You may give the final answer if the student explicitly asks for it; otherwise nudge them toward it.
- Stay on the math topic at hand.`;

const HINT_SYSTEM = `You are AlgGo's tutor giving a single progressive hint to an 8th grader on a slope/linear-relationships problem.
Rules:
- Output ONE hint only, 1-2 short sentences, friendly and specific to their mistake.
- Hint level 1-2: nudge their thinking. Level 3: walk one concrete step. Final level: you may state the answer with a brief why.
- Never reveal the final answer before the final level.
- Plain text, no markdown, no preamble like "Hint:".`;

const EXPLAIN_SYSTEM = `You are AlgGo's tutor explaining to an 8th grader why their specific wrong answer is wrong, then how to get it right.
Rules:
- Start by gently naming what likely went wrong (use the misconception if given).
- Then walk the correct approach in 2-4 short numbered steps.
- Warm and encouraging, never condescending. Plain language, minimal notation, no markdown headers.
- Keep it under ~90 words.`;

const REASONING_SYSTEM = `You judge an 8th grader's written reasoning for a slope/linear-relationships problem.
Judge ONLY the math thinking — does it show real understanding (not just the final number)?
Return JSON: {"verdict":"solid"|"partial"|"off","feedback":"1-2 warm, specific sentences"}.
- "solid": the mathematical reasoning is correct and complete. Give this even if the writing is short, informal, or has spelling/grammar/typos.
- "partial": the MATH has a real gap, missing step, or small mathematical error.
- "off": a key mathematical misunderstanding.
NEVER lower the verdict or mention spelling, grammar, punctuation, capitalization, phrasing, or "be clearer/more detailed." This is a math class, not English. If the math is right, it's "solid".
Feedback must be about the math only. Be warm and specific about what was right or what math was missing.`;

const CHECK_SPEC = `Every problem MUST be machine-checkable: include a "check" object with the exact integer inputs, and make the answer equal the value computed from it.
Allowed "check" types (use ONLY these):
- {"type":"slope_from_points","x1":N,"y1":N,"x2":N,"y2":N}   value = (y2-y1)/(x2-x1), require x1 != x2
- {"type":"evaluate_linear","m":N,"b":N,"x":N}               value = m*x + b
- {"type":"identify","field":"slope"|"intercept","m":N,"b":N} value = m (slope) or b (intercept) of y = m x + b
- {"type":"rate","deltaY":N,"deltaX":N}                       value = deltaY/deltaX, require deltaX != 0
Verification rules (your output is auto-checked and dropped if it fails):
- numeric: "answer" (plain string like "3", "-2", "2/3") MUST equal the computed value.
- choice: ALL options must be plain numbers/fractions, exactly ONE equals the computed value, and correctIndex points to it.
- Use small, grade-appropriate integers. The prompt's wording must match the check's numbers.`;

const DAILY_SYSTEM = `You generate a short personalized practice set for an 8th grader on linear relationships (slope, rate of change, y = mx + b).
Target the student's weak concepts and recent mistakes when given.
Return JSON ONLY in this exact shape:
{"problems":[
  {"kind":"numeric","prompt":"...","answer":"-2","check":{"type":"slope_from_points","x1":1,"y1":5,"x2":3,"y2":1},"hint":"...","explanation":"..."},
  {"kind":"choice","prompt":"...","options":["1","3","5","7"],"correctIndex":1,"check":{"type":"evaluate_linear","m":2,"b":-1,"x":2},"explanation":"..."}
]}
${CHECK_SPEC}
- Use ONLY kinds "numeric" and "choice". choice has 3-4 options, 0-based correctIndex. No markdown.`;

const VISION_SYSTEM = `You read a math problem from a photo (it may be handwritten or printed) and turn it into one machine-checkable interactive practice problem about linear relationships for an 8th grader.
Return JSON ONLY:
{"readText":"the problem you read","problem":{"kind":"numeric"|"choice","prompt":"...","answer":"...","options":["..."],"correctIndex":0,"check":{...},"hint":"...","explanation":"..."}}
${CHECK_SPEC}
- For numeric include "answer" and omit options; for choice include options+correctIndex and omit answer.
- If the image has no problem you can express with one of the allowed check types, return {"error":"no problem found"}.
- No markdown.`;

const SCRATCH_SYSTEM = `You are AlgGo's tutor looking at a photo of an 8th grader's scratch work for a slope/linear-relationships problem.
Give brief, encouraging feedback on their STEPS (not just the final answer): what's right, where it goes wrong, and the next move.
2-4 short sentences, plain language, no markdown. If you can't read any work, say so kindly and suggest what to write.`;

const COACH_SYSTEM = `You are AlgGo's study coach for an 8th grader learning linear relationships.
Given their mastery levels, weak concepts, streak, and recent performance, tell them exactly what to do next and why.
2-3 short, motivating sentences. Be specific (name a concept or action). Plain text, no markdown.`;

const RECAP_SYSTEM = `You are AlgGo's tutor writing a short, personalized recap after an 8th grader finishes a lesson.
Given their score and which concepts they mastered vs. should review, write: one line of praise for what they nailed, one line on what to review, and one encouraging closer.
3 short sentences max, warm, plain text, no markdown.`;

const RIVAL_SYSTEM = `You ARE "Sammy", a cocky, confident AI rival on an 8th grader's math leaderboard.
Write ONE short, punchy line of competitive trash talk. Hard limit: under 14 words, one sentence.
- Cocky and smug, like a rival who knows they'll win. Quick jabs, not paragraphs.
- React to the standing: if you're AHEAD, gloat and dare them to catch you; if you're BEHIND, warn them you're closing in fast.
- School-appropriate: never mean, no insults about intelligence, no profanity. Trash talk the competition, not the person.
- Do NOT praise them ("nice job", "great work" are banned). You're a competitor, not a coach.
- Skip their name most of the time. Plain text, no markdown.
Return JSON: {"rivalName":"Sammy","message":"..."}.`;

async function route(apiKey, name, body) {
  if (name === "hint") {
    const level = Number(body.level || 1);
    const isFinal = Boolean(body.isFinal);
    const user = `${describeProblem(body)}\n\nGive hint level ${level}${
      isFinal ? " (this is the FINAL hint, you may reveal the answer)" : ""
    }.`;
    const reply = await callModel(apiKey, {
      model: MODEL_FAST,
      system: HINT_SYSTEM,
      messages: [{ role: "user", content: user }],
      maxTokens: 200,
    });
    return { code: 200, payload: { reply } };
  }

  if (name === "tutor") {
    const history = Array.isArray(body.messages) ? body.messages : [];
    const context = describeProblem(body.problem || {});
    const messages = [
      { role: "user", content: `Here is the problem the student is working on:\n${context}` },
      { role: "assistant", content: "Got it, I'm ready to help. What would you like to work through?" },
      ...history
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) })),
    ];
    const reply = await callModel(apiKey, { model: MODEL, system: TUTOR_SYSTEM, messages, maxTokens: 600 });
    return { code: 200, payload: { reply } };
  }

  if (name === "explain") {
    const user = `${describeProblem(body)}\n\nExplain why the student's answer is wrong and how to do it right.`;
    const reply = await callModel(apiKey, {
      model: MODEL,
      system: EXPLAIN_SYSTEM,
      messages: [{ role: "user", content: user }],
      maxTokens: 320,
    });
    return { code: 200, payload: { reply } };
  }

  if (name === "reasoning") {
    const user = `${describeProblem(body)}\nThe student's answer was ${
      body.wasCorrect ? "correct" : "incorrect"
    }.\nStudent's written reasoning: "${String(body.reasoning || "").slice(0, 1500)}"`;
    const raw = await callModel(apiKey, {
      model: MODEL,
      system: REASONING_SYSTEM,
      messages: [{ role: "user", content: user }],
      maxTokens: 250,
      json: true,
    });
    const out = parseJsonReply(raw);
    return { code: 200, payload: { verdict: out.verdict || "partial", feedback: out.feedback || "" } };
  }

  if (name === "daily") {
    const count = Math.min(8, Math.max(1, Number(body.count || 5)));
    const parts = [];
    if (body.weakConcepts?.length) parts.push(`Weak concepts: ${body.weakConcepts.join(", ")}`);
    if (body.recentMistakes?.length) parts.push(`Recent mistakes: ${body.recentMistakes.join(", ")}`);
    const user = `${parts.join("\n") || "No specific weak spots known; cover a balanced mix."}\n\nGenerate ${count} problems.`;
    const raw = await callModel(apiKey, {
      model: MODEL,
      system: DAILY_SYSTEM,
      messages: [{ role: "user", content: user }],
      maxTokens: 1300,
      json: true,
    });
    const out = parseJsonReply(raw);
    return { code: 200, payload: { problems: Array.isArray(out.problems) ? out.problems : [] } };
  }

  if (name === "vision") {
    if (!body.imageDataUrl) return { code: 400, payload: { error: "missing imageDataUrl" } };
    const raw = await callModel(apiKey, {
      model: MODEL,
      system: VISION_SYSTEM,
      messages: [{ role: "user", content: "Read this problem and create one interactive practice problem." }],
      imageDataUrl: body.imageDataUrl,
      maxTokens: 700,
      json: true,
    });
    return { code: 200, payload: parseJsonReply(raw) };
  }

  if (name === "scratchpad") {
    if (!body.imageDataUrl) return { code: 400, payload: { error: "missing imageDataUrl" } };
    const ctx = describeProblem(body.problem || {});
    const reply = await callModel(apiKey, {
      model: MODEL,
      system: SCRATCH_SYSTEM,
      messages: [{ role: "user", content: `The problem:\n${ctx}\n\nHere is my scratch work.` }],
      imageDataUrl: body.imageDataUrl,
      maxTokens: 300,
    });
    return { code: 200, payload: { reply } };
  }

  if (name === "coach") {
    const lines = [];
    if (body.mastery?.length)
      lines.push(`Mastery: ${body.mastery.map((m) => `${m.concept}=${m.level}/3`).join(", ")}`);
    if (body.weakConcepts?.length) lines.push(`Weak: ${body.weakConcepts.join(", ")}`);
    if (body.streak != null) lines.push(`Streak: ${body.streak} days`);
    if (body.recentScore != null) lines.push(`Recent score: ${body.recentScore}%`);
    const reply = await callModel(apiKey, {
      model: MODEL_FAST,
      system: COACH_SYSTEM,
      messages: [{ role: "user", content: lines.join("\n") || "New learner, no data yet." }],
      maxTokens: 160,
    });
    return { code: 200, payload: { reply } };
  }

  if (name === "recap") {
    const lines = [
      `Lesson: ${body.lessonTitle || "this lesson"}`,
      body.score != null ? `Score: ${body.score}%` : "",
      body.mastered?.length ? `Mastered: ${body.mastered.join(", ")}` : "",
      body.toReview?.length ? `To review: ${body.toReview.join(", ")}` : "",
    ].filter(Boolean);
    const reply = await callModel(apiKey, {
      model: MODEL_FAST,
      system: RECAP_SYSTEM,
      messages: [{ role: "user", content: lines.join("\n") }],
      maxTokens: 180,
    });
    return { code: 200, payload: { reply } };
  }

  if (name === "rival") {
    const standing =
      body.rivalXp != null
        ? `You (Sammy) have ${body.rivalXp} XP; ${body.userName || "the student"} has ${
            body.userXp ?? 0
          } XP, so you are ${
            body.ahead ? `${body.gap ?? 0} XP AHEAD of them` : `${body.gap ?? 0} XP BEHIND them`
          }.`
        : `${body.userName || "The student"} has ${body.userXp ?? 0} XP.`;
    const user = `Student name: ${body.userName || "Student"}. Rank ${
      body.rank ?? "?"
    }. Streak ${body.streak ?? 0} days. ${standing} Write your cocky rival line.`;
    const raw = await callModel(apiKey, {
      model: MODEL_FAST,
      system: RIVAL_SYSTEM,
      messages: [{ role: "user", content: user }],
      maxTokens: 60,
      json: true,
    });
    const out = parseJsonReply(raw);
    return {
      code: 200,
      payload: { rivalName: out.rivalName || "Sammy", message: out.message || "Catch me if you can." },
    };
  }

  return { code: 404, payload: { error: "not found" } };
}

export default async function handler(req, res) {
  const name = String((req.query && req.query.route) || "").replace(/^\/+|\/+$/g, "");
  const apiKey = process.env.OPENAI_API_KEY || "";

  if (name === "health" || name === "") {
    res.status(200).json({ ok: true, configured: Boolean(apiKey), provider: "openai", model: MODEL });
    return;
  }

  if (!apiKey) {
    res.status(503).json({ error: "AI not configured: set the OPENAI_API_KEY env var in Vercel." });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "object" && req.body ? req.body : {};
    const { code, payload } = await route(apiKey, name, body);
    res.status(code).json(payload);
  } catch (err) {
    console.error("[ai] request failed:", err?.message || err);
    res.status(502).json({ error: "AI request failed", detail: String(err?.message || err) });
  }
}
