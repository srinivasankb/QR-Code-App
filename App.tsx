import React from 'react';
import { QRCodeEditor } from './components/QRCodeEditor';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your QR Code</h1>
            <p className="text-gray-500 text-sm md:text-base max-w-2xl">
              Generate customizable, private, and offline-capable QR codes directly in your browser.
            </p>
        </div>

        <QRCodeEditor />
      </main>

      <footer className="w-full py-8 text-center text-gray-400 text-sm border-t border-gray-200 bg-white">
        <p className="mb-2">© {new Date().getFullYear()} QuickQR. Offline capable.</p>
        <p>
          Created by <a href="https://srinivasan.online/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black hover:underline transition-colors">Srinivasan KB</a>
        </p>
      </footer>
    </div>
  );
};

export default App;