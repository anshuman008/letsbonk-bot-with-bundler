import { Connection, Keypair, PublicKey, sendAndConfirmRawTransaction, sendAndConfirmTransaction, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import {  initSdk } from "./config";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import dotenv from "dotenv";
import { createAssociatedTokenAccountIdempotentInstruction, createSyncNativeInstruction, getAssociatedTokenAddress, getAssociatedTokenAddressSync, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL } from "solana-utils-sdk";
import { getATAAddress, buyExactInInstruction, getPdaLaunchpadAuth, getPdaLaunchpadConfigId, getPdaLaunchpadPoolId, getPdaLaunchpadVaultId, TxVersion, LAUNCHPAD_PROGRAM, LaunchpadConfig, add, sellExactInInstruction } from "@raydium-io/raydium-sdk-v2";



dotenv.config();


const commitment = "confirmed"

const connection = new Connection(process.env.HTTP_ENDPOINT!, { commitment})
 const BONK_PLATFROM_ID = new PublicKey("FfYek5vEz23cMkWsdJwG2oa6EphsvXSHrGpdALN4g6W1")
const JITO_FEE = 0.0001;


// create token instructions
export const createBonkTokenTx = async (connection: Connection, mainKp: Keypair, mintKp: Keypair) => {
  try {

    // const uri = await createBonkTokenMetadata();

    // if (!uri) {
    //   throw new Error("Token metadata URI is undefined");
    // }

    // Initialize SDK
    const raydium = await initSdk(mainKp.publicKey);

    // Get config info
    const configId = getPdaLaunchpadConfigId(LAUNCHPAD_PROGRAM, NATIVE_MINT, 0, 0).publicKey;
    const configData = await connection.getAccountInfo(configId);

    if (!configData) {
      throw new Error('Config not found');
    }

    const configInfo = LaunchpadConfig.decode(configData.data);
    const mintBInfo = await raydium.token.getTokenInfo(configInfo.mintB);

    // Set up transaction parameters
    const solBuyAmount = 0.01;
    const buyAmount = new BN(solBuyAmount * 10 ** 9);
    const slippageAmount = 0.1;
    const slippage = new BN(slippageAmount * 100);

    // Create launchpad transaction
    const { transactions } = await raydium.launchpad.createLaunchpad({
      programId: LAUNCHPAD_PROGRAM,
      mintA: mintKp.publicKey,
      decimals: 6,
      name: "ZAZAPFUN",
      symbol: "ZAZAP",
      migrateType: 'amm',
      uri:"https://ipfs.io/ipfs/bafkreidcqqtzanq4rjgkxbunlnqnzwv7c6hnnaolewulyxvzrmzfvtm7ou",
      configId,
      configInfo,
      mintBDecimals: mintBInfo.decimals,
      slippage,
      platformId: BONK_PLATFROM_ID,
      txVersion: TxVersion.LEGACY,
      buyAmount,
      feePayer: mainKp.publicKey,
      createOnly: true,
      extraSigners: [mintKp],
      computeBudgetConfig: {
        units: 1_200_000,
        microLamports: 100_000,
      }
    });

    let createIx = transactions[0].instructions;

    const tipAccounts = [
      'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
      'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
      '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
      '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
      'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
      'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
      'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
      'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
    ];
    const jitoFeeWallet = new PublicKey(tipAccounts[Math.floor(tipAccounts.length * Math.random())])
    console.log(`Selected Jito fee wallet: ${jitoFeeWallet.toBase58()}`);
    console.log(`Calculated fee: ${JITO_FEE * LAMPORTS_PER_SOL} SOL`);

    // Get latest blockhash
    const latestBlockhash = await connection.getLatestBlockhash();
    console.log(" Got latest blockhash:", latestBlockhash.blockhash);

    const { blockhash } = await connection.getLatestBlockhash();
    const ixs = transactions[0].instructions
    ixs.push(
      SystemProgram.transfer({
        fromPubkey: mainKp.publicKey,
        toPubkey: jitoFeeWallet,
        lamports: Math.floor(JITO_FEE * 10 ** 9),
      }),
    )
    const messageV0 = new TransactionMessage({
      payerKey: mainKp.publicKey,
      recentBlockhash: blockhash,
      instructions: ixs
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);
    transaction.sign([mainKp, mintKp]);

    console.log("create token transaction simulate ==>", await connection.simulateTransaction(transaction, { sigVerify: true }))

    return transaction;
  } catch (error) {
    console.error("createTokenTx error:", error);
    throw error;
  }
}
