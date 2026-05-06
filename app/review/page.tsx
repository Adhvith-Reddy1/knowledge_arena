'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentSession, saveHistoryEntry } from '@/lib/storage';
import {
  QuizSession,
  Question,
  Answer,
  MCQQuestion,
  MCQAnswer,
  ShortAnswer,
  QuestionFeedback,
} from '@/types';

export default function ReviewPage() {
  const router = useRouter();
  const [session, setSession] = useState<Partial<QuizSession> | null>(null);

  useEffect(() => {
    const s = getCurrentSession();
    if (!s?.evaluation) { router.push('/'); return; }
    setSession(s);
    saveHistoryEntry({
      id: s.id!,
      topicId: s.topicId!,
      topic: s.topic!,
      difficulty: s.difficulty!,
      date: s.date || new Date().toISOString(),
      score: s.evaluation.totalScore,
      questionsCorrect: s.evaluation.questionsCorrect,
      totalQuestions: s.evaluation.totalQuestions,
    });
  }, []);

  if (!session?.evaluation) return null;

  const { evaluation, questions = [], answers = [], topic, difficulty } = session;
  const pct = Math.round(evaluation.totalScore * 100);
  const label = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : 'Needs Work';

  const summaryStyle =
    pct >= 80
      ? 'bg-green-50 border-green-200 text-green-700'
      : pct >= 60
      ? 'bg-amber-50 border-amber-200 text-amber-700'
      : 'bg-red-50 border-red-200 text-red-600';

  return (
    <div>
      {/* Summary */}
      <div className={`border rounded-xl p-5 mb-8 flex items-start justify-between gap-4 flex-wrap ${summaryStyle}`}>
        <div>
          <div className="text-xl font-bold mb-0.5">{label}</div>
          <div className="text-sm opacity-75">
            {topic} · <span className="capitalize">{difficulty}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold">{pct}%</div>
          <div className="text-sm opacity-60">
            {evaluation.questionsCorrect}/{evaluation.totalQuestions} correct
          </div>
        </div>
      </div>

      {/* Per-question feedback */}
      <div className="space-y-5 mb-8">
        {questions.map((q: Question, i: number) => {
          const fb: QuestionFeedback | undefined = evaluation.feedback.find(
            (f: QuestionFeedback) => f.questionId === q.id
          );
          const ans = answers.find((a: Answer) => a.questionId === q.id);
          if (!fb) return null;

          const partial = !fb.isCorrect && fb.score > 0;

          const headerStyle = fb.isCorrect
            ? 'bg-green-50 border-green-200 text-green-700'
            : partial
            ? 'bg-amber-50 border-amber-200 text-amber-700'
            : 'bg-red-50 border-red-200 text-red-600';

          const borderStyle = fb.isCorrect
            ? 'border-green-200'
            : partial
            ? 'border-amber-200'
            : 'border-red-200';

          const icon = fb.isCorrect ? '✓' : partial ? '◑' : '✗';

          return (
            <div key={q.id} className={`bg-white border rounded-xl overflow-hidden ${borderStyle}`}>
              {/* Question header bar */}
              <div className={`flex items-center gap-2.5 px-5 py-3 border-b text-sm ${headerStyle}`}>
                <span className="font-bold">{icon}</span>
                <span className="font-medium">Question {i + 1}</span>
                <span className="ml-auto text-xs opacity-60 capitalize">
                  {q.type === 'mcq' ? 'Multiple choice' : 'Short answer'}
                </span>
              </div>

              <div className="p-5 space-y-4">
                {/* Question text */}
                <p className="text-sm font-medium text-gray-900 leading-relaxed">{q.question}</p>

                {/* MCQ: show all options with highlighting */}
                {q.type === 'mcq' && (
                  <div className="space-y-1.5">
                    {(q as MCQQuestion).options.map((opt, idx) => {
                      const correct = idx === (q as MCQQuestion).correctIndex;
                      const selected = idx === (ans as MCQAnswer)?.selectedIndex;
                      let cls =
                        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ';
                      if (correct && selected)
                        cls += 'border-green-300 bg-green-50 text-green-800';
                      else if (correct)
                        cls += 'border-green-300 bg-green-50 text-green-800';
                      else if (selected)
                        cls += 'border-red-300 bg-red-50 text-red-700';
                      else cls += 'border-gray-100 text-gray-400';
                      return (
                        <div key={idx} className={cls}>
                          <span className="font-semibold w-4 shrink-0">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <span className="flex-1">{opt}</span>
                          {correct && (
                            <span className="text-green-600 text-xs font-medium ml-auto shrink-0">
                              Correct
                            </span>
                          )}
                          {selected && !correct && (
                            <span className="text-red-500 text-xs ml-auto shrink-0">Your answer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Short answer: show user's response */}
                {q.type === 'short_answer' && (
                  <div className="bg-gray-50 rounded-lg p-3.5">
                    <p className="text-xs font-medium text-gray-400 mb-1.5">Your answer</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {(ans as ShortAnswer)?.text?.trim() || (
                        <span className="italic text-gray-300">No answer provided</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Annotation */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">Feedback</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{fb.annotation}</p>
                </div>

                {/* Strengths / weaknesses for short answer */}
                {q.type === 'short_answer' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {fb.strengths?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-1.5">What you got right</p>
                        <ul className="space-y-1">
                          {fb.strengths.map((s, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs text-gray-700">
                              <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {fb.weaknesses?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-600 mb-1.5">What you missed</p>
                        <ul className="space-y-1">
                          {fb.weaknesses.map((w, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs text-gray-700">
                              <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Model answer */}
                {fb.modelAnswer && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-400 mb-1.5">Model Answer</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{fb.modelAnswer}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2.5">
        <Link
          href="/"
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Topics
        </Link>
        <button
          onClick={() => router.push('/quiz')}
          className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          Retry Topic
        </button>
        <Link
          href="/history"
          className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          View History
        </Link>
      </div>
    </div>
  );
}
