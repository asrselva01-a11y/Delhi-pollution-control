// ══════════════════════════════════════════════════════════
// API ROUTE: TEXT-TO-SPEECH (The Mouth)
// ──────────────────────────────────────────────────────────
// Receives: Text to speak
// Uses:     OpenAI TTS API
// Returns:  Audio file (mp3)
// ══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  try {
    // 1. Get the text to convert to speech
    const { text, voice } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // 2. Generate speech using OpenAI TTS
    //    Voices: alloy, echo, fable, onyx, nova, shimmer
    //    Models: tts-1 (fast), tts-1-hd (high quality)
    const speechResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice || process.env.TTS_VOICE || 'nova',
      input: text,
      speed: 1.0, // 0.25 to 4.0
    });

    // 3. Convert to buffer and return as audio
    const buffer = Buffer.from(await speechResponse.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech: ' + error.message },
      { status: 500 }
    );
  }
}
