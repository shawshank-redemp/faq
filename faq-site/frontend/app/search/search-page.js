'use client';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDate, truncate } from '@/lib/utils';
import api from '@/lib/api';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [didYouMean, setDidYouMean] = useState({ correction: null, relatedFAQs: [] });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    const t = searchParams.get('type') || '';
    if (q) {
      setQuery(q);
      setType(t);
      performSearch(q, t);
    }
    api.get('/search/suggestions').then(d => setSuggestions(d.suggestions || [])).catch(() => {});
  }, [searchParams]);

  const performSearch = async (q, t) => {
    if (!q) return;
    setLoading(true);
    try {
      const data = await api.get('/search', { q, type: t });
      setResults(data.results || []);
      setTotal(data.total || 0);
      setDidYouMean(data.didYouMean || { correction: null, relatedFAQs: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Search</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions, FAQs, users..."
          className="input flex-1"
          autoFocus
        />
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {/* Type filter */}
      <div className="flex gap-2 mb-6">
        {['', 'questions', 'faqs', 'users'].map(t => (
          <button
            key={t}
            onClick={() => { setType(t); if (query) router.push(`/search?q=${encodeURIComponent(query)}&type=${t}`); }}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium capitalize transition-colors ${
              type === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t || 'All'}
          </button>
        ))}
      </div>

      {/* Suggestions */}
      {!searchParams.get('q') && suggestions.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Trending searches</h3>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <Link
                key={i}
                href={`/search?q=${encodeURIComponent(s.query)}`}
                className="badge-gray hover:bg-gray-200 cursor-pointer"
              >
                {s.query}
              </Link>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : results.length === 0 && searchParams.get('q') ? (
        <div className="card p-10 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results for &ldquo;{searchParams.get('q')}&rdquo;
          </h3>

          {/* Spelling correction */}
          {didYouMean.correction && (
            <p className="text-gray-500 mb-4">
              Did you mean{' '}
              <Link
                href={`/search?q=${encodeURIComponent(didYouMean.correction)}${type ? `&type=${type}` : ''}`}
                className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2"
              >
                {didYouMean.correction}
              </Link>
              ?
            </p>
          )}

          {/* Related FAQ suggestions */}
          {didYouMean.relatedFAQs?.length > 0 && (
            <div className="mt-6 text-left">
              <p className="text-sm font-medium text-gray-700 mb-3">
                You might find these FAQs helpful:
              </p>
              <div className="space-y-2">
                {didYouMean.relatedFAQs.map(faq => (
                  <Link
                    key={faq.slug}
                    href={`/faqs/${faq.slug}`}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-50 hover:bg-primary-50 hover:text-primary-700 transition-colors text-sm text-gray-700 group"
                  >
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {faq.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Fallback tip when nothing helps */}
          {!didYouMean.correction && didYouMean.relatedFAQs?.length === 0 && (
            <p className="text-gray-500 mt-2">
              Try different keywords or{' '}
              <Link href="/faqs" className="text-primary-600 hover:text-primary-700 font-medium">
                browse all FAQ categories
              </Link>
              .
            </p>
          )}
        </div>
      ) : (
        <>
          {total > 0 && <p className="text-sm text-gray-500 mb-4">{total} results found</p>}
          <div className="space-y-4">
            {results.map((result) => {
              const typeLabel = result.body !== undefined ? 'question' : result.description !== undefined ? 'faq' : 'user';
              const title = result.title || result.displayName || result.username || 'Untitled';
              const desc = result.body || result.description || result.bio || '';
              const link = typeLabel === 'question' ? `/questions/${result.id}` : typeLabel === 'faq' ? `/faqs/${result.slug || result.id}` : `/users/${result.username}`;

              return (
                <Link key={result.id} href={link} className="card-hover p-4 block">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge-gray text-xs capitalize">{typeLabel}</span>
                    {result.score && <span className="text-xs text-gray-400">Relevance: {Math.round(result.score * 100)}%</span>}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
                  {desc && <p className="text-sm text-gray-600 line-clamp-2">{truncate(desc, 200)}</p>}
                  {result.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {result.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="badge-primary text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8 animate-pulse"><div className="h-8 w-48 bg-gray-200 rounded mb-6" /></div>}>
      <SearchPageContent />
    </Suspense>
  );
}
