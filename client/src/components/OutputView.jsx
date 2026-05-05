import { useState } from 'react';
import { Send, CheckCircle2, Copy, TrendingUp, Lightbulb } from 'lucide-react';
import { sendEmail } from '../api';
import { improveHook } from '../api';

const OutputView = ({ result, loading }) => {
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState('idle');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const [showImproveModal, setShowImproveModal] = useState(false);
  const [selectedHookIndex, setSelectedHookIndex] = useState(null);
  const [improveText, setImproveText] = useState('');

  const [improvingIndex, setImprovingIndex] = useState(null);
  const [improvedHooks, setImprovedHooks] = useState({});

  if (loading) {
    return (
      <div className="glass-card h-96 flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-400 font-medium animate-pulse">
          Analyzing trends & crafting hooks...
        </p>
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

  const { hooks, explanations, trends, stats } = result;

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    // if (!email) return;
    if (!email || emailStatus === 'sending') return;

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

  const openImproveModal = (index) => {
    setSelectedHookIndex(index);
    setImproveText('');
    setShowImproveModal(true);
  };

  const handleImprove = async () => {
    if (selectedHookIndex === null) return;

    const hookObj = hooks[selectedHookIndex];

    const originalHook =
      typeof hookObj === 'string' ? hookObj : hookObj.hook;

    const id =
      typeof hookObj === 'string' ? null : hookObj.id;

    try {
      setImprovingIndex(selectedHookIndex);

      console.log('[Improve Debug]', {
        hookObj,
        originalHook,
        id,
        instruction: improveText
      });


      const res = await improveHook(
        originalHook,
        improveText,
        "Contrarian",
        id
      );

      setImprovedHooks(prev => ({
        ...prev,
        [selectedHookIndex]: res.improvedHook
      }));

      setShowImproveModal(false);

    } catch (err) {
      console.error(err);
    } finally {
      setImprovingIndex(null);
    }
  };

  return (
    <div className="space-y-8">

      {/* {stats && (
        <div className="text-sm text-gray-400 mb-4">
          Analyzed {stats.totalAnalyzed} posts 
        </div>
      )} */}

      {/* Hooks */}
      <section>
        <h3 className="text-2xl font-bold mb-4 flex items-center">
          <CheckCircle2 className="w-6 h-6 mr-2 text-primary" />
          Generated Hooks
        </h3>

        <div className="space-y-4">
          {hooks?.map((hookItem, index) => {
            const hookText =
              improvedHooks[index] ||
              (typeof hookItem === 'string' ? hookItem : hookItem.hook);

            return (
              <div key={index} className="glass-card relative">

                <p className="text-lg font-medium pr-12">
                  {hookText}
                </p>

                <button
                  onClick={() => handleCopy(hookText, index)}
                  className="absolute top-4 right-4"
                >
                  {copiedIndex === index ? '✓' : 'Copy'}
                </button>

                <button
                  onClick={() => openImproveModal(index)}
                  className="text-xs text-primary mt-2"
                >
                  Improve this hook
                </button>

                {explanations && explanations[index] && (
                  <div className="mt-4 border-t pt-2 text-sm text-gray-400">
                    {explanations[index]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Trends */}
      {trends && (
        <section>
          <h3 className="text-xl font-bold mb-2 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-secondary" />
            Trends
          </h3>
          <ul className="space-y-2">
            {trends.map((t, i) => (
              <li key={i}>• {t}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Email */}
      <form onSubmit={handleEmail} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          className="input-field"
        />
        <button
          type="submit"
          disabled={emailStatus === 'sending'}
          className="btn-primary px-4"
        >
          {emailStatus === 'sending' && 'Sending...'}
          {emailStatus === 'success' && 'Sent!'}
          {emailStatus === 'error' && 'Failed'}
          {emailStatus === 'idle' && 'Send'}
        </button>
      </form>

      {/* 🔥 Improve Modal */}
      {showImproveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-surface p-6 rounded-lg w-[400px]">
            <h3 className="mb-2 font-semibold">Improve Hook</h3>

            <textarea
              value={improveText}
              onChange={(e) => setImproveText(e.target.value)}
              placeholder="make it shorter / more aggressive / more contrarian"
              className="input-field w-full mb-4"
              rows={3}
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowImproveModal(false)}>
                Cancel
              </button>

              <button onClick={handleImprove} className="btn-primary">
                Improve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutputView;