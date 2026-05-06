'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const COLORS = [
  { id: 'violet', label: 'Violet', cls: 'bg-violet-500' },
  { id: 'emerald', label: 'Emerald', cls: 'bg-emerald-500' },
  { id: 'blue', label: 'Blue', cls: 'bg-blue-500' },
  { id: 'orange', label: 'Orange', cls: 'bg-orange-500' },
  { id: 'rose', label: 'Rose', cls: 'bg-rose-500' },
  { id: 'amber', label: 'Amber', cls: 'bg-amber-500' },
];

export default function NewTopicPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('violet');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, color }),
      });
      if (!res.ok) throw new Error('Failed to create topic');
      const topic = await res.json();
      router.push(`/topics/${topic.id}`);
    } catch {
      setError('Failed to create topic. Try again.');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6 inline-block">
        ← Back
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-7">New Topic</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Transformer Architecture, Cell Signaling"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What does this topic cover?"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button
                key={c.id}
                type="button"
                title={c.label}
                onClick={() => setColor(c.id)}
                className={`w-7 h-7 rounded-full ${c.cls} transition-all ${
                  color === c.id ? 'ring-2 ring-offset-2 ring-gray-900' : 'opacity-50 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating…' : 'Create Topic'}
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
