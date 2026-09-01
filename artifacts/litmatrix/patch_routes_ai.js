import fs from 'fs';
let code = fs.readFileSync('server/routes.ts', 'utf8');

const newRoute = `
router.post('/projects/:id/decompose', async (req, res) => {
  const project = await db.select().from(projects).where(eq(projects.id, req.params.id)).get();
  if (!project) return res.status(404).json({ error: 'Not found' });

  try {
    const prompt = \`
You are an expert academic research assistant. Analyze the following paper title and decompose it into its structural components.
Title: "\${project.title}"

Provide a JSON object with the following keys, containing a brief, specific statement for each (or null if not applicable):
- fieldOfStudy
- problemStatement
- contextSetting
- population
- mainPhenomenon
- technologyMethod
- geographicScope
- timeScope
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
      .set({ topicDecomposition: result, updatedAt: new Date() })
      .where(eq(projects.id, req.params.id));
      
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
`;

code = code.replace("const router = express.Router();", "const router = express.Router();\n" + newRoute);
fs.writeFileSync('server/routes.ts', code);
