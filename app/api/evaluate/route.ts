import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { Question, Answer, MCQQuestion, MCQAnswer, ShortAnswer, ShortAnswerQuestion } from '@/types';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a rigorous but fair academic evaluator. Assess quiz answers with expert precision.

For MCQ questions:
- isCorrect = true if selectedIndex matches correctIndex, false otherwise
- score = 1 or 0
- annotation: explain why the correct answer is right; if wrong, why their choice was incorrect and what it confuses
- modelAnswer: state the correct option and a brief explanation

For short-answer questions:
- Evaluate against the rubric with granularity
- annotation: overall assessment in 2-3 sentences
- strengths: array of specific things the user got right (be precise, not generic)
- weaknesses: array of specific things missed or incorrectly stated (note near-misses: "You mentioned X which is close, but the key distinction is Y")
- modelAnswer: a complete, expert-level answer
- score: 0 (wrong), 0.25 (minimal), 0.5 (partial), 0.75 (mostly correct), 1.0 (complete)

questionsCorrect = count of questions with score >= 0.75
totalScore = average score across all questions

Return ONLY valid JSON — no markdown, no explanation, no code blocks.`;

export async function POST(req: NextRequest) {
  try {
    const { questions, answers, topic, difficulty } = await req.json();

    const payload = questions.map((q: Question) => {
      const answer = answers.find((a: Answer) => a.questionId === q.id);

      if (q.type === 'mcq') {
        const mcq = q as MCQQuestion;
        const ans = answer as MCQAnswer;
        return {
          id: q.id,
          type: 'mcq',
          question: q.question,
          options: mcq.options,
          correctIndex: mcq.correctIndex,
          correctOption: mcq.options[mcq.correctIndex],
          selectedIndex: ans?.selectedIndex ?? null,
          selectedOption: ans?.selectedIndex != null ? mcq.options[ans.selectedIndex] : 'No answer',
        };
      } else {
        const sa = q as ShortAnswerQuestion;
        const ans = answer as ShortAnswer;
        return {
          id: q.id,
          type: 'short_answer',
          question: q.question,
          rubric: sa.rubric,
          userAnswer: ans?.text?.trim() || '(no answer provided)',
        };
      }
    });

    const userPrompt = `Evaluate these ${questions.length} answers for a "${topic}" quiz at ${difficulty} difficulty.

${JSON.stringify(payload, null, 2)}

Return this exact JSON:
{
  "feedback": [
    {
      "questionId": "q1",
      "isCorrect": true,
      "score": 1,
      "annotation": "Overall assessment",
      "strengths": ["Specific thing correct"],
      "weaknesses": ["Specific thing missed"],
      "modelAnswer": "Complete ideal answer"
    }
  ],
  "totalScore": 0.75,
  "questionsCorrect": 3,
  "totalQuestions": 4
}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
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
    console.error('Evaluate error:', err);
    return NextResponse.json({ error: 'Failed to evaluate answers' }, { status: 500 });
  }
}
