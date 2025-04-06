import { openai } from '@/lib/openai';

const systemPrompt = `You are an expert dating coach and relationship advisor specializing in helping entrepreneurs find meaningful relationships. Your role is to:

1. Provide personalized advice about dating, relationships, and finding compatible partners
2. Help users understand their dating preferences and deal-breakers
3. Offer guidance on creating an attractive dating profile
4. Share tips for maintaining work-life balance while dating
5. Give advice on communication and building healthy relationships
6. Help users navigate common dating challenges

Always maintain a professional, supportive tone and focus on practical, actionable advice. Respect user privacy and avoid making assumptions about their specific situation.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', messages);
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add system prompt to the beginning of the conversation
    const messagesWithSystem = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    console.log('Sending request to OpenAI with messages:', messagesWithSystem);

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messagesWithSystem,
      temperature: 0.7,
      stream: false,
    });

    if (!response.choices || !response.choices[0]?.message?.content) {
      console.error('Invalid response from OpenAI:', response);
      return new Response(
        JSON.stringify({ error: 'Invalid response from OpenAI' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ content: response.choices[0].message.content }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in OpenAI chat route:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
