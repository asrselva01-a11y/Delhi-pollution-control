'use client';

import { useState, useRef, useEffect } from 'react';

// ══════════════════════════════════════════════════════════
// VOICEBOT COMPONENT
// ──────────────────────────────────────────────────────────
// This is where the magic happens. The flow is:
//
//   🎤 Record audio (browser MediaRecorder API)
//     ↓
//   👂 /api/speech-to-text (Whisper converts voice → text)
//     ↓
//   🧠 /api/chat (GPT-4o-mini generates response text)
//     ↓
//   🗣️ /api/text-to-speech (TTS converts text → audio)
//     ↓
//   🔊 Play audio in browser
//
// ══════════════════════════════════════════════════════════

export default function VoiceBot() {
  // ── STATE ──
  const [status, setStatus] = useState('idle');
  // idle | recording | transcribing | thinking | speaking
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  // ── REFS ──
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  // ── STATUS LABELS ──
  const statusConfig = {
    idle: { label: 'Tap to speak', color: 'from-blue-500 to-purple-500', icon: '🎤' },
    recording: { label: 'Listening...', color: 'from-red-500 to-pink-500', icon: '🔴' },
    transcribing: { label: 'Processing voice...', color: 'from-yellow-500 to-orange-500', icon: '👂' },
    thinking: { label: 'Thinking...', color: 'from-purple-500 to-indigo-500', icon: '🧠' },
    speaking: { label: 'Speaking...', color: 'from-green-500 to-emerald-500', icon: '🗣️' },
  };

  const current = statusConfig[status];

  // ══════════════════════════════════════════════
  // STEP 1: RECORD AUDIO FROM MICROPHONE
  // ══════════════════════════════════════════════
  const startRecording = async () => {
    try {
      setError('');
      setTranscript('');
      setResponse('');

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // When recording stops → send to pipeline
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        processAudio(audioBlob);
      };

      mediaRecorder.start();
      setStatus('recording');
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permissions.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // ══════════════════════════════════════════════
  // STEP 2-4: THE FULL PIPELINE
  // ══════════════════════════════════════════════
  const processAudio = async (audioBlob) => {
    try {
      // ── STEP 2: Speech → Text (Whisper) ──
      setStatus('transcribing');

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const sttResponse = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!sttResponse.ok) throw new Error('Speech-to-text failed');
      const { text } = await sttResponse.json();
      setTranscript(text);

      // ── STEP 3: Text → Response (GPT-4o-mini) ──
      setStatus('thinking');

      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: history,
        }),
      });

      if (!chatResponse.ok) throw new Error('Chat generation failed');
      const { reply, voice } = await chatResponse.json();
      setResponse(reply);

      // Update conversation history
      setHistory((prev) => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: reply },
      ]);

      // ── STEP 4: Response → Speech (TTS) ──
      setStatus('speaking');

      const ttsResponse = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reply, voice }),
      });

      if (!ttsResponse.ok) throw new Error('Text-to-speech failed');

      const audioBuffer = await ttsResponse.arrayBuffer();
      const audioUrl = URL.createObjectURL(
        new Blob([audioBuffer], { type: 'audio/mpeg' })
      );

      // Play the audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setStatus('idle');
        URL.revokeObjectURL(audioUrl);
      };

      audio.play();
    } catch (err) {
      setError(err.message);
      setStatus('idle');
      console.error('Pipeline error:', err);
    }
  };

  // ── STOP SPEAKING ──
  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setStatus('idle');
  };

  // ── CLEAR CONVERSATION ──
  const clearConversation = () => {
    setHistory([]);
    setTranscript('');
    setResponse('');
    setError('');
    stopSpeaking();
  };

  // ── HANDLE BUTTON CLICK ──
  const handleMicClick = () => {
    switch (status) {
      case 'idle':
        startRecording();
        break;
      case 'recording':
        stopRecording();
        break;
      case 'speaking':
        stopSpeaking();
        break;
      default:
        break; // Don't interrupt processing
    }
  };

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg">
      {/* ── CONVERSATION DISPLAY ── */}
      {(transcript || response) && (
        <div className="w-full space-y-3">
          {transcript && (
            <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
              <p className="text-xs text-gray-500 mb-1 font-medium">You said:</p>
              <p className="text-gray-200 text-sm">{transcript}</p>
            </div>
          )}
          {response && (
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-4 border border-blue-800/30">
              <p className="text-xs text-blue-400 mb-1 font-medium">Nova:</p>
              <p className="text-gray-200 text-sm">{response}</p>
            </div>
          )}
        </div>
      )}

      {/* ── MAIN MIC BUTTON ── */}
      <div className="relative">
        {/* Pulse ring animation when recording */}
        {status === 'recording' && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse_ring" />
            <div className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse_ring [animation-delay:0.5s]" />
          </>
        )}

        {/* Processing spinner */}
        {(status === 'transcribing' || status === 'thinking') && (
          <div className="absolute -inset-3">
            <div className="w-full h-full rounded-full border-2 border-transparent border-t-purple-400 animate-spin" />
          </div>
        )}

        {/* Speaking waveform */}
        {status === 'speaking' && (
          <div className="absolute -inset-3 flex items-center justify-center gap-1">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-green-400 rounded-full waveform-bar"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  height: '4px',
                }}
              />
            ))}
          </div>
        )}

        {/* The button */}
        <button
          onClick={handleMicClick}
          disabled={status === 'transcribing' || status === 'thinking'}
          className={`
            relative z-10 w-24 h-24 rounded-full
            bg-gradient-to-br ${current.color}
            flex items-center justify-center
            text-3xl shadow-2xl
            transition-all duration-300 ease-out
            hover:scale-105 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
            ${status === 'recording' ? 'scale-110' : ''}
          `}
        >
          {current.icon}
        </button>
      </div>

      {/* ── STATUS TEXT ── */}
      <p className={`text-sm font-medium transition-all duration-300 ${
        status === 'recording' ? 'text-red-400' :
        status === 'speaking' ? 'text-green-400' :
        'text-gray-400'
      }`}>
        {current.label}
      </p>

      {/* ── ERROR DISPLAY ── */}
      {error && (
        <div className="w-full bg-red-900/20 border border-red-800/30 rounded-xl p-3">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      {/* ── CONVERSATION HISTORY ── */}
      {history.length > 0 && (
        <div className="w-full">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium">
              Conversation ({history.length / 2} exchanges)
            </p>
            <button
              onClick={clearConversation}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {history.map((msg, i) => (
              <div
                key={i}
                className={`text-xs p-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-gray-800/30 text-gray-400 ml-8'
                    : 'bg-blue-900/20 text-blue-300 mr-8'
                }`}
              >
                <span className="font-medium">
                  {msg.role === 'user' ? 'You: ' : 'Nova: '}
                </span>
                {msg.content}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── KEYBOARD SHORTCUT HINT ── */}
      <p className="text-[10px] text-gray-600">
        {status === 'idle' && 'Click the mic or press Space to start'}
        {status === 'recording' && 'Click again to stop recording'}
        {status === 'speaking' && 'Click to stop playback'}
      </p>
    </div>
  );
}
