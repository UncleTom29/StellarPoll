export const ErrType = {
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  USER_REJECTED: 'USER_REJECTED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  ALREADY_VOTED: 'ALREADY_VOTED',
  CONTRACT_ERROR: 'CONTRACT_ERROR',
};

export function parseError(err) {
  const m = err?.message || String(err);
  if (m.includes('not found') || m.includes('No wallet') || m.includes('not installed'))
    return { type: ErrType.WALLET_NOT_FOUND, message: 'Wallet not found. Install a Stellar wallet extension.' };
  if (m.includes('reject') || m.includes('declined') || m.includes('cancel'))
    return { type: ErrType.USER_REJECTED, message: 'Transaction rejected by user.' };
  if (m.includes('insufficient') || m.includes('underfunded') || m.includes('balance'))
    return { type: ErrType.INSUFFICIENT_BALANCE, message: 'Insufficient balance. Fund via testnet faucet.' };
  if (m.includes('already voted') || m.includes('already_voted'))
    return { type: ErrType.ALREADY_VOTED, message: 'You have already voted.' };
  return { type: ErrType.CONTRACT_ERROR, message: 'Contract error: ' + m };
}
