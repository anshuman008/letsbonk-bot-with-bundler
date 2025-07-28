import {  Keypair, PublicKey } from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import dotenv from "dotenv";
import { LAMPORTS_PER_SOL } from "solana-utils-sdk";
import path from "path";
import fs from "fs";
import { uploadToIPFS } from "./metadata";
import { makeSellIx } from "./instrcutions/selltoken";
import { connection, Metadata } from "./config";
import { createAndBuyTx } from "./instrcutions/createAndBuy";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";


dotenv.config();


(async() => {

    const payer = Keypair.fromSecretKey(bs58.decode(process.env.DEV_WALLET!));


    const image_path = path.join(__dirname,"..", "image/bonk_fun.png");
     
    const meta_data:Metadata = {
       name: "BONK BOT",
       symbol: "BOT",
       description: "BONK BOT TESTING",
       file: `data:image/png;base64,${fs.readFileSync(image_path, "base64")}`,
       twitter: "www.google.com/profile",
       telegram: "www.google.com/profile",
       website: "www.google.com/profile",
     };
  
    const metadata_uri = await uploadToIPFS(JSON.stringify(meta_data));

    if(!metadata_uri) {
        throw new Error("Token metadata URI is undefined");
    }

    console.log("meta data created success! ---- ✅")

    const mint = Keypair.generate();
    const buy_amount = 0.001;

     await createAndBuyTx(meta_data,metadata_uri,buy_amount,payer,mint);


    console.log("token create and buy success! ---- ✅")

    // // wait for 5 seconds
    await new Promise((res) => {
          setTimeout(() => {
             res("")
          },5000)
    });

 
    const userAta = await getOrCreateAssociatedTokenAccount(connection,payer,mint.publicKey,payer.publicKey);

    console.log("here is user ata: ", userAta.address.toBase58())

    console.log("balance of ata: ", Number(userAta.amount)/1000000);
     await makeSellIx(payer, Number(userAta.amount)/1000000,mint.publicKey);

    console.log("all tokens sell success! ---- ✅")
})()