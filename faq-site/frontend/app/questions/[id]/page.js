'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function QuestionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const socket = useSocket();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [answering, setAnswering] = useState(false);
  const [userVotes, setUserVotes] = useState({});
  const [saved, setSaved] = useState(false);

  const fetchQuestion = useCallback(async () => {
    try {
      const data = await api.get(`/questions/${id}`);
      setQuestion(data.question);
    } catch (err) {
      toast.error('Question not found');
      router.push('/questions');
    }
  }, [id, router]);

  const fetchAnswers = useCallback(async () => {
    try {
      const data = await api.get(`/answers/question/${id}`);
      setAnswers(data.answers || []);
    } catch (_) {}
  }, [id]);

  useEffect(() => {
    fetchQuestion();
    fetchAnswers();
  }, [fetchQuestion, fetchAnswers]);

  useEffect(() => {
    if (socket && id) {
      socket.emit('join:question', id);
      socket.on('answer:new', (data) => {
        if (data.answer) {
          setAnswers(prev => [data.answer, ...prev]);
        }
      });
      return () => {
        socket.emit('leave:question', id);
        socket.off('answer:new');
      };
    }
  }, [socket, id]);

  const handleVote = async (targetType, targetId, voteType) => {
    if (!user) { toast.error('Please login to vote'); return; }
    try {
      await api.post('/votes', { targetType, targetId, voteType });
      if (targetType === 'Question') {
        fetchQuestion();
      } else {
        fetchAnswers();
      }
    } catch (err) {
      toast.error(err.message || 'Vote failed');
    }
  };

  const handleSave = async () => {
    if (!user) { toast.error('Please login to save'); return; }
    try {
      if (saved) {
        await api.delete(`/users/me/saved/${id}`);
        setSaved(false);
        toast.success('Question unsaved');
      } else {
        await api.post('/users/me/saved', { questionId: id });
        setSaved(true);
        toast.success('Question saved');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to answer'); return; }
    if (newAnswer.length < 10) { toast.error('Answer too short'); return; }

    setAnswering(true);
    try {
      const data = await api.post(`/answers/question/${id}`, { body: newAnswer });
      setAnswers(prev => [data.answer, ...prev]);
      setNewAnswer('');
      toast.success('Answer posted!');
    } catch (err) {
      toast.error(err.message || 'Failed to post answer');
    } finally {
      setAnswering(false);
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      await api.post(`/answers/${answerId}/accept`);
      fetchQuestion();
      fetchAnswers();
      toast.success('Answer accepted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/questions/${id}`);
      toast.success('Question deleted');
      router.push('/questions');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading && !question) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{question.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleSave} className="btn-secondary btn-sm">
              {saved ? 'Saved' : 'Save'}
            </button>
            {(user?._id === question.author?._id || user?.role === 'admin') && (
              <button onClick={handleDelete} className="btn-danger btn-sm">Delete</button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          {question.tagNames?.map(tag => (
            <Link key={tag} href={`/tags/${tag}`} className="badge-primary">{tag}</Link>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
          <Link href={`/users/${question.author?.username}`} className="flex items-center gap-1 hover:text-primary-600">
            <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[10px] font-medium">
              {(question.author?.displayName || question.author?.username || '?')[0]}
            </div>
            <span>{question.author?.displayName || question.author?.username}</span>
          </Link>
          <span>asked {formatDate(question.createdAt)}</span>
          <span>{question.viewCount} views</span>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Vote sidebar */}
        <div className="hidden sm:flex flex-col items-center gap-2">
          <button onClick={() => handleVote('Question', id, 'upvote')} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-green-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </button>
          <span className="font-bold text-lg text-gray-900">{question.upvotes - question.downvotes}</span>
          <button onClick={() => handleVote('Question', id, 'downvote')} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>

        {/* Question body */}
        <div className="flex-1 min-w-0">
          <div className="card p-6 mb-4">
            <MarkdownRenderer content={question.body} />
          </div>

          {/* Answer count */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {question.answerCount || 0} {(question.answerCount || 0) === 1 ? 'Answer' : 'Answers'}
            </h2>
          </div>

          {/* Answers */}
          {answers.length === 0 ? (
            <div className="card p-8 text-center mb-6">
              <p className="text-gray-500">No answers yet. Be the first to answer!</p>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {answers.map(answer => (
                <div key={answer._id} className={`card p-6 ${answer.isAccepted ? 'border-green-300 ring-1 ring-green-200' : ''}`}>
                  <div className="flex gap-4">
                    <div className="hidden sm:flex flex-col items-center gap-1">
                      <button onClick={() => handleVote('Answer', answer._id, 'upvote')} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-green-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <span className="font-semibold text-sm">{answer.upvotes - answer.downvotes}</span>
                      <button onClick={() => handleVote('Answer', answer._id, 'downvote')} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>
                    <div className="flex-1">
                      <MarkdownRenderer content={answer.body} />
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Link href={`/users/${answer.author?.username}`} className="flex items-center gap-1 hover:text-primary-600">
                            <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[10px] font-medium">
                              {(answer.author?.displayName || answer.author?.username || '?')[0]}
                            </div>
                            <span>{answer.author?.displayName || answer.author?.username}</span>
                          </Link>
                          <span>answered {formatDate(answer.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {answer.isOfficial && <span className="badge-green">Official</span>}
                          {answer.isAccepted && <span className="badge-green">Accepted</span>}
                          {question.author?._id === user?._id && !answer.isAccepted && (
                            <button onClick={() => handleAcceptAnswer(answer._id)} className="btn-secondary btn-sm">
                              Accept
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Answer form */}
          {user ? (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Answer</h3>
              <form onSubmit={handleSubmitAnswer}>
                <textarea
                  rows={6}
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="input mb-3 font-mono text-sm"
                  placeholder="Write your answer in Markdown..."
                  maxLength={50000}
                />
                <button type="submit" disabled={answering} className="btn-primary">
                  {answering ? 'Posting...' : 'Post Answer'}
                </button>
              </form>
            </div>
          ) : (
            <div className="card p-6 text-center">
              <p className="text-gray-500">
                <Link href={`/auth?mode=login&redirect=/questions/${id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                  Login
                </Link> to answer this question
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
