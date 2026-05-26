'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AskQuestionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', body: '', tagInput: '' });
  const [tags, setTags] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth?mode=login');
      return;
    }
    api.get('/tags').then(d => setSuggestions(d.tags || [])).catch(() => {});
  }, [user]);

  const addTag = (name) => {
    const t = name.toLowerCase().trim();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
    }
    setForm({ ...form, tagInput: '' });
  };

  const removeTag = (name) => setTags(tags.filter(t => t !== name));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.title.length < 10) { setError('Title must be at least 10 characters'); return; }
    if (form.body.length < 20) { setError('Body must be at least 20 characters'); return; }

    setLoading(true);
    try {
      const data = await api.post('/questions', { title: form.title, body: form.body, tags });
      toast.success('Question posted!');
      router.push(`/questions/${data.question._id}`);
    } catch (err) {
      setError(err.message || 'Failed to post question');
      toast.error(err.message || 'Failed to post question');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ask a Question</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <div>
            <label className="label">Title</label>
            <p className="text-xs text-gray-500 mb-1">Be specific and imagine you&apos;re asking a question to another person.</p>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              placeholder="e.g. How do I use useEffect in React for data fetching?"
              maxLength={300}
            />
          </div>

          <div>
            <label className="label">Body</label>
            <p className="text-xs text-gray-500 mb-1">Include all the information someone would need to answer your question. Supports Markdown.</p>
            <textarea
              required
              rows={10}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="input font-mono text-sm"
              placeholder="Describe your problem in detail..."
              maxLength={50000}
            />
          </div>

          <div>
            <label className="label">Tags</label>
            <p className="text-xs text-gray-500 mb-1">Add up to 5 tags to describe what your question is about.</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <span key={tag} className="badge-primary flex items-center gap-1">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-primary-600 hover:text-primary-800">&times;</button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={form.tagInput}
                onChange={(e) => setForm({ ...form, tagInput: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(form.tagInput); } }}
                className="input"
                placeholder="Type and press Enter to add tags"
              />
              {form.tagInput && suggestions.filter(s => s.name.includes(form.tagInput.toLowerCase()) && !tags.includes(s.name)).length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {suggestions.filter(s => s.name.includes(form.tagInput.toLowerCase()) && !tags.includes(s.name)).slice(0, 5).map(s => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => addTag(s.name)}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary px-6 py-2.5">
            {loading ? 'Posting...' : 'Post Your Question'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary px-6 py-2.5">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
