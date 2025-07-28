import {
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { BONK_PLATFROM_ID, connection } from "../config";
import {
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import {
  getATAAddress,
  getPdaLaunchpadAuth,
  getPdaLaunchpadConfigId,
  getPdaLaunchpadPoolId,
  getPdaLaunchpadVaultId,
  LAUNCHPAD_PROGRAM,
  sellExactInInstruction,
} from "@raydium-io/raydium-sdk-v2";

// Function to get pool information and calculate expected output
const getPoolInfo = async (mintAddress: PublicKey) => {
  // You'll need to fetch pool data to calculate expected output
  // This is a placeholder - you need to implement based on Raydium's pool structure
  const programId = LAUNCHPAD_PROGRAM;
  const poolId = getPdaLaunchpadPoolId(
    programId,
    mintAddress,
    NATIVE_MINT
  ).publicKey;

  // Fetch pool account data
  const poolInfo = await connection.getAccountInfo(poolId);
  // Parse pool data to get reserves, etc.
  // Return expected SOL output for given token input

  return {
    expectedSolOutput: new BN(0), // Replace with actual calculation
    poolReserves: {
      tokenA: new BN(0),
      tokenB: new BN(0),
    },
  };
};

export const makeSellIx = async (
  kp: Keypair,
  token_amount: number,
  mintAddress: PublicKey,
  slippageBps: number = 500 // Default 5% slippage (500 basis points)
) => {
  const sellInstruction: TransactionInstruction[] = [];
  console.log("launchpad programId:", LAUNCHPAD_PROGRAM.toBase58());

  const programId = LAUNCHPAD_PROGRAM;
  const configId = getPdaLaunchpadConfigId(
    programId,
    NATIVE_MINT,
    0,
    0
  ).publicKey;
  const poolId = getPdaLaunchpadPoolId(
    programId,
    mintAddress,
    NATIVE_MINT
  ).publicKey;

  const userTokenAccountA = getAssociatedTokenAddressSync(
    mintAddress,
    kp.publicKey
  );
  const userTokenAccountB = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    kp.publicKey
  );

  const vaultA = getPdaLaunchpadVaultId(
    programId,
    poolId,
    mintAddress
  ).publicKey;
  const vaultB = getPdaLaunchpadVaultId(
    programId,
    poolId,
    NATIVE_MINT
  ).publicKey;

  const shareATA = getATAAddress(kp.publicKey, NATIVE_MINT).publicKey;
  const authProgramId = getPdaLaunchpadAuth(programId).publicKey;

  // Calculate minimum amount with slippage protection
  const tokenAmountBN = new BN(token_amount * 1000000); // Convert to base units

  // Method 1: Simple percentage-based slippage
  // You need to estimate expected SOL output somehow
  const estimatedSolOutput = new BN(1000000); // Replace with actual calculation
  const minSolAmount = estimatedSolOutput
    .mul(new BN(10000 - slippageBps))
    .div(new BN(10000));

  // Method 2: If you have pool data, calculate more precisely
  try {
    const poolInfo = await getPoolInfo(mintAddress);
    // Use AMM formula: output = (input * reserveOut) / (reserveIn + input)
    // Then apply slippage tolerance
  } catch (error) {
    console.log("Could not fetch pool info, using simple slippage calculation");
  }

  console.log(`Selling ${token_amount} tokens`);
  console.log(`Slippage tolerance: ${slippageBps / 100}%`);
  console.log(`Minimum SOL amount: ${minSolAmount.toString()} lamports`);

  const instruction = sellExactInInstruction(
    programId,
    kp.publicKey,
    authProgramId,
    configId,
    BONK_PLATFROM_ID,
    poolId,
    userTokenAccountA,
    userTokenAccountB,
    vaultA,
    vaultB,
    mintAddress,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    tokenAmountBN,
    minSolAmount, // Use calculated minimum instead of BN(1)
    new BN(10000),
    shareATA
  );

  sellInstruction.push(instruction);

  const txs = new Transaction().add(...sellInstruction);
  const { blockhash } = await connection.getLatestBlockhash();

  txs.feePayer = kp.publicKey;
  txs.recentBlockhash = blockhash;

  //   const simulation = await connection.simulateTransaction(txs);
  //   console.log(simulation);

  const res = await sendAndConfirmTransaction(connection, txs, [kp]);
  console.log("Transaction signature:", res);

  return res;
};

// Usage examples:
// makeSellIx(keypair, 1000, mintAddress, 100);  // 1% slippage
// makeSellIx(keypair, 1000, mintAddress, 500);  // 5% slippage
// makeSellIx(keypair, 1000, mintAddress, 1000); // 10% slippage
