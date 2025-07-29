# 🚀 BONK Trading Bot

A sophisticated Solana-based trading bot that automates token creation, buying, and selling on the Raydium launchpad platform. This bot is specifically designed to work with the BONK platform and provides advanced features including transaction bundling, lookup tables, MEV protection, and bonding curve calculations.

## 🌟 Features

- **Token Creation**: Automatically create new tokens with custom metadata
- **IPFS Integration**: Upload token metadata to IPFS for decentralized storage
- **Automated Trading**: Create, buy, and sell tokens in a single transaction
- **Transaction Bundling**: Bundle multiple buy/sell transactions for efficiency
- **Lookup Tables**: Optimize transaction size and reduce costs with address lookup tables
- **MEV Protection**: Built-in Jito integration for better transaction success rates
- **Bonding Curve Calculations**: Advanced arithmetic logic for price calculations
- **Slippage Protection**: Configurable slippage tolerance for safe trading
- **Raydium SDK Integration**: Leverages the latest Raydium SDK v2 for optimal performance
- **TypeScript Support**: Fully typed codebase for better development experience

## 🛠️ Tech Stack

- **Blockchain**: Solana
- **DEX**: Raydium Launchpad
- **Language**: TypeScript
- **Key Dependencies**:
  - `@raydium-io/raydium-sdk-v2` - Raydium trading SDK
  - `@solana/web3.js` - Solana Web3 client
  - `@coral-xyz/anchor` - Solana program framework
  - `@solana/spl-token` - SPL token operations
  - `axios` - HTTP client for IPFS uploads and Jito API
  - `bs58` - Base58 encoding/decoding
  - `solana-utils-sdk` - Solana utility functions

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Solana CLI tools
- A Solana wallet with SOL for transactions
- IPFS API key and endpoint
- Helius RPC endpoint (or other Solana RPC provider)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd letsbonkdotfun-trading-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DEV_WALLET=your_base58_encoded_private_key
   HTTP_ENDPOINT=your_helius_rpc_endpoint
   IPFS_API_KEY=your_ipfs_api_key
   IPFS_SERVER_ENDPOINT=your_ipfs_server_endpoint
   ```

4. **Add your token image**
   Place your token image in the `image/` directory (currently uses `bonk_fun.png`)

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DEV_WALLET` | Base58 encoded private key of your wallet | ✅ |
| `HTTP_ENDPOINT` | Solana RPC endpoint (Helius recommended) | ✅ |
| `IPFS_API_KEY` | API key for IPFS service | ✅ |
| `IPFS_SERVER_ENDPOINT` | IPFS server endpoint URL | ✅ |

### Token Configuration

Edit the metadata in `src/index.ts` to customize your token:

```typescript
const meta_data: Metadata = {
  name: "YOUR_TOKEN_NAME",
  symbol: "SYMBOL",
  description: "YOUR_TOKEN_DESCRIPTION",
  file: `data:image/png;base64,${fs.readFileSync(image_path, "base64")}`,
  twitter: "your_twitter_url",
  telegram: "your_telegram_url",
  website: "your_website_url",
};
```

## 🎯 Usage

### Basic Workflow

The bot performs the following automated workflow:

1. **Token Creation**: Creates a new token with specified metadata
2. **IPFS Upload**: Uploads token metadata to IPFS
3. **Token Purchase**: Buys the created token with specified SOL amount
4. **Wait Period**: Waits for 5 seconds (configurable)
5. **Token Sale**: Sells all purchased tokens

### Running the Bot

```bash
# Compile TypeScript
npx tsc

# Run the bot
node dist/index.js
```

## 🔧 Advanced Features

### Transaction Bundling

The bot includes sophisticated transaction bundling capabilities for efficient trading:

#### Bundle Buy (`src/bundler/bundleBuy.ts`)
- **Batch Processing**: Processes multiple buy transactions in batches of 2
- **Compute Optimization**: Sets compute unit price and limits for optimal performance
- **Lookup Table Integration**: Uses address lookup tables to reduce transaction size
- **Automatic ATA Creation**: Creates associated token accounts as needed

```typescript
import { makeBuyTx } from './src/bundler/bundleBuy';

// Bundle buy with multiple wallets
const buyTxs = await makeBuyTx(connection, mint, buyerKeypairs, lookupTableAddress);
```

