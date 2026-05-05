import React, { useState } from 'react';
import { Settings2, Target, Type, Sparkles } from 'lucide-react';

const InputForm = ({ onGenerate, loading }) => {
  const [mode, setMode] = useState('Pixii');
  const [niche, setNiche] = useState('');
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('Get leads');
  const [tone, setTone] = useState('Contrarian');
  const [timeRange, setTimeRange] = useState('1w');

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate({ mode, niche, topic, goal, tone, timeRange });
  };

  return (
    <div className="glass-card sticky top-8">
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <Settings2 className="w-5 h-5 mr-2 text-primary" />
        Engine Configuration
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mode Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300">Mode</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('Pixii')}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${mode === 'Pixii' ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
            >
              Pixii Engine
            </button>
            <button
              type="button"
              onClick={() => setMode('Business')}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${mode === 'Business' ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
            >
              Business Hooks
            </button>
          </div>
        </div>

        {/* Dynamic Input based on Mode */}
        {mode === 'Pixii' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Topic Focus (Optional)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. CRO, Content ROI..."
              className="input-field"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Business Niche *</label>
            <input
              type="text"
              required
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. Saree business, B2B SaaS"
              className="input-field"
            />
          </div>
        )}

        {/* Common Inputs */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center">
            <Target className="w-4 h-4 mr-1.5" /> Goal
          </label>
          <select value={goal} onChange={(e) => setGoal(e.target.value)} className="input-field appearance-none">
            <option value="Get leads">Get leads</option>
            <option value="Increase engagement">Increase engagement</option>
            <option value="Build authority">Build authority</option>
            <option value="Drive adoption">Drive adoption</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center">
            <Type className="w-4 h-4 mr-1.5" /> Tone
          </label>
          <select value={tone} onChange={(e) => setTone(e.target.value)} className="input-field appearance-none">
            <option value="Contrarian">Contrarian</option>
            <option value="Insight-driven">Insight-driven</option>
            <option value="Sharp & Bold">Sharp & Bold</option>
            <option value="Educational">Educational</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">⏱ Time Range</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="input-field appearance-none">
            <option value="24h">Past 24 Hours</option>
            <option value="1w">Past 1 Week</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 text-gray-500">Platform</label>
          <input type="text" value="LinkedIn" disabled className="input-field opacity-50 cursor-not-allowed" />
        </div>

        <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center mt-4">
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            <span className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Hooks
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

export default InputForm;
