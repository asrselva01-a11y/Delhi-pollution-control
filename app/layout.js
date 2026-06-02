import './globals.css';

export const metadata = {
  title: 'VoiceBot — AI Voice Assistant',
  description: 'Talk to AI using your voice. Built with Next.js + OpenAI.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-950 text-white min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