#### Bundle Sell (`src/bundler/bundleSell.ts`)
- **Slippage Protection**: Configurable slippage tolerance (default 5%)
- **Batch Selling**: Sells tokens from multiple wallets efficiently
- **Price Calculation**: Uses bonding curve logic for accurate price estimation
- **Transaction Optimization**: Optimized for high-frequency trading

```typescript
import { sellBundleTx } from './src/bundler/bundleSell';

// Bundle sell with slippage protection
const sellTxs = await sellBundleTx(connection, mint, sellerKeypairs, lookupTableAddress);
```

### Lookup Tables

The bot implements Solana Address Lookup Tables (LUT) for transaction optimization:

#### LUT Creation (`src/LookupTable/createLUT.ts`)
- **Automatic Creation**: Creates lookup tables with retry logic
- **Authority Management**: Sets proper authority and payer
- **Slot Management**: Uses recent slots for optimal performance

```typescript
import { createLUT } from './src/LookupTable/createLUT';

// Create a new lookup table
const lutAddress = await createLUT(mainKeypair);
```

#### Address Management (`src/LookupTable/lookupAddressFiller.ts`)
- **Wallet Addresses**: Adds multiple wallet addresses to LUT
- **Token Accounts**: Adds associated token accounts for the target token
- **WSOL Accounts**: Adds wrapped SOL accounts for trading
- **Program Addresses**: Adds necessary program and PDA addresses

```typescript
import { addBonkAddressesToTable } from './src/LookupTable/lookupAddressFiller';

// Add addresses to lookup table
await addBonkAddressesToTable(lutAddress, mint, walletKeypairs, mainKeypair);
```

#### SOL Distribution (`src/LookupTable/disrtibuteSol.ts`)
- **Multi-Wallet Funding**: Distributes SOL to multiple wallets
- **Batch Transactions**: Processes funding in efficient batches
- **Balance Management**: Ensures proper SOL distribution for trading

### Executors

The bot provides two transaction execution methods:

#### Jito Executor (`exucutor/jito.ts`)
- **MEV Protection**: Uses Jito block engine for better transaction success
- **Multi-Endpoint**: Sends to multiple Jito endpoints for redundancy
- **Bundle Support**: Supports transaction bundling for atomic execution
- **Confirmation Handling**: Proper transaction confirmation and error handling

```typescript
import { executeJitoTx } from './exucutor/jito';

// Execute with Jito MEV protection
const signature = await executeJitoTx(transactions, payer, 'confirmed');
```

#### Legacy Executor (`exucutor/legacy.ts`)
- **Standard Execution**: Traditional Solana transaction execution
- **V0 Transactions**: Supports versioned transactions
- **Retry Logic**: Built-in retry mechanism for failed transactions
- **Confirmation**: Proper transaction confirmation handling

```typescript
import { createAndSendV0Tx } from './exucutor/legacy';

// Execute standard transaction
const success = await createAndSendV0Tx(instructions, keypair, connection);
```

### Bonding Curve Arithmetic (`src/arithmeticLogic.ts`)

Advanced mathematical calculations for bonding curve operations:

#### Key Features:
- **Buy Price Calculation**: Calculates token amounts for SOL input
- **Sell Price Calculation**: Calculates SOL output for token amounts
- **Market Cap Calculation**: Computes current market cap in SOL
- **Fee Handling**: Includes fee calculations in price computations
- **Virtual Reserves**: Handles virtual and real reserve calculations

```typescript
import { BondingCurveAccount } from './src/arithmeticLogic';

// Calculate buy price
const tokenAmount = curveAccount.getBuyPrice(solAmount);

// Calculate sell price with fees
const solOutput = curveAccount.getSellPrice(tokenAmount, feeBps);

// Get market cap
const marketCap = curveAccount.getMarketCapSOL();
```

### Custom Trading Functions

You can also use individual functions for specific operations:

```typescript
// Create token only
import { createBonkTokenTx } from './src/instrcutions/createtoken';

// Buy tokens
import { makeBuyIx } from './src/instrcutions/buytoken';

// Sell tokens
import { makeSellIx } from './src/instrcutions/selltoken';

// Create and buy in one transaction
import { createAndBuyTx } from './src/instrcutions/createAndBuy';
```

