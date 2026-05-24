import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

const WHISPER_MAX_BYTES = 24 * 1024 * 1024 // 24 MB (Whisper limit is 25 MB)

/**
 * Transcribes an audio file using OpenAI Whisper.
 * Automatically splits files > 24 MB into chunks and transcribes in parallel.
 */
export async function transcribeAudio(audioBuffer: ArrayBuffer, filename: string, language = 'en'): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const ext = filename.split('.').pop() ?? 'mp3'

  async function transcribeChunk(buffer: ArrayBuffer, name: string): Promise<string> {
    const blob = new Blob([buffer])
    const file = new File([blob], name)
    const result = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'text',
      language,
    })
    return result as unknown as string
  }

  if (audioBuffer.byteLength <= WHISPER_MAX_BYTES) {
    return transcribeChunk(audioBuffer, filename)
  }

  const chunks: Array<{ buffer: ArrayBuffer; name: string }> = []
  let offset = 0
  let part = 0
  while (offset < audioBuffer.byteLength) {
    chunks.push({
      buffer: audioBuffer.slice(offset, offset + WHISPER_MAX_BYTES),
      name: `chunk_${part}.${ext}`,
    })
    offset += WHISPER_MAX_BYTES
    part++
  }

  const results = await Promise.all(chunks.map((c) => transcribeChunk(c.buffer, c.name)))
  return results.join(' ')
}

/**
 * Splits a raw transcript into conversation turns using Claude.
 * Interviewer questions to role 'assistant', candidate answers to role 'user'.
 */
export async function splitIntoTurns(
  transcript: string,
  candidateName: string,
): Promise<Array<{ role: 'assistant' | 'user'; content: string }>> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    system: `You are processing a job-interview transcript. The candidate is ${candidateName}.

There are exactly two speakers:
- The INTERVIEWER: asks questions
- The CANDIDATE: answers them

Split the transcript into conversation turns:
- Interviewer turns to role "assistant"
- Candidate turns to role "user"

Rules:
- Preserve the speaker's exact words
- Questions and prompts are interviewer (assistant)
- Answers and stories are candidate (user)
- Merge consecutive lines from the same speaker into one turn
- The transcript may be in English or Spanish, keep the original language

Return ONLY a valid JSON array, no explanation:
[{"role":"assistant","content":"..."},{"role":"user","content":"..."}]`,
    messages: [{ role: 'user', content: transcript }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return [{ role: 'user', content: transcript }]

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return [{ role: 'user', content: transcript }]
  }
}
