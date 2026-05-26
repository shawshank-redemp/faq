'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import QuestionCard from '@/components/QuestionCard';
import Pagination from '@/components/Pagination';
import api from '@/lib/api';

export default function TagDetailPage() {
  const { name } = useParams();
  const [tag, setTag] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/tags/${name}`),
      api.get('/questions', { tag: name, limit: 20 }),
    ])
      .then(([tData, qData]) => {
        setTag(tData.tag);
        setQuestions(qData.questions || []);
        setPagination(qData.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {tag && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-primary text-lg px-4 py-1">{tag.name}</span>
          </div>
          {tag.description && <p className="text-gray-600">{tag.description}</p>}
          <p className="text-sm text-gray-500 mt-1">{tag.questionCount || 0} questions tagged</p>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">No questions with this tag yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map(q => <QuestionCard key={q._id} question={q} />)}
          <Pagination pagination={pagination} basePath={`/tags/${name}`} />
        </div>
      )}
    </div>
  );
}
