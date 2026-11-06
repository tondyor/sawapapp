import React, { useEffect, useMemo, useRef, useState } from "react";
import { IconChevron } from "./icons.jsx";
const MODEL_LABELS = { "deepseek-ai/deepseek-v4.1-flash": "SAWAP" };
const STEP_ICON = {
  vision: "👁",
  search: "🔎",
  read_url: "📖",
  reason: "🧠",
  math: "🔢",
  deep_reason: "🧐",
  pdf_parse: "📄",
  direct_answer: "💬",
  synthesize: "✨",
  image_read: "👁",
  skill_read: "📕",
  skill: "📕",
};
const STEP_NAME = {
  vision: "картинка",
  search: "поиск",
  read_url: "страница",
  reason: "размышления",
  math: "расчёты",
  deep_reason: "глубокий анализ",
  pdf_parse: "документ",
  direct_answer: "ответ",
  synthesize: "сборка ответа",
  image_read: "картинка",
  skill_read: "навык",
  skill: "навык",
};
function modelLabel(m) {
  return MODEL_LABELS[m] ?? (m ? String(m).split("/").pop() : "");
}
function fmtSec(ms) {
  if (!ms && ms !== 0) return "";
  return ms < 1e3 ? `${ms}мс` : `${(ms / 1e3).toFixed(ms < 1e4 ? 1 : 0)}с`;
}
function buildStepViews(events) {
  const views = [];
  const byIndex = new Map();
  for (const ev of events) {
    const p = ev.payload ?? {};
    if (ev.type === "step_start") {
      const v = { index: p.index, type: p.type, title: p.title, status: "run" };
      byIndex.set(v.index, v);
      views.push(v);
    } else if (ev.type === "step") {
      views.push({
        index: `m${ev.id ?? views.length}`,
        type: p.stepType,
        title: p.title,
        status: p.ok ? "ok" : "fail",
        ms: p.ms ?? null,
        finding: p.finding ?? null,
        error: p.error ?? null,
      });
    } else if (ev.type === "step_done") {
      const v = byIndex.get(p.index) ?? views[views.length - 1];
      if (v) {
        v.status = p.ok ? "ok" : "fail";
        v.ms = p.ms ?? v.ms;
        v.duplicate = v.duplicate || p.duplicate;
        v.error = p.error ?? v.error;
        if (v.type === "search" && p.error)
          v.search = v.search ?? { query: v.title, items: [] };
      }
    } else if (ev.type === "image" || ev.type === "vision") {
      const v =
        p.index != null ? byIndex.get(p.index) : views[views.length - 1];
      if (v) v.image = p;
    } else if (ev.type === "search") {
      const v =
        p.index != null ? byIndex.get(p.index) : views[views.length - 1];
      if (v) v.search = p;
    } else if (ev.type === "read_url") {
      const v =
        p.index != null ? byIndex.get(p.index) : views[views.length - 1];
      if (v) v.read = p;
    }
  }
  return views;
}
function StepRow({ v }) {
  const [open, setOpen] = useState(false);
  const icon = STEP_ICON[v.type] ?? "•";
  const name = v.title || STEP_NAME[v.type] || v.type;
  const statusMark = v.status === "run" ? "…" : v.status === "fail" ? "✕" : "";
  const hasDetails = Boolean(
    v.image?.description ||
    v.search?.items?.length ||
    v.read ||
    v.finding ||
    v.error,
  );
  return (
    <div className={`rt-step ${v.status === "fail" ? "fail" : ""}`}>
      <button
        className="rt-step-head"
        onClick={() => hasDetails && setOpen((o) => !o)}
        disabled={!hasDetails}
      >
        <span className="rt-step-icon">{icon}</span>
        <span className="rt-step-title">{name}</span>
        {statusMark && (
          <span className={`rt-step-mark ${v.status === "fail" ? "err" : ""}`}>
            {statusMark}
          </span>
        )}
        {v.ms != null && <span className="rt-step-ms">{fmtSec(v.ms)}</span>}
        {hasDetails && <IconChevron size={12} />}
      </button>
      {open && (
        <div className="rt-step-body">
          {v.image?.description && (
            <div className="rt-step-detail">{v.image.description}</div>
          )}
          {v.search && (
            <div className="rt-step-detail">
              <div className="rt-dim">Запрос: {v.search.query}</div>
              {(v.search.items ?? []).map((it, i) => (
                <div key={i} className="rt-src">
                  <a
                    href={it.link || void 0}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {it.title || it.link}
                  </a>
                  {it.snippet && (
                    <div className="rt-dim">
                      {String(it.snippet).slice(0, 160)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {v.read && (
            <div className="rt-step-detail">
              <a
                href={v.read.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {v.read.url}
              </a>
              <div className="rt-dim">
                {v.read.via === "jina" ? "через ридер" : "прямо"} ·{" "}
                {v.read.chars} знаков
              </div>
            </div>
          )}
          {v.finding && (
            <div className="rt-step-detail">
              {String(v.finding).slice(0, 1200)}
            </div>
          )}
          {v.error && (
            <div className="rt-step-detail err">Не сработало: {v.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
export default function ReasoningTrace({
  events,
  live = false,
  accent = "#7C8CF8",
  startedAt = null,
}) {
  const [open, setOpen] = useState(false);
  const tailRef = useRef(null);
  const reasoning = events
    .filter((e) => e.type === "reasoning")
    .map((e) => e.payload?.text ?? "")
    .join("");
  const planEvs = events.filter((e) => e.type === "plan");
  const planEv = planEvs[planEvs.length - 1] ?? null;
  const steps = useMemo(() => buildStepViews(events), [events]);
  const legacySteps = events.filter(
    (e) => e.type === "skill" || e.type === "image",
  );
  const doneEv = events.find((e) => e.type === "done");
  const errorEv = events.find((e) => e.type === "error");
  const stopEv = events.find((e) => e.type === "stop");
  const startEv = events.find((e) => e.type === "start");
  const elapsed = startedAt ? Date.now() - startedAt : null;
  useEffect(() => {
    if (open && live && tailRef.current) {
      tailRef.current.scrollTop = tailRef.current.scrollHeight;
    }
  }, [reasoning.length, open, live]);
  const active = live && !doneEv && !errorEv && !stopEv;
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!active) return void 0;
    const bump = () => forceTick((n) => n + 1);
    const iv = setInterval(bump, 500);
    const opts = { passive: true };
    const onVis = () => {
      if (document.visibilityState === "visible") bump();
    };
    window.addEventListener("focus", bump, opts);
    window.addEventListener("pointerdown", bump, opts);
    window.addEventListener("touchstart", bump, opts);
    document.addEventListener("visibilitychange", onVis, opts);
    return () => {
      clearInterval(iv);
      window.removeEventListener("focus", bump, opts);
      window.removeEventListener("pointerdown", bump, opts);
      window.removeEventListener("touchstart", bump, opts);
      document.removeEventListener("visibilitychange", onVis, opts);
    };
  }, [active]);
  const running = active;
  const hasAnything =
    running ||
    reasoning.length > 0 ||
    steps.length > 0 ||
    legacySteps.length > 0 ||
    Boolean(errorEv) ||
    Boolean(stopEv) ||
    Boolean(planEv);
  if (!hasAnything) return null;
  const seq = [];
  if (planEv)
    seq.push(
      `▶ план${(planEv.payload?.steps ?? []).length ? ` (${planEv.payload.steps.length})` : ""}`,
    );
  for (const v of steps) {
    const icon = STEP_ICON[v.type] ?? "•";
    seq.push(
      `${icon} ${STEP_NAME[v.type] ?? v.type}${v.status === "run" ? "…" : ""}`,
    );
  }
  if (!steps.length) {
    for (const s of legacySteps)
      seq.push(
        `${s.type === "image" ? "👁" : "📕"} ${s.type === "image" ? "картинка" : "навык"}`,
      );
  }
  if (reasoning && !steps.some((v) => v.type === "reason"))
    seq.push("🧠 размышления");
  if (stopEv) seq.push("⏹ остановлен");
  if (doneEv) seq.push("✓ ответ");
  const statusEvs = events.filter((e) => e.type === "status");
  const lastStatus = statusEvs[statusEvs.length - 1]?.payload?.text;
  let statusText;
  if (errorEv) statusText = "Ошибка генерации";
  else if (stopEv) statusText = "Ход остановлен";
  else if (running) statusText = lastStatus || "Думаю…";
  else statusText = seq.join(" · ");
  const model = startEv?.payload?.model ?? doneEv?.payload?.meta?.model ?? null;
  const tail =
    reasoning.length > 160
      ? "…" + reasoning.slice(-160).replace(/\s+/g, " ")
      : reasoning.replace(/\s+/g, " ");
  return (
    <div
      className={`rtrace ${live ? "live" : ""} ${errorEv ? "err" : ""} ${open ? "open" : ""}`}
      style={{ "--accent": accent }}
    >
      <button
        className="rtrace-head"
        onClick={() => {
          setOpen((v) => !v);
        }}
        aria-expanded={open}
      >
        <span
          className={`rtrace-dot ${running ? "pulse" : ""} ${errorEv ? "dot-err" : doneEv ? "dot-done" : ""}`}
        />
        <span className="rtrace-status">{statusText}</span>
        {running && elapsed != null && (
          <span className="rtrace-timer">{fmtSec(elapsed)}</span>
        )}
        {model && <span className="rtrace-model">{modelLabel(model)}</span>}
        <IconChevron size={14} />
      </button>
      {!open && running && reasoning && (
        <div className="rtrace-tail">{tail}</div>
      )}
      {open && (
        <div className="rtrace-body">
          {planEv && (
            <div className="rt-block">
              <div className="rt-block-title">
                ▶ План хода
                {planEv.payload?.model
                  ? ` · ${modelLabel(planEv.payload.model)}${planEv.payload.latencyMs != null ? ` · ${fmtSec(planEv.payload.latencyMs)}` : ""}`
                  : ""}
              </div>
              {(planEv.payload?.steps ?? []).map((s, i) => (
                <div key={i} className="rt-plan-step">
                  {i + 1}. {STEP_ICON[s.type] ?? "•"} {s.title || s.type}
                </div>
              ))}
            </div>
          )}
          {(steps.length > 0 || legacySteps.length > 0) && (
            <div className="rt-block">
              {steps.map((v) => (
                <StepRow key={v.index ?? v.title} v={v} />
              ))}
              {!steps.length &&
                legacySteps.map((s, i) =>
                  s.type === "image" ? (
                    <div key={s.id ?? i} className="rt-step">
                      <div className="rt-step-head">
                        <span className="rt-step-icon">👁</span>
                        <span className="rt-step-title">
                          изображение «{s.payload?.name ?? i}»
                        </span>
                      </div>
                      {s.payload?.description && (
                        <div className="rt-step-detail">
                          {s.payload.description}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div key={s.id ?? i} className="rt-step">
                      <div className="rt-step-head">
                        <span className="rt-step-icon">📕</span>
                        <span className="rt-step-title">
                          навык: {s.payload?.name ?? s.payload?.id}
                        </span>
                      </div>
                    </div>
                  ),
                )}
            </div>
          )}
          {reasoning && (
            <div className="rtrace-text" ref={tailRef}>
              <div className="rtrace-text-title">🧠 Ход размышлений</div>
              <div className="rtrace-text-body">{reasoning}</div>
            </div>
          )}
          {doneEv?.payload?.meta && (
            <div className="rt-block">
              <div className="rt-block-title">✓ Ответ готов</div>
              <div className="rt-dim">
                {modelLabel(doneEv.payload.meta.model)} ·{" "}
                {fmtSec(doneEv.payload.meta.latencyMs)}
                {doneEv.payload.meta.tokens?.total != null
                  ? ` · ${doneEv.payload.meta.tokens.total} токенов`
                  : ""}
              </div>
            </div>
          )}
          {errorEv && (
            <div className="rt-step-detail err">
              ✕ {errorEv.payload?.message ?? "ошибка"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
