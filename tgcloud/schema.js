import { table, integer, text, boolean, json, index, sql } from 'sdk/db';

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
  createdAt:      integer('created_at', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
}, (t) => ({
  convIdx: index('idx_messages_conv').on(t.conversationId, t.id),
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
