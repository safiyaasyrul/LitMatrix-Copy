import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../src/db/index';
import { projects, papers } from '../src/db/schema';
import { parseRIS } from '../src/lib/risParser';
import fs from 'fs';
import { eq } from 'drizzle-orm';
import { ai } from './ai';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.get('/projects/:id/stats', async (req, res) => {
  const projectId = req.params.id;
  const projectPapers = await db.select().from(papers).where(eq(papers.projectId, projectId));
  
  const total = projectPapers.length;
  const duplicates = projectPapers.filter(p => p.duplicateStatus === 'duplicate').length;
  const unique = total - duplicates;
  
  const scopus = projectPapers.filter(p => p.sources?.includes('Scopus') || p.sources?.includes('Unknown')).length;
  const wos = projectPapers.filter(p => p.sources?.includes('Web of Science')).length;
  
  res.json({ total, duplicates, unique, sources: { scopus, wos, other: 0 } });
});


router.post('/projects/:id/search-strings', async (req, res) => {
  const project = await db.select().from(projects).where(eq(projects.id, req.params.id)).get();
  if (!project) return res.status(404).json({ error: 'Not found' });

  try {
    const prompt = `
You are an expert academic research assistant. Based on the selected taxonomy keywords, generate database search strings.
Title: "${project.title}"
Taxonomy: ${JSON.stringify(project.taxonomy)}

Provide a JSON object with:
- "scopus": string (The exact boolean search string for Scopus, e.g. TITLE-ABS-KEY(...))
- "wos": string (The exact boolean search string for Web of Science, e.g. TS=(...))
- "scholar": string (A simplified search string for Google Scholar)
- "aiSuggestion": string (A brief explanation of why these keywords were chosen, risks of over/under-retrieval)
- "alternativeTitles": array of 3 strings (Suggest 3 improved, academic paper titles based on the original title)
`;

    if (!ai) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });

    const aiRes = await ai.models.generateContent({
      model: 'gemini-pro-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const result = JSON.parse(aiRes.text);
    
    await db.update(projects)
      .set({ searchStrings: result, updatedAt: new Date() })
      .where(eq(projects.id, req.params.id));
      
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/projects/:id/taxonomy', async (req, res) => {
  const project = await db.select().from(projects).where(eq(projects.id, req.params.id)).get();
  if (!project) return res.status(404).json({ error: 'Not found' });

  try {
    const prompt = `
You are an expert academic research assistant. Based on the following topic decomposition, suggest a structured taxonomy and keywords for a systematic literature review database search.
Title: "${project.title}"
Decomposition: ${JSON.stringify(project.topicDecomposition)}

Provide a JSON object with a single key "categories" which is an array of objects.
Each object must have:
- "category" (e.g. "Maritime Transport")
- "content" (a short description or primary term, e.g. "Vessel")
- "keywords" (a string of boolean OR keywords with synonyms, e.g. "(\"ship\" OR \"vessel\" OR \"maritime\")")
- "selected" (boolean, true by default)

IMPORTANT: You MUST provide an extensive list of synonyms in the "keywords" field for EVERY category. Do NOT leave it empty.
`;

    if (!ai) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });

    const aiRes = await ai.models.generateContent({
      model: 'gemini-pro-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const rawText = aiRes.text;
    console.log('AI Response (Taxonomy):', rawText);

    let result;
    try {
      // Strip markdown if present
      const jsonString = rawText.replace(/```json\n?/, '').replace(/\n?```$/, '').trim();
      result = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse JSON (Taxonomy):', rawText);
      // Fallback: try to extract JSON from raw text
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }
    
    await db.update(projects)
      .set({ taxonomy: result, updatedAt: new Date() })
      .where(eq(projects.id, req.params.id));
      
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/projects/:id/decompose', async (req, res) => {
  const project = await db.select().from(projects).where(eq(projects.id, req.params.id)).get();
  if (!project) return res.status(404).json({ error: 'Not found' });

  try {
    const prompt = `
You are an expert academic research assistant. Analyze the following paper title and decompose it into its structural components.
Title: "${project.title}"

Provide a JSON object with the following keys, containing a brief, specific statement for each (or null if not applicable):
- fieldOfStudy
- problemStatement
- contextSetting
- population
- mainPhenomenon
- technologyMethod
- geographicScope
- timeScope

Return ONLY the raw JSON object, no Markdown or other text.
`;

    if (!ai) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });

    const aiRes = await ai.models.generateContent({
      model: 'gemini-pro-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const rawText = aiRes.text;
    console.log('AI Response (Decompose):', rawText);

    let result;
    try {
      // Strip markdown if present
      const jsonString = rawText.replace(/```json\n?/, '').replace(/\n?```$/, '').trim();
      result = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse JSON (Decompose):', rawText);
      // Fallback: try to extract JSON from raw text
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }
    
    await db.update(projects)
      .set({ topicDecomposition: result, updatedAt: new Date() })
      .where(eq(projects.id, req.params.id));
      
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});




// Normalize text for title matching
function normalizeText(text: string) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDoi(doi: string) {
  return doi.toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '').trim();
}

import stringSimilarity from 'string-similarity';

router.post('/projects/:id/deduplicate', async (req, res) => {
  const projectId = req.params.id;
  const projectPapers = await db.select().from(papers).where(eq(papers.projectId, projectId));
  
  let duplicateCount = 0;
  const duplicateGroups = [];
  
  const doiMap = new Map();
  const titleMap = new Map();
  const processed = new Set();
  
  // O(N) deduplication
  for (const p of projectPapers) {
    if (processed.has(p.id)) continue;
    
    let isDuplicate = false;
    let masterId = null;
    let reason = '';
    let confidence = 0;
    
    if (p.doi && doiMap.has(p.doi)) {
      isDuplicate = true;
      masterId = doiMap.get(p.doi);
      reason = 'Same DOI';
      confidence = 100;
    } else if (p.normalizedTitle && titleMap.has(p.normalizedTitle)) {
      isDuplicate = true;
      masterId = titleMap.get(p.normalizedTitle);
      reason = 'Exact title match';
      confidence = 98;
    }
    
    if (isDuplicate && masterId) {
      processed.add(p.id);
      duplicateCount++;
      await db.update(papers)
        .set({ duplicateStatus: 'duplicate', masterPaperId: masterId })
        .where(eq(papers.id, p.id));
    } else {
      if (p.doi) doiMap.set(p.doi, p.id);
      if (p.normalizedTitle) titleMap.set(p.normalizedTitle, p.id);
      await db.update(papers)
        .set({ duplicateStatus: 'unique' })
        .where(eq(papers.id, p.id));
    }
  }
  
  res.json({ duplicateCount, duplicateGroups: 0 });
});

import { isNull, and, notInArray } from 'drizzle-orm';
import { screenings } from '../src/db/schema';

router.get('/projects/:id/papers/next', async (req, res) => {
  const projectId = req.params.id;
  
  // Find a unique paper that hasn't been screened yet
  // This is a simplistic approach for SQLite
  const screenedPaperIds = (await db.select({ id: screenings.paperId }).from(screenings)).map(s => s.id);
  
  const query = db.select().from(papers)
    .where(and(
      eq(papers.projectId, projectId),
      eq(papers.duplicateStatus, 'unique')
    ));
    
  const projectPapers = await query;
  
  const unscreened = projectPapers.find(p => !screenedPaperIds.includes(p.id));
  
  if (!unscreened) {
    return res.json({ complete: true });
  }
  
  res.json(unscreened);
});

router.post('/projects/:id/screen', async (req, res) => {
  const { paperId, decision, reason, aiScreening } = req.body;
  
  await db.insert(screenings).values({
    id: uuidv4(),
    paperId,
    aiDecision: aiScreening?.decision,
    aiConfidence: aiScreening?.confidence,
    aiReason: aiScreening?.reason,
    humanDecision: decision,
    exclusionReason: reason,
    reviewedBy: 'human',
    reviewedAt: new Date()
  });
  
  res.json({ success: true });
});

router.post('/projects/:id/ai-screen', async (req, res) => {
  const { paperId } = req.body;
  const project = await db.select().from(projects).where(eq(projects.id, req.params.id)).get();
  const paper = await db.select().from(papers).where(eq(papers.id, paperId)).get();
  
  if (!project || !paper) return res.status(404).json({ error: 'Not found' });
  
  if (!paper.abstract) {
    return res.json({
      decision: 'MAYBE',
      confidence: 100,
      reason: 'No abstract available to perform automated screening.'
    });
  }

  const prompt = `You are an academic systematic literature review screening assistant.
Evaluate the supplied paper strictly against the research question, inclusion criteria and exclusion criteria.
Use only the supplied metadata and abstract. Do not invent information.

Research Question: ${project.researchQuestion}
Inclusion Criteria: ${project.inclusionCriteria?.join(', ')}
Exclusion Criteria: ${project.exclusionCriteria?.join(', ')}

Paper Title: ${paper.title}
Abstract: ${paper.abstract}

If sufficient evidence supports inclusion, return INCLUDE.
If sufficient evidence supports exclusion, return EXCLUDE.
If the abstract does not contain sufficient information, return MAYBE.

Respond ONLY with a JSON object in this exact format:
{
  "decision": "INCLUDE" | "EXCLUDE" | "MAYBE",
  "confidence": <number 0-100>,
  "reason": "<detailed reason focusing on criteria>"
}`;

  try {
    if (!ai) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });

    const result = await ai.models.generateContent({
      model: 'gemini-pro-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const aiRes = JSON.parse(result.text || '{}');
    res.json(aiRes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/projects', async (req, res) => {
  try {
    const id = uuidv4();
    const { title, researchQuestion, reviewType, objectives, inclusionCriteria, exclusionCriteria } = req.body;
    
    await db.insert(projects).values({
      id,
      title,
      researchQuestion,
      reviewType,
      objectives,
      inclusionCriteria,
      exclusionCriteria,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    res.json({ id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/projects', async (req, res) => {
  const allProjects = await db.select().from(projects);
  res.json(allProjects);
});

router.get('/projects/:id', async (req, res) => {
  try {
    const project = await db.select().from(projects).where(eq(projects.id, req.params.id)).get();
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/projects/:id', async (req, res) => {
  try {
    const updateData = { ...req.body, updatedAt: new Date() };
    await db.update(projects).set(updateData).where(eq(projects.id, req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload RIS endpoint
router.post('/projects/:id/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const projectId = req.params.id as string;
  const source = req.body.source || 'Unknown';
  
  const content = fs.readFileSync(req.file.path, 'utf8');
  const records = parseRIS(content);
  
  const papersToInsert = records.map(record => {
    return {
      id: uuidv4(),
      projectId,
      title: record.title || 'Untitled',
      normalizedTitle: record.title ? normalizeText(record.title) : '',
      authors: record.authors,
      year: record.year,
      doi: record.doi ? normalizeDoi(record.doi) : null,
      abstract: record.abstract,
      journal: record.journal,
      keywords: record.keywords,
      sources: [source],
      duplicateStatus: 'unique', // default, to be updated during dedup
    };
  });
  
  // Insert in batches of 100
  for (let i = 0; i < papersToInsert.length; i += 100) {
    const batch = papersToInsert.slice(i, i + 100);
    await db.insert(papers).values(batch);
  }

  res.json({ success: true, count: papersToInsert.length });
});

router.get('/projects/:id/stats', async (req, res) => {
  const projectPapers = await db.select().from(papers).where(eq(papers.projectId, req.params.id));
  
  const total = projectPapers.length;
  const scopus = projectPapers.filter(p => p.sources && p.sources.includes('Scopus')).length;
  const wos = projectPapers.filter(p => p.sources && p.sources.includes('Web of Science')).length;
  const duplicates = projectPapers.filter(p => p.duplicateStatus !== 'unique').length;
  const unique = total - duplicates;

  res.json({
    total,
    scopus,
    wos,
    duplicates,
    unique,
  });
});

export default router;