## 🔧 Advanced Configuration

### Slippage Settings

Configure slippage tolerance in `src/instrcutions/selltoken.ts`:

```typescript
// 1% slippage
await makeSellIx(keypair, 1000, mintAddress, 100);

// 5% slippage (default)
await makeSellIx(keypair, 1000, mintAddress, 500);

// 10% slippage
await makeSellIx(keypair, 1000, mintAddress, 1000);
```

### Jito MEV Protection

The bot includes Jito tip integration for better transaction success rates. Tips are automatically sent to random Jito validators.

### Pool Information

For advanced trading, you can implement pool data fetching in `getPoolInfo()` function in `selltoken.ts` to calculate more precise slippage.

## 📁 Project Structure

```
letsbonkdotfun-trading-bot/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── config.ts                   # Configuration and SDK setup
│   ├── metadata.ts                 # IPFS metadata upload
│   ├── arithmeticLogic.ts          # Bonding curve calculations
│   ├── bundler/
│   │   ├── bundleBuy.ts            # Bundle buy transactions
│   │   └── bundleSell.ts           # Bundle sell transactions
│   ├── LookupTable/
│   │   ├── createLUT.ts            # Create lookup tables
│   │   ├── lookupAddressFiller.ts  # Add addresses to LUT
│   │   ├── disrtibuteSol.ts        # Distribute SOL to wallets
│   │   └── saveAccounts.ts         # Save account data
│   └── instrcutions/
│       ├── createtoken.ts          # Token creation logic
│       ├── buytoken.ts             # Token buying logic
│       ├── selltoken.ts            # Token selling logic
│       └── createAndBuy.ts         # Combined create and buy
├── exucutor/
│   ├── jito.ts                     # Jito MEV executor
│   └── legacy.ts                   # Standard transaction executor
├── image/
│   └── bonk_fun.png               # Token image
├── package.json
├── tsconfig.json
└── README.md
```

## ⚠️ Important Notes

1. **Risk Warning**: This bot is for educational purposes. Trading involves significant risk of loss.
2. **Testnet First**: Always test on Solana devnet before using on mainnet.
3. **Wallet Security**: Never share your private keys. Use environment variables.
4. **RPC Limits**: Use a reliable RPC provider to avoid rate limiting.
5. **Gas Fees**: Ensure your wallet has sufficient SOL for transaction fees.
6. **Lookup Tables**: LUTs require time to activate (15+ seconds after creation).
7. **Bundle Limits**: Transaction bundles have size limits; adjust batch sizes accordingly.

## 🔍 Troubleshooting

### Common Issues

1. **Insufficient Funds Error**
   - Ensure your wallet has enough SOL for the transaction amount plus fees
   - Check that you're using the correct wallet address

2. **RPC Connection Issues**
   - Verify your RPC endpoint is working
   - Consider using a paid RPC service for better reliability

3. **Transaction Failures**
   - Check network congestion
   - Verify slippage settings
   - Ensure sufficient SOL for Jito tips

4. **Lookup Table Errors**
   - Wait 15+ seconds after LUT creation before using
   - Verify LUT authority and payer settings
   - Check that addresses are properly added to LUT

5. **Bundle Transaction Failures**
   - Reduce batch size if transactions are too large
   - Check compute unit limits and prices
   - Verify all required addresses are in lookup table

### Debug Mode

Enable transaction simulation by uncommenting the simulation code in `createAndBuy.ts`:

```typescript
const simulation = await connection.simulateTransaction(txs);
console.log("simulation res: ", simulation);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚖️ Disclaimer

This software is provided "as is" without warranty. Trading cryptocurrencies involves substantial risk of loss and is not suitable for all investors. The high degree of leverage can work against you as well as for you. Before deciding to trade cryptocurrencies, you should carefully consider your investment objectives, level of experience, and risk appetite.

## 🔗 Links

- [Solana Documentation](https://docs.solana.com/)
- [Raydium SDK Documentation](https://raydium.io/developers/)
- [BONK Platform](https://bonk.fun/)
- [Helius RPC](https://helius.xyz/)
- [Jito Labs](https://jito.network/)
- [Address Lookup Tables](https://docs.solana.com/developing/features/versioned-transactions#address-lookup-tables)

---

**Happy Trading! 🚀** 