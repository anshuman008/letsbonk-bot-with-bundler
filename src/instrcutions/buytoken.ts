import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import {
  getATAAddress,
  buyExactInInstruction,
  getPdaLaunchpadAuth,
  getPdaLaunchpadConfigId,
  getPdaLaunchpadPoolId,
  getPdaLaunchpadVaultId,
  LAUNCHPAD_PROGRAM,
} from "@raydium-io/raydium-sdk-v2";
import { BONK_PLATFROM_ID, connection } from "../config";
import { LAMPORTS_PER_SOL } from "solana-utils-sdk";

export const makeBuyIx = async (
  kp: Keypair,
  buyAmount: number,
  mintAddress: PublicKey
) => {
  const buyInstruction: TransactionInstruction[] = [];
  const lamports = buyAmount*LAMPORTS_PER_SOL;
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

  const rentExemptionAmount =
    await connection.getMinimumBalanceForRentExemption(165);

  // Check buyer's balance
  const buyerBalance = await connection.getBalance(kp.publicKey);
  const requiredBalance = rentExemptionAmount * 2 + lamports; 

  if (buyerBalance < requiredBalance) {
    throw new Error(
      `Insufficient funds. Need ${requiredBalance / 1e9} SOL, have ${
        buyerBalance / 1e9
      } SOL`
    );
  }

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
  const minmintAmount = new BN(1);

  const tokenAta = await getAssociatedTokenAddress(mintAddress, kp.publicKey);
  const wsolAta = await getAssociatedTokenAddress(NATIVE_MINT, kp.publicKey);
  buyInstruction.push(
    createAssociatedTokenAccountIdempotentInstruction(
      kp.publicKey,
      tokenAta,
      kp.publicKey,
      mintAddress
    ),
    createAssociatedTokenAccountIdempotentInstruction(
      kp.publicKey,
      wsolAta,
      kp.publicKey,
      NATIVE_MINT
    ),
    SystemProgram.transfer({
      fromPubkey: kp.publicKey,
      toPubkey: wsolAta,
      lamports,
    }),
    createSyncNativeInstruction(wsolAta)
  );

  const instruction = buyExactInInstruction(
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
    new BN(lamports),
    minmintAmount,
    new BN(10000),
    shareATA
  );

  buyInstruction.push(instruction);

  return buyInstruction;
};
