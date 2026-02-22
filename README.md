# 🗳️ StellarPoll — Live On-Chain Poll

Vote on-chain via Soroban smart contract. Level 2 Stellar challenge.

## Features
- Multi-wallet via StellarWalletsKit (Freighter, xBull, Lobstr)
- Soroban contract on Stellar Testnet
- Real-time results (8s auto-refresh)
- TX status: pending → success / failed
- 3 error types: wallet not found, user rejected, insufficient balance

## Contract
- **Address:** CBLNNLUJ2YM2MTQHJ7M6WLQ7KIPKRVOLLZWZYUW7IJEHIR246S636B5W
- **Explorer:** https://stellar.expert/explorer/testnet/contract/CBLNNLUJ2YM2MTQHJ7M6WLQ7KIPKRVOLLZWZYUW7IJEHIR246S636B5W

## Live Deployment
https://stellar-poll.vercel.app/

## Setup
```bash
npm install
# Install Stellar CLI
cargo install --locked stellar-cli
# Generate & fund testnet key
stellar keys generate admin --network testnet
stellar keys fund admin --network testnet
# Deploy contract
ADMIN_SECRET=$(stellar keys show admin) bash scripts/deploy.sh
# Configure
cp .env.example .env  # paste CONTRACT_ID
npm run dev
```

## Deploy
```bash
npm run build && npx vercel --prod
```

## Screenshots
> wallet modal
[Wallet Modal](./wallets.png)

> poll UI 
[Poll UI](./deployedcontract.png)

> confirmed tx hash
[Confirmed TX Hash](./contractcall.png)

