'use client';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QuestionCard from '@/components/QuestionCard';
import Pagination from '@/components/Pagination';
import api from '@/lib/api';

function QuestionsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    setLoading(true);
    api.get('/questions', { page, sort, tag })
      .then(data => {
        setQuestions(data.questions || []);
        setPagination(data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, sort, tag]);

  const changeSort = (newSort) => {
    setSort(newSort);
    router.push(`/questions?sort=${newSort}${tag ? `&tag=${tag}` : ''}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
          {tag && (
            <p className="text-sm text-gray-500 mt-1">
              Tagged with <span className="badge-primary">{tag}</span>
              <button onClick={() => { setTag(''); router.push('/questions'); }} className="ml-2 text-red-500 hover:text-red-700">&times; clear</button>
            </p>
          )}
        </div>
        <Link href="/questions/ask" className="btn-primary">Ask Question</Link>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[
          { value: 'newest', label: 'Newest' },
          { value: 'active', label: 'Active' },
          { value: 'votes', label: 'Most Voted' },
          { value: 'views', label: 'Most Viewed' },
        ].map(s => (
          <button
            key={s.value}
            onClick={() => changeSort(s.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              sort === s.value
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="card p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
          <p className="text-gray-500 mb-4">Be the first to ask a question!</p>
          <Link href="/questions/ask" className="btn-primary">Ask a Question</Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {questions.map(q => (
              <QuestionCard key={q._id} question={q} />
            ))}
          </div>
          <Pagination pagination={pagination} basePath="/questions" queryParams={{ sort, tag }} />
        </>
      )}
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 animate-pulse"><div className="h-8 w-48 bg-gray-200 rounded mb-6" /></div>}>
      <QuestionsPageContent />
    </Suspense>
  );
}
