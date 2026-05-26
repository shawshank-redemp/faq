import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold text-primary-600 mb-2">QuoraFAQ</h3>
            <p className="text-sm text-gray-500">A community-driven Q&A and FAQ platform for knowledge sharing.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h4>
            <div className="space-y-2">
              <Link href="/questions" className="block text-sm text-gray-500 hover:text-gray-700">Questions</Link>
              <Link href="/faqs" className="block text-sm text-gray-500 hover:text-gray-700">FAQs</Link>
              <Link href="/tags" className="block text-sm text-gray-500 hover:text-gray-700">Tags</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Community</h4>
            <div className="space-y-2">
              <Link href="/questions/ask" className="block text-sm text-gray-500 hover:text-gray-700">Ask a Question</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} QuoraFAQ. Open source project.
        </div>
      </div>
    </footer>
  );
}
