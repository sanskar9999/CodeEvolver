import { Groq } from "groq-sdk";
import { systemPrompt, fullCodingPrompt } from '../dist/defaults.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const client = new Groq();
    const { prompt } = req.body;

    try {
      const completion = await client.chat.completions.create({
        model: "llama-3.1-70b-versatile",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: fullCodingPrompt + "\n" + prompt
          }
        ],
        temperature: 1,
        max_tokens: 8000,
        top_p: 1,
        stream: false,
        stop: null
      });

      res.status(200).json({ content: completion.choices[0].message.content || '' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}