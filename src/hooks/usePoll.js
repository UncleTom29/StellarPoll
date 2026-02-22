import { useState, useEffect, useCallback } from 'react';
import {
  getPollResults,
  checkHasVoted,
  buildVoteTx,
  submitSigned,
  waitForTx,
} from '../utils/contract';
import { parseError } from '../utils/errors';

export const TX = { IDLE: 'idle', PENDING: 'pending', SUCCESS: 'success', FAILED: 'failed' };

export function usePoll(pk, sign) {
  const [poll, setPoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(TX.IDLE);
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);

  const refresh = useCallback(async () => {
    if (!pk) return;
    setLoading(true);
    try {
      const [r, v] = await Promise.all([getPollResults(pk), checkHasVoted(pk)]);
      setPoll(r);
      setHasVoted(v);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [pk]);

  useEffect(() => {
    if (pk) {
      refresh();
      const id = setInterval(refresh, 8000);
      return () => clearInterval(id);
    } else {
      setPoll(null);
      setHasVoted(false);
      setTxStatus(TX.IDLE);
    }
  }, [pk, refresh]);

  const vote = useCallback(
    async (idx) => {
      if (!pk || !sign) return;
      setTxStatus(TX.PENDING);
      setTxError(null);
      setTxHash(null);
      try {
        const tx = await buildVoteTx(pk, idx);
        const signed = await sign(tx.toXDR());
        const hash = await submitSigned(signed);
        setTxHash(hash);
        await waitForTx(hash);
        setTxStatus(TX.SUCCESS);
        setHasVoted(true);
        setTimeout(refresh, 2000);
      } catch (e) {
        setTxError(parseError(e).message);
        setTxStatus(TX.FAILED);
      }
    },
    [pk, sign, refresh]
  );

  return { poll, hasVoted, loading, txStatus, txHash, txError, refresh, vote };
}
