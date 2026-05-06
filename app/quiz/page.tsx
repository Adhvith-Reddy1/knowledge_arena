'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Question, Answer, MCQAnswer, ShortAnswer, Difficulty } from '@/types';
import { saveCurrentSession } from '@/lib/storage';

interface QuizConfig {
  topicId: string;
  topicName: string;
  difficulty: Difficulty;
  questionCount: number;
}

export default function QuizPage() {
  const router = useRouter();
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('ka_quiz_config');
    if (!raw) { router.push('/'); return; }
    const cfg = JSON.parse(raw) as QuizConfig;
    setConfig(cfg);
    generateQuestions(cfg);
  }, []);

  async function generateQuestions(cfg: QuizConfig) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: cfg.topicId,
          topic: cfg.topicName,
          difficulty: cfg.difficulty,
          count: cfg.questionCount,
        }),
      });
      if (!res.ok) throw new Error('Generate failed');
      const data = await res.json();
      setQuestions(data.questions);
      setAnswers(
        data.questions.map((q: Question) =>
          q.type === 'mcq'
            ? { questionId: q.id, type: 'mcq', selectedIndex: null }
            : { questionId: q.id, type: 'short_answer', text: '' }
        )
      );
    } catch {
      setError('Failed to generate questions. Make sure ANTHROPIC_API_KEY is set in .env.local.');
    } finally {
      setLoading(false);
    }
  }

  function updateAnswer(updated: Answer) {
    setAnswers(prev => prev.map(a => a.questionId === updated.questionId ? updated : a));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions,
          answers,
          topic: config?.topicName,
          difficulty: config?.difficulty,
        }),
      });
      if (!res.ok) throw new Error('Evaluate failed');
      const evaluation = await res.json();

      saveCurrentSession({
        id: Date.now().toString(),
        topicId: config!.topicId,
        topic: config!.topicName,
        difficulty: config!.difficulty,
        questions,
        answers,
        evaluation,
        date: new Date().toISOString(),
      });

      router.push('/review');
    } catch {
      setError('Failed to evaluate. Please try again.');
      setSubmitting(false);
    }
  }

  const q = questions[currentIndex];
  const currentAnswer = answers.find(a => a.questionId === q?.id);
  const isLast = currentIndex === questions.length - 1;

  const answeredCount = answers.filter(a =>
    a.type === 'mcq'
      ? (a as MCQAnswer).selectedIndex !== null
      : (a as ShortAnswer).text.trim().length > 0
  ).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-7 h-7 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">
          Generating {config?.questionCount} {config?.difficulty} questions on {config?.topicName}…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24">
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button onClick={() => router.push('/')} className="text-sm underline text-gray-500">
          Back to topics
        </button>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{config?.topicName}</span>
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 capitalize">
              {config?.difficulty}
            </span>
          </div>
          <span className="text-xs text-gray-400">{answeredCount}/{questions.length} answered</span>
        </div>

        {/* Progress */}
        <div className="h-1 bg-gray-200 rounded-full">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <div className="flex gap-3 mb-5">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-semibold">
            {currentIndex + 1}
          </span>
          <p className="text-gray-900 leading-relaxed text-sm">{q.question}</p>
        </div>

        {q.type === 'mcq' ? (
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              const selected = (currentAnswer as MCQAnswer)?.selectedIndex === i;
              return (
                <button
                  key={i}
                  onClick={() =>
                    updateAnswer({ questionId: q.id, type: 'mcq', selectedIndex: i })
                  }
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-lg border text-sm transition-all ${
                    selected
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-400 hover:bg-white'
                  }`}
                >
                  <span className={`font-semibold shrink-0 ${selected ? 'text-gray-400' : 'text-gray-400'}`}>
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <textarea
              value={(currentAnswer as ShortAnswer)?.text || ''}
              onChange={e =>
                updateAnswer({ questionId: q.id, type: 'short_answer', text: e.target.value })
              }
              placeholder="Write your answer here — explain your reasoning clearly."
              rows={5}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex(i => i - 1)}
          disabled={currentIndex === 0}
          className="text-sm text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {questions.map((qs, i) => {
            const ans = answers.find(a => a.questionId === qs.id);
            const done =
              qs.type === 'mcq'
                ? (ans as MCQAnswer)?.selectedIndex !== null
                : (ans as ShortAnswer)?.text?.trim().length > 0;
            return (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === currentIndex
                    ? 'w-5 bg-gray-900'
                    : done
                    ? 'w-2 bg-gray-400'
                    : 'w-2 bg-gray-200'
                }`}
              />
            );
          })}
        </div>

        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                Evaluating…
              </span>
            ) : (
              'Submit Quiz'
            )}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(i => i + 1)}
            className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
