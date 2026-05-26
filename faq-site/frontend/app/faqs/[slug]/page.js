'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function FAQDetailPage() {
  const { slug } = useParams();
  const [faq, setFaq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(0);

  useEffect(() => {
    api.get(`/faqs/${slug}`)
      .then(data => setFaq(data.faq))
      .catch(() => toast.error('FAQ not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleFeedback = async (itemId, helpful) => {
    try {
      await api.post(`/faqs/${faq._id}/items/${itemId}/feedback`, { helpful });
      toast.success(helpful ? 'Glad this helped!' : 'Thanks for the feedback');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!faq) return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-center">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">FAQ not found</h2>
      <Link href="/faqs" className="text-primary-600 hover:text-primary-700">Browse all FAQs</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/faqs" className="text-sm text-gray-500 hover:text-gray-700">&larr; Back to FAQs</Link>
        <div className="flex items-center gap-2 mt-2 mb-2">
          {faq.isOfficial && <span className="badge-green">Official</span>}
          {faq.category && <span className="badge-gray capitalize">{faq.category}</span>}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{faq.title}</h1>
        {faq.description && <p className="text-gray-600 mt-2">{faq.description}</p>}
      </div>

      {/* Sidebar navigation */}
      {faq.items?.length > 1 && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">On this page</h3>
          <nav className="space-y-1">
            {faq.items.filter(i => i.isPublished).map((item, index) => (
              <button
                key={item._id}
                onClick={() => {
                  setActiveItem(index);
                  document.getElementById(`item-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`block w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeItem === index ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.question}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* FAQ items */}
      <div className="space-y-6">
        {(faq.items || []).filter(i => i.isPublished).map((item, index) => (
          <div
            key={item._id}
            id={`item-${index}`}
            className={`card p-6 transition-all ${activeItem === index ? 'ring-2 ring-primary-200' : ''}`}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{item.question}</h2>
            <MarkdownRenderer content={item.answer} />
            {item.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {item.tags.map(tag => (
                  <span key={tag} className="badge-gray text-xs">{tag}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
              <span>Was this helpful?</span>
              <button onClick={() => handleFeedback(item._id, true)} className="flex items-center gap-1 hover:text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                Yes ({item.helpfulCount || 0})
              </button>
              <button onClick={() => handleFeedback(item._id, false)} className="flex items-center gap-1 hover:text-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                No ({item.notHelpfulCount || 0})
              </button>
            </div>
          </div>
        ))}
      </div>

      {faq.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-6">
          {faq.tags.map(tag => (
            <Link key={tag} href={`/tags/${tag}`} className="badge-primary">{tag}</Link>
          ))}
        </div>
      )}

      <div className="mt-6 text-xs text-gray-400">
        {faq.viewCount} views &middot; Last updated {formatDate(faq.updatedAt)}
      </div>
    </div>
  );
}
