# 🎤 VoiceBot Starter

A complete starter project for building an AI voice assistant using **Next.js + OpenAI**.

Talk to AI using your voice — it listens, thinks, and speaks back.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Frontend)                    │
│                                                          │
│   🎤 Mic Button ──► MediaRecorder API ──► Audio Blob    │
│                                                          │
│   🔊 Audio Player ◄── plays mp3 audio response          │
└────────────┬──────────────────────────────┬──────────────┘
             │                              ▲
             ▼                              │
┌─────────────────────────────────────────────────────────┐
│                  NEXT.JS API ROUTES (Backend)            │
│                                                          │
│   STEP 1: /api/speech-to-text     (👂 Ears)             │
│           Audio blob → OpenAI Whisper → Text             │
│                          │                               │
│   STEP 2: /api/chat              (🧠 Brain)             │
│           Text → OpenAI GPT-4o-mini → Response text      │
│                          │                               │
│   STEP 3: /api/text-to-speech    (🗣️ Mouth)            │
│           Response text → OpenAI TTS → Audio mp3         │
└──────────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────┐
│                   OPENAI API (Cloud)                      │
│                                                           │
│   Whisper API ─── GPT-4o-mini ─── TTS API                │
│   (speech→text)   (text→text)     (text→speech)          │
└──────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | What It Does |
|-------|-----------|--------------|
| **Framework** | Next.js 14 | Full-stack React — frontend + API in one project |
| **Styling** | Tailwind CSS | Utility-first CSS for the UI |
| **Ears** | OpenAI Whisper API | Converts voice → text |
| **Brain** | OpenAI GPT-4o-mini | Generates AI responses |
| **Mouth** | OpenAI TTS API | Converts text → spoken audio |
| **Runtime** | Node.js | Runs the server |

---

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url> voicebot
cd voicebot
npm install
```

### 2. Add Your API Key

```bash
cp .env.example .env.local
# Edit .env.local and add your OpenAI key:
# OPENAI_API_KEY=sk-your-key-here
```

Get a key at: https://platform.openai.com/api-keys

### 3. Run

```bash
npm run dev
```

Open http://localhost:3000 — tap the mic and start talking!

---

## Project Structure

```
voicebot-starter/
├── app/
│   ├── layout.js                  # Root layout + fonts
│   ├── page.js                    # Main page
│   ├── globals.css                # Tailwind + custom CSS
│   └── api/
│       ├── speech-to-text/
│       │   └── route.js           # 👂 Whisper API
│       ├── chat/
│       │   └── route.js           # 🧠 GPT-4o-mini
│       └── text-to-speech/
│           └── route.js           # 🗣️ TTS API
├── components/
│   └── VoiceBot.js                # Main voice bot UI
├── .env.example                   # Environment template
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
└── README.md
```

---

## Customization

### Change the Bot's Personality

Edit the `SYSTEM_PROMPT` in `app/api/chat/route.js`:

```javascript
const SYSTEM_PROMPT = `
You are Captain Jack, a pirate AI assistant.
You speak like a pirate and end every response with "Arrr!"
Keep responses under 3 sentences.
`;
```

### Change the Voice

Edit `TTS_VOICE` in `.env.local`:

```
TTS_VOICE=onyx
```

Available voices:
- `alloy` — neutral, balanced
- `echo` — warm, conversational
- `fable` — storyteller, expressive
- `onyx` — deep, authoritative
- `nova` — friendly, bright (default)
- `shimmer` — soft, gentle

### Change the Language

Edit `language` in `app/api/speech-to-text/route.js`:

```javascript
language: 'ta',  // Tamil
language: 'hi',  // Hindi
language: 'es',  // Spanish
language: 'fr',  // French
```

Whisper supports 50+ languages.

---

## How It Works (Step by Step)

### 1. User taps mic → Browser records audio
```
Browser MediaRecorder API → audio/webm blob
```

### 2. Audio sent to Whisper → Returns text
```
POST /api/speech-to-text
Body: FormData with audio file
Response: { text: "What's the weather like?" }
```

### 3. Text sent to GPT-4o-mini → Returns response
```
POST /api/chat
Body: { message: "What's the weather...", history: [...] }
Response: { reply: "I don't have real-time weather data..." }
```

### 4. Response sent to TTS → Returns audio
```
POST /api/text-to-speech
Body: { text: "I don't have real-time..." }
Response: audio/mpeg binary
```

### 5. Browser plays the audio
```
new Audio(audioUrl).play()
```

---

## API Costs (Approximate)

| API | Cost | Per Conversation Turn |
|-----|------|----------------------|
| Whisper | $0.006/min | ~$0.001 (10 sec recording) |
| GPT-4o-mini | $0.15/1M input tokens | ~$0.0001 |
| TTS | $0.015/1K chars | ~$0.002 (150 chars) |
| **Total** | | **~$0.003 per turn** |

A typical conversation of 10 turns costs about 3 cents.

---

## Extending the Project

### Add Web Search (so the bot knows current info)
See the `chatbot_websearch.py` or `chatbot_tavily.py` patterns —
add a Tavily search step before the GPT call.

### Add Character Selection
Create multiple system prompts and let users pick:
- A teacher who explains simply
- A comedian who makes everything funny
- A policy expert who cites sources

### Add Conversation Memory
The `history` state already maintains conversation context.
To persist across sessions, save to localStorage or a database.

### Deploy
```bash
# Vercel (recommended for Next.js)
npx vercel

# Or build for production
npm run build
npm start
```

---

## Troubleshooting

**"Microphone access denied"**
→ Click the lock icon in your browser's address bar → Allow microphone

**"Failed to transcribe audio"**
→ Check your OPENAI_API_KEY in .env.local
→ Make sure you have credits on your OpenAI account

**Audio doesn't play**
→ Some browsers block autoplay. Click the mic button to interact first.
→ Check browser console for errors

**Slow responses**
→ The pipeline has 3 API calls. Each takes 0.5-2 seconds.
→ Total round-trip: 2-5 seconds is normal.
→ Use `tts-1` (not `tts-1-hd`) for faster speech generation.

---

Built for the C40 AI Accelerator Bootcamp
