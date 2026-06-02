// ══════════════════════════════════════════════════════════
// API ROUTE: SPEECH-TO-TEXT (The Ears)
// ──────────────────────────────────────────────────────────
// Receives: Audio blob from browser microphone
// Uses:     OpenAI Whisper API
// Returns:  Transcribed text
// ══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  try {
    // 1. Get the audio file from the request
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // 2. Send audio to Whisper API for transcription
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile,
      language: 'en', // Change to 'ta' for Tamil, 'hi' for Hindi, etc.
    });

    // 3. Return the transcribed text
    return NextResponse.json({
      text: transcription.text,
    });
  } catch (error) {
    console.error('Speech-to-text error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio: ' + error.message },
      { status: 500 }
    );
  }
}
