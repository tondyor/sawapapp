import convGuidelines from './chat/conv-guidelines.js';
import rfConsultProtocol from './lawyer/rf-consult-protocol.js';
import growthFramework from './marketer/growth-framework.js';
import uiAuditChecklist from './designer/ui-audit-checklist.js';
import textEditProtocol from './copywriter/text-edit-protocol.js';

export const SKILLS = [
  {
    id: 'conv-guidelines',
    agentId: 'chat',
    name: 'Ведение диалога',
    when: 'Правила структуры ответа, уточняющих вопросов и тона — полезно для любого сложного или многосоставного запроса.',
    content: convGuidelines,
  },
  {
    id: 'rf-consult-protocol',
    agentId: 'lawyer',
    name: 'Протокол юридической консультации',
    when: 'Когда нужен разбор правовой ситуации, проверка договора или пошаговый план действий по праву РФ.',
    content: rfConsultProtocol,
  },
  {
    id: 'growth-framework',
    agentId: 'marketer',
    name: 'Growth-фреймворк',
    when: 'Когда нужна стратегия, план запуска, разбор воронки или выбор каналов продвижения.',
    content: growthFramework,
  },
  {
    id: 'ui-audit-checklist',
    agentId: 'designer',
    name: 'Чек-лист UI/UX-аудита',
    when: 'Когда просят оценить или улучшить интерфейс, макет, лендинг или палитру.',
    content: uiAuditChecklist,
  },
  {
    id: 'text-edit-protocol',
    agentId: 'copywriter',
    name: 'Протокол работы с текстом',
    when: 'Когда нужно написать, переписать или отредактировать текст: посты, лендинги, письма, слоганы.',
    content: textEditProtocol,
  },
];

export function skillsForAgent(agentId) {
  return SKILLS.filter((s) => s.agentId === agentId);
}

export function getSkill(id) {
  return SKILLS.find((s) => s.id === id) ?? null;
}

export function skillsToolFor(agent) {
  const list = skillsForAgent(agent.id);
  if (!list.length) return null;
  return {
    type: 'function',
    function: {
      name: 'read_skill',
      description:
        'Читать подробную инструкцию по навыку. Перед сложным ответом посмотри на список навыков в системном промпте: если навык релевантен запросу — вызови read_skill с его id, прочитай и строй ответ на его основе. Для простых вопросов навык не нужен.',
      parameters: {
        type: 'object',
        properties: {
          skill: {
            type: 'string',
            enum: list.map((s) => s.id),
            description: 'ID навыка из списка в системном промпте',
          },
        },
        required: ['skill'],
      },
    },
  };
}
