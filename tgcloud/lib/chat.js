import { db } from "sdk";
import { eq, and, desc, gt } from "sdk/db";
import { users, conversations, messages, files } from "../schema.js";
import { getAgentOrDefault } from "./agents.js";
import { skillsToolFor, getSkill, skillsForAgent } from "./skills/index.js";
import {
  MARKETER_AGENT_ID,
  ensureMarketerSkills,
  getMarketerSkillFile,
} from "./skills/mSkills.js";
import {
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_CHARS,
  MAX_IMAGES_PER_REQUEST,
  MAX_IMAGE_BYTES,
  VISION_READER_PROMPT,
} from "./config.js";
import {
  completeChat,
  streamChat,
  resolveAnswerModel,
  getVisionModel,
} from "./nvidia.js";
import { readFileBytes, bytesToBase64 } from "./files.js";
import {
  createRecorder,
  sanitizeTurnId,
  cleanupConversationTurns,
} from "./turnEvents.js";
export async function ensureUser(tgUser) {
  if (!tgUser || !tgUser.id) throw new Error("Нет пользователя Telegram");
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.tgId, tgUser.id))
    .get();
  const now = new Date();
  if (existing) {
    const patch = { lastSeenAt: now };
    if (tgUser.first_name && tgUser.first_name !== existing.name)
      patch.name = tgUser.first_name;
    if (tgUser.username && tgUser.username !== existing.username)
      patch.username = tgUser.username;
    await db.update(users).set(patch).where(eq(users.id, existing.id));
    return { ...existing, ...patch };
  }
  const [row] = await db
    .insert(users)
    .values({
      tgId: tgUser.id,
      name: tgUser.first_name ?? null,
      username: tgUser.username ?? null,
      agentId: "chat",
      lastSeenAt: now,
    })
    .returning();
  return row;
}
export async function setAgent(tgId, agentId) {
  await db.update(users).set({ agentId }).where(eq(users.tgId, tgId));
}
export async function latestConversation(userRow, agentId) {
  const conds = [eq(conversations.tgId, userRow.tgId)];
  if (agentId) conds.push(eq(conversations.agentId, agentId));
  return db
    .select()
    .from(conversations)
    .where(and(...conds))
    .orderBy(desc(conversations.updatedAt))
    .limit(1)
    .get();
}
export async function createConversation(userRow, agentId, title = null) {
  const [conv] = await db
    .insert(conversations)
    .values({ userId: userRow.id, tgId: userRow.tgId, agentId, title })
    .returning();
  return conv;
}
export async function ensureConversation(userRow, agentId) {
  const existing = await latestConversation(userRow, agentId);
  return existing ?? createConversation(userRow, agentId);
}
export async function getConversationById(convId, tgId) {
  const conv = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, convId))
    .get();
  if (!conv || conv.tgId !== tgId) return null;
  return conv;
}
export async function appendMessage(
  conv,
  role,
  content,
  meta = null,
  attachments = null,
) {
  const [m] = await db
    .insert(messages)
    .values({
      conversationId: conv.id,
      role,
      content,
      agentId: conv.agentId,
      ...(meta ? { meta } : {}),
      ...(attachments ? { attachments } : {}),
    })
    .returning();
  const patch = { updatedAt: new Date() };
  if (role === "user" && (!conv.title || conv.title === "Новый диалог"))
    patch.title = content.slice(0, 80);
  await db
    .update(conversations)
    .set(patch)
    .where(eq(conversations.id, conv.id));
  return m;
}
export async function getHistory(convId, limit = MAX_HISTORY_MESSAGES) {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, convId))
    .orderBy(desc(messages.id))
    .limit(limit)
    .all();
  return rows.reverse();
}
function collectImages(historyRows) {
  const lastUser = [...historyRows].reverse().find((r) => r.role === "user");
  if (!lastUser) return { lastUserId: null, images: [] };
  const images = [];
  for (const att of lastUser.attachments ?? []) {
    if (images.length >= MAX_IMAGES_PER_REQUEST) break;
    const mime = String(att.mime ?? "").toLowerCase();
    if (!mime.startsWith("image/") || mime === "image/svg+xml") continue;
    images.push(att);
  }
  return { lastUserId: lastUser.id, images };
}
export { streamRounds, describeImage, collectImages };
async function describeImage(img) {
  const row = await db
    .select()
    .from(files)
    .where(eq(files.id, img.fileId))
    .get();
  if (!row || (row.size ?? 0) > MAX_IMAGE_BYTES) {
    throw new Error(
      "Изображение слишком большое для анализа (максимум 3 МБ). Сожмите картинку и отправьте снова.",
    );
  }
  const bytes = await readFileBytes(row);
  if (!bytes || !bytes.length || bytes.length > MAX_IMAGE_BYTES) {
    throw new Error("Файл изображения недоступен");
  }
  const url = `data:${row.mime};base64,${bytesToBase64(bytes)}`;
  const reader = await getVisionModel();
  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await completeChat(
        [
          { role: "system", content: VISION_READER_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Прочитай изображение и дай описание." },
              { type: "image_url", image_url: { url } },
            ],
          },
        ],
        { model: reader, temperature: 0.2, maxTokens: 1024 },
      );
      const desc2 = (r.content ?? "").trim();
      if (!desc2) throw new Error("Vision-модель вернула пустое описание");
      return desc2;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}
