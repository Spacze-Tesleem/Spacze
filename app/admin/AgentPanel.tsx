'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Loader2, ChevronDown, ChevronRight,
  Wrench, CheckCircle2, XCircle, Zap, Sparkles, RotateCcw,
  Copy, Check, Terminal,
} from 'lucide-react';
import { useChat } from '@ai-sdk/react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ToolStatus = 'running' | 'done' | 'error';

interface ToolCallDisplay {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: ToolStatus;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  getLeads:         Zap,
  analyzeLead:      Sparkles,
  generateCopy:     Sparkles,
  sendEmail:        Send,
  sendWhatsApp:     Send,
  updateLead:       CheckCircle2,
  createCampaign:   Zap,
  getCampaignStats: Zap,
  processQueue:     Zap,
};

const ACCENT = '#00D67D';

const SUGGESTIONS = [
  'Show me all pending leads',
  'Run outreach for all pending logistics leads',
  'Create a campaign for the top 5 leads',
  'How are my campaigns performing?',
  'Process the outreach queue',
];

function formatToolArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return '';
  return entries
    .map(([k, v]) => {
      const val = Array.isArray(v) ? `[${(v as unknown[]).length} items]` : String(v);
      return `${k}: ${val}`;
    })
    .join(' · ');
}

function formatResult(result: unknown): string {
  if (result === null || result === undefined) return '—';
  if (typeof result === 'string') return result;
  try {
    const str = JSON.stringify(result, null, 2);
    return str.length > 600 ? str.slice(0, 600) + '\n…' : str;
  } catch {
    return String(result);
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ToolCallCard({ call }: { call: ToolCallDisplay }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = TOOL_ICONS[call.toolName] ?? Wrench;
  const label = TOOL_LABELS[call.toolName] ?? call.toolName;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border admin-border overflow-hidden text-[11px]"
      style={{ background: 'var(--admin-surface-2)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
      >
        {call.status === 'running' && (
          <Loader2 size={12} className="animate-spin flex-shrink-0" style={{ color: ACCENT }} />
        )}
        {call.status === 'done' && (
          <CheckCircle2 size={12} className="flex-shrink-0 text-[#00D67D]" />
        )}
        {call.status === 'error' && (
          <XCircle size={12} className="flex-shrink-0 text-red-400" />
        )}

        <Icon size={11} className="flex-shrink-0 admin-muted" />
        <span className="font-semibold admin-text flex-1">{label}</span>

        {call.args && Object.keys(call.args).length > 0 && (
          <span className="admin-muted truncate max-w-[200px]">
            {formatToolArgs(call.args)}
          </span>
        )}

        {call.result !== undefined && (
          expanded
            ? <ChevronDown size={11} className="admin-muted flex-shrink-0" />
            : <ChevronRight size={11} className="admin-muted flex-shrink-0" />
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
            <pre className="px-3 pb-3 font-mono text-[10px] admin-muted whitespace-pre-wrap break-all leading-relaxed border-t admin-border pt-2">
              {formatResult(call.result)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="p-1 rounded admin-muted hover:admin-text transition-colors"
    >
      {copied ? <Check size={12} className="text-[#00D67D]" /> : <Copy size={12} />}
    </button>
  );
}

// ── Message shape from @ai-sdk/react v3 ──────────────────────────────────────

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

function MessageBubble({ msg, isStreaming }: { msg: UIMessage; isStreaming?: boolean }) {
  const isUser = msg.role === 'user';

  // Collect tool calls from parts (v3) or toolInvocations (v2 compat)
  const toolCalls: ToolCallDisplay[] = [];
  if (msg.parts) {
    for (const p of msg.parts) {
      if (p.type === 'tool-invocation' && p.toolCallId) {
        toolCalls.push({
          toolCallId: p.toolCallId,
          toolName:   p.toolName ?? '',
          args:       p.args ?? {},
          result:     p.result,
          status:     p.state === 'result' ? 'done' : 'running',
        });
      }
    }
  } else if (msg.toolInvocations) {
    for (const inv of msg.toolInvocations) {
      toolCalls.push({
        toolCallId: inv.toolCallId,
        toolName:   inv.toolName,
        args:       inv.args,
        result:     inv.result,
        status:     inv.state === 'result' ? 'done' : 'running',
      });
    }
  }

  // Extract text
  let text = msg.content ?? '';
  if (!text && msg.parts) {
    text = msg.parts.filter((p) => p.type === 'text').map((p) => p.text ?? '').join('');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isUser ? 'bg-blue-500/20' : ''}`}
        style={!isUser ? { background: ACCENT + '20' } : {}}
      >
        {isUser
          ? <User size={13} className="text-blue-400" />
          : <Bot size={13} style={{ color: ACCENT }} />
        }
      </div>

      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {toolCalls.length > 0 && (
          <div className="w-full space-y-1.5">
            {toolCalls.map((tc) => <ToolCallCard key={tc.toolCallId} call={tc} />)}
          </div>
        )}

        {(text || isStreaming) && (
          <div
            className={`relative group rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
              isUser
                ? 'bg-blue-500/15 border border-blue-500/20 admin-text'
                : 'admin-card admin-text'
            }`}
          >
            {text
              ? text.split('\n').map((line, i, arr) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </React.Fragment>
                ))
              : null}
            {isStreaming && (
              <span
                className="inline-block w-1.5 h-3.5 ml-0.5 rounded-sm animate-pulse align-middle"
                style={{ background: ACCENT }}
              />
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

// ── Main panel ────────────────────────────────────────────────────────────────

export default function AgentPanel() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');

  // @ai-sdk/react v3 — input state is managed locally; hook provides sendMessage
  const { messages, sendMessage, status, error, setMessages } = useChat({
    api: '/api/agent',
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const submit = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    sendMessage({ role: 'user', content: text });
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    },
    [submit],
  );

  const uiMessages = messages as unknown as UIMessage[];
  const isEmpty = uiMessages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: ACCENT + '18' }}>
            <Bot size={16} style={{ color: ACCENT }} />
          </div>
          <div>
            <div className="font-semibold text-sm admin-text">Spacze Agent</div>
            <div className="text-[10px] admin-muted flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ background: isLoading ? '#f59e0b' : ACCENT }}
              />
              {isLoading ? 'Working…' : 'Ready · 9 tools · Multi-step reasoning'}
            </div>
          </div>
        </div>
        {!isEmpty && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] admin-muted hover:admin-text admin-hover transition-colors"
          >
            <RotateCcw size={11} />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 pb-2">

        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-8 py-12"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: ACCENT + '15' }}>
                <Terminal size={28} style={{ color: ACCENT }} />
              </div>
              <h3 className="font-semibold admin-text text-base mb-1">Spacze Agent</h3>
              <p className="text-[12px] admin-muted max-w-xs text-center leading-relaxed">
                Give me a goal. I'll plan the steps, use the right tools, and execute — no hand-holding needed.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="px-3 py-1.5 rounded-full text-[11px] border admin-border admin-muted hover:admin-text admin-hover transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {uiMessages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {isLoading && (uiMessages.length === 0 || uiMessages[uiMessages.length - 1]?.role === 'user') && (
          <MessageBubble msg={{ id: '__streaming__', role: 'assistant', content: '' }} isStreaming />
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-400"
          >
            <XCircle size={14} className="flex-shrink-0" />
            <span className="flex-1">{error.message}</span>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-3">
        <div
          className="flex items-end gap-3 rounded-2xl border admin-border p-3 transition-colors focus-within:border-[var(--accent-border)]"
          style={{ background: 'var(--admin-surface)' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Give me a goal — e.g. 'Run outreach for all pending logistics leads'"
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent resize-none outline-none text-[13px] admin-text placeholder:admin-muted leading-relaxed max-h-32 overflow-y-auto disabled:opacity-50"
            style={{ minHeight: '24px' }}
            onInput={(e) => {
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
              ? <Loader2 size={14} className="animate-spin text-black" />
              : <Send size={13} className="text-black" />
            }
          </button>
        </div>
        <p className="text-[10px] admin-muted text-center mt-2">
          Enter to send · Shift+Enter for new line · Agent may take multiple steps
        </p>
      </div>
    </div>
  );
}
