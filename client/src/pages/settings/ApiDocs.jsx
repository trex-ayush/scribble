import React, { useState } from 'react';
import { BookOpen, Copy, Check, ChevronDown, ChevronRight, Lock, Unlock } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';

const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1`;

/* ─── tiny helpers ─────────────────────────────────────────────────────────── */

const useCopy = () => {
  const [copied, setCopied] = useState(false);
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };
  return [copied, copy];
};

const CopyBtn = ({ text }) => {
  const [copied, copy] = useCopy();
  return (
    <button onClick={() => copy(text)} className="shrink-0 text-paper/60 hover:text-paper transition-colors" aria-label="Copy">
      {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2.5} />}
    </button>
  );
};

const CodeBlock = ({ children, lang = '' }) => (
  <div className="relative group">
    <div className="flex items-center justify-between px-3 py-1.5 bg-pencil/80 border-b border-white/10">
      <span className="font-mono text-[10px] text-paper/50 uppercase tracking-wider">{lang}</span>
      <CopyBtn text={children} />
    </div>
    <pre className="font-mono text-xs text-paper p-4 overflow-x-auto bg-pencil leading-relaxed">{children}</pre>
  </div>
);

const Badge = ({ method }) => {
  const colors = {
    GET: 'bg-ink/20 text-ink border-ink/40',
    POST: 'bg-green-100 text-green-700 border-green-300',
    PUT: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    DELETE: 'bg-red-100 text-red-600 border-red-300',
  };
  return (
    <span className={`shrink-0 inline-block px-2 py-0.5 font-mono text-xs font-bold border rounded ${colors[method]}`}>
      {method}
    </span>
  );
};

const AuthBadge = ({ required }) => (
  <span className={`flex items-center gap-1 text-xs font-body px-2 py-0.5 border rounded ${required ? 'text-accent border-accent/40 bg-accent/5' : 'text-pencil/50 border-pencil/20'}`}>
    {required ? <Lock size={11} strokeWidth={2.5} /> : <Unlock size={11} strokeWidth={2.5} />}
    {required ? 'Basic Auth' : 'Open'}
  </span>
);

/* ─── field table ───────────────────────────────────────────────────────────── */

const FieldTable = ({ fields }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm font-body">
      <thead>
        <tr className="border-b-2 border-dashed border-pencil/20">
          <th className="text-left py-2 pr-4 font-heading text-pencil/70 text-xs">Field</th>
          <th className="text-left py-2 pr-4 font-heading text-pencil/70 text-xs">Type</th>
          <th className="text-left py-2 pr-4 font-heading text-pencil/70 text-xs">Required</th>
          <th className="text-left py-2 font-heading text-pencil/70 text-xs">Description</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((f) => (
          <tr key={f.name} className="border-b border-pencil/10">
            <td className="py-2 pr-4"><code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{f.name}</code></td>
            <td className="py-2 pr-4 font-mono text-xs text-ink">{f.type}</td>
            <td className="py-2 pr-4">
              <span className={`text-xs ${f.required ? 'text-accent font-bold' : 'text-pencil/40'}`}>
                {f.required ? 'Yes' : 'No'}
              </span>
            </td>
            <td className="py-2 text-pencil/70 text-xs">{f.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ─── collapsible endpoint card ─────────────────────────────────────────────── */

const EndpointCard = ({ method, path, summary, auth, params, body, response, curl }) => {
  const [open, setOpen] = useState(false);
  const fullUrl = `${BASE_URL}${path}`;

  return (
    <div className="border-2 border-pencil overflow-hidden" style={{ borderRadius: '12px 4px 12px 4px / 4px 12px 4px 12px' }}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-muted/40 transition-colors text-left"
      >
        <Badge method={method} />
        <code className="font-mono text-sm text-pencil flex-1">{path}</code>
        <AuthBadge required={auth} />
        <span className="hidden sm:block font-body text-xs text-pencil/50 flex-1 text-right pr-2">{summary}</span>
        {open ? <ChevronDown size={16} strokeWidth={2.5} className="shrink-0 text-pencil/50" /> : <ChevronRight size={16} strokeWidth={2.5} className="shrink-0 text-pencil/50" />}
      </button>

      {open && (
        <div className="border-t-2 border-dashed border-pencil/20 divide-y divide-dashed divide-pencil/10">
          {/* Summary + URL */}
          <div className="px-4 py-3 bg-muted/20 space-y-2">
            <p className="font-body text-sm text-pencil/70">{summary}</p>
            <div className="flex items-center gap-2 bg-pencil/5 border border-pencil/20 rounded px-3 py-1.5">
              <span className="font-mono text-xs text-pencil/50 shrink-0">{method}</span>
              <code className="font-mono text-xs text-pencil flex-1 break-all">{fullUrl}</code>
              <CopyBtn text={fullUrl} />
            </div>
          </div>

          {/* Path / Query params */}
          {params && (
            <div className="px-4 py-3 space-y-2">
              <p className="font-heading text-sm text-pencil">Parameters</p>
              <FieldTable fields={params} />
            </div>
          )}

          {/* Request body */}
          {body && (
            <div className="px-4 py-3 space-y-2">
              <p className="font-heading text-sm text-pencil">Request Body <span className="font-body text-xs text-pencil/50 font-normal">application/json</span></p>
              <FieldTable fields={body} />
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="px-4 py-3 space-y-2">
              <p className="font-heading text-sm text-pencil">Response</p>
              <CodeBlock lang="json">{response}</CodeBlock>
            </div>
          )}

          {/* cURL example */}
          {curl && (
            <div className="px-4 py-3 space-y-2">
              <p className="font-heading text-sm text-pencil">Example (cURL)</p>
              <CodeBlock lang="bash">{curl}</CodeBlock>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── endpoint definitions ───────────────────────────────────────────────────── */

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/posts',
    summary: 'List all published posts with optional filtering and pagination.',
    auth: false,
    params: [
      { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
      { name: 'limit', type: 'number', required: false, description: 'Results per page: 10, 15, 20, 30, 50 (default: 10)' },
      { name: 'tag', type: 'string', required: false, description: 'Filter posts by tag slug' },
      { name: 'search', type: 'string', required: false, description: 'Search in title and excerpt' },
    ],
    response: `{
  "success": true,
  "data": {
    "posts": [
      {
        "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
        "title": "Getting Started with MERN",
        "slug": "getting-started-with-mern-b8c9d0e1",
        "excerpt": "A short preview of the post...",
        "format": "html",
        "tags": ["mern", "javascript"],
        "readingTime": 5,
        "author": { "username": "ayush", "name": "Ayush" },
        "createdAt": "2026-05-30T10:00:00.000Z"
      }
    ],
    "total": 42,
    "page": 1,
    "pages": 5,
    "perPage": 10
  }
}`,
    curl: `curl "${BASE_URL}/posts?page=1&limit=10&tag=javascript"`,
  },
  {
    method: 'GET',
    path: '/posts/:slug',
    summary: 'Get a single published post by its slug.',
    auth: false,
    params: [
      { name: 'slug', type: 'string', required: true, description: 'The post slug (from the URL or list response)' },
    ],
    response: `{
  "success": true,
  "data": {
    "post": {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
      "title": "Getting Started with MERN",
      "slug": "getting-started-with-mern-b8c9d0e1",
      "content": "<p>Full post content here...</p>",
      "format": "html",
      "tags": ["mern", "javascript"],
      "readingTime": 5,
      "claps": [],
      "author": { "username": "ayush", "name": "Ayush" },
      "createdAt": "2026-05-30T10:00:00.000Z"
    }
  }
}`,
    curl: `curl "${BASE_URL}/posts/getting-started-with-mern-b8c9d0e1"`,
  },
  {
    method: 'POST',
    path: '/posts',
    summary: 'Create a new post. Requires Basic Auth.',
    auth: true,
    body: [
      { name: 'title', type: 'string', required: false, description: 'Post title — auto-generated from content if omitted' },
      { name: 'content', type: 'string', required: true, description: 'Post body (HTML or Markdown depending on format)' },
      { name: 'format', type: 'string', required: false, description: '"html" (default) or "markdown"' },
      { name: 'tags', type: 'string[]', required: false, description: 'Array of tag slugs, max 5' },
      { name: 'status', type: 'string', required: false, description: '"draft" or "published" (default: "draft")' },
    ],
    response: `{
  "success": true,
  "statusCode": 201,
  "data": {
    "post": {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
      "title": "My New Post",
      "slug": "my-new-post-b8c9d0e1",
      "content": "<p>Hello world</p>",
      "format": "html",
      "tags": ["api"],
      "status": "published",
      "readingTime": 1,
      "author": "64a1b2c3d4e5f6a7b8c9d0e0",
      "createdAt": "2026-05-30T10:00:00.000Z"
    }
  },
  "message": "Post created"
}`,
    curl: `curl -u API_KEY:API_SECRET \\
  -X POST ${BASE_URL}/posts \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "My New Post",
    "content": "<p>Hello world</p>",
    "format": "html",
    "tags": ["api"],
    "status": "published"
  }'`,
  },
  {
    method: 'PUT',
    path: '/posts/:id',
    summary: 'Update an existing post. Only the post author can update. Requires Basic Auth.',
    auth: true,
    params: [
      { name: 'id', type: 'string', required: true, description: 'MongoDB ObjectId of the post' },
    ],
    body: [
      { name: 'title', type: 'string', required: false, description: 'New title' },
      { name: 'content', type: 'string', required: false, description: 'New post body' },
      { name: 'format', type: 'string', required: false, description: '"html" or "markdown"' },
      { name: 'tags', type: 'string[]', required: false, description: 'Replace tags array (max 5)' },
      { name: 'status', type: 'string', required: false, description: '"draft" or "published"' },
    ],
    response: `{
  "success": true,
  "data": {
    "post": {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
      "title": "Updated Title",
      "slug": "updated-title-b8c9d0e1",
      "status": "published",
      "updatedAt": "2026-05-30T11:00:00.000Z"
    }
  },
  "message": "Post updated"
}`,
    curl: `curl -u API_KEY:API_SECRET \\
  -X PUT ${BASE_URL}/posts/64a1b2c3d4e5f6a7b8c9d0e1 \\
  -H "Content-Type: application/json" \\
  -d '{ "title": "Updated Title", "status": "published" }'`,
  },
  {
    method: 'DELETE',
    path: '/posts/:id',
    summary: 'Permanently delete a post. Only the post author can delete. Requires Basic Auth.',
    auth: true,
    params: [
      { name: 'id', type: 'string', required: true, description: 'MongoDB ObjectId of the post' },
    ],
    response: `HTTP 204 No Content`,
    curl: `curl -u API_KEY:API_SECRET \\
  -X DELETE ${BASE_URL}/posts/64a1b2c3d4e5f6a7b8c9d0e1`,
  },
  {
    method: 'POST',
    path: '/posts/:id/clap',
    summary: 'Toggle a clap (like) on a post. Calling again removes the clap. Requires Basic Auth.',
    auth: true,
    params: [
      { name: 'id', type: 'string', required: true, description: 'MongoDB ObjectId of the post' },
    ],
    response: `{
  "success": true,
  "data": {
    "clapped": true,
    "clapCount": 7
  }
}`,
    curl: `curl -u API_KEY:API_SECRET \\
  -X POST ${BASE_URL}/posts/64a1b2c3d4e5f6a7b8c9d0e1/clap`,
  },
];

