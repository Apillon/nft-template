#!/bin/bash -eu
# Check if CONTRACT_ADDRESS and CHAIN_ID are set
if [ -z "$CONTRACT_ADDRESS" ] || [ -z "$CHAIN_ID" ]; then
  echo "Error: CONTRACT_ADDRESS and CHAIN_ID must be set."
  exit 1
fi

# Replace placeholders in env.js
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS (BSD `sed`)
  sed -i '' "s|const contractAddress = \"\";|const contractAddress = \"$CONTRACT_ADDRESS\";|g" js/env.js
  sed -i '' "s|const chainId = \".*\";|const chainId = \"$CHAIN_ID\";|g" js/env.js
else
  # Linux (GNU `sed`)
  sed -i "s|const contractAddress = \"\";|const contractAddress = \"$CONTRACT_ADDRESS\";|g" js/env.js
  sed -i "s|const chainId = \".*\";|const chainId = \"$CHAIN_ID\";|g" js/env.js
fi