import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenLine, BookOpen, Bookmark, Users, Webhook, Activity, ArrowRight, Sparkles, Plus } from 'lucide-react';
import { postsApi } from '../api/posts.js';
import { PostCard } from '../components/post/PostCard.jsx';
import { Button } from '../components/ui/Button.jsx';

const Squiggle = ({ color = '#2d2d2d' }) => (
  <svg width="100%" height="22" viewBox="0 0 1200 22" preserveAspectRatio="none" className="block" aria-hidden>
    <path
      d="M0,11 Q 40,1 80,11 T 160,11 T 240,11 T 320,11 T 400,11 T 480,11 T 560,11 T 640,11 T 720,11 T 800,11 T 880,11 T 960,11 T 1040,11 T 1120,11 T 1200,11"
      fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
    />
  </svg>
);

const Tack = ({ className = '' }) => (
  <span
    className={`absolute w-3.5 h-3.5 rounded-full border-2 border-pencil bg-accent ${className}`}
    style={{ boxShadow: '1px 2px 3px rgba(0,0,0,.25)' }}
  />
);

const VALUES = [
  { k: 'Free', v: 'to read & write', bg: 'bg-highlight', rot: '-rotate-1' },
  { k: 'No ads', v: 'on your words, ever', bg: 'bg-sky', rot: 'rotate-1' },
  { k: 'Open', v: 'API & webhooks', bg: 'bg-blush', rot: '-rotate-1' },
];

const FEATURES = [
  { icon: PenLine, title: 'Distraction-free editor', desc: 'A rich, hand-feel editor that gets out of your way.', bg: 'bg-highlight', rot: '-rotate-2' },
  { icon: BookOpen, title: 'Read & follow', desc: 'Discover writers, follow them, never miss a post.', bg: 'bg-sky', rot: 'rotate-2' },
  { icon: Bookmark, title: 'Bookmarks', desc: 'Save stories to your reading list for later.', bg: 'bg-blush', rot: '-rotate-1' },
  { icon: Users, title: 'Teams & workspaces', desc: 'Invite members and write together under one roof.', bg: 'bg-mint', rot: 'rotate-1' },
  { icon: Webhook, title: 'API & webhooks', desc: 'Publish over REST and get pinged on every event.', bg: 'bg-peach', rot: '-rotate-2' },
  { icon: Activity, title: 'Activity log', desc: 'A full trail of everything happening in your account.', bg: 'bg-postit', rot: 'rotate-2' },
];

const FAQS = [
  { q: 'Is Scribble free?', a: 'Yes — reading, writing, and publishing are all free. Make an account and start scribbling.' },
  { q: 'Can I use the API?', a: 'Absolutely. Generate credentials in Settings → API, then create and manage posts over a simple REST API. Read the docs for endpoints and examples.' },
  { q: 'How do teams work?', a: 'Owners invite members into a workspace with a read or full role, and members can act on the workspace’s behalf.' },
  { q: 'Do you support webhooks?', a: 'Yes. Subscribe an endpoint to events like new comments, claps, and follows — deliveries are signed and retried automatically.' },
];

const SectionTitle = ({ kicker, kickerColor, children }) => (
  <div className="text-center mb-8">
    <div className={`inline-block font-body text-sm ${kickerColor} -rotate-1`}>~ {kicker} ~</div>
    <h2 className="font-heading text-3xl sm:text-4xl text-pencil mt-1">{children}</h2>
  </div>
);

