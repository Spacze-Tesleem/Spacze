'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Loader2, ChevronDown, ChevronRight,
  Wrench, CheckCircle2, XCircle, Zap, Sparkles, RotateCcw,
  Copy, Check, Terminal, Activity, Cpu, Globe, Mail,
  MessageCircle, Database, BarChart2, Play, Layers,
} from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

// ── Types ─────────────────────────────────────────────────────────────────────
type ToolStatus = 'running' | 'done' | 'error';

interface ToolCallDisplay {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: ToolStatus;
}

interface MsgPart {
  type: string;
  text?: string;
  toolCallId?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  state?: string;
}

interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts?: MsgPart[];
  toolInvocations?: Array<{
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    result?: unknown;
    state: string;
  }>;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const ACCENT = '#00D67D';

const TOOL_LABELS: Record<string, string> = {
  getLeads:         'Fetching leads',
  analyzeLead:      'Analysing website',
  generateCopy:     'Generating copy',
  sendEmail:        'Sending email',
  sendWhatsApp:     'Sending WhatsApp',
  updateLead:       'Updating CRM',
  createCampaign:   'Creating campaign',
  getCampaignStats: 'Fetching stats',
  processQueue:     'Processing queue',
};

const TOOL_ICONS: Record<string, React.ElementType> = {
  getLeads:         Database,
  analyzeLead:      Globe,
  generateCopy:     Sparkles,
  sendEmail:        Mail,
  sendWhatsApp:     MessageCircle,
  updateLead:       CheckCircle2,
  createCampaign:   Zap,
  getCampaignStats: BarChart2,
  processQueue:     Layers,
};

const TOOL_COLORS: Record<string, string> = {
  getLeads:         '#60a5fa',
  analyzeLead:      '#a78bfa',
  generateCopy:     ACCENT,
  sendEmail:        '#60a5fa',
  sendWhatsApp:     '#25D366',
  updateLead:       ACCENT,
  createCampaign:   '#f59e0b',
  getCampaignStats: '#38bdf8',
  processQueue:     '#f59e0b',
};

const SUGGESTIONS = [
  'Show me all pending leads',
  'Run outreach for all pending logistics leads',
  'Analyse the top 3 leads by score',
  'Create a campaign for the top 5 leads',
  'How are my campaigns performing?',
  'Process the outreach queue',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatToolArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return '';
  return entries
    .map(([k, v]) => {
      const val = Array.isArray(v) ? `[${(v as unknown[]).length}]` : String(v).slice(0, 40);
      return `${k}=${val}`;
    })
    .join('  ');
}

function formatResult(result: unknown): string {
  if (result === null || result === undefined) return '—';
  if (typeof result === 'string') return result;
  try {
    const str = JSON.stringify(result, null, 2);
    return str.length > 500 ? str.slice(0, 500) + '\n…' : str;
  } catch { return String(result); }
}

