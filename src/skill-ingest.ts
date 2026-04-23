/**
 * skill-ingest.ts — Auto-create skills from conversation turns.
 *
 * After each conversation turn, evaluates whether the exchange involved
 * a non-trivial technique worth codifying as a reusable skill.
 * Inspired by Hermes Agent's nudge + background review system.
 *
 * Uses Gemini for evaluation (same pattern as memory-ingest.ts).
 */

import { generateContent, parseJsonResponse } from './gemini.js';
import { logSkillAction } from './db.js';
import { writeSkill, skillExists, readSkill, findSimilarSkills } from './skill-manage.js';
import { logger } from './logger.js';

// Rate limiting: max 1 skill creation per 10 minutes per agent
const lastSkillCreation = new Map<string, number>();
const SKILL_COOLDOWN_MS = 10 * 60 * 1000;

// Minimum response length to even consider skill creation
const MIN_RESPONSE_LENGTH = 500;

interface SkillEvaluationResult {
  should_create: boolean;
  skill_name: string;
  category: string;
  title: string;
  description: string;
  content: string;
  trigger_keywords: string[];
}

const SKILL_EVALUATION_PROMPT = `You are evaluating a conversation turn to decide if it contains a non-trivial technique, multi-step workflow, or specialized approach worth codifying as a REUSABLE SKILL.

The bar is HIGH. Most conversations should NOT create skills. Only create a skill when:
1. A multi-step technical workflow was executed (not just a simple question/answer)
2. Trial-and-error or course corrections occurred that produced valuable lessons
3. A specialized approach was discovered that would be useful for similar future tasks
4. The methodology is general enough to apply beyond this specific instance

DO NOT create skills for:
- Simple factual Q&A
- One-off tasks with no reusable methodology
- Basic code changes or bug fixes
- Status updates or acknowledgments
- Conversations shorter than a few exchanges

If a skill should be created, provide it in this JSON format:
{
  "should_create": true,
  "skill_name": "kebab-case-name",
  "category": "development|devops|content|communication|research|workflow",
  "title": "Human Readable Title",
  "description": "One-line description of what this skill teaches",
  "content": "Full markdown body with ## When to Use, ## Approach, ## Key Commands / Patterns, ## Common Pitfalls sections",
  "trigger_keywords": ["keyword1", "keyword2"]
}

If no skill should be created:
{
  "should_create": false,
  "skill_name": "",
  "category": "",
  "title": "",
  "description": "",
  "content": "",
  "trigger_keywords": []
}

USER MESSAGE:
{USER_MSG}

ASSISTANT RESPONSE:
{ASSISTANT_MSG}

Respond with ONLY the JSON object, no other text.`;

/**
 * Evaluate a conversation turn for skill creation.
 * Fire-and-forget: never blocks the response to the user.
 */
export async function evaluateSkillCreation(
  chatId: string,
  userMessage: string,
  assistantResponse: string,
  agentId = 'main',
): Promise<boolean> {
  try {
    // Quick filters
    if (!assistantResponse || assistantResponse.length < MIN_RESPONSE_LENGTH) return false;
    if (!userMessage || userMessage.length < 20) return false;

    // Skip commands and short messages
    if (userMessage.startsWith('/')) return false;
    if (/^(ok|yes|no|thanks|sure|got it|cool|nice)\s*$/i.test(userMessage)) return false;

    // Rate limit
    const lastCreation = lastSkillCreation.get(agentId) ?? 0;
    if (Date.now() - lastCreation < SKILL_COOLDOWN_MS) return false;

    // Ask Gemini
    const prompt = SKILL_EVALUATION_PROMPT
      .replace('{USER_MSG}', userMessage.slice(0, 2000))
      .replace('{ASSISTANT_MSG}', assistantResponse.slice(0, 4000));

    const response = await generateContent(prompt);
    const result = parseJsonResponse<SkillEvaluationResult>(response);

    if (!result || !result.should_create || !result.skill_name || !result.content) {
      return false;
    }

    // Check for similar existing skills
    const similar = findSimilarSkills(result.skill_name);
    if (similar.length > 0) {
      // Skill exists — try to patch/enhance it
      const existingSkill = similar[0];
      const existingContent = readSkill(existingSkill.name);
      if (existingContent) {
        // Append new insights to existing skill
        const enhancedContent = existingContent + '\n\n## Additional Insights\n\n' + result.content;
        writeSkill(existingSkill.name, enhancedContent);
        logSkillAction(existingSkill.name, 'patch', agentId, chatId, userMessage.slice(0, 500));
        lastSkillCreation.set(agentId, Date.now());
        logger.info('Skill patched: %s (from conversation)', existingSkill.name);
        return true;
      }
    }

    // Create new skill
    const skillMdContent = `---
name: ${result.skill_name}
description: ${result.description}
auto-generated: true
auto_context: true
user_invocable: true
category: ${result.category}
trigger_keywords: ${JSON.stringify(result.trigger_keywords)}
---

# ${result.title}

${result.content}
`;

    writeSkill(result.skill_name, skillMdContent);
    logSkillAction(result.skill_name, 'create', agentId, chatId, userMessage.slice(0, 500));
    lastSkillCreation.set(agentId, Date.now());
    logger.info('Skill created: %s (from conversation)', result.skill_name);
    return true;
  } catch (err) {
    logger.warn('Skill evaluation failed: %s', (err as Error).message);
    return false;
  }
}
