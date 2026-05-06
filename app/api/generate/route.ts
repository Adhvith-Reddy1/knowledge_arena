import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getSourcesContent } from '@/lib/db';

const client = new Anthropic();

const BASE_SYSTEM = `You are an expert educator and quiz designer creating questions that test deep conceptual understanding — not surface-level memorization.

Guidelines:
- Mix multiple-choice (MCQ) and short-answer questions
- MCQ must have 4 options with plausible distractors requiring genuine reasoning
- Short-answer questions must be open-ended, probing edge cases, misconceptions, and cross-concept connections
- Scale difficulty: easy = foundational concepts; medium = application and analysis; hard = synthesis, edge cases, subtle distinctions

Return ONLY valid JSON — no markdown, no explanation, no code blocks.`;

const SOURCE_ADDENDUM = `
IMPORTANT: You have been given source material below. Generate questions EXCLUSIVELY from concepts, facts, and ideas present in that material. Do not ask about topics not covered in the sources. Ground every question in something the learner could have studied from these sources.`;

const NO_SOURCE_ADDENDUM = `
Generate questions from your general knowledge of this topic.`;

export async function POST(req: NextRequest) {
  try {
    const { topicId, topic, difficulty, count } = await req.json();

    if (!topic || !difficulty || !count) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sourceContent = topicId ? getSourcesContent(topicId) : '';
    const hasSource = sourceContent.trim().length > 0;

    // Limit context to ~120k chars (~30k tokens) to leave room for the response
    const contextText = hasSource ? sourceContent.slice(0, 120_000) : '';

    const mcqCount = Math.round(count * 0.4);
    const saCount = count - mcqCount;

    const systemPrompt =
      BASE_SYSTEM + (hasSource ? SOURCE_ADDENDUM : NO_SOURCE_ADDENDUM);

    const userPrompt = [
      hasSource
        ? `STUDY MATERIAL FOR "${topic}":\n\n${contextText}\n\n---`
        : null,
      `Create ${count} quiz questions about "${topic}" at ${difficulty} difficulty.`,
      `Use ${mcqCount} MCQ and ${saCount} short-answer questions.`,
      ``,
      `Return this exact JSON:`,
      `{`,
      `  "questions": [`,
      `    {`,
      `      "id": "q1",`,
      `      "type": "mcq",`,
      `      "question": "...",`,
      `      "options": ["A", "B", "C", "D"],`,
      `      "correctIndex": 0`,
      `    },`,
      `    {`,
      `      "id": "q2",`,
      `      "type": "short_answer",`,
      `      "question": "...",`,
      `      "rubric": "A complete answer must include: [key points]. Common mistakes: [misconceptions]."`,
      `    }`,
      `  ]`,
      `}`,
    ]
      .filter(l => l !== null)
      .join('\n');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response format' }, { status: 500 });
    }

    const text = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(text);
    return NextResponse.json({ ...parsed, hasSource });
  } catch (err) {
    console.error('Generate error:', err);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
