import fs from 'fs';
let code = fs.readFileSync('server/routes.ts', 'utf8');

const newRoute = `
router.post('/projects/:id/search-strings', async (req, res) => {
  const project = await db.select().from(projects).where(eq(projects.id, req.params.id)).get();
  if (!project) return res.status(404).json({ error: 'Not found' });

  try {
    const prompt = \`
You are an expert academic research assistant. Based on the selected taxonomy keywords, generate database search strings.
Title: "\${project.title}"
Taxonomy: \${JSON.stringify(project.taxonomy)}

Provide a JSON object with:
- "scopus": string (The exact boolean search string for Scopus, e.g. TITLE-ABS-KEY(...))
- "wos": string (The exact boolean search string for Web of Science, e.g. TS=(...))
- "scholar": string (A simplified search string for Google Scholar)
- "aiSuggestion": string (A brief explanation of why these keywords were chosen, risks of over/under-retrieval)
- "alternativeTitles": array of 3 strings (Suggest 3 improved, academic paper titles based on the original title)
\`;

    const aiRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const result = JSON.parse(aiRes.text());
    
    await db.update(projects)
      .set({ searchStrings: result, updatedAt: new Date() })
      .where(eq(projects.id, req.params.id));
      
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
`;

code = code.replace("const router = express.Router();", "const router = express.Router();\n" + newRoute);
fs.writeFileSync('server/routes.ts', code);
