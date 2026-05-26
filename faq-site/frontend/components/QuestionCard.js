import Link from 'next/link';
import { formatDate, truncate } from '@/lib/utils';

export default function QuestionCard({ question }) {
  return (
    <div className="card-hover p-4 sm:p-6">
      <div className="flex gap-4">
        <div className="hidden sm:flex flex-col items-center gap-1 text-sm min-w-[60px]">
          <span className="font-semibold text-gray-900">{question.upvotes || 0}</span>
          <span className="text-gray-500 text-xs">votes</span>
          <span className={`font-semibold ${question.answerCount > 0 ? 'text-green-600' : 'text-gray-500'}`}>
            {question.answerCount || 0}
          </span>
          <span className="text-gray-500 text-xs">answers</span>
          <span className="text-gray-400 text-xs">{question.viewCount || 0} views</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            <Link href={`/questions/${question._id}`} className="hover:text-primary-600 transition-colors">
              {question.title}
            </Link>
          </h2>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {truncate(question.body, 200)}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {question.tagNames?.slice(0, 5).map(tag => (
              <Link
                key={tag}
                href={`/tags/${tag}`}
                className="badge-primary text-xs hover:bg-primary-200 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <Link href={`/users/${question.author?.username}`} className="flex items-center gap-1 hover:text-primary-600">
              {question.author?.avatar ? (
                <img src={question.author.avatar} alt="" className="w-4 h-4 rounded-full" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[10px] font-medium">
                  {(question.author?.displayName || question.author?.username || '?')[0]}
                </span>
              )}
              <span>{question.author?.displayName || question.author?.username}</span>
            </Link>
            <span>asked {formatDate(question.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
