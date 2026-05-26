'use client';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import api from '@/lib/api';

function FAQsPageContent() {
  const searchParams = useSearchParams();
  const [faqs, setFaqs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || '';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/faqs', { page, category }),
      api.get('/faqs', { limit: 100 }),
    ]).then(([data, all]) => {
      setFaqs(data.faqs || []);
      setPagination(data.pagination);
      const cats = [...new Set((all.faqs || []).map(f => f.category).filter(Boolean))];
      setCategories(cats);
    })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, category]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">FAQs</h1>
        <p className="text-sm text-gray-500 mt-1">Curated answers to commonly asked questions</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/faqs"
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            !category ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </Link>
        {categories.map(cat => (
          <Link
            key={cat}
            href={`/faqs?category=${cat}`}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium capitalize transition-colors ${
              category === cat ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <div className="card p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
          <p className="text-gray-500">No FAQs available for this category yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {faqs.map(faq => (
              <Link key={faq._id} href={`/faqs/${faq.slug}`} className="card-hover p-6">
                <div className="flex items-center gap-2 mb-3">
                  {faq.isOfficial && <span className="badge-green text-xs">Official</span>}
                  {faq.category && <span className="badge-gray text-xs capitalize">{faq.category}</span>}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{faq.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{faq.itemCount || 0} items</span>
                  <span>{faq.viewCount || 0} views</span>
                </div>
              </Link>
            ))}
          </div>
          <Pagination pagination={pagination} basePath="/faqs" queryParams={{ category }} />
        </>
      )}
    </div>
  );
}

export default function FAQsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 animate-pulse"><div className="h-8 w-48 bg-gray-200 rounded mb-6" /></div>}>
      <FAQsPageContent />
    </Suspense>
  );
}
