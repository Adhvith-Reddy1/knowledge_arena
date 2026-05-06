'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Difficulty } from '@/types';

interface Topic {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface SourceMeta {
  id: string;
  type: 'url' | 'file';
  name: string;
  url: string | null;
  char_count: number;
  created_at: string;
}

const COLOR_DOT: Record<string, string> = {
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
};

export default function TopicPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [sources, setSources] = useState<SourceMeta[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);

  // URL add state
  const [urlInput, setUrlInput] = useState('');
  const [addingUrl, setAddingUrl] = useState(false);
  const [urlError, setUrlError] = useState('');

  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTopic, setDeletingTopic] = useState(false);

  // Quiz settings
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questionCount, setQuestionCount] = useState(7);

  useEffect(() => {
    Promise.all([
      fetch(`/api/topics`).then(r => r.json()),
      fetch(`/api/topics/${id}/sources`).then(r => r.json()),
    ]).then(([topics, srcs]) => {
      const t = topics.find((t: Topic) => t.id === id);
      if (!t) { router.push('/'); return; }
      setTopic(t);
      setSources(srcs);
    }).finally(() => setLoadingPage(false));
  }, [id]);

  async function addUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setAddingUrl(true);
    setUrlError('');
    try {
      const res = await fetch(`/api/topics/${id}/sources/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setSources(prev => [data, ...prev]);
      setUrlInput('');
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : 'Failed to scrape URL');
    } finally {
      setAddingUrl(false);
    }
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    setFileError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/topics/${id}/sources/file`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setSources(prev => [data, ...prev]);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function deleteSource(sourceId: string) {
    setDeletingId(sourceId);
    try {
      await fetch(`/api/sources/${sourceId}`, { method: 'DELETE' });
      setSources(prev => prev.filter(s => s.id !== sourceId));
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteTopic() {
    if (!confirm(`Delete "${topic?.name}" and all its sources? This cannot be undone.`)) return;
    setDeletingTopic(true);
    await fetch(`/api/topics/${id}`, { method: 'DELETE' });
    router.push('/');
  }

  function startQuiz() {
    sessionStorage.setItem(
      'ka_quiz_config',
      JSON.stringify({
        topicId: id,
        topicName: topic!.name,
        difficulty,
        questionCount,
      })
    );
    router.push('/quiz');
  }

  function formatChars(n: number) {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k chars`;
    return `${n} chars`;
  }

  if (loadingPage) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!topic) return null;

  const totalChars = sources.reduce((s, src) => s + src.char_count, 0);
  const dotColor = COLOR_DOT[topic.color] ?? COLOR_DOT.violet;

  return (
    <div>
      {/* Back */}
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6 inline-block">
        ← Topics
      </Link>

      {/* Topic header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-3">
          <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{topic.name}</h1>
            {topic.description && (
              <p className="text-sm text-gray-500 mt-0.5">{topic.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={deleteTopic}
          disabled={deletingTopic}
          className="text-xs text-gray-300 hover:text-red-500 transition-colors shrink-0 mt-1"
        >
          Delete topic
        </button>
      </div>

      {/* ── STUDY MATERIAL ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Study Material
          </h2>
          {sources.length > 0 && (
            <span className="text-xs text-gray-400">
              {sources.length} source{sources.length !== 1 ? 's' : ''} · {formatChars(totalChars)}
            </span>
          )}
        </div>

        {/* Add URL */}
        <form onSubmit={addUrl} className="flex gap-2 mb-3">
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="Paste a URL to scrape…"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            disabled={addingUrl}
          />
          <button
            type="submit"
            disabled={addingUrl || !urlInput.trim()}
            className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            {addingUrl ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                Scraping…
              </span>
            ) : (
              'Add URL'
            )}
          </button>
        </form>
        {urlError && <p className="text-xs text-red-600 mb-3">{urlError}</p>}

        {/* Upload file */}
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.markdown"
            onChange={uploadFile}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`inline-flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 cursor-pointer hover:border-gray-500 hover:text-gray-700 transition-colors ${
              uploadingFile ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            {uploadingFile ? (
              <>
                <span className="w-3.5 h-3.5 border border-gray-500 border-t-transparent rounded-full animate-spin" />
                Parsing file…
              </>
            ) : (
              <>
                <span>↑</span>
                Upload PDF, TXT, or MD
              </>
            )}
          </label>
          {fileError && <p className="text-xs text-red-600 mt-2">{fileError}</p>}
        </div>

        {/* Sources list */}
        {sources.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400">
            No sources yet — add a URL or upload a file to ground questions in your material.
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map(src => (
              <div
                key={src.id}
                className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg"
              >
                <span className="text-base shrink-0">{src.type === 'url' ? '🔗' : '📄'}</span>
                <div className="flex-1 min-w-0">
                  {src.url ? (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gray-900 truncate block hover:underline"
                    >
                      {src.name}
                    </a>
                  ) : (
                    <div className="text-sm font-medium text-gray-900 truncate">{src.name}</div>
                  )}
                  <div className="text-xs text-gray-400">{formatChars(src.char_count)}</div>
                </div>
                <button
                  onClick={() => deleteSource(src.id)}
                  disabled={deletingId === src.id}
                  className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none shrink-0 disabled:opacity-40"
                  title="Remove source"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── START QUIZ ── */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Start Quiz
        </h2>

        {sources.length === 0 && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            No sources added — questions will be generated from Claude's general knowledge.
          </div>
        )}

        <div className="flex flex-wrap gap-6 mb-5">
          <div>
            <p className="text-xs text-gray-500 mb-2">Difficulty</p>
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
            <p className="text-xs text-gray-500 mb-2">
              Questions: <span className="font-semibold text-gray-900">{questionCount}</span>
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

        <button
          onClick={startQuiz}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          Start Quiz →
        </button>
      </section>
    </div>
  );
}
