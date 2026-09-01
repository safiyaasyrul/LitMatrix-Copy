import { BrowserRouter as Router, Routes, Route, Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import React from 'react';
import Step1Title from './pages/Step1Title';
import Step2Topic from './pages/Step2Topic';
import Step3Taxonomy from './pages/Step3Taxonomy';
import Step4Search from './pages/Step4Search';
import Step5Import from './pages/Step5Import';
import Step6Screening from './pages/Step6Screening';
import Step7Themes from './pages/Step7Themes';
import Step8Draft from './pages/Step8Draft';
import Step9Paper from './pages/Step9Paper';

const STEPS = [
  { id: 1, label: '① Tajuk', path: 'step1-title' },
  { id: 2, label: '② Topik', path: 'step2-topic' },
  { id: 3, label: '③ Taksonomi', path: 'step3-taxonomy' },
  { id: 4, label: '④ Carian', path: 'step4-search' },
  { id: 5, label: '⑤ Import', path: 'step5-import' },
  { id: 6, label: '⑥ Saringan', path: 'step6-screening' },
  { id: 7, label: '⑦ Tema', path: 'step7-themes' },
  { id: 8, label: '⑧ Draf', path: 'step8-draft' },
  { id: 9, label: '⑨ Paper', path: 'step9-paper' },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { id } = useParams();
  const location = useLocation();
  const projectId = id || 'new';

  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden">
      <aside className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold tracking-tight text-slate-800">SCHOLARPEN</h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Project: {projectId !== 'new' ? 'Active' : 'New'}</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          {STEPS.map((step) => {
            const isActive = location.pathname.includes(step.path);
            const to = projectId !== 'new' ? `/project/${projectId}/${step.path}` : '/';
            return (
              <Link 
                key={step.id} 
                to={to} 
                className={`flex items-center px-6 py-3 transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="text-sm">{step.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        <header className="h-14 border-b border-slate-200 flex items-center px-8 shrink-0 bg-white shadow-sm z-10">
          <div className="flex items-center text-xs text-slate-400 font-medium tracking-wider space-x-2">
            {STEPS.map((step, idx) => {
              const isActive = location.pathname.includes(step.path);
              return (
                <React.Fragment key={step.id}>
                  <span className={isActive ? 'text-blue-600 font-bold' : ''}>
                    {step.id} {step.label.replace('①', '').replace('②', '').replace('③', '').replace('④', '').replace('⑤', '').replace('⑥', '').replace('⑦', '').replace('⑧', '').replace('⑨', '').trim()}
                  </span>
                  {idx < STEPS.length - 1 && <span>→</span>}
                </React.Fragment>
              );
            })}
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout><Step1Title /></AppLayout>} />
        <Route path="/project/:id/step1-title" element={<AppLayout><Step1Title /></AppLayout>} />
        <Route path="/project/:id/step2-topic" element={<AppLayout><Step2Topic /></AppLayout>} />
        <Route path="/project/:id/step3-taxonomy" element={<AppLayout><Step3Taxonomy /></AppLayout>} />
        <Route path="/project/:id/step4-search" element={<AppLayout><Step4Search /></AppLayout>} />
        <Route path="/project/:id/step5-import" element={<AppLayout><Step5Import /></AppLayout>} />
        <Route path="/project/:id/step6-screening" element={<AppLayout><Step6Screening /></AppLayout>} />
        <Route path="/project/:id/step7-themes" element={<AppLayout><Step7Themes /></AppLayout>} />
        <Route path="/project/:id/step8-draft" element={<AppLayout><Step8Draft /></AppLayout>} />
        <Route path="/project/:id/step9-paper" element={<AppLayout><Step9Paper /></AppLayout>} />
      </Routes>
    </Router>
  );
}
