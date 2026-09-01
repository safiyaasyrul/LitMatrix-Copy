import fs from 'fs';
let code = fs.readFileSync('server/routes.ts', 'utf8');

const newRoute = `
router.post('/projects/:id/taxonomy', async (req, res) => {
  const project = await db.select().from(projects).where(eq(projects.id, req.params.id)).get();
  if (!project) return res.status(404).json({ error: 'Project not found' });

  try {
    const prompt = `
You are an expert academic research assistant. Based on the following topic decomposition, suggest a structured taxonomy and keywords for a systematic literature review database search.
Title: "${project.title}"
Decomposition: ${JSON.stringify(project.topicDecomposition ?? {})}
Provide a JSON object with a single key "categories" which is an array of objects.
Each object must have:
- "category" (e.g. "Maritime Transport")
- "content" (a short description or primary term, e.g. "Vessel")
- "keywords" (a string of boolean OR keywords, e.g. "\"ship\" OR \"vessel\" OR \"maritime\"")
- "selected" (boolean, true by default)
`;
    const aiRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    let result;
    try {
      result = JSON.parse(aiRes.text);
    } catch (parseErr) {
      console.error('Taxonomy JSON parse failed:', aiRes.text);
      return res.status(502).json({ error: 'AI returned invalid JSON for taxonomy generation.' });
    }

    if (!result || !Array.isArray(result.categories)) {
      return res.status(502).json({ error: 'AI response missing "categories" array.' });
    }

    await db.update(projects)
      .set({ taxonomy: result, updatedAt: new Date() })
      .where(eq(projects.id, req.params.id));

    res.json(result);
  } catch (error: any) {
    console.error('Taxonomy generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate taxonomy.' });
  }
});
`;

code = code.replace("const router = express.Router();", "const router = express.Router();\n" + newRoute);
fs.writeFileSync('server/routes.ts', code);
