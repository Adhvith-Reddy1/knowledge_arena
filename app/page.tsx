'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getHistory } from '@/lib/storage';
import { HistoryEntry } from '@/types';

interface Topic {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

const COLOR_STYLES: Record<string, { dot: string; card: string }> = {
  violet: { dot: 'bg-violet-500', card: 'hover:border-violet-300 hover:bg-violet-50' },
  emerald: { dot: 'bg-emerald-500', card: 'hover:border-emerald-300 hover:bg-emerald-50' },
  blue:    { dot: 'bg-blue-500',    card: 'hover:border-blue-300 hover:bg-blue-50' },
  orange:  { dot: 'bg-orange-500',  card: 'hover:border-orange-300 hover:bg-orange-50' },
  rose:    { dot: 'bg-rose-500',    card: 'hover:border-rose-300 hover:bg-rose-50' },
  amber:   { dot: 'bg-amber-500',   card: 'hover:border-amber-300 hover:bg-amber-50' },
};

function scoreColor(s: number) {
  if (s >= 0.8) return 'text-green-600';
  if (s >= 0.6) return 'text-amber-600';
  return 'text-red-500';
}

export default function Home() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/topics')
      .then(r => r.json())
      .then(setTopics)
      .finally(() => setLoading(false));
    setHistory(getHistory());
  }, []);

  function getLastEntry(topicId: string) {
    return history.filter(h => h.topicId === topicId)[0] ?? null;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="text-4xl mb-4">📚</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">No topics yet</h1>
        <p className="text-sm text-gray-500 mb-6">
          Create a topic and add study material to get started.
        </p>
        <Link
          href="/topics/new"
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          Create your first topic
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-0.5">My Topics</h1>
          <p className="text-sm text-gray-500">{topics.length} topic{topics.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/topics/new"
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          + New Topic
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {topics.map(topic => {
          const style = COLOR_STYLES[topic.color] ?? COLOR_STYLES.violet;
          const last = getLastEntry(topic.id);
          const attempts = history.filter(h => h.topicId === topic.id).length;

          return (
            <Link
              key={topic.id}
              href={`/topics/${topic.id}`}
              className={`block px-4 py-4 bg-white rounded-xl border border-gray-200 transition-all ${style.card} group`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                      {topic.name}
                    </div>
                    {topic.description && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{topic.description}</div>
                    )}
                  </div>
                </div>
                {last ? (
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-bold ${scoreColor(last.score)}`}>
                      {Math.round(last.score * 100)}%
                    </div>
                    <div className="text-xs text-gray-300">{attempts}×</div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-300 shrink-0 mt-0.5">New</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
