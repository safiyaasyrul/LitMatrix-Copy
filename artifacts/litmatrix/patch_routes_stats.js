import fs from 'fs';
let code = fs.readFileSync('server/routes.ts', 'utf8');

const newRoute = `
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
`;

code = code.replace("const router = express.Router();", "const router = express.Router();\n" + newRoute);
fs.writeFileSync('server/routes.ts', code);
