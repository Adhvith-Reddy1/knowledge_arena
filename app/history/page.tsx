'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getHistory } from '@/lib/storage';
import { HistoryEntry } from '@/types';
import { TOPIC_CATEGORIES } from '@/lib/topics';

function scoreColor(s: number) {
  if (s >= 0.8) return 'text-green-600';
  if (s >= 0.6) return 'text-amber-600';
  return 'text-red-500';
}

function scoreBarColor(s: number) {
  if (s >= 0.8) return 'bg-green-500';
  if (s >= 0.6) return 'bg-amber-500';
  return 'bg-red-500';
}

function scoreBadge(s: number) {
  if (s >= 0.8) return 'bg-green-100 text-green-700';
  if (s >= 0.6) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-600';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const allTopics = TOPIC_CATEGORIES.flatMap(cat => cat.topics);

  const topicStats = allTopics
    .map(topic => {
      const entries = history.filter(h => h.topicId === topic.id);
      if (entries.length === 0) return null;
      const avgScore = entries.reduce((s, e) => s + e.score, 0) / entries.length;
      const bestScore = Math.max(...entries.map(e => e.score));
      return { id: topic.id, name: topic.name, entries, avgScore, bestScore };
    })
    .filter(Boolean)
    .sort((a, b) => a!.avgScore - b!.avgScore) as {
      id: string;
      name: string;
      entries: HistoryEntry[];
      avgScore: number;
      bestScore: number;
    }[];

  if (history.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-400 text-sm mb-3">No quiz history yet.</p>
        <Link href="/" className="text-sm font-medium text-gray-900 underline">
          Start your first quiz
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">History</h1>
        <p className="text-sm text-gray-500">
          {history.length} quiz{history.length !== 1 ? 'zes' : ''} completed
        </p>
      </div>

      {/* Performance by topic */}
      {topicStats.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Performance by Topic
          </h2>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {topicStats.map(t => (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                  <div className={`text-sm font-bold ${scoreColor(t.avgScore)}`}>
                    {Math.round(t.avgScore * 100)}%
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full ${scoreBarColor(t.avgScore)} transition-all`}
                    style={{ width: `${t.avgScore * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400">
                  {t.entries.length} attempt{t.entries.length !== 1 ? 's' : ''} ·{' '}
                  Best: {Math.round(t.bestScore * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Recent Sessions
      </h2>
      <div className="space-y-2">
        {history.map(entry => (
          <div
            key={entry.id}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center gap-4"
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${scoreBadge(entry.score)}`}
            >
              <span className="text-xs font-bold">{Math.round(entry.score * 100)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{entry.topic}</div>
              <div className="text-xs text-gray-400">
                {entry.questionsCorrect}/{entry.totalQuestions} correct ·{' '}
                <span className="capitalize">{entry.difficulty}</span>
              </div>
            </div>
            <div className="text-xs text-gray-300 shrink-0">{formatDate(entry.date)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
