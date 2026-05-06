import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert educator and quiz designer. Your job is to create challenging, intellectually stimulating quiz questions that test deep conceptual understanding—not surface-level memorization.

Guidelines:
- Mix multiple-choice (MCQ) and short-answer questions
- MCQ questions must have 4 options with plausible distractors that require genuine reasoning to eliminate
- Short-answer questions must be open-ended, probing edge cases, misconceptions, and connections between concepts
- Questions should be creative and test genuine comprehension, not just recitation of definitions
- Include a detailed rubric for short-answer questions describing what a complete, correct answer must contain

Difficulty calibration:
- easy: foundational concepts, standard definitions, basic application
- medium: application, analysis, comparing related concepts, identifying trade-offs
- hard: synthesis, edge cases, subtle distinctions, "why does X fail when Y" style questions

Return ONLY valid JSON — no markdown, no explanation, no code blocks.`;

export async function POST(req: NextRequest) {
  try {
    const { topic, difficulty, count } = await req.json();

    if (!topic || !difficulty || !count) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const mcqCount = Math.round(count * 0.4);
    const saCount = count - mcqCount;

    const userPrompt = `Create ${count} quiz questions about "${topic}" at ${difficulty} difficulty.

Use ${mcqCount} MCQ questions and ${saCount} short-answer questions.

Return this exact JSON structure:
{
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    },
    {
      "id": "q2",
      "type": "short_answer",
      "question": "Question text",
      "rubric": "A complete answer must include: [key points]. Common mistakes: [misconceptions to watch for]."
    }
  ]
}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
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

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Generate error:', err);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
