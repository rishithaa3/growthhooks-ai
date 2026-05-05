import { useState } from 'react';
import { Settings2, Target, Type, Sparkles } from 'lucide-react';

const InputForm = ({ onGenerate, loading }) => {
  const [instructions, setInstructions] = useState('');
  const [goal, setGoal] = useState('Get leads');
  // const [customGoal, setCustomGoal] = useState('');
  const [tone, setTone] = useState('Contrarian');
  const [timeRange, setTimeRange] = useState('1w');

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate({
      instructions,
      goal,
      tone,
      timeRange
    });
  };

  return (
    <div className="glass-card sticky top-8">
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <Settings2 className="w-5 h-5 mr-2 text-primary" />
        Engine Configuration
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Instructions */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Instructions (optional)</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Tell the AI exactly what you want (tone, audience etc.)"
            rows={4}
            className="input-field resize-none"
          />
        </div>

        {/* Goal */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center">
            <Target className="w-4 h-4 mr-1.5" /> Goal
          </label>

          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="input-field appearance-none"
          >
            <option value="Get leads">Get leads</option>
            <option value="Increase engagement">Increase engagement</option>
            <option value="Build authority">Build authority</option>
            <option value="Drive conversions">Drive conversions</option>
          </select>

          {/* <input
            type="text"
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            placeholder="Or type a custom goal..."
            className="input-field mt-2"
          /> */}
        </div>

        {/* Tone */}
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

        {/* Time */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">⏱ Time Range</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="input-field appearance-none">
            <option value="24h">Past 24 Hours</option>
            <option value="1w">Past 1 Week</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center mt-4">
          {loading ? 'Generating...' : 'Generate Hooks'}
        </button>
      </form>
    </div>
  );
};

export default InputForm;