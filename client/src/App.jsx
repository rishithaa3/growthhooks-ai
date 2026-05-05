import { useState } from 'react';
import { generateHooks } from './api';
import InputForm from './components/InputForm';
import OutputView from './components/OutputView';
import { Sparkles, Zap } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateHooks(formData);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-6xl">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">GrowthHooks <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">AI</span></h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Generate viral hooks powered by real-time trend data for Pixii.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <InputForm onGenerate={handleGenerate} loading={loading} />
          </div>
          
          <div className="lg:col-span-8">
            {error && (
              <div className="glass-card border-red-500/30 mb-6 bg-red-500/5">
                <p className="text-red-400 flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  {error}
                </p>
              </div>
            )}
            
            <OutputView result={result} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
