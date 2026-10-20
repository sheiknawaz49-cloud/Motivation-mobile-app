import React, { useState } from 'react';
import { Globe, Play, CheckCircle2, AlertCircle, RefreshCw, Server, Send } from 'lucide-react';

interface CloudRunTesterProps {
  cloudRunUrl: string;
  onUrlChange: (newUrl: string) => void;
  isLiveMode: boolean;
  onToggleLiveMode: (live: boolean) => void;
}

export const CloudRunTester: React.FC<CloudRunTesterProps> = ({
  cloudRunUrl,
  onUrlChange,
  isLiveMode,
  onToggleLiveMode,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/batch');
  const [requestMethod, setRequestMethod] = useState<'GET' | 'POST'>('GET');
  const [loading, setLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [requestPayload, setRequestPayload] = useState<string>(
    JSON.stringify({ action: 'like', quote: 'Mindfulness begins with acceptance.' }, null, 2)
  );

  const endpoints = [
    {
      method: 'GET',
      path: '/api/batch',
      desc: 'Fetch 3 daily quotes, streak, max streak & quota status (Asia/Kolkata)',
      defaultBody: '',
    },
    {
      method: 'POST',
      path: '/api/tts',
      desc: 'Generate on-demand audio speech (cached in profile & daily_cards)',
      defaultBody: JSON.stringify({ quote: 'The mind is everything. What you think you become.', voice: 'female', language: 'en' }, null, 2),
    },
    {
      method: 'POST',
      path: '/preferences',
      desc: 'Update preferences and appearance theme_mode (auto, light, dark)',
      defaultBody: JSON.stringify({ mood: 'focused', goal: 'Daily growth', voice: 'female', language: 'en', theme_mode: 'auto' }, null, 2),
    },
    {
      method: 'POST',
      path: '/api/feedback',
      desc: 'Submit like/dislike quote reaction',
      defaultBody: JSON.stringify({ action: 'like', quote: 'Small disciplines repeated with consistency every day lead to great achievements.' }, null, 2),
    },
    {
      method: 'POST',
      path: '/api/context/mobile',
      desc: 'Submit mobile screen-time or app usage context for AI personalization',
      defaultBody: JSON.stringify({ app_usage_context: 'Screen time 3.5h today. Frequent coding on GitHub and reading books.' }, null, 2),
    },
    {
      method: 'POST',
      path: '/auth/delete-account',
      desc: 'Permanently delete user account, Firestore profile, and GCS audio files',
      defaultBody: JSON.stringify({}, null, 2),
    },
    {
      method: 'POST',
      path: '/onboarding',
      desc: 'Submit calibrated language (en/te), 9 interests & AI persona summary',
      defaultBody: JSON.stringify({
        language: 'en',
        interests: ['Coding & Tech 💻', 'Fitness 💪', 'Devotion 🙏', 'Movies 🎬'],
        aiPersona: 'Ambitious developer striving to ship SaaS products, thrives on stoic discipline and direct, no-fluff motivation.'
      }, null, 2),
    },
  ];

  const handleSelectEndpoint = (ep: typeof endpoints[0]) => {
    setSelectedEndpoint(ep.path);
    setRequestMethod(ep.method as any);
    if (ep.defaultBody) {
      setRequestPayload(ep.defaultBody);
    }
  };

  const handleExecuteRequest = async () => {
    setLoading(true);
    setResponseStatus(null);
    setResponseBody(null);
    const start = performance.now();

    try {
      const url = `${cloudRunUrl.replace(/\/$/, '')}${selectedEndpoint}`;
      const options: RequestInit = {
        method: requestMethod,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      };

      if (requestMethod === 'POST') {
        options.body = requestPayload;
      }

      const res = await fetch(url, options);
      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);
      setResponseStatus(res.status);

      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setResponseBody(JSON.stringify(json, null, 2));
      } catch {
        setResponseBody(text || '(Empty response body)');
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);
      setResponseStatus(0);
      setResponseBody(
        JSON.stringify(
          {
            error: 'Network / CORS / Service connection error',
            message: err.message,
            tip: 'If this service is running on Google Cloud Run, ensure CORS middleware allows requests from this browser origin or test within the mobile app.',
          },
          null,
          2
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Backend Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Google Cloud Run Backend</h3>
            <p className="text-xs text-slate-500">FastAPI Motivation Microservice (Python)</p>
          </div>
        </div>

        {/* Live vs Mock Switch */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => onToggleLiveMode(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              isLiveMode
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Cloud Run
          </button>
          <button
            onClick={() => onToggleLiveMode(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              !isLiveMode
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Built-in Mock
          </button>
        </div>
      </div>

      {/* Cloud Run Service URL Input */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Cloud Run Host URL
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={cloudRunUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              placeholder="https://motivation-service-xxxx.asia-south1.run.app"
            />
          </div>
        </div>
      </div>

      {/* Quick Endpoint Selection */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          FastAPI Endpoints
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {endpoints.map((ep) => {
            const isSelected = selectedEndpoint === ep.path && requestMethod === ep.method;
            return (
              <button
                key={`${ep.method}-${ep.path}`}
                onClick={() => handleSelectEndpoint(ep)}
                className={`text-left p-2.5 rounded-xl border text-xs transition ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-1 ring-blue-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      ep.method === 'GET' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono font-semibold">{ep.path}</span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{ep.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Request Payload if POST */}
      {requestMethod === 'POST' && (
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            JSON Request Body
          </label>
          <textarea
            value={requestPayload}
            onChange={(e) => setRequestPayload(e.target.value)}
            rows={3}
            className="w-full p-2.5 font-mono text-xs rounded-xl border border-slate-200 bg-slate-900 text-emerald-400 focus:outline-hidden"
          />
        </div>
      )}

      {/* Execute Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleExecuteRequest}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          {loading ? 'Sending to Cloud Run...' : `Send ${requestMethod} ${selectedEndpoint}`}
        </button>

        {latency !== null && (
          <span className="text-xs font-mono text-slate-500">
            Latency: <strong className="text-slate-800">{latency}ms</strong>
          </span>
        )}
      </div>

      {/* Response Box */}
      {responseBody !== null && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Response</span>
            <div className="flex items-center gap-2">
              {responseStatus === 200 ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5" /> Status {responseStatus}
                </span>
              )}
            </div>
          </div>
          <pre className="p-3 bg-slate-950 text-slate-100 font-mono text-xs rounded-xl overflow-x-auto max-h-60 border border-slate-800 leading-relaxed">
            {responseBody}
          </pre>
        </div>
      )}
    </div>
  );
};
