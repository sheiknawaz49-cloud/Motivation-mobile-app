import React, { useState } from 'react';
import { X, Download, Copy, Check, Share2, Sparkles, Smartphone } from 'lucide-react';
import { DailyTheme } from '../logic/quota';

interface StoryShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: {
    quote: string;
    author: string;
    category: string;
  };
  theme: DailyTheme;
}

export const StoryShareModal: React.FC<StoryShareModalProps> = ({
  isOpen,
  onClose,
  quote,
  theme,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(
      `"${quote.quote}" — ${quote.author}\n\n✨ Shared via Motiveate AI • 3 Mindful Quotes / Day`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCard = () => {
    setDownloading(true);
    // Simulate image rendering or trigger canvas download
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Background
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, 1080, 1920);

      // Card
      ctx.fillStyle = '#ffffff';
      ctx.roundRect ? ctx.roundRect(100, 480, 880, 960, 48) : ctx.fillRect(100, 480, 880, 960);
      ctx.fill();

      // Motiveate AI Watermark Header
      ctx.fillStyle = theme.accent;
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('✨ Motiveate AI', 120, 240);

      ctx.fillStyle = '#64748b';
      ctx.font = '32px sans-serif';
      ctx.fillText(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), 780, 240);

      // Category Tag
      ctx.fillStyle = theme.accent;
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(quote.category.toUpperCase(), 160, 580);

      // Quote text
      ctx.fillStyle = '#1e293b';
      ctx.font = '500 52px serif';
      const words = quote.quote.split(' ');
      let line = '';
      let y = 720;
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 760) {
          ctx.fillText(line, 160, y);
          line = word + ' ';
          y += 72;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 160, y);

      // Author
      ctx.fillStyle = '#475569';
      ctx.font = 'italic 38px sans-serif';
      ctx.fillText(`— ${quote.author}`, 160, y + 100);

      // Bottom callout
      ctx.fillStyle = '#64748b';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Start your day with 3 mindful cards on iOS & Android', 540, 1720);

      const link = document.createElement('a');
      link.download = `motiveate-story-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
    setDownloading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">9:16 Vertical Story Card</h3>
              <p className="text-xs text-slate-500">Instagram Stories & WhatsApp Status preview</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close share preview"
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Card Canvas Preview (Aspect Ratio 9:16) */}
        <div className="p-6 flex flex-col items-center bg-slate-100">
          <div
            className="w-[270px] h-[480px] rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all duration-300"
            style={{ backgroundColor: theme.background }}
          >
            {/* Subtle soft gradient shapes */}
            <div
              className="absolute -top-12 -right-12 w-36 h-36 rounded-full opacity-60 blur-xl"
              style={{ backgroundColor: theme.accentSoft }}
            />
            <div
              className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full opacity-60 blur-xl"
              style={{ backgroundColor: theme.accentSoft }}
            />

            {/* Top Bar with Motiveate AI Watermark */}
            <div className="flex items-center justify-between relative z-10">
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs tracking-wide"
                style={{ backgroundColor: theme.cardBackground, color: theme.accent }}
              >
                ✨ Motiveate AI
              </span>
              <span className="text-[10px] font-medium" style={{ color: theme.textSecondary }}>
                Today's Daily
              </span>
            </div>

            {/* Center Card */}
            <div
              className="p-5 rounded-2xl border shadow-sm relative z-10 my-auto"
              style={{
                backgroundColor: theme.cardBackground,
                borderColor: theme.cardBorder,
              }}
            >
              <span
                className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase mb-2"
                style={{ backgroundColor: theme.accentSoft, color: theme.accent }}
              >
                {quote.category}
              </span>
              <p
                className="text-base font-serif italic font-medium leading-snug line-clamp-6 mb-3"
                style={{ color: theme.textPrimary }}
              >
                "{quote.quote}"
              </p>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5" style={{ backgroundColor: theme.accent }} />
                <span className="text-xs font-semibold" style={{ color: theme.textSecondary }}>
                  {quote.author}
                </span>
              </div>
            </div>

            {/* Bottom Watermark Call to action */}
            <div className="text-center relative z-10">
              <p className="text-[10px] font-semibold" style={{ color: theme.textPrimary }}>
                Start your morning with 3 mindful cards.
              </p>
              <p className="text-[9px]" style={{ color: theme.textSecondary }}>
                Motiveate AI • iOS & Android
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={handleCopyQuote}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied Quote!' : 'Copy Text'}
          </button>
          <button
            onClick={handleDownloadCard}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold text-xs shadow-md transition"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Rendering...' : 'Download 9:16 PNG'}
          </button>
        </div>
      </div>
    </div>
  );
};
