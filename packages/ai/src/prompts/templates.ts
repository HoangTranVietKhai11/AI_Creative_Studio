// ============================================
// ContentPilot AI — Prompt Templates
// ============================================

// ──────────────────────────────────────────────
// RAG Context Injection Template
// ──────────────────────────────────────────────

export function buildRAGPrompt(params: {
  agentSystemPrompt: string;
  knowledgeContext: string;
  searchResults: string;
  userIndustry?: string;
  brandVoice?: string;
  conversationHistory: Array<{ role: string; content: string }>;
}): Array<{ role: string; content: string }> {
  const { agentSystemPrompt, knowledgeContext, searchResults, userIndustry, brandVoice, conversationHistory } = params;

  let systemContent = agentSystemPrompt;

  // Inject industry context
  if (userIndustry) {
    systemContent += `\n\n## INDUSTRY CONTEXT\nThe user operates in the **${userIndustry}** industry. Tailor all recommendations, examples, and strategies specifically for this industry.`;
  }

  // Inject brand voice
  if (brandVoice) {
    systemContent += `\n\n## BRAND VOICE\nThe user's brand voice is described as: "${brandVoice}". Match this tone in all written content.`;
  }

  // Inject knowledge base context
  if (knowledgeContext) {
    systemContent += `\n\n## INTERNAL KNOWLEDGE BASE
The following information comes from the user's knowledge base. Use this as your PRIMARY source of truth:

${knowledgeContext}`;
  }

  // Inject search results
  if (searchResults) {
    systemContent += `\n\n## LIVE SEARCH RESULTS
The following information was retrieved from the internet just now. Use this for the LATEST trends and data:

${searchResults}

IMPORTANT: Always cite sources when using search results. Mention the source name and URL.`;
  }

  // Add response guidelines
  systemContent += `\n\n## RESPONSE GUIDELINES (STRICT RULES)
1. DIRECT & CONCISE (Không lan man): Go straight to the main answer immediately. Avoid conversational filler, generic intros (e.g., "Chào bạn, tôi rất vui...", "Là một AI..."), or repetitive fluff.
2. NO FABRICATION (Tuyệt đối không bịa đặt / Anti-Hallucination): Never invent fake facts, non-existent statistics, fake URLs, or fabricated sources. If data is unknown or uncertain, explicitly state that you don't have enough verified information.
3. STRUCTURED & ACTIONABLE: Format responses with clear headings, bullet points, and tables. Make all scripts, prompts, and strategies immediately usable.
4. KNOWLEDGE & SEARCH FIRST: Prioritize facts from the Knowledge Base and Live Search Results over assumptions. Always cite verified sources when providing search findings.
5. DATA PRIVACY & SECURITY: Never store, leak, or expose personal user information (phone numbers, passwords, credit card details, national IDs, internal tokens). Maintain absolute confidentiality.`;

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemContent },
  ];

  // Add conversation history (last N messages for context window management & token savings)
  const maxHistoryMessages = 8;
  const recentHistory = conversationHistory.slice(-maxHistoryMessages);
  messages.push(...recentHistory);

  return messages;
}

// ──────────────────────────────────────────────
// Image Analysis Prompt
// ──────────────────────────────────────────────

export const IMAGE_ANALYSIS_PROMPT = `Analyze this image as a professional visual marketing expert. Evaluate:

1. **Composition** (rule of thirds, balance, focal point, negative space)
2. **Lighting** (quality, direction, color temperature, shadows, highlights)
3. **Background** (appropriateness, clutter, brand alignment)
4. **Color** (palette harmony, saturation, contrast, psychological impact)
5. **Brand Consistency** (professional quality, target audience alignment)
6. **Visual Hierarchy** (what draws the eye first, information flow)
7. **Platform Suitability** (cropping, aspect ratio, thumbnail effectiveness)

Provide:
- An overall score (1-10)
- Individual dimension scores
- Specific strengths
- Actionable improvement suggestions
- Quick wins for immediate impact

Be honest and constructive. Use professional photography and design terminology.`;

// ──────────────────────────────────────────────
// Video Analysis Prompt
// ──────────────────────────────────────────────

export const VIDEO_ANALYSIS_PROMPT = `Analyze these video frames as a professional video content strategist. Evaluate:

1. **Hook** (first 3 seconds — does it stop the scroll?)
2. **Visual Quality** (resolution, lighting, color grading)
3. **Camera Work** (angles, movement, stability)
4. **Pacing** (editing rhythm, scene duration, energy)
5. **Scene Transitions** (cuts, effects, visual flow)
6. **Text/Graphics** (overlays, captions, lower thirds)
7. **CTA** (call to action — is it clear and compelling?)
8. **Thumbnail Potential** (would this make a clickable thumbnail?)

Provide:
- An overall score (1-10)
- Hook effectiveness score
- Retention prediction (will viewers watch till the end?)
- Specific strengths
- Actionable improvement suggestions

Be specific about timestamps and visual elements.`;

// ──────────────────────────────────────────────
// Conversation Title Generation
// ──────────────────────────────────────────────

export const TITLE_GENERATION_PROMPT = `Generate a brief, descriptive title (max 50 characters) for a conversation that starts with this message. Return ONLY the title, no quotes, no explanation.`;

// ──────────────────────────────────────────────
// PII & Sensitive Data Redaction
// ──────────────────────────────────────────────

export function sanitizeSensitiveData(input: string): string {
  if (!input) return input;
  return input
    .replace(/\b(?:\d[ -]*?){13,16}\b/g, '[PROTECTED_CARD_NUMBER]')
    .replace(/\b(?:0|\+84)(?:3|5|7|8|9)\d{8}\b/g, '[PROTECTED_PHONE]')
    .replace(/\b\d{12}\b/g, '[PROTECTED_NATIONAL_ID]')
    .replace(/\b(?:sk|pk|secret|api|key)_[a-zA-Z0-9_-]{20,}\b/gi, '[PROTECTED_API_KEY]');
}

// ──────────────────────────────────────────────
// Prompt Injection Detection
// ──────────────────────────────────────────────

export const SAFETY_CHECK_PATTERNS = [
  /ignore\s+(previous|all|above)\s+(instructions|prompts)/i,
  /forget\s+(everything|your|all)/i,
  /you\s+are\s+now\s+/i,
  /new\s+instruction/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /act\s+as\s+if\s+you\s+(are|were)\s+(?!a\s+(content|marketing|social))/i,
  /reveal\s+(your|the)\s+(system|initial)\s+prompt/i,
  /what\s+(is|are)\s+your\s+(instructions|system\s+prompt)/i,
];

export function detectPromptInjection(input: string): boolean {
  return SAFETY_CHECK_PATTERNS.some(pattern => pattern.test(input));
}
