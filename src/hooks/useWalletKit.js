import { useState, useCallback } from 'react';
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
} from '@creit.tech/stellar-wallets-kit';
import { parseError } from '../utils/errors';

let _kit = null;
const getKit = () => {
  if (!_kit)
    _kit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });
  return _kit;
};

export function useWalletKit() {
  const [pk, setPk] = useState(null);
  const [walletId, setWalletId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const openModal = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      await getKit().openModal({
        onWalletSelected: async (opt) => {
          getKit().setWallet(opt.id);
          setWalletId(opt.id);
          const { address } = await getKit().getAddress();
          if (!address) throw new Error('No address');
          setPk(address);
        },
      });
    } catch (e) {
      setError(parseError(e).message);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPk(null);
    setWalletId(null);
    setError(null);
    _kit = null;
  }, []);

  const sign = useCallback(async (xdr) => {
    const { signedTxXdr } = await getKit().signTransaction(xdr, {
      network: WalletNetwork.TESTNET,
      networkPassphrase: 'Test SDF Network ; September 2015',
    });
    return signedTxXdr;
  }, []);

  return { pk, walletId, connecting, error, openModal, disconnect, sign };
}