export const Landing = () => {
  const [featured, setFeatured] = useState([]);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    let alive = true;
    postsApi
      .getFeed({ page: 1, limit: 4 })
      .then(({ data }) => { if (alive) setFeatured(data.data.posts || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <div className="space-y-14 pb-10">
      {/* Hero */}
      <section className="relative text-center pt-6 pb-2 space-y-6">
        {/* Announcement pill */}
        <Link
          to="/docs"
          className="group inline-flex items-center gap-2 font-body text-xs sm:text-sm text-paper bg-pencil px-3 py-1.5 border-2 border-pencil wobbly-tag shadow-hard-sm hover:bg-ink transition-colors -rotate-1"
        >
          <Sparkles size={14} strokeWidth={2.5} className="text-highlight" />
          New — publish with the API &amp; get webhooks
          <ArrowRight size={14} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
        </Link>

        <div className="doodle absolute left-2 top-16 w-16 h-16 border-[3px] border-dashed border-sky rounded-full hidden md:block" aria-hidden />
        <div className="doodle absolute right-4 top-24 w-0 h-0 hidden md:block" style={{ borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderBottom: '34px solid #ffb3c1', transform: 'rotate(18deg)' }} aria-hidden />

        <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl text-pencil leading-[0.95]">
          Read, write &amp; share<br />
          <span className="text-accent inline-block -rotate-1 underline decoration-wavy decoration-accent/50">
            one scribble
          </span>{' '}
          at a time
        </h1>
        <p className="font-body text-lg sm:text-xl text-pencil/70 max-w-xl mx-auto">
          A place to think out loud — a distraction-free editor, a community of writers, and an open API when you want to automate it.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/register">
            <Button size="lg" className="inline-flex items-center gap-2">
              <PenLine size={20} strokeWidth={2.5} /> Start writing — it’s free
            </Button>
          </Link>
          <Link to="/explore">
            <Button size="lg" variant="secondary" className="inline-flex items-center gap-2">
              <BookOpen size={20} strokeWidth={2.5} /> Explore stories
            </Button>
          </Link>
        </div>

        {/* Value tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-6">
          {VALUES.map((t) => (
            <div
              key={t.k}
              className={`${t.bg} ${t.rot} border-2 border-pencil shadow-hard px-4 py-5 text-center wobbly-tag`}
            >
              <div className="font-heading text-3xl text-pencil leading-none">{t.k}</div>
              <div className="font-body text-sm text-pencil/70 mt-1">{t.v}</div>
            </div>
          ))}
        </div>
      </section>

      <Squiggle color="#2d5da1" />

      {/* What is Scribble */}
      <section className="max-w-3xl mx-auto grid md:grid-cols-[1.4fr_0.8fr] gap-8 items-start">
        <div className="space-y-4">
          <SectionTitle kicker="the story" kickerColor="text-accent">What is Scribble?</SectionTitle>
          <p className="font-body text-lg leading-relaxed text-pencil/80">
            Scribble is a <span className="bg-highlight px-1">no-fuss writing platform</span>. Open the editor,
            write your piece, hit publish — your words get a clean page, a shareable link, and a place in readers’ feeds.
          </p>
          <p className="font-body text-lg leading-relaxed text-pencil/80">
            Follow writers you love, save stories to a <span className="bg-sky px-1">reading list</span>, clap for the
            good ones, and when you’re ready to go further, wire it all up with the <span className="bg-blush px-1">API &amp; webhooks</span>.
          </p>
        </div>
        <div className="relative bg-postit border-2 border-pencil shadow-hard p-5 rotate-2 wobbly-md">
          <Tack className="-top-2 left-1/2 -ml-2" />
          <div className="font-heading text-lg text-pencil mb-1">no distractions ✏</div>
          <p className="font-body text-sm text-pencil/70 leading-relaxed">
            No trackers on your reading. No ads on your words. Just you, a pencil, and a blank page.
          </p>
        </div>
      </section>

      <Squiggle color="#ff4d4d" />

      {/* Features grid */}
      <section>
        <SectionTitle kicker="everything in the box" kickerColor="text-ink">What you can do</SectionTitle>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {FEATURES.map(({ icon: Icon, title, desc, bg, rot }) => (
            <div key={title} className={`relative ${bg} ${rot} border-2 border-pencil shadow-hard p-5 wobbly-md`}>
              <Tack className="-top-2 left-1/2 -ml-2" />
              <div className="flex items-center gap-2 font-heading text-lg text-pencil mb-1">
                <Icon size={20} strokeWidth={2.5} /> {title}
              </div>
              <p className="font-body text-sm text-pencil/70 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured stories */}
      {featured.length > 0 && (
        <>
          <Squiggle color="#2d5da1" />
          <section>
            <SectionTitle kicker="fresh off the page" kickerColor="text-accent">Featured stories</SectionTitle>
            <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
              {featured.map((post, i) => (
                <PostCard key={post._id} post={post} index={i} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/explore">
                <Button variant="secondary" className="inline-flex items-center gap-2">
                  Browse all stories <ArrowRight size={18} strokeWidth={2.5} />
                </Button>
              </Link>
            </div>
          </section>
        </>
      )}

      <Squiggle color="#ff4d4d" />

      {/* FAQ */}
      <section className="max-w-2xl mx-auto">
        <SectionTitle kicker="scribbled questions" kickerColor="text-ink">Things people ask</SectionTitle>
        <div className="space-y-4">
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={f.q} className="bg-white border-2 border-pencil shadow-hard-sm overflow-hidden wobbly-tag">
                <button
                  onClick={() => setOpenFaq(open ? -1 : i)}
                  className={`w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-body text-pencil transition-colors ${open ? 'bg-highlight' : 'hover:bg-muted/40'}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-heading text-accent">Q.</span> {f.q}
                  </span>
                  <Plus size={18} strokeWidth={2.5} className={`shrink-0 transition-transform ${open ? 'rotate-45' : ''}`} />
                </button>
                {open && (
                  <p className="font-body text-sm text-pencil/70 leading-relaxed px-5 py-4 border-t-2 border-dashed border-pencil/20">
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative bg-highlight border-2 border-pencil shadow-hard p-10 text-center wobbly-md overflow-hidden">
        <div className="doodle absolute top-6 left-8 w-14 h-14 border-[3px] border-dashed border-pencil rounded-full hidden sm:block" aria-hidden />
        <h2 className="font-heading text-3xl sm:text-5xl text-pencil leading-tight">Close the tab. Open the editor.</h2>
        <p className="font-body text-lg text-pencil/70 max-w-md mx-auto mt-3 mb-6">
          One account, then every idea you have gets a page of its own.
        </p>
        <Link to="/register">
          <Button size="lg" className="inline-flex items-center gap-2">
            <PenLine size={20} strokeWidth={2.5} /> Start writing today
          </Button>
        </Link>
      </section>
    </div>
  );
};
