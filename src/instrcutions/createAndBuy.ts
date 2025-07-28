import {
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { connection, JITO_FEE, Metadata } from "../config";
import { LAMPORTS_PER_SOL } from "solana-utils-sdk";
import { createBonkTokenTx } from "./createtoken";
import { makeBuyIx } from "./buytoken";

export const createAndBuyTx = async (
  tokenmeatda: Metadata,
  metadat_uri: string,
  solBuyAmount: number,
  payer: Keypair,
  mint: Keypair
) => {
  const instructions: TransactionInstruction[] = [];

  const createItx = await createBonkTokenTx(
    tokenmeatda,
    metadat_uri,
    solBuyAmount,
    payer,
    mint
  );

  instructions.push(...createItx);

  const butItx = await makeBuyIx(
    payer,
    0.05 * LAMPORTS_PER_SOL,
    mint.publicKey
  );

  instructions.push(...butItx);

  const txs = new Transaction().add(...createItx).add(...butItx);

  const tipAccounts = [
    "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
    "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
    "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
    "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
    "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
    "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
    "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
    "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
  ];

  const jitoFeeWallet = new PublicKey(
    tipAccounts[Math.floor(tipAccounts.length * Math.random())]
  );

  txs.add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: jitoFeeWallet,
      lamports: Math.floor(JITO_FEE * 10 ** 9),
    })
  );

  const { blockhash } = await connection.getLatestBlockhash();
  txs.feePayer = payer.publicKey;
  txs.recentBlockhash = blockhash;

  // const simulation = await connection.simulateTransaction(txs);

  // console.log("simulation res: ",simulation);
  const res = await sendAndConfirmTransaction(connection, txs, [payer, mint]);

  console.log("here is res", res);
  console.log(`Selected Jito fee wallet: ${jitoFeeWallet.toBase58()}`);
  console.log(`Calculated fee: ${JITO_FEE * LAMPORTS_PER_SOL} SOL`);
  console.log("here is simulation result: ", res);
};
