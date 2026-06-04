'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Mail, Loader2, Check, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side domain check
    if (!email.endsWith('@merchynt.com')) {
      setErrorMessage('Only @merchynt.com email addresses can access Reddit Rosie.');
      return;
    }

    setStatus('sending');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to send magic link');
      }

      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setErrorMessage(String(err).replace('Error: ', ''));
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/rosie-logo.png"
            alt="Rosie The Redditor by Merchynt"
            width={320}
            height={185}
            priority
          />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl border border-border p-8">
          {status === 'sent' ? (
            /* Success State */
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-4">
                <Check size={24} className="text-green" />
              </div>
              <h1 className="text-[18px] font-bold text-dark mb-2">Check your email</h1>
              <p className="text-[13px] text-muted leading-relaxed">
                We sent a magic link to <span className="font-medium text-dark">{email}</span>. Click the link in the email to sign in.
              </p>
              <button
                onClick={() => { setStatus('idle'); setEmail(''); }}
                className="mt-4 text-[13px] text-blue hover:text-navy transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            /* Login Form */
            <>
              <h1 className="text-[18px] font-bold text-dark text-center mb-1">Sign in to Reddit Rosie</h1>
              <p className="text-[13px] text-muted text-center mb-6">
                Enter your Merchynt email to receive a magic link.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="relative mb-4">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@merchynt.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-surface text-[14px] text-dark placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30"
                  />
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-pink/5 border border-pink/20">
                    <AlertCircle size={14} className="text-pink shrink-0 mt-0.5" />
                    <p className="text-[12px] text-pink">{errorMessage}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending' || !email}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-navy text-white text-[14px] font-medium hover:bg-navy/90 transition-colors disabled:opacity-50"
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending magic link...
                    </>
                  ) : (
                    'Send magic link'
                  )}
                </button>
              </form>

              <p className="text-[11px] text-muted text-center mt-4">
                Only @merchynt.com email addresses are permitted.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
