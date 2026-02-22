import {
  Contract,
  SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Address,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';
import { CFG } from '../config';

const rpc = new SorobanRpc.Server(CFG.RPC_URL, { allowHttp: false });
const contract = () => new Contract(CFG.CONTRACT_ID);

async function sim(pk, method, args = []) {
  const acc = await rpc.getAccount(pk);
  const tx = new TransactionBuilder(acc, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(contract().call(method, ...args))
    .setTimeout(30)
    .build();
  const s = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(s)) throw new Error(s.error);
  return s.result?.retval ? scValToNative(s.result.retval) : null;
}

export async function getPollResults(pk) {
  const r = await sim(pk, 'get_results');
  if (!r) return null;
  const [question, options, counts] = r;
  return {
    question: question?.toString() || '',
    options: options?.map((o) => o?.toString() || '') || [],
    counts: counts?.map(Number) || [0, 0, 0],
    total: counts?.reduce((a, b) => a + Number(b), 0) || 0,
  };
}

export async function checkHasVoted(pk) {
  try {
    const r = await sim(pk, 'has_voted', [new Address(pk).toScVal()]);
    return !!r;
  } catch {
    return false;
  }
}

export async function buildVoteTx(pk, idx) {
  const acc = await rpc.getAccount(pk);
  const tx = new TransactionBuilder(acc, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(
      contract().call('vote', new Address(pk).toScVal(), nativeToScVal(idx, { type: 'u32' }))
    )
    .setTimeout(30)
    .build();
  return rpc.prepareTransaction(tx);
}

export async function submitSigned(xdrStr) {
  const tx = TransactionBuilder.fromXDR(xdrStr, Networks.TESTNET);
  const res = await rpc.sendTransaction(tx);
  if (res.status === 'ERROR') throw new Error('Submit error');
  return res.hash;
}

export async function waitForTx(hash) {
  for (let i = 0; i < 20; i++) {
    const s = await rpc.getTransaction(hash);
    if (s.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) return s;
    if (s.status === SorobanRpc.Api.GetTransactionStatus.FAILED)
      throw new Error('TX failed on-chain');
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('Timeout');
}
