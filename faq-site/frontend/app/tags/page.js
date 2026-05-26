'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function TagsPage() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/tags', { search })
      .then(data => setTags(data.tags || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Tags</h1>
      <p className="text-sm text-gray-500 mb-6">Browse questions by topic or category</p>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter tags..."
        className="input max-w-md mb-6"
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : tags.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">No tags found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {tags.map(tag => (
            <Link key={tag._id} href={`/tags/${tag.name}`} className="card-hover p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge-primary text-sm font-medium">{tag.name}</span>
                {tag.isOfficial && <span className="badge-green text-xs">Official</span>}
              </div>
              {tag.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tag.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{tag.questionCount || 0} questions</span>
                {tag.category && <span className="capitalize">{tag.category}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
