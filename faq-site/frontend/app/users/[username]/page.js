'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QuestionCard from '@/components/QuestionCard';
import { formatDate, getInitials } from '@/lib/utils';
import api from '@/lib/api';

export default function UserProfilePage() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [tab, setTab] = useState('questions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/${username}`)
      .then(data => setUser(data.user))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (tab === 'questions') {
      api.get(`/users/${username}/questions`).then(d => setQuestions(d.questions || [])).catch(() => {});
    } else {
      api.get(`/users/${username}/answers`).then(d => setAnswers(d.answers || [])).catch(() => {});
    }
  }, [username, tab]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-center">
      <h2 className="text-xl font-semibold">User not found</h2>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold shrink-0">
            {getInitials(user.displayName || user.username)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{user.displayName || user.username}</h1>
            <p className="text-sm text-gray-500">@{user.username}</p>
            {user.bio && <p className="text-sm text-gray-700 mt-2">{user.bio}</p>}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{user.reputation}</span> reputation
              {user.location && <span>{user.location}</span>}
              {user.website && (
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                  {user.website}
                </a>
              )}
              <span>Joined {formatDate(user.createdAt)}</span>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{user.questionCount || 0}</p>
                <p className="text-xs text-gray-500">Questions</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{user.answerCount || 0}</p>
                <p className="text-xs text-gray-500">Answers</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            {user.role !== 'user' && (
              <span className={`badge ${user.role === 'admin' ? 'badge-red' : 'badge-yellow'} capitalize`}>
                {user.role}
              </span>
            )}
          </div>
        </div>
        {user.badges?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-gray-100">
            {user.badges.map(badge => (
              <span key={badge} className="badge-yellow text-xs">{badge}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <button
          onClick={() => setTab('questions')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'questions' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Questions ({user.questionCount || 0})
        </button>
        <button
          onClick={() => setTab('answers')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'answers' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Answers ({user.answerCount || 0})
        </button>
      </div>

      {tab === 'questions' ? (
        questions.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">No questions yet</div>
        ) : (
          <div className="space-y-4">
            {questions.map(q => <QuestionCard key={q._id} question={q} />)}
          </div>
        )
      ) : (
        answers.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">No answers yet</div>
        ) : (
          <div className="space-y-4">
            {answers.map(answer => (
              <Link key={answer._id} href={`/questions/${answer.question?._id || answer.question}`} className="card-hover p-4 block">
                <div className="flex items-center gap-2 mb-2">
                  {answer.isAccepted && <span className="badge-green text-xs">Accepted</span>}
                  <span className="text-xs text-gray-500">{answer.upvotes || 0} votes</span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-3">{answer.body?.slice(0, 300)}</p>
                <p className="text-xs text-gray-500 mt-2">Answered {formatDate(answer.createdAt)}</p>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
