import Anthropic from '@anthropic-ai/sdk'

export async function getAIResponse(
  messages: Array<{ role: 'assistant' | 'user'; content: string }>,
  systemPrompt: string,
  maxTokens: number = 700,
): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Anthropic requires at least one user message, seed with "Hi" if opening
  const apiMessages = messages.length > 0 ? messages : [{ role: 'user' as const, content: 'Hi' }]

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: apiMessages,
  })

  const block = response.content[0]
  const reply = block.type === 'text' ? block.text : ''
  return reply.trim()
}
