import React from 'react';
import { Link } from 'react-router-dom';
import { PenLine, Feather, Users, Heart, BookOpen, BarChart3, Bookmark, Check } from 'lucide-react';

const uline = (t) => (
  <span className="underline decoration-wavy decoration-accent/60 underline-offset-4">{t}</span>
);

// Distinct branding content per page. Sign-up sells the value with a full
// checklist; sign-in welcomes the returning writer with a few light tags.
const PANELS = {
  register: {
    headline: <>Turn your ideas into {uline('stories')}.</>,
    blurb: 'A cosy corner of the web to write, publish, and be read.',
    checklist: [
      'Rich-text & Markdown editor',
      'Publish stories & reach readers',
      'Invite your team to your desk',
      'Public API & webhooks',
      'Bookmarks, claps & follows',
    ],
  },
  login: {
    headline: <>Back to your {uline('desk')}.</>,
    blurb: 'Your drafts, stories, and team are right where you left them.',
    features: [
      { icon: BookOpen, text: 'Pick up your drafts' },
      { icon: BarChart3, text: 'Check your stats' },
      { icon: Bookmark, text: 'Your reading list' },
    ],
  },
};

const BrandMark = ({ className = '' }) => (
  <Link to="/" aria-label="Scribble home" className={`inline-flex items-center gap-2 group ${className}`}>
    <span className="w-11 h-11 flex items-center justify-center bg-white border-2 border-pencil rounded-full shadow-hard-sm group-hover:-rotate-6 transition-transform duration-100">
      <PenLine size={22} strokeWidth={2.5} className="text-accent" />
    </span>
    <span className="font-heading text-3xl text-pencil">Scribble</span>
  </Link>
);

// Hand-drawn "writing" illustration — a tilted page with scribbles, a pencil,
// and a couple of sparkles. Pure inline SVG so it ships self-contained.
const Sketch = ({ className = '' }) => (
  <svg viewBox="0 0 240 170" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <g transform="rotate(-5 120 90)">
      <rect x="52" y="30" width="120" height="120" rx="8" fill="#fff" stroke="#2d2d2d" strokeWidth="3" />
      <path d="M68 56 H150" stroke="#2d2d2d" strokeWidth="4" strokeLinecap="round" />
      <path d="M68 67 q 16 -7 32 0 t 32 0" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round" />
      <path d="M68 88 H156 M68 102 H148 M68 116 H156 M68 130 H130" stroke="#2d2d2d" strokeWidth="2.5" strokeLinecap="round" opacity="0.32" />
    </g>
    <g transform="rotate(42 180 120)">
      <rect x="172" y="60" width="16" height="80" fill="#ffe066" stroke="#2d2d2d" strokeWidth="3" />
      <rect x="172" y="60" width="16" height="12" fill="#ff4d4d" stroke="#2d2d2d" strokeWidth="3" />
      <path d="M172 140 L188 140 L180 158 Z" fill="#ffd9a0" stroke="#2d2d2d" strokeWidth="3" strokeLinejoin="round" />
      <path d="M177 150 L183 150 L180 158 Z" fill="#2d2d2d" />
    </g>
    <path d="M42 35 L45 43 L53 46 L45 49 L42 57 L39 49 L31 46 L39 43 Z" fill="#ff4d4d" />
    <path d="M204 24 L206.5 29.5 L212 32 L206.5 34.5 L204 40 L201.5 34.5 L196 32 L201.5 29.5 Z" fill="#2d5da1" />
  </svg>
);

// Two-column auth scaffold: hand-drawn branding panel on the left (desktop),
// form on the right. `variant` selects the sign-in vs sign-up branding copy.
export const AuthShell = ({ variant = 'register', title, subtitle, error, children, footer }) => {
  const panel = PANELS[variant] || PANELS.register;

  return (
    <div className="max-w-5xl mx-auto pb-8">
      <div
        className="grid lg:grid-cols-2 bg-white border-2 border-pencil shadow-hard-lg overflow-hidden"
        style={{ borderRadius: '28px 10px 28px 10px / 10px 28px 10px 28px' }}
      >
        {/* LEFT — branding panel (desktop only) */}
        <div
          className="relative hidden lg:flex flex-col justify-center gap-6 p-8 bg-postit border-r-2 border-dashed border-pencil overflow-hidden"
          style={{ backgroundImage: 'radial-gradient(rgba(45,45,45,0.07) 1px, transparent 1px)', backgroundSize: '18px 18px' }}
        >
          {/* tape strips + doodle */}
          <div className="absolute -top-3 left-10 w-20 h-7 bg-white/40 border-x border-dashed border-pencil/20 -rotate-6" aria-hidden />
          <div className="absolute -top-3 right-14 w-16 h-7 bg-sky/40 border-x border-dashed border-pencil/20 rotate-6" aria-hidden />
          <div className="absolute -right-12 bottom-8 w-32 h-32 border-[3px] border-dashed border-accent/25 rounded-full" aria-hidden />

          <BrandMark />

          <div className="relative z-10 space-y-4">
            <h2 className="font-heading text-4xl leading-[1.15] text-pencil">{panel.headline}</h2>
            <p className="font-body text-lg text-pencil/70 max-w-xs">{panel.blurb}</p>
          </div>

          <div className="relative z-10 flex justify-center">
            <Sketch className="animate-float w-44 h-auto" />
          </div>

          {panel.checklist && (
            <ul className="relative z-10 space-y-2.5">
              {panel.checklist.map((item) => (
                <li key={item} className="flex items-center gap-2.5 font-body text-[15px] text-pencil/85">
                  <span className="w-5 h-5 flex items-center justify-center bg-mint border-2 border-pencil rounded-full shrink-0">
                    <Check size={12} strokeWidth={3.5} className="text-pencil" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          )}

          {panel.features && (
            <div className="relative z-10 flex flex-wrap gap-2">
              {panel.features.map((f, i) => (
                <span
                  key={f.text}
                  className={`inline-flex items-center gap-1.5 bg-white border-2 border-pencil px-2.5 py-1 font-body text-xs text-pencil shadow-hard-sm wobbly-tag ${i % 2 ? '-rotate-1' : 'rotate-1'}`}
                >
                  <f.icon size={13} strokeWidth={2.5} className="text-accent shrink-0" />
                  {f.text}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — form */}
        <div className="flex flex-col justify-center p-6 sm:p-9">
          <div className="flex justify-center lg:hidden mb-6">
            <BrandMark />
          </div>

          <div className="space-y-1.5 mb-6">
            <h1 className="font-heading text-3xl text-pencil">
              <span className="underline decoration-wavy decoration-accent/50 underline-offset-4">{title}</span>
            </h1>
            {subtitle && <p className="font-body text-pencil/60">{subtitle}</p>}
          </div>

          {error && (
            <p role="alert" className="font-body text-sm text-accent bg-accent/10 border-2 border-accent px-4 py-3 wobbly-tag mb-5">
              {error}
            </p>
          )}

          {children}

          {footer && (
            <>
              <div className="border-t-2 border-dashed border-pencil/20 my-5" />
              <p className="font-body text-center text-pencil/60 text-sm">{footer}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
