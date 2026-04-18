const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function callGemini(prompt, apiKey) {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 1500,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Groq API error");
  return data.choices[0].message.content;
}
// Route 1: Smart Summary
app.post("/api/summarize", async (req, res) => {
  const { notes, apiKey } = req.body;
  if (!notes || !apiKey)
    return res.status(400).json({ error: "Missing notes or apiKey" });

  const prompt = `You are an expert meeting analyst. Analyze the following raw meeting/lecture notes and return a JSON response with this exact structure:
{
  "title": "A concise meeting title (max 8 words)",
  "date_context": "Any date/time context found, or 'Not specified'",
  "summary": "2-3 sentence executive summary of what was discussed",
  "key_decisions": ["decision 1", "decision 2", "decision 3"],
  "topics_covered": ["topic 1", "topic 2", "topic 3"]
}

Raw Notes:
${notes}

Return ONLY valid JSON, no markdown, no explanation.`;

  try {
    const text = await callGemini(prompt, apiKey);
    const clean = text
      .replace(/```json|```/g, "")
      .replace(/[\x00-\x1F\x7F]/g, " ")
      .trim();
    const result = JSON.parse(clean);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Route 2: Action Items
app.post("/api/actions", async (req, res) => {
  const { notes, apiKey } = req.body;
  if (!notes || !apiKey)
    return res.status(400).json({ error: "Missing notes or apiKey" });

  const prompt = `You are an expert at extracting action items from meeting notes. Analyze the following notes and return a JSON array of action items with this exact structure:
{
  "action_items": [
    {
      "task": "Clear description of what needs to be done",
      "owner": "Person responsible (or 'Unassigned' if not mentioned)",
      "deadline": "Deadline if mentioned (or 'No deadline set')",
      "priority": "High/Medium/Low"
    }
  ]
}

Raw Notes:
${notes}

Return ONLY valid JSON, no markdown, no explanation.`;

  try {
    const text = await callGemini(prompt, apiKey);
    const clean = text
      .replace(/```json|```/g, "")
      .replace(/[\x00-\x1F\x7F]/g, " ")
      .trim();
    const result = JSON.parse(clean);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Route 3: Follow-up Email
app.post("/api/email", async (req, res) => {
  const { notes, summary, actionItems, apiKey } = req.body;
  if (!notes || !apiKey)
    return res.status(400).json({ error: "Missing notes or apiKey" });

  const context = summary
    ? `Summary: ${summary.summary}\nKey Decisions: ${summary.key_decisions?.join(", ")}\nAction Items: ${actionItems?.action_items?.map((a) => a.task).join(", ")}`
    : notes;

  const prompt = `You are a professional email writer. Based on the following meeting context, write a clear, professional follow-up email. Return JSON with this exact structure:
{
  "subject": "Email subject line",
  "greeting": "Dear Team,",
  "body": "Full email body with proper paragraphs.",
  "closing": "Best regards,\\n[Your Name]"
}

Meeting Context:
${context}

Return ONLY valid JSON, no markdown, no explanation.`;

  try {
    const text = await callGemini(prompt, apiKey);
    const clean = text
      .replace(/```json|```/g, "")
      .replace(/[\x00-\x1F\x7F]/g, " ")
      .trim();
    const result = JSON.parse(clean);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
