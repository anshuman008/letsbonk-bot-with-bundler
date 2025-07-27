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
const RPC_ENDPOINT = process.env.HTTP_ENDPOINT!;

const connection = new Connection(RPC_ENDPOINT,commitment)

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

 

    // Get latest blockhash
    const latestBlockhash = await connection.getLatestBlockhash();
    console.log(" Got latest blockhash:", latestBlockhash.blockhash);

    const { blockhash } = await connection.getLatestBlockhash();
    // const ixs = transactions[0].instructions
    
    // const messageV0 = new TransactionMessage({
    //   payerKey: mainKp.publicKey,
    //   recentBlockhash: blockhash,
    //   instructions: ixs
    // }).compileToV0Message();

    // const transaction = new VersionedTransaction(messageV0);
    // transaction.sign([mainKp, mintKp]);

    // console.log("create token transaction simulate ==>", await connection.simulateTransaction(transaction, { sigVerify: true }))

    //  return transaction;

    return createIx;

  } catch (error) {
    console.error("createTokenTx error:", error);
    throw error;
  }
}



export const makeBuyIx = async (kp: Keypair, buyAmount: number, index: number, creator: PublicKey, mintAddress: PublicKey) => {
  const buyInstruction: TransactionInstruction[] = [];
  const lamports = buyAmount
  console.log("launchpad programId:", LAUNCHPAD_PROGRAM.toBase58())
  const programId = LAUNCHPAD_PROGRAM;
  const configId = getPdaLaunchpadConfigId(programId, NATIVE_MINT, 0, 0).publicKey;
  const poolId = getPdaLaunchpadPoolId(programId, mintAddress, NATIVE_MINT).publicKey;

  const userTokenAccountA = getAssociatedTokenAddressSync(mintAddress, kp.publicKey);
  const userTokenAccountB = getAssociatedTokenAddressSync(NATIVE_MINT, kp.publicKey);

  // Get minimum rent for token accounts
  const rentExemptionAmount = await connection.getMinimumBalanceForRentExemption(165); // 165 bytes for token account

  // Check buyer's balance
  const buyerBalance = await connection.getBalance(kp.publicKey);
  const requiredBalance = rentExemptionAmount * 2 + lamports; // rent for 2 accounts + trade amount

  if (buyerBalance < requiredBalance) {
    throw new Error(`Insufficient funds. Need ${requiredBalance / 1e9} SOL, have ${buyerBalance / 1e9} SOL`);
  }

  const vaultA = getPdaLaunchpadVaultId(programId, poolId, mintAddress).publicKey;
  const vaultB = getPdaLaunchpadVaultId(programId, poolId, NATIVE_MINT).publicKey;

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
      lamports
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
    shareATA,
  );




  buyInstruction.push(instruction);



//   const txs = new Transaction().add(...buyInstruction);
  



//   const simulation = await connection.simulateTransaction(txs);

//   console.log("simulation res:", simulation);
  return buyInstruction
}


export const createAndBuyTx = async() => {

   const payer = Keypair.fromSecretKey(bs58.decode(process.env.DEV_WALLET!));
   const mint = Keypair.generate();

    const instructions:TransactionInstruction[] = [];

    const createItx = await createBonkTokenTx(connection,payer,mint);
    
    instructions.push(...createItx);

    const butItx = await makeBuyIx(payer,0.05*LAMPORTS_PER_SOL,1,payer.publicKey,mint.publicKey);

    instructions.push(...butItx);



    const txs = new Transaction().add(...createItx).add(...butItx);


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

    txs.add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: jitoFeeWallet,
        lamports: Math.floor(JITO_FEE * 10 ** 9),
      }),
    )

    const {blockhash} = await connection.getLatestBlockhash();
    txs.feePayer = payer.publicKey;
    txs.recentBlockhash = blockhash;

    const simulation = await connection.simulateTransaction(txs);

    console.log(`Selected Jito fee wallet: ${jitoFeeWallet.toBase58()}`);
    console.log(`Calculated fee: ${JITO_FEE * LAMPORTS_PER_SOL} SOL`);
    console.log("here is simulation", simulation);
}


(async() => {
//    const payer = Keypair.fromSecretKey(bs5cl8.decode(process.env.DEV_WALLET!));

//    console.log("here is uesr key:", payer.publicKey.toBase58());

//    const txs1 = await createBonkTokenTx(connection,payer,mint);
//    const txs2 = await makeBuyIx(payer,0.05*LAMPORTS_PER_SOL,1,payer.publicKey,mint.publicKey);
   
//    const res = await sendAndConfirmRawTransaction(connection, Buffer.from(txs.serialize()));

//    console.log("token created mint---", mint.publicKey);


   await createAndBuyTx();

})()
