'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TOPIC_CATEGORIES } from '@/lib/topics';
import { getHistory } from '@/lib/storage';
import { Difficulty, HistoryEntry } from '@/types';

const CATEGORY_STYLES = {
  emerald: {
    dot: 'bg-emerald-500',
    card: 'border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50',
  },
  violet: {
    dot: 'bg-violet-500',
    card: 'border-violet-100 hover:border-violet-300 hover:bg-violet-50',
  },
};

function scoreColor(score: number) {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-amber-600';
  return 'text-red-500';
}

export default function Home() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questionCount, setQuestionCount] = useState(7);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  function getLatestScore(topicId: string) {
    const entries = history.filter(h => h.topicId === topicId);
    return entries.length > 0 ? entries[0] : null;
  }

  function startQuiz(topicId: string, topicName: string) {
    sessionStorage.setItem(
      'ka_quiz_config',
      JSON.stringify({ topicId, topicName, difficulty, questionCount })
    );
    router.push('/quiz');
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Select a Topic</h1>
        <p className="text-sm text-gray-500">Choose what you want to be tested on today</p>
      </div>

      {/* Settings bar */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 mb-8 flex flex-wrap items-center gap-6">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Difficulty</p>
          <div className="flex gap-1.5">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                  difficulty === d
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
            Questions: <span className="font-bold text-gray-900">{questionCount}</span>
          </p>
          <input
            type="range"
            min={5}
            max={10}
            value={questionCount}
            onChange={e => setQuestionCount(Number(e.target.value))}
            className="w-28 accent-gray-900 cursor-pointer"
          />
        </div>
      </div>

      {/* Topic categories */}
      {TOPIC_CATEGORIES.map(cat => {
        const styles = CATEGORY_STYLES[cat.color as keyof typeof CATEGORY_STYLES];
        return (
          <div key={cat.category} className="mb-9">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${styles.dot}`} />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {cat.category}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {cat.topics.map(topic => {
                const last = getLatestScore(topic.id);
                return (
                  <button
                    key={topic.id}
                    onClick={() => startQuiz(topic.id, topic.name)}
                    className={`text-left px-4 py-3.5 rounded-xl border bg-white transition-all ${styles.card} group`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 mb-0.5">
                          {topic.name}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{topic.description}</div>
                      </div>
                      {last && (
                        <div className="text-right shrink-0">
                          <div className={`text-sm font-bold ${scoreColor(last.score)}`}>
                            {Math.round(last.score * 100)}%
                          </div>
                          <div className="text-xs text-gray-300">
                            {history.filter(h => h.topicId === topic.id).length}×
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
