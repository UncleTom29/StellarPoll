import React, { useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useWalletKit } from './hooks/useWalletKit';
import { usePoll, TX } from './hooks/usePoll';
import { CFG } from './config';

const EM = ['🔵', '🟣', '🟢'];

function Hero({ onConnect, connecting, error }) {
  return (
    <div className="card hero">
      <div style={{ fontSize: '3.5rem' }}>🗳️</div>
      <h1 className="htitle">StellarPoll</h1>
      <p className="hsub">
        Vote on-chain. Results update live.
        <br />
        Your vote is stored in a Soroban contract.
      </p>
      <div className="wf">
        <div className="wfi">⭐ Multi-wallet via StellarWalletsKit</div>
        <div className="wfi">📜 Votes stored in deployed Soroban contract</div>
        <div className="wfi">🔄 Auto-refresh every 8 seconds</div>
      </div>
      <button
        className="btn bp"
        onClick={onConnect}
        disabled={connecting}
        style={{ minWidth: 220 }}
      >
        {connecting ? (
          <>
            <span className="sp" />
            Connecting...
          </>
        ) : (
          '🔗 Connect Wallet'
        )}
      </button>
      {error && <p className="errmsg">⚠️ {error}</p>}
    </div>
  );
}

function TxBox({ status, hash, error }) {
  if (status === TX.IDLE) return null;
  const map = {
    [TX.PENDING]: { cls: 'pending', icon: '⏳', title: 'Transaction Pending...', sub: 'Waiting for Stellar Testnet confirmation.' },
    [TX.SUCCESS]: { cls: 'success', icon: '✅', title: 'Vote Confirmed!', sub: 'Your vote is recorded on-chain.' },
    [TX.FAILED]:  { cls: 'failed',  icon: '❌', title: 'Transaction Failed',   sub: error || 'Something went wrong.' },
  };
  const m = map[status];
  return (
    <div className={`txbox ${m.cls}`}>
      <div className={`txtitle ${m.cls}`}>{m.icon} {m.title}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--mt)', marginTop: 4 }}>{m.sub}</div>
      {hash && (
        <>
          <div className="txhash">{hash}</div>
          <a
            className="txlink"
            href={`${CFG.EXPLORER}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            🔍 View on Stellar Expert →
          </a>
        </>
      )}
    </div>
  );
}

function PollCard({ poll, hasVoted, txStatus, txHash, txError, onVote, loading, onRefresh }) {
  if (!poll)
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--mt)', padding: 40 }}>
        {loading ? (
          <>
            <span className="sp" /> Loading poll...
          </>
        ) : (
          '⚠️ Poll not loaded. Check VITE_CONTRACT_ID in .env'
        )}
      </div>
    );
  const tot = poll.total || 0;
  const pct = (n) => (tot > 0 ? Math.round((n / tot) * 100) : 0);
  const canVote = !hasVoted && txStatus === TX.IDLE;
  return (
    <div className="card">
      <div className="rrow">
        <span className="clabel">Live Poll</span>
        <button className="rbtn" onClick={onRefresh} disabled={loading}>
          <span className={loading ? 'spin' : ''}>↻</span>
        </button>
      </div>
      <div className="question">{poll.question}</div>
      {hasVoted && <div className="vbanner">✅ Voted — results updating live</div>}
      <div className="opts">
        {poll.options.map((opt, i) => {
          const p = pct(poll.counts[i]);
          return (
            <button
              key={i}
              className={`opt${hasVoted && poll.counts[i] === Math.max(...poll.counts) ? ' win' : ''}`}
              onClick={() => canVote && onVote(i)}
              disabled={!canVote || txStatus === TX.PENDING}
            >
              <div className="obar" style={{ width: hasVoted ? `${p}%` : '0%' }} />
              <div className="ocnt">
                <div>
                  <div className="olabel">{EM[i]} {opt}</div>
                  {hasVoted && (
                    <div className="ocount">
                      {poll.counts[i]} vote{poll.counts[i] !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                {hasVoted && <div className="opct">{p}%</div>}
              </div>
            </button>
          );
        })}
      </div>
      <div className="tvotes">Total votes: {tot}</div>
      <TxBox status={txStatus} hash={txHash} error={txError} />
    </div>
  );
}

function ContractCard({ walletId }) {
  const copy = (t) => {
    navigator.clipboard.writeText(t).catch(() => {});
    toast.success('Copied!', { duration: 1500 });
  };
  return (
    <div className="card">
      <p className="clabel">Contract Info</p>
      <div style={{ fontSize: '0.8rem', color: 'var(--mt)', marginBottom: 6 }}>
        Deployed Contract:
      </div>
      <div className="cinfo" onClick={() => copy(CFG.CONTRACT_ID)} title="Click to copy">
        📜 {CFG.CONTRACT_ID}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 10,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span style={{ fontSize: '0.72rem', color: 'var(--d)' }}>Testnet · 8s sync</span>
        {walletId && <span className="wbdg">{walletId}</span>}
      </div>
      <a
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          marginTop: 10,
          fontSize: '0.75rem',
          color: 'var(--ac)',
          textDecoration: 'none',
        }}
        href={`${CFG.EXPLORER}/contract/${CFG.CONTRACT_ID}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        🔍 View contract →
      </a>
    </div>
  );
}

export default function App() {
  const { pk, walletId, connecting, error, openModal, disconnect, sign } = useWalletKit();
  const { poll, hasVoted, loading, txStatus, txHash, txError, refresh, vote } = usePoll(pk, sign);

  useEffect(() => {
    if (txStatus === TX.SUCCESS) toast.success('Vote confirmed on-chain! 🎉');
    if (txStatus === TX.FAILED) toast.error(txError || 'Transaction failed');
  }, [txStatus]);

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#0f0f28',
            color: '#f0f0ff',
            border: '1px solid #252545',
            borderRadius: 10,
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
          },
        }}
      />
      <header className="hdr">
        <div className="logo">🗳️ StellarPoll</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="bdg bdg-net">Testnet</span>
          {pk && (
            <span className="bdg bdg-live">
              <span className="dot" />
              Live
            </span>
          )}
          {pk && (
            <button
              className="btn bdr"
              onClick={disconnect}
              style={{ padding: '7px 12px', fontSize: '0.78rem' }}
            >
              Disconnect
            </button>
          )}
        </div>
      </header>
      <main className="main">
        {!pk ? (
          <Hero onConnect={openModal} connecting={connecting} error={error} />
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--d)',
              }}
            >
              <span>
                Connected: {pk.slice(0, 8)}...{pk.slice(-6)}
              </span>
            </div>
            <PollCard
              poll={poll}
              hasVoted={hasVoted}
              txStatus={txStatus}
              txHash={txHash}
              txError={txError}
              onVote={vote}
              loading={loading}
              onRefresh={refresh}
            />
            <ContractCard walletId={walletId} />
          </>
        )}
      </main>
      <footer className="footer">
        Built on{' '}
        <a href="https://stellar.org" target="_blank" rel="noopener">
          Stellar
        </a>{' '}
        ·
        <a
          href={`${CFG.EXPLORER}/contract/${CFG.CONTRACT_ID}`}
          target="_blank"
          rel="noopener"
        >
          {' '}
          Contract Explorer
        </a>
      </footer>
    </>
  );
}
