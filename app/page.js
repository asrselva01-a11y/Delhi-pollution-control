'use client';
import VoiceBot from '../components/VoiceBot';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          VoiceBot
        </h1>
        <p className="text-gray-400 mt-2 text-sm">
          Tap the mic, speak, and listen to the AI respond
        </p>
      </div>

      {/* Voice Bot Component */}
      <VoiceBot />

      {/* Footer */}
      <div className="mt-12 text-center text-xs text-gray-600">
        <p>Built with Next.js • OpenAI Whisper • GPT-4o-mini • TTS</p>
        <p className="mt-1">Press &amp; hold the mic button to record</p>
      </div>
    </main>
  );
}
