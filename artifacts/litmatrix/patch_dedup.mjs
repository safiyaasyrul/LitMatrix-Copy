import fs from 'fs';
let code = fs.readFileSync('server/routes.ts', 'utf8');

const newDedup = `router.post('/projects/:id/deduplicate', async (req, res) => {
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
});`;

code = code.replace(/router\.post\('\/projects\/:id\/deduplicate', async \(req, res\) => \{[\s\S]*?res\.json\(\{ duplicateCount, duplicateGroups: duplicateGroups\.length \}\);\n\}\);/, newDedup);

fs.writeFileSync('server/routes.ts', code);
