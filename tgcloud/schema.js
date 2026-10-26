import { table, integer, text, boolean, json, blob, index, sql } from 'sdk/db';

export const users = table('users', {
  id:         integer('id').primaryKey({ autoIncrement: true }),
  tgId:       integer('tg_id').unique(),
  name:       text('name'),
  username:   text('username'),
  agentId:    text('agent_id').default('chat'),
  createdAt:  integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  lastSeenIdx: index('idx_users_last_seen').on(t.lastSeenAt),
}));

export const conversations = table('conversations', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  userId:    integer('user_id').notNull(),
  tgId:      integer('tg_id').notNull(),
  agentId:   text('agent_id').notNull(),
  title:     text('title'),
  reasoning: text('reasoning').default('fast'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  userConvIdx: index('idx_conversations_tg_agent').on(t.tgId, t.agentId, t.updatedAt),
}));

export const messages = table('messages', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  conversationId: integer('conversation_id').notNull(),
  role:           text('role').notNull(),
  content:        text('content').notNull(),
  agentId:        text('agent_id'),
  meta:           json('meta'),
  attachments:    json('attachments'),
  createdAt:      integer('created_at', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
}, (t) => ({
  convIdx: index('idx_messages_conv').on(t.conversationId, t.id),
}));

export const files = table('files', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  tgId:           integer('tg_id').notNull(),
  conversationId: integer('conversation_id').notNull(),
  name:           text('name').notNull(),
  mime:           text('mime').notNull(),
  size:           integer('size').notNull(),
  data:           blob('data'),
  tgFileId:       text('tg_file_id'),
  createdAt:      integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  convIdx: index('idx_files_conv').on(t.conversationId, t.id),
}));

export const fileChunks = table('file_chunks', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  uploadId:  text('upload_id').notNull(),
  tgId:      integer('tg_id').notNull(),
  idx:       integer('idx').notNull(),
  data:      blob('data'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  upIdx: index('idx_file_chunks_up').on(t.uploadId, t.idx),
}));

export const turnEvents = table('turn_events', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  turnId:         text('turn_id').notNull(),
  conversationId: integer('conversation_id').notNull(),
  tgId:           integer('tg_id').notNull(),
  type:           text('type').notNull(),
  payload:        json('payload'),
  createdAt:      integer('created_at', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
}, (t) => ({
  turnIdx: index('idx_turn_events_turn').on(t.turnId, t.id),
  convIdx: index('idx_turn_events_conv').on(t.conversationId, t.id),
}));

// Состояние агентского хода (конечный автомат). Живёт в БД, а не в изоляте:
// каждый шаг хода = свежий изолят, ход возобновляем после обрыва клиента.
export const turns = table('turns', {
  turnId:         text('turn_id').primaryKey(),
  conversationId: integer('conversation_id').notNull(),
  tgId:           integer('tg_id').notNull(),
  agentId:        text('agent_id').notNull(),
  status:         text('status').notNull().default('planning'),
  question:       text('question').notNull(),
  plan:           json('plan'),
  currentStep:    integer('current_step').default(0),
  findings:       json('findings'),
  reasoning:      text('reasoning'),
  reasoningLevel: text('reasoning_level').default('fast'),
  error:          text('error'),
  createdAt:      integer('created_at', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
  updatedAt:      integer('updated_at', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
}, (t) => ({
  convIdx:   index('idx_turns_conv').on(t.conversationId, t.createdAt),
  statusIdx: index('idx_turns_status').on(t.tgId, t.status),
}));

export const settings = table('settings', {
  key:       text('key').primaryKey(),
  value:     text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const mcpServers = table('mcp_servers', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  name:      text('name').notNull(),
  url:       text('url').notNull(),
  headers:   json('headers'),
  enabled:   boolean('enabled').default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