export async function runVisionStep({ history, recorder, out }) {
  const { lastUserId, images } = collectImages(history);
  if (!images.length) return history;
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const t0 = Date.now();
    let desc2 = img.vision ?? null;
    const cached = Boolean(desc2);
    if (!desc2) desc2 = await describeImage(img);
    out.steps.push({
      type: "image_read",
      name: img.name,
      ms: Date.now() - t0,
      desc: desc2.slice(0, 800),
    });
    if (recorder) {
      await recorder.event("image", {
        index: i,
        name: img.name,
        description: desc2,
        cached,
      });
    }
    img.vision = desc2;
  }
  const lastRow = history.find((r) => r.id === lastUserId);
  await db
    .update(messages)
    .set({ attachments: lastRow.attachments ?? [] })
    .where(eq(messages.id, lastUserId));
  return history;
}
function messageTextForModel(row) {
  const atts = row.attachments ?? [];
  let text = row.content ?? "";
  if (atts.length && text && atts.some((a) => a.name === text)) text = "";
  const fileNotes = atts
    .filter(
      (a) =>
        !String(a.mime ?? "")
          .toLowerCase()
          .startsWith("image/"),
    )
    .map((a) => `(пользователь приложил файл: ${a.name}, ${a.mime})`);
  const visionNotes = atts
    .filter((a) => a.vision)
    .map(
      (a) => `Результат vision-анализа изображения «${a.name}»:
${a.vision}`,
    );
  const parts = [text, ...fileNotes, ...visionNotes].filter(Boolean);
  if (parts.length) return parts.join("\n\n");
  return atts.some((a) =>
    String(a.mime ?? "")
      .toLowerCase()
      .startsWith("image/"),
  )
    ? "(изображение приложено)"
    : "";
}
export async function buildLlmMessages(agent, history) {
  const sysParts = [agent.systemPrompt];
  const dbSkills =
    agent.id === MARKETER_AGENT_ID ? await ensureMarketerSkills() : [];
  const skills = [...skillsForAgent(agent.id), ...dbSkills];
  if (skills.length) {
    sysParts.push(
      "Инструмент read_skill даёт доступ к подробным навыкам. Если запрос пользователя попадает в тематику любого навыка из списка ниже — ОБЯЗАТЕЛЬНО сначала вызови read_skill с его id, прочитай содержимое и строй ответ на его основе. Не вызывай навык только для приветствий и совсем коротких вопросов.",
      skills.map((s) => `- ${s.id}: ${s.name} — ${s.when}`).join("\n"),
    );
  }
  const out = [{ role: "system", content: sysParts.join("\n\n") }];
  for (const m of history) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    out.push({ role: m.role, content: messageTextForModel(m) });
  }
  return out;
}
export async function prepareTurn({
  tgUser,
  agentId,
  text,
  conversationId,
  attachments,
  reuseLastUser = false,
  forceNewConversation = false,
}) {
  if ((!text || !text.trim()) && !(attachments && attachments.length))
    throw new Error("Пустое сообщение");
  const clean = (text ?? "").trim();
  if (clean.length > MAX_MESSAGE_CHARS) {
    throw new Error(
      `Сообщение слишком длинное (максимум ${MAX_MESSAGE_CHARS} символов)`,
    );
  }
  const userRow = await ensureUser(tgUser);
  const agent = getAgentOrDefault(agentId ?? userRow.agentId);
  let conv = null;
  if (conversationId) {
    conv = await getConversationById(Number(conversationId), tgUser.id);
  }
  if (!conv) {
    if (forceNewConversation) {
      conv = await createConversation(userRow, agent.id);
    } else {
      conv = await ensureConversation(userRow, agent.id);
    }
  }
  if (conv.agentId !== agent.id) {
    await db
      .update(conversations)
      .set({ agentId: agent.id })
      .where(eq(conversations.id, conv.id));
    conv.agentId = agent.id;
  }
  const contentForDb =
    clean || (attachments && attachments.length ? attachments[0].name : "");
  let history = await getHistory(conv.id);
  const last = history[history.length - 1];
  const ts =
    last?.createdAt instanceof Date
      ? last.createdAt.getTime()
      : Number(last?.createdAt) || 0;
  const fresh = last && last.role === "user" && Date.now() - ts < 5 * 60 * 1e3;
  const lastAtts = last?.attachments ?? [];
  const sameAtts =
    lastAtts.length === (attachments?.length ?? 0) &&
    (lastAtts.length === 0 ||
      (lastAtts[0]?.name === attachments[0]?.name &&
        lastAtts[0]?.size === attachments[0]?.size));
  const sameText = String(last?.content ?? "").trim() === contentForDb;
  if (!(reuseLastUser && fresh && sameText && sameAtts)) {
    await appendMessage(conv, "user", contentForDb, null, attachments ?? null);
    history = await getHistory(conv.id);
  }
  const model = await resolveAnswerModel();
  return { user: userRow, agent, conv, history, model };
}
export async function finishTurn(conv, replyText, meta = null) {
  return appendMessage(conv, "assistant", replyText, meta);
}
export function buildMeta({
  started,
  model,
  usage,
  steps = [],
  skills = [],
  reasoningText = null,
  error = null,
}) {
  return {
    model: model ?? null,
    latencyMs: Date.now() - started,
    tokens: usage
      ? {
          prompt: usage.prompt_tokens ?? null,
          completion: usage.completion_tokens ?? null,
          total: usage.total_tokens ?? null,
        }
      : null,
    skills,
    steps,
    reasoningText: reasoningText ? String(reasoningText).slice(0, 2e4) : null,
    error: error ? String(error).slice(0, 400) : null,
  };
}
function extractReadSkill(toolCalls) {
  if (!Array.isArray(toolCalls)) return null;
  return toolCalls.find((c) => c?.function?.name === "read_skill") ?? null;
}
async function* streamRounds(
  { agent, llmMessages, model },
  out,
  recorder = null,
) {
  const dbSkills =
    agent.id === MARKETER_AGENT_ID ? await ensureMarketerSkills() : [];
  const tool = skillsToolFor(agent, dbSkills);
  const msgs = [...llmMessages];
  let rounds = 0;
  let acc = "";
  const flushReasoning = (() => {
    let pending = "";
    return async (text, force = false) => {
      if (text) pending += text;
      if (recorder && pending && (force || pending.length >= 350)) {
        await recorder.event("reasoning", { text: pending });
        pending = "";
      }
    };
  })();
  const flushContent = (() => {
    let pending = "";
    return async (text, force = false) => {
      if (text) pending += text;
      if (recorder && pending && (force || pending.length >= 900)) {
        await recorder.event("content", { text: pending });
        pending = "";
      }
    };
  })();
  for (;;) {
    let roundAcc = "";
    let pendingCalls = null;
    for await (const ev of streamChat(msgs, {
      model,
      tools: tool ? [tool] : void 0,
    })) {
      if (ev.model && !out.model) out.model = ev.model;
      if (ev.usage) out.usage = ev.usage;
      if (ev.reasoning) {
        out.reasoningText = (out.reasoningText ?? "") + ev.reasoning;
        await flushReasoning(ev.reasoning);
        yield { type: "reasoning", delta: ev.reasoning };
      }
      if (ev.delta) {
        acc += ev.delta;
        roundAcc += ev.delta;
        await flushContent(ev.delta);
        yield { type: "delta", delta: ev.delta };
      }
      if (ev.toolCalls) pendingCalls = ev.toolCalls;
    }
    await flushReasoning("", true);
    await flushContent("", true);
    const call = extractReadSkill(pendingCalls);
    if (!call || rounds >= 2) {
      out.content = acc;
      return;
    }
    rounds += 1;
    let args = {};
    try {
      args = JSON.parse(call.function.arguments || "{}");
    } catch (_) {}
    const skillId = String(args.skill ?? "");
    const fileArg = String(args.file ?? "").trim();
    let body = null;
    let skillName = skillId;
    if (fileArg) {
      body = await getMarketerSkillFile(skillId, fileArg);
      if (body != null) skillName = `${skillId} · ${fileArg}`;
    } else {
      const skill =
        getSkill(skillId) ?? dbSkills.find((s) => s.id === skillId) ?? null;
      if (skill) {
        body = skill.content;
        skillName = skill.name;
      }
    }
    if (skillId && !fileArg && body != null)
      out.skills.push({ id: skillId, name: skillName });
    out.steps.push({
      type: "skill_read",
      skill: fileArg ? `${skillId}#${fileArg}` : skillId,
      ms: Date.now() - out.started,
    });
    if (recorder)
      await recorder.event("skill", {
        id: skillId,
        name: skillName,
        ...(fileArg ? { file: fileArg } : {}),
      });
    yield { type: "skill", id: skillId, name: skillName };
    msgs.push({
      role: "assistant",
      ...(roundAcc ? { content: roundAcc } : {}),
      tool_calls: [
        {
          id: call.id ?? `call_${rounds}`,
          type: "function",
          function: {
            name: "read_skill",
            arguments: call.function.arguments ?? "{}",
          },
        },
      ],
    });
    msgs.push({
      role: "tool",
      tool_call_id: call.id ?? `call_${rounds}`,
      content:
        body != null
          ? body
          : `Навык «${skillId}»${fileArg ? ` / файл «${fileArg}»` : ""} не найден. Отвечай без него, используя свои знания.`,
    });
  }
}
async function finalizeTurn({ conv, agent, out, started, recorder, saved }) {
  const meta = buildMeta({
    started,
    model: out.model,
    usage: out.usage,
    steps: out.steps,
    skills: out.skills,
    reasoningText: out.reasoningText,
  });
  const message =
    saved ?? (await finishTurn(conv, (out.content ?? "").trim(), meta));
  if (recorder) {
    await recorder.event("done", {
      messageId: message.id,
      content: message.content,
      meta,
    });
  }
  return message;
}
async function runTurn({ agent, conv, history, model }, turnId) {
  const started = Date.now();
  const out = {
    started,
    skills: [],
    steps: [],
    model: null,
    usage: null,
    reasoningText: null,
    content: null,
  };
  const tid = sanitizeTurnId(turnId);
  const recorder = tid
    ? createRecorder({ turnId: tid, conversationId: conv.id, tgId: conv.tgId })
    : null;
  if (recorder) {
    await cleanupConversationTurns(conv.id, tid);
    await recorder.event("start", {
      model,
      agentId: agent.id,
      agentName: agent.name,
    });
  }
  try {
    await runVisionStep({ history, recorder, out });
    const llmMessages = await buildLlmMessages(agent, history);
    for await (const _ev of streamRounds(
      { agent, llmMessages, model },
      out,
      recorder,
    )) {
    }
    const message = await finalizeTurn({ conv, agent, out, started, recorder });
    return { agent, conv, reply: message.content, meta: message.meta, message };
  } catch (e) {
    const meta = buildMeta({
      started,
      steps: out.steps,
      skills: out.skills,
      reasoningText: out.reasoningText,
      error: e?.message ?? String(e),
    });
    if (recorder)
      await recorder.event("error", {
        message: String(e?.message ?? e).slice(0, 400),
      });
    try {
      await finishTurn(conv, "[ошибка: ответ не получен]", meta);
    } catch (_) {}
    throw e;
  }
}
export async function completeTurn({
  tgUser,
  agentId,
  text,
  conversationId,
  attachments,
  turnId,
}) {
  const prepared = await prepareTurn({
    tgUser,
    agentId,
    text,
    conversationId,
    attachments,
  });
  return runTurn(prepared, turnId);
}
async function lastUserMessage(convId) {
  return db
    .select()
    .from(messages)
    .where(and(eq(messages.conversationId, convId), eq(messages.role, "user")))
    .orderBy(desc(messages.id))
    .limit(1)
    .get();
}
export async function deleteMessagesAfter(convId, messageId) {
  await db
    .delete(messages)
    .where(
      and(eq(messages.conversationId, convId), gt(messages.id, messageId)),
    );
}
export async function regenerateTurn({ tgUser, conversationId, turnId }) {
  const userRow = await ensureUser(tgUser);
  const conv = await getConversationById(Number(conversationId), tgUser.id);
  if (!conv) throw new Error("Диалог не найден");
  const lastUser = await lastUserMessage(conv.id);
  if (!lastUser)
    throw new Error("Нечего перегенерировать: в диалоге нет сообщений");
  await deleteMessagesAfter(conv.id, lastUser.id);
  const agent = getAgentOrDefault(conv.agentId);
  const history = await getHistory(conv.id);
  const model = await resolveAnswerModel();
  return runTurn({ user: userRow, agent, conv, history, model }, turnId);
}
