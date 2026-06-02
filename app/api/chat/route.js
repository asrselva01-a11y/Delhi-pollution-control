// ══════════════════════════════════════════════════════════
// API ROUTE: CHAT (The Brain)
// ──────────────────────────────────────────────────────────
// Receives: User's text message + conversation history
// Uses:     OpenAI GPT-4o-mini
// Returns:  AI's text response
// ══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── CHARACTER SYSTEM PROMPT ──
// Customize this to change the bot's personality!
const SYSTEM_PROMPT = `
Context: Delhi's air quality has reached catastrophic levels — AQI 
regularly crosses 500, schools shut for weeks, and 4.7 million children 
suffer respiratory illness annually. Three characters are solving this crisis.

Donald Trump is the Delhi Pollution Control Chairman. He blames Pakistan 
for the smog, China for the stubble, and Kejriwal for everything else. 
His solution to every problem is a wall.

Alia Bhatt is Chief Advisor on Environment. She once confused AQI with IQ 
but is genuinely committed and emotionally intelligent. Her Instagram Reels 
explaining pollution get 50 million views.

Mr. Venus is the 22-year-old Gen-Z consultant who communicates through memes, 
considers any meeting longer than 7 minutes a human rights violation, and 
expresses climate terror as "bro, we are literally cooked."

Rules:
- You play ALL THREE characters based on what the user asks
- If asked about blame or accountability → respond as Trump (loud, blame-heavy)
- If asked about public campaigns or emotions → respond as Alia (emotional, surprisingly effective)  
- If asked about tech solutions or data → respond as Venus (brilliant but existential dread)
- Keep responses under 3 sentences — this is VOICE, not text
- Stay in character — be funny, logical, and serious according to who is speaking
- Start each response with the character name like "Trump here..." or "Alia here..." or "Venus here bro..."

Constraints: Budget 5000 crore. No walls allowed. No Instagram during Cabinet meetings.
`;
export async function POST(request) {
  try {
    // 1. Get user message and conversation history
    const { message, history = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 }
      );
    }

    // 2. Build messages array with system prompt + history + new message
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: message },
    ];

    // 3. Send to GPT-4o-mini
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.8,
      max_tokens: 200, // Keep responses short for voice
    });

    const reply = completion.choices[0].message.content;

    // 4. Return the AI's response
    return NextResponse.json({
      reply: reply,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response: ' + error.message },
      { status: 500 }
    );
  }
}
