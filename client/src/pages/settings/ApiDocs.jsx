import React, { useState } from 'react';
import { BookOpen, Copy, Check } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';

const CopyBox = ({ value, mono = true }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };
  return (
    <div className="flex items-stretch gap-2">
      <code
        className={`flex-1 px-3 py-2 bg-muted/40 border-2 border-pencil text-pencil text-sm break-all ${mono ? 'font-mono' : 'font-body'}`}
        style={{ borderRadius: '9px 3px 8px 3px / 3px 8px 3px 9px' }}
      >
        {value}
      </code>
      <button
        type="button"
        onClick={copy}
        className="px-3 border-2 border-pencil bg-white hover:bg-muted transition-colors"
        style={{ borderRadius: '9px 3px 8px 3px / 3px 8px 3px 9px' }}
        aria-label="Copy"
      >
        {copied ? <Check size={16} strokeWidth={2.5} className="text-ink" /> : <Copy size={16} strokeWidth={2.5} />}
      </button>
    </div>
  );
};

const Code = ({ children }) => (
  <pre
    className="font-mono text-xs text-paper bg-pencil p-4 overflow-x-auto"
    style={{ borderRadius: '9px 3px 8px 3px / 3px 8px 3px 9px' }}
  >
    {children}
  </pre>
);

const Method = ({ verb, path, auth }) => (
  <li className="flex items-center gap-2">
    <span className="text-ink font-mono text-sm w-16 shrink-0">{verb}</span>
    <span className="font-mono text-sm text-pencil/80">{path}</span>
    {auth && <span className="font-body text-xs text-pencil/50">(auth)</span>}
  </li>
);

export const ApiDocs = () => {
  const baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1`;

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-10 h-10 flex items-center justify-center bg-postit border-2 border-pencil rounded-full">
            <BookOpen size={18} strokeWidth={2.5} />
          </span>
          <div>
            <h2 className="font-heading text-2xl text-pencil">API Documentation</h2>
            <p className="font-body text-sm text-pencil/60">
              The public REST API lets you manage your posts programmatically using HTTP Basic Auth.
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-heading text-sm text-pencil">Base URL</p>
          <CopyBox value={baseUrl} />
        </div>
      </Card>

      <Card className="space-y-3">
        <h3 className="font-heading text-xl text-pencil">Authentication</h3>
        <p className="font-body text-sm text-pencil/70">
          Send your <strong>API Key</strong> as the username and your <strong>API Secret</strong> as the
          password using HTTP Basic Auth. Generate them in the <strong>API Settings</strong> tab and make
          sure access is <strong>Enabled</strong>.
        </p>
        <Code>{`Authorization: Basic base64(API_KEY:API_SECRET)`}</Code>
        <p className="font-body text-xs text-pencil/50">
          Most HTTP clients build this header for you (e.g. cURL's <code>-u</code> flag).
        </p>
      </Card>

      <Card className="space-y-3">
        <h3 className="font-heading text-xl text-pencil">Endpoints</h3>
        <ul className="space-y-2">
          <Method verb="GET" path="/posts" />
          <Method verb="GET" path="/posts/:slug" />
          <Method verb="POST" path="/posts" auth />
          <Method verb="PUT" path="/posts/:id" auth />
          <Method verb="DELETE" path="/posts/:id" auth />
          <Method verb="POST" path="/posts/:id/clap" auth />
        </ul>
        <p className="font-body text-xs text-pencil/50">
          Reads (GET) are open. Writes require authentication. Every write is recorded in your Activity Log.
        </p>
      </Card>

      <Card className="space-y-4">
        <h3 className="font-heading text-xl text-pencil">Examples</h3>

        <div className="space-y-2">
          <p className="font-heading text-sm text-pencil">Create a post</p>
          <Code>{`curl -u API_KEY:API_SECRET \\
  -X POST ${baseUrl}/posts \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Hello from the API",
    "content": "Posted via the public API.",
    "status": "published",
    "tags": ["api", "demo"]
  }'`}</Code>
        </div>

        <div className="space-y-2">
          <p className="font-heading text-sm text-pencil">Update a post</p>
          <Code>{`curl -u API_KEY:API_SECRET \\
  -X PUT ${baseUrl}/posts/POST_ID \\
  -H "Content-Type: application/json" \\
  -d '{ "title": "Updated title" }'`}</Code>
        </div>

        <div className="space-y-2">
          <p className="font-heading text-sm text-pencil">Delete a post</p>
          <Code>{`curl -u API_KEY:API_SECRET \\
  -X DELETE ${baseUrl}/posts/POST_ID`}</Code>
        </div>
      </Card>

      <Card className="space-y-3">
        <h3 className="font-heading text-xl text-pencil">Request body fields (posts)</h3>
        <ul className="font-body text-sm text-pencil/80 space-y-1">
          <li><code className="font-mono">title</code> — string, optional (auto-generated if blank)</li>
          <li><code className="font-mono">content</code> — string, required</li>
          <li><code className="font-mono">format</code> — <code className="font-mono">"html"</code> | <code className="font-mono">"markdown"</code> (default html)</li>
          <li><code className="font-mono">tags</code> — array of strings, max 5</li>
          <li><code className="font-mono">status</code> — <code className="font-mono">"draft"</code> | <code className="font-mono">"published"</code></li>
        </ul>
      </Card>
    </div>
  );
};
