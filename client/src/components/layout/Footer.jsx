import React from 'react';
import { Link } from 'react-router-dom';
import { PenLine, Heart, Github, Twitter } from 'lucide-react';

const FooterLink = ({ to, children }) => (
  <li>
    <Link
      to={to}
      className="font-body text-pencil/70 hover:text-accent hover:line-through transition-colors duration-100"
    >
      {children}
    </Link>
  </li>
);

const ColHeading = ({ children }) => (
  <h3 className="font-heading text-lg text-pencil mb-3 underline decoration-wavy decoration-accent/50 underline-offset-4">
    {children}
  </h3>
);

export const Footer = () => (
  <footer className="border-t-[3px] border-dashed border-pencil bg-paper mt-16 pb-16 md:pb-0">
    <div className="w-full px-6 py-12 grid gap-10 md:grid-cols-3">
      {/* Brand */}
      <div className="space-y-3">
        <Link to="/" className="flex items-center gap-2 group w-fit">
          <PenLine
            size={26}
            strokeWidth={2.5}
            className="text-accent group-hover:rotate-12 transition-transform duration-100"
          />
          <span className="font-heading text-2xl text-pencil">Scribble</span>
        </Link>
        <p className="font-body text-pencil/70 max-w-xs leading-relaxed">
          A place to read, write, and deepen your understanding of the world — one scribble at a time.
        </p>
        <div className="flex items-center gap-3 pt-1">
          {[Github, Twitter].map((Icon, i) => (
            <a
              key={i}
              href="#"
              onClick={(e) => e.preventDefault()}
              className="w-9 h-9 flex items-center justify-center bg-white border-2 border-pencil shadow-hard-sm
                         hover:bg-accent hover:text-white hover:-rotate-6 transition-all duration-100"
              style={{ borderRadius: '60% 40% 55% 45% / 45% 55% 45% 55%' }}
              aria-label="social link"
            >
              <Icon size={16} strokeWidth={2.5} />
            </a>
          ))}
        </div>
      </div>

      {/* Explore */}
      <div>
        <ColHeading>Explore</ColHeading>
        <ul className="space-y-2">
          <FooterLink to="/">Home feed</FooterLink>
          <FooterLink to="/?tag=writing">Writing</FooterLink>
          <FooterLink to="/?tag=design">Design</FooterLink>
          <FooterLink to="/?tag=career">Career</FooterLink>
        </ul>
      </div>

      {/* Create */}
      <div>
        <ColHeading>Create</ColHeading>
        <ul className="space-y-2">
          <FooterLink to="/write">Write a story</FooterLink>
          <FooterLink to="/drafts">Your drafts</FooterLink>
          <FooterLink to="/settings/activity">Activity log</FooterLink>
          <FooterLink to="/settings/api">API settings</FooterLink>
          <FooterLink to="/settings">Settings</FooterLink>
        </ul>
      </div>
    </div>

    <div className="border-t-2 border-dashed border-pencil/40">
      <div className="w-full px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="font-body text-sm text-pencil/60">
          © {2026} Scribble. All scribbles reserved.
        </p>
        <p className="font-body text-sm text-pencil/60 flex items-center gap-1">
          Made with
          <Heart size={14} strokeWidth={2.5} className="text-accent" fill="currentColor" />
          and a pencil
          <span className="inline-block -rotate-12">✏️</span>
        </p>
      </div>
    </div>
  </footer>
);
