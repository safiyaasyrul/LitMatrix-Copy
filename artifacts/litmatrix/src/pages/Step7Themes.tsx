import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';

export default function Step7Themes() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto p-10 h-full overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Langkah 7: Pengelompokan Bertema</h2>
        <p className="text-slate-500">AI mengelompokkan artikel yang diterima berdasarkan persamaan topik, kaedah, pemboleh ubah dan dapatan.</p>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-8">
        <p className="text-blue-800 text-sm">
          <strong>Cadangan AI:</strong> Mengelompokkan 412 artikel yang diterima kepada 4 tema utama berdasarkan persamaan semantik dan abstrak.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm relative">
          <span className="absolute top-4 right-4 text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">42 Artikel (18%)</span>
          <h3 className="text-sm font-bold text-slate-800 mb-2">TEMA 1: AI-Based Emission Prediction</h3>
          <p className="text-sm text-slate-600 mb-4 line-clamp-3">
            Studies applying machine learning and artificial intelligence to predict vessel emissions using operational and environmental variables.
          </p>
          <div className="flex gap-2">
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">machine learning</span>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">neural networks</span>
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm relative">
          <span className="absolute top-4 right-4 text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">37 Artikel (16%)</span>
          <h3 className="text-sm font-bold text-slate-800 mb-2">TEMA 2: AIS-Based Emission Estimation</h3>
          <p className="text-sm text-slate-600 mb-4 line-clamp-3">
            Research focusing on leveraging Automatic Identification System (AIS) data for maritime trajectory and emission estimations.
          </p>
          <div className="flex gap-2">
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">AIS data</span>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">trajectory</span>
          </div>
        </div>

        <button className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-slate-50 transition-colors">
          <Plus className="w-8 h-8 mb-2" />
          <span className="text-sm font-bold">Tambah Tema Manual</span>
        </button>
      </div>

      <div className="flex justify-end pt-6 border-t border-slate-200 mt-8 gap-4">
        <button
          onClick={() => navigate(`/project/${id}/step8-draft`)}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium inline-flex items-center hover:bg-blue-700 transition-colors shadow-sm"
        >
          Jana Draf Kajian <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}
