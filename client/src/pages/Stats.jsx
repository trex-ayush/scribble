import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Eye, BookOpen, Heart, FileText } from 'lucide-react';
import { postsApi } from '../api/posts.js';
import { Card } from '../components/ui/Card.jsx';
import { Tooltip } from '../components/ui/Tooltip.jsx';

const ratio = (reads, views) => (views > 0 ? Math.round((reads / views) * 100) : 0);

const StatCard = ({ icon: Icon, label, value, sub, tooltip }) => (
  <Card className="hover:-rotate-1 transition-transform duration-100">
    <div className="flex items-center gap-2 text-pencil/60 font-body text-sm">
      <Icon size={16} strokeWidth={2.5} className="text-accent" />
      {tooltip ? <Tooltip label={tooltip}>{label}</Tooltip> : label}
    </div>
    <div className="font-heading text-3xl text-pencil mt-1">{value}</div>
    {sub && <div className="font-body text-xs text-pencil/50 mt-0.5">{sub}</div>}
  </Card>
);

const Spinner = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-pencil border-t-accent rounded-full animate-spin" />
  </div>
);

export const Stats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    postsApi
      .getAnalytics()
      .then(({ data }) => setData(data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const totals = data?.totals;
  const posts = data?.posts || [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl text-pencil flex items-center gap-2">
          <BarChart3 size={26} strokeWidth={2.5} className="text-accent" />
          Stats
        </h1>
        <p className="font-body text-pencil/60">How your published stories are performing.</p>
      </div>

      {error ? (
        <Card className="text-center py-16 space-y-2">
          <p className="font-heading text-2xl text-pencil">Couldn't load your stats</p>
          <p className="font-body text-pencil/60">Something went wrong. Please refresh to try again.</p>
        </Card>
      ) : !totals || totals.totalPosts === 0 ? (
        <Card className="text-center py-16 space-y-2">
          <p className="font-heading text-2xl text-pencil">No published stories yet</p>
          <p className="font-body text-pencil/60">
            Publish a story and your views and reads will show up here.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              icon={Eye}
              label="Unique views"
              value={totals.totalUniqueViews}
              sub={`${totals.totalViews} total`}
              tooltip="Distinct visitors — repeat visits by the same person aren't counted twice."
            />
            <StatCard
              icon={BookOpen}
              label="Reads"
              value={totals.totalReads}
              sub="finished reading"
              tooltip="Visitors who scrolled to the end of an article — counted once per visitor."
            />
            <StatCard
              icon={BarChart3}
              label="Read ratio"
              value={`${ratio(totals.totalReads, totals.totalUniqueViews)}%`}
              sub="reads / unique views"
              tooltip="Share of unique viewers who finished reading (reads ÷ unique views)."
            />
            <StatCard
              icon={Heart}
              label="Claps"
              value={totals.totalClaps}
              sub="across your stories"
              tooltip="Total claps across all your published stories."
            />
            <StatCard
              icon={FileText}
              label="Published"
              value={totals.totalPosts}
              sub="stories"
              tooltip="Number of stories you've published."
            />
          </div>

          <div className="bg-white border-2 border-pencil shadow-hard wobbly-md overflow-hidden">
            <div className="hidden md:grid grid-cols-[2.4fr_1fr_0.8fr_0.8fr_1fr] gap-4 px-6 py-3 border-b-2 border-dashed border-pencil bg-muted/30 font-heading text-sm text-pencil/70">
              <Tooltip label="Your published stories" className="justify-self-start"><span>STORY</span></Tooltip>
              <Tooltip label="Unique viewers / total page loads" className="justify-self-start"><span>VIEWS</span></Tooltip>
              <Tooltip label="Visitors who finished reading" className="justify-self-start"><span>READS</span></Tooltip>
              <Tooltip label="Total claps received" className="justify-self-start"><span>CLAPS</span></Tooltip>
              <Tooltip label="Reads ÷ unique views" className="justify-self-start"><span>READ RATIO</span></Tooltip>
            </div>
            {posts.map((p) => (
              <div
                key={p._id}
                className="grid grid-cols-1 md:grid-cols-[2.4fr_1fr_0.8fr_0.8fr_1fr] gap-2 md:gap-4 px-6 py-4 border-b border-dashed border-pencil/30 last:border-0 font-body text-sm"
              >
                <Tooltip label={p.title} className="w-full min-w-0">
                  <Link
                    to={`/post/${p.slug}`}
                    className="min-w-0 truncate text-pencil hover:text-accent transition-colors font-medium"
                  >
                    {p.title}
                  </Link>
                </Tooltip>
                <span className="text-pencil/80">
                  {p.uniqueViews}
                  <span className="text-pencil/40"> / {p.views}</span>
                </span>
                <span className="text-pencil/80">{p.reads}</span>
                <span className="text-pencil/80">{p.claps}</span>
                <span className="text-pencil/80">{ratio(p.reads, p.uniqueViews)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