// ── Tool Log Card (right sidebar) ────────────────────────────────────────────
function ToolLogCard({ call, index }: { call: ToolCallDisplay; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon  = TOOL_ICONS[call.toolName]  ?? Wrench;
  const label = TOOL_LABELS[call.toolName] ?? call.toolName;
  const color = TOOL_COLORS[call.toolName] ?? '#71717a';
  const args  = formatToolArgs(call.args);

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl border overflow-hidden"
      style={{ background: '#0d0d14', borderColor: '#1e1e2e' }}
    >
      <button
        onClick={() => call.result !== undefined && setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left group"
      >
        {/* status indicator */}
        <div className="flex-shrink-0">
          {call.status === 'running' && <Loader2 size={11} className="animate-spin" style={{ color }} />}
          {call.status === 'done'    && <CheckCircle2 size={11} style={{ color: ACCENT }} />}
          {call.status === 'error'   && <XCircle size={11} className="text-red-400" />}
        </div>

        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
          <Icon size={10} style={{ color }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold leading-tight" style={{ color: call.status === 'done' ? '#c0c0d0' : color }}>{label}</p>
          {args && <p className="text-[9px] font-mono mt-0.5 truncate" style={{ color: '#4a4a6a' }}>{args}</p>}
        </div>

        {call.result !== undefined && (
          <div className="flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
            {expanded ? <ChevronDown size={10} style={{ color: '#6b6b8a' }} /> : <ChevronRight size={10} style={{ color: '#6b6b8a' }} />}
          </div>
        )}
      </button>

      <AnimatePresence>
        {expanded && call.result !== undefined && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <pre className="px-3 pb-3 pt-2 font-mono text-[9px] leading-relaxed whitespace-pre-wrap break-all border-t"
              style={{ color: '#5a5a7a', borderColor: '#1e1e2e' }}>
              {formatResult(call.result)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
// ── Thought Block ─────────────────────────────────────────────────────────────
function ThoughtBlock({ content }: { content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border overflow-hidden mb-2" style={{ background: '#0e0e1c', borderColor: '#2a2a4a' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <Cpu size={10} style={{ color: '#7c6fcd' }} />
        <span className="text-[10px] font-bold uppercase tracking-widest flex-1" style={{ color: '#7c6fcd' }}>Internal Monologue</span>
        {open ? <ChevronDown size={10} style={{ color: '#7c6fcd' }} /> : <ChevronRight size={10} style={{ color: '#7c6fcd' }} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <pre className="px-3 pb-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap border-t"
              style={{ color: '#9d8fdf', borderColor: '#2a2a4a' }}>
              {content}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Copy Button ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1 rounded transition-colors"
      style={{ color: copied ? ACCENT : '#4a4a6a' }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}
// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isStreaming }: { msg: UIMessage; isStreaming?: boolean }) {
  const isUser = msg.role === 'user';

  // Collect tool calls
  const toolCalls: ToolCallDisplay[] = [];
  if (msg.parts) {
    for (const p of msg.parts) {
      if (p.type === 'tool-invocation' && p.toolCallId) {
        toolCalls.push({ toolCallId: p.toolCallId, toolName: p.toolName ?? '', args: p.args ?? {}, result: p.result, status: p.state === 'result' ? 'done' : 'running' });
      }
    }
  } else if (msg.toolInvocations) {
    for (const inv of msg.toolInvocations) {
      toolCalls.push({ toolCallId: inv.toolCallId, toolName: inv.toolName, args: inv.args, result: inv.result, status: inv.state === 'result' ? 'done' : 'running' });
    }
  }

  // Extract text + thought
  let raw = msg.content ?? '';
  if (!raw && msg.parts) raw = msg.parts.filter(p => p.type === 'text').map(p => p.text ?? '').join('');

  let thought = '';
  let text = raw;
  const thoughtMatch = raw.match(/<thought>([\s\S]*?)<\/thought>/i);
  if (thoughtMatch) {
    thought = thoughtMatch[1].trim();
    text = raw.replace(/<thought>[\s\S]*?<\/thought>/i, '').trim();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border"
        style={isUser
          ? { background: '#1e3a5f', borderColor: '#2a4a7f' }
          : { background: `${ACCENT}18`, borderColor: `${ACCENT}30` }
        }
      >
        {isUser
          ? <User size={12} style={{ color: '#60a5fa' }} />
          : <Bot size={12} style={{ color: ACCENT }} />
        }
      </div>

      <div className={`flex flex-col gap-1.5 max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Thought block */}
        {thought && <ThoughtBlock content={thought} />}

        {/* Tool calls (inline, compact) */}
        {toolCalls.length > 0 && (
          <div className="w-full space-y-1">
            {toolCalls.map(tc => {
              const Icon  = TOOL_ICONS[tc.toolName]  ?? Wrench;
              const label = TOOL_LABELS[tc.toolName] ?? tc.toolName;
              const color = TOOL_COLORS[tc.toolName] ?? '#71717a';
              return (
                <div key={tc.toolCallId}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px]"
                  style={{ background: '#0d0d14', borderColor: '#1e1e2e' }}>
                  {tc.status === 'running' && <Loader2 size={10} className="animate-spin flex-shrink-0" style={{ color }} />}
                  {tc.status === 'done'    && <CheckCircle2 size={10} className="flex-shrink-0" style={{ color: ACCENT }} />}
                  {tc.status === 'error'   && <XCircle size={10} className="flex-shrink-0 text-red-400" />}
                  <Icon size={9} style={{ color }} className="flex-shrink-0" />
                  <span className="font-mono" style={{ color: '#6b6b8a' }}>{label}</span>
                  {Object.keys(tc.args).length > 0 && (
                    <span className="truncate font-mono" style={{ color: '#3a3a5a' }}>{formatToolArgs(tc.args)}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Text bubble */}
        {(text || isStreaming) && (
          <div
            className="relative group rounded-2xl px-4 py-3 text-[13px] leading-relaxed"
            style={isUser
              ? { background: '#1a2a4a', border: '1px solid #2a3a6a', color: '#c8d8f0' }
              : { background: '#111118', border: '1px solid #1e1e2e', color: '#d0d0e0' }
            }
          >
            {text
              ? text.split('\n').map((line, i, arr) => (
                  <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
                ))
              : null}
            {isStreaming && (
              <span className="inline-block w-1.5 h-3.5 ml-0.5 rounded-sm animate-pulse align-middle" style={{ background: ACCENT }} />
            )}
            {!isUser && text && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text={text} />
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
// ── Main Panel ────────────────────────────────────────────────────────────────
export default function AgentPanel() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/agent' }),
  });

  const isLoading = status === 'streaming' || status === 'submitted';
  const uiMessages = messages as unknown as UIMessage[];
  const isEmpty = uiMessages.length === 0;

  // Aggregate all tool calls for the workflow sidebar
  const allToolCalls = useMemo<ToolCallDisplay[]>(() => {
    const calls: ToolCallDisplay[] = [];
    for (const msg of uiMessages) {
      if (msg.parts) {
        for (const p of msg.parts) {
          if (p.type === 'tool-invocation' && p.toolCallId) {
            calls.push({ toolCallId: p.toolCallId, toolName: p.toolName ?? '', args: p.args ?? {}, result: p.result, status: p.state === 'result' ? 'done' : 'running' });
          }
        }
      } else if (msg.toolInvocations) {
        for (const inv of msg.toolInvocations) {
          calls.push({ toolCallId: inv.toolCallId, toolName: inv.toolName, args: inv.args, result: inv.result, status: inv.state === 'result' ? 'done' : 'running' });
        }
      }
    }
    return calls;
  }, [uiMessages]);

  const doneCount    = allToolCalls.filter(t => t.status === 'done').length;
  const runningCount = allToolCalls.filter(t => t.status === 'running').length;
  const errorCount   = allToolCalls.filter(t => t.status === 'error').length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const submit = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    sendMessage({ text });
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }, [submit]);

  return (
    <div
      className="flex h-[calc(100vh-140px)] overflow-hidden rounded-2xl border"
      style={{ background: '#080810', borderColor: '#1a1a2e' }}
    >
      {/* ══ MAIN CHAT AREA ═══════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 border-r" style={{ borderColor: '#1a1a2e' }}>

        {/* IDE-style tab bar */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 h-10 border-b"
          style={{ background: '#0d0d18', borderColor: '#1a1a2e' }}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span style={{ color: '#3a3a5a' }}>agent/</span>
            <span style={{ color: ACCENT }}>marketing-workstation</span>
            {isLoading && (
              <span className="ml-2 flex items-center gap-1" style={{ color: '#f59e0b' }}>
                <Loader2 size={9} className="animate-spin" />
                <span className="text-[9px]">running</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEmpty && (
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono transition-colors"
                style={{ color: '#3a3a5a', background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#6b6b8a')}
                onMouseLeave={e => (e.currentTarget.style.color = '#3a3a5a')}
              >
                <RotateCcw size={9} /> clear
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full gap-8 py-12"
            >
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border"
                  style={{ background: `${ACCENT}12`, borderColor: `${ACCENT}25` }}
                >
                  <Terminal size={26} style={{ color: ACCENT }} />
                </div>
                <h3 className="font-bold text-[15px] mb-1" style={{ color: '#c0c0d8' }}>Marketing Workstation</h3>
                <p className="text-[12px] max-w-xs text-center leading-relaxed" style={{ color: '#3a3a5a' }}>
                  Give me a goal. I'll plan the steps, use the right tools, and execute — no hand-holding needed.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    className="px-3 py-1.5 rounded-full text-[11px] border font-mono transition-all"
                    style={{ color: '#4a4a6a', borderColor: '#1e1e2e', background: '#0d0d18' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${ACCENT}40`; e.currentTarget.style.color = ACCENT; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.color = '#4a4a6a'; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {uiMessages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {isLoading && (uiMessages.length === 0 || uiMessages[uiMessages.length - 1]?.role === 'user') && (
            <MessageBubble msg={{ id: '__streaming__', role: 'assistant', content: '' }} isStreaming />
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border text-[12px] text-red-400"
              style={{ background: '#1a0808', borderColor: '#3a1010' }}
            >
              <XCircle size={14} className="flex-shrink-0" />
              <span className="flex-1">{error.message}</span>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 p-4 border-t" style={{ borderColor: '#1a1a2e' }}>
          <div
            className="flex items-end gap-3 rounded-xl border p-3 transition-colors"
            style={{ background: '#0d0d18', borderColor: '#1e1e2e' }}
            onFocus={() => {}}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Give me a goal — e.g. 'Run outreach for all pending logistics leads'"
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent resize-none outline-none text-[13px] leading-relaxed max-h-32 overflow-y-auto disabled:opacity-40 font-mono"
              style={{ color: '#c0c0d8', minHeight: '24px' }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 128) + 'px';
              }}
            />
            <button
              onClick={submit}
              disabled={!input.trim() || isLoading}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
              style={{ background: ACCENT }}
            >
              {isLoading
                ? <Loader2 size={13} className="animate-spin text-black" />
                : <Send size={12} className="text-black" />
              }
            </button>
          </div>
          <p className="text-[9px] font-mono text-center mt-2" style={{ color: '#2a2a3a' }}>
            Enter to send · Shift+Enter for new line · Agent may take multiple steps
          </p>
        </div>
      </div>

      {/* ══ WORKFLOW SIDEBAR ═════════════════════════════════════════════════ */}
      <div className="w-[280px] flex-shrink-0 flex flex-col" style={{ background: '#0a0a14' }}>

        {/* Sidebar header */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 h-10 border-b"
          style={{ background: '#0d0d18', borderColor: '#1a1a2e' }}
        >
          <div className="flex items-center gap-2">
            <Activity size={11} style={{ color: ACCENT }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: '#3a3a5a' }}>Workflow</span>
          </div>
          {/* live counters */}
          <div className="flex items-center gap-2 text-[9px] font-mono">
            {runningCount > 0 && (
              <span className="flex items-center gap-1" style={{ color: '#f59e0b' }}>
                <Loader2 size={8} className="animate-spin" />{runningCount}
              </span>
            )}
            {doneCount > 0 && (
              <span style={{ color: ACCENT }}>{doneCount} done</span>
            )}
            {errorCount > 0 && (
              <span className="text-red-400">{errorCount} err</span>
            )}
          </div>
        </div>

        {/* Tool log */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {allToolCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-10">
              <Layers size={20} style={{ color: '#1e1e2e' }} />
              <p className="text-[10px] font-mono" style={{ color: '#2a2a3a' }}>Waiting for agent activity…</p>
            </div>
          ) : (
            allToolCalls.map((tc, i) => (
              <ToolLogCard key={tc.toolCallId} call={tc} index={i} />
            ))
          )}
        </div>

        {/* Sidebar footer: session stats */}
        {allToolCalls.length > 0 && (
          <div
            className="flex-shrink-0 px-4 py-3 border-t grid grid-cols-3 gap-2"
            style={{ borderColor: '#1a1a2e' }}
          >
            {[
              { label: 'Total',   value: allToolCalls.length, color: '#3a3a5a' },
              { label: 'Done',    value: doneCount,           color: ACCENT },
              { label: 'Errors',  value: errorCount,          color: errorCount > 0 ? '#f87171' : '#2a2a3a' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[14px] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[8px] font-mono uppercase tracking-wider mt-0.5" style={{ color: '#2a2a3a' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
