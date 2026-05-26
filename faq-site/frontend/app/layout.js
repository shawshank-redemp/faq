import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'QuoraFAQ - Community Q&A and FAQ Platform',
  description: 'A community-driven Q&A and FAQ platform for knowledge sharing',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <SocketProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
