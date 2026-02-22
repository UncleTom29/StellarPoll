#!/bin/bash
set -e

echo "Building contract..."
cd contract
cargo build --target wasm32-unknown-unknown --release

WASM=target/wasm32-unknown-unknown/release/stellar_poll.wasm

echo "Deploying to testnet..."
CONTRACT_ID=$(stellar contract deploy --wasm $WASM --source $ADMIN_SECRET --network testnet)
echo "Deployed: $CONTRACT_ID"

ADMIN_ADDR=$(stellar keys address $ADMIN_SECRET 2>/dev/null)

echo "Initializing..."
stellar contract invoke --id $CONTRACT_ID --source $ADMIN_SECRET --network testnet \
  -- init --admin $ADMIN_ADDR \
  --question "What is Stellar best used for?" \
  --opt_a "DeFi Payments" --opt_b "NFTs & Assets" --opt_c "Identity"

echo "Add to .env: VITE_CONTRACT_ID=$CONTRACT_ID"
