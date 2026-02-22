# 🗳️ StellarPoll — Live On-Chain Poll

Vote on-chain via Soroban smart contract. Level 2 Stellar challenge.

## Features
- Multi-wallet via StellarWalletsKit (Freighter, xBull, Lobstr)
- Soroban contract on Stellar Testnet
- Real-time results (8s auto-refresh)
- TX status: pending → success / failed
- 3 error types: wallet not found, user rejected, insufficient balance

## Contract
- **Address:** YOUR_CONTRACT_ID_HERE
- **Explorer:** https://stellar.expert/explorer/testnet/contract/YOUR_CONTRACT_ID

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
> wallet modal, poll UI, confirmed tx hash