const ERRORS = [
  { code: '200', text: 'OK — request succeeded' },
  { code: '201', text: 'Created — resource created successfully' },
  { code: '204', text: 'No Content — deleted successfully (no body)' },
  { code: '400', text: 'Bad Request — validation failed (check request body)' },
  { code: '401', text: 'Unauthorized — missing or invalid Basic Auth credentials' },
  { code: '403', text: 'Forbidden — you do not own this resource' },
  { code: '404', text: 'Not Found — post or resource does not exist' },
  { code: '500', text: 'Internal Server Error — something went wrong on our end' },
];

/* ─── page ────────────────────────────────────────────────────────────────── */

export const ApiDocs = () => {
  const [tab, setTab] = useState('endpoints');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-10 h-10 flex items-center justify-center bg-postit border-2 border-pencil rounded-full">
            <BookOpen size={18} strokeWidth={2.5} />
          </span>
          <div>
            <h2 className="font-heading text-2xl text-pencil">API Documentation</h2>
            <p className="font-body text-sm text-pencil/60">
              REST API using HTTP Basic Auth. Use your API Key as username and API Secret as password.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted/40 border-2 border-pencil px-3 py-2" style={{ borderRadius: '9px 3px 8px 3px / 3px 8px 3px 9px' }}>
          <span className="font-body text-xs text-pencil/50 shrink-0">Base URL</span>
          <code className="font-mono text-sm text-pencil flex-1 break-all">{BASE_URL}</code>
          <CopyBtn text={BASE_URL} />
        </div>

        <div className="flex items-center gap-2 font-body text-xs text-pencil/60">
          <Lock size={12} strokeWidth={2.5} className="text-accent" />
          Write endpoints require <code className="font-mono bg-muted px-1 rounded">Authorization: Basic base64(API_KEY:API_SECRET)</code>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b-2 border-pencil">
        {['endpoints', 'auth', 'errors'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-4 py-2 font-body text-sm capitalize transition-colors',
              tab === t
                ? 'border-2 border-b-0 border-pencil bg-white text-pencil -mb-0.5'
                : 'text-pencil/50 hover:text-pencil',
            ].join(' ')}
          >
            {t === 'endpoints' ? 'Endpoints' : t === 'auth' ? 'Authentication' : 'Status Codes'}
          </button>
        ))}
      </div>

      {/* Endpoints tab */}
      {tab === 'endpoints' && (
        <div className="space-y-3">
          <p className="font-body text-xs text-pencil/50">Click an endpoint to expand details, parameters, and examples.</p>
          {ENDPOINTS.map((ep) => (
            <EndpointCard key={`${ep.method}-${ep.path}`} {...ep} />
          ))}
        </div>
      )}

      {/* Auth tab */}
      {tab === 'auth' && (
        <div className="space-y-4">
          <Card className="space-y-3">
            <h3 className="font-heading text-xl text-pencil">HTTP Basic Authentication</h3>
            <p className="font-body text-sm text-pencil/70">
              Write endpoints require an <code className="font-mono text-xs bg-muted px-1 rounded">Authorization</code> header
              with your <strong>API Key</strong> (username) and <strong>API Secret</strong> (password) encoded in Base64.
            </p>
            <CodeBlock lang="http">{`Authorization: Basic base64(API_KEY:API_SECRET)`}</CodeBlock>

            <div className="space-y-2">
              <p className="font-heading text-sm text-pencil">cURL (automatic)</p>
              <CodeBlock lang="bash">{`curl -u YOUR_API_KEY:YOUR_API_SECRET \\
  -X POST ${BASE_URL}/posts \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Hello","content":"World","status":"published"}'`}</CodeBlock>
            </div>

            <div className="space-y-2">
              <p className="font-heading text-sm text-pencil">JavaScript (fetch)</p>
              <CodeBlock lang="javascript">{`const response = await fetch('${BASE_URL}/posts', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa('YOUR_API_KEY:YOUR_API_SECRET'),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Hello from JS',
    content: 'Posted via fetch API',
    status: 'published',
  }),
});
const data = await response.json();`}</CodeBlock>
            </div>

            <div className="space-y-2">
              <p className="font-heading text-sm text-pencil">Python (requests)</p>
              <CodeBlock lang="python">{`import requests

response = requests.post(
    '${BASE_URL}/posts',
    auth=('YOUR_API_KEY', 'YOUR_API_SECRET'),
    json={
        'title': 'Hello from Python',
        'content': 'Posted via requests library',
        'status': 'published',
    }
)
print(response.json())`}</CodeBlock>
            </div>

            <div className="p-3 bg-postit/60 border-2 border-pencil/30 font-body text-sm text-pencil/70 space-y-1" style={{ borderRadius: '9px 3px 8px 3px / 3px 8px 3px 9px' }}>
              <p className="font-heading text-sm text-pencil">Where to find your credentials</p>
              <p>Settings → <strong>API Settings</strong> → Generate credentials. Make sure access is <strong>Enabled</strong>.</p>
            </div>
          </Card>
        </div>
      )}

      {/* Status codes tab */}
      {tab === 'errors' && (
        <Card className="space-y-3">
          <h3 className="font-heading text-xl text-pencil">HTTP Status Codes</h3>
          <div className="divide-y divide-dashed divide-pencil/20">
            {ERRORS.map((e) => (
              <div key={e.code} className="flex items-start gap-4 py-2.5">
                <code className={`font-mono text-sm font-bold shrink-0 w-10 ${
                  e.code.startsWith('2') ? 'text-ink' : e.code.startsWith('4') ? 'text-accent' : 'text-pencil/60'
                }`}>{e.code}</code>
                <span className="font-body text-sm text-pencil/70">{e.text}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <p className="font-heading text-sm text-pencil">Error response shape</p>
            <CodeBlock lang="json">{`{
  "success": false,
  "statusCode": 401,
  "message": "Invalid API credentials",
  "errors": []
}`}</CodeBlock>
          </div>
        </Card>
      )}
    </div>
  );
};
