import Link from 'next/link';

export default function Pagination({ pagination, basePath, queryParams = {} }) {
  if (!pagination || pagination.pages <= 1) return null;

  const buildUrl = (page) => {
    const params = new URLSearchParams({ ...queryParams, page: String(page) });
    return `${basePath}?${params}`;
  };

  const { page, pages } = pagination;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {page > 1 && (
        <Link href={buildUrl(page - 1)} className="btn-secondary btn-sm">
          Previous
        </Link>
      )}
      {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
        let p;
        if (pages <= 7) {
          p = i + 1;
        } else if (page <= 4) {
          p = i + 1;
        } else if (page >= pages - 3) {
          p = pages - 6 + i;
        } else {
          p = page - 3 + i;
        }
        return (
          <Link
            key={p}
            href={buildUrl(p)}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              p === page
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {p}
          </Link>
        );
      })}
      {page < pages && (
        <Link href={buildUrl(page + 1)} className="btn-secondary btn-sm">
          Next
        </Link>
      )}
    </div>
  );
}
