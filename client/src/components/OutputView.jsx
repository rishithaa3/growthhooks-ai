import React, { useState } from 'react';
import { Send, CheckCircle2, Copy, TrendingUp, Lightbulb } from 'lucide-react';
import { sendEmail } from '../api';

const OutputView = ({ result, loading }) => {
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState('idle'); // idle, sending, success, error
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (loading) {
    return (
      <div className="glass-card h-96 flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 border-4 border-secondary/30 border-b-secondary rounded-full animate-spin animation-delay-500"></div>
        </div>
        <p className="text-gray-400 font-medium animate-pulse">Analyzing trends & crafting hooks...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="glass-card h-96 flex flex-col items-center justify-center text-gray-500 border-dashed">
        <Lightbulb className="w-12 h-12 mb-4 opacity-20" />
        <p>Configure the engine and generate to see hooks here.</p>
      </div>
    );
  }

  const { hooks, explanations, trends } = result;

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setEmailStatus('sending');
    try {
      await sendEmail(email, hooks, trends);
      setEmailStatus('success');
      setTimeout(() => setEmailStatus('idle'), 3000);
    } catch (error) {
      setEmailStatus('error');
      setTimeout(() => setEmailStatus('idle'), 3000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Hooks Section */}
      <section>
        <h3 className="text-2xl font-bold mb-4 flex items-center">
          <span className="bg-primary/20 text-primary p-2 rounded-lg mr-3">
            <CheckCircle2 className="w-6 h-6" />
          </span>
          Generated Hooks
        </h3>
        <div className="space-y-4">
          {hooks?.map((hook, index) => (
            <div key={index} className="glass-card relative group hover:border-primary/50 transition-colors">
              <p className="text-lg font-medium pr-12 leading-relaxed">{hook}</p>
              
              <button 
                onClick={() => handleCopy(hook, index)}
                className="absolute top-4 right-4 p-2 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Copy to clipboard"
              >
                {copiedIndex === index ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>

              {explanations && explanations[index] && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400 flex items-start">
                    <Lightbulb className="w-4 h-4 mr-2 mt-0.5 text-yellow-500 flex-shrink-0" />
                    <span className="italic">{explanations[index]}</span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Trends Section */}
      {trends && trends.length > 0 && (
        <section>
          <h3 className="text-2xl font-bold mb-4 flex items-center">
             <span className="bg-secondary/20 text-secondary p-2 rounded-lg mr-3">
              <TrendingUp className="w-6 h-6" />
            </span>
            Trend Insights
          </h3>
          <div className="glass-card">
            <ul className="space-y-3">
              {trends.map((trend, i) => (
                <li key={i} className="flex items-start text-gray-300">
                  <span className="text-secondary mr-3 mt-1">•</span>
                  <span>{trend}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Email Export */}
      <section className="glass-card bg-gradient-to-br from-surface to-surface/50 border-primary/20">
        <h3 className="text-lg font-bold mb-2">Export to Email</h3>
        <p className="text-sm text-gray-400 mb-4">Send these hooks and insights directly to your inbox or team.</p>
        
        <form onSubmit={handleEmail} className="flex space-x-3">
          <input 
            type="email" 
            required 
            placeholder="team@pixii.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field flex-grow"
          />
          <button 
            type="submit" 
            disabled={emailStatus === 'sending' || emailStatus === 'success'}
            className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors disabled:opacity-50"
          >
            {emailStatus === 'sending' ? 'Sending...' : 
             emailStatus === 'success' ? 'Sent!' : 
             <><Send className="w-4 h-4 mr-2" /> Send</>}
          </button>
        </form>
        {emailStatus === 'error' && <p className="text-red-400 text-sm mt-2">Failed to send email. Check server configuration.</p>}
      </section>

    </div>
  );
};

export default OutputView;
