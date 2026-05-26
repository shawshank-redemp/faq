'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function HomePage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/faqs', { limit: 6 })
      .then(data => setFaqs(data.faqs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Vicharanashala Internship — FAQ</h1>
            <p className="text-lg sm:text-xl text-primary-100 mb-8">
              Everything you need to know about the Vicharanashala Internship programme.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/faqs" className="btn bg-white text-primary-700 hover:bg-primary-50 font-semibold px-6 py-3 rounded-lg">
                Browse FAQs
              </Link>
              <Link href="/search" className="btn bg-transparent border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-lg">
                Search
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* FAQ Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">VINS FAQ Categories</h2>
            <Link href="/faqs" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all &rarr;
            </Link>
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {faqs.map(faq => (
                <Link key={faq._id} href={`/faqs/${faq.slug}`} className="card-hover p-6">
                  <div className="flex items-center gap-2 mb-2">
                    {faq.isOfficial && (
                      <span className="badge-green text-xs">Official</span>
                    )}
                    {faq.category && (
                      <span className="badge-gray text-xs">{faq.category}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{faq.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{faq.itemCount || 0} items</span>
                    <span>{faq.viewCount || 0} views</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Stats */}
        <section className="card p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-primary-600">13</p>
              <p className="text-sm text-gray-500 mt-1">Categories</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-600">126</p>
              <p className="text-sm text-gray-500 mt-1">FAQ Items</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-600">v21.0.0</p>
              <p className="text-sm text-gray-500 mt-1">Version</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-600">IIT Ropar</p>
              <p className="text-sm text-gray-500 mt-1">Vicharanashala Lab</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
