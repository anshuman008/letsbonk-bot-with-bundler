import {
  TxVersion,
  getPdaLaunchpadPoolId,
  Curve,
  PlatformConfig,
  LAUNCHPAD_PROGRAM,
  buyExactInInstruction,
  getPdaLaunchpadConfigId,
  getATAAddress,
  getPdaLaunchpadAuth,
  getPdaLaunchpadVaultId,
  sellExactInInstruction,
} from "@raydium-io/raydium-sdk-v2";
import {
  Connection,
  Keypair,
  VersionedTransaction,
  TransactionMessage,
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";





const sellBundleTx = async(connection:Connection,mint:PublicKey, sellerKps:Keypair[],lookupTableAddress:PublicKey  ) => {


      console.log("sellersKps:", sellerKps);
     const slippageBps = 500 


  console.log("sellerKps:", sellerKps);
  try {
    const lookupTableAccount = (
      await connection.getAddressLookupTable(lookupTableAddress)
    ).value;
    if (!lookupTableAccount) {
      throw new Error("Lookup table not found");
    }

    const buyTxs: VersionedTransaction[] = [];
    // Reduce batch size to 3 to keep transaction size under limit
    const batchSize = 2;

    for (let i = 0; i < sellerKps.length; i += batchSize) {
      const sellInstruction = [
        // Optimize compute budget
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }),
        ComputeBudgetProgram.setComputeUnitLimit({ units: 1000_000 }),
      ];

      // Add up to batchSize buy instructions per batch
      const endIdx = Math.min(i + batchSize, sellerKps.length);
      for (let j = i; j < endIdx; j++) {
        const mainKp = sellerKps[j];
        if (mainKp) {
          const mintA = mint;
          const mintB = NATIVE_MINT;

          const tokenAmountBN = new BN(50000 * 1000000); 
            const estimatedSolOutput = new BN(1000000);

            const minSolAmount = estimatedSolOutput
            .mul(new BN(10000 - slippageBps))
            .div(new BN(10000));

          const programId = LAUNCHPAD_PROGRAM;
          const configId = getPdaLaunchpadConfigId(
            programId,
            NATIVE_MINT,
            0,
            0
          ).publicKey;
          const poolId = getPdaLaunchpadPoolId(
            programId,
            mintA,
            mintB
          ).publicKey;
          console.log("poolId:", poolId);

          const userTokenAccountA = getAssociatedTokenAddressSync(
            mintA,
            mainKp.publicKey
          );
          console.log("userTokenAccountA:", userTokenAccountA);
          const userTokenAccountB = getAssociatedTokenAddressSync(
            mintB,
            mainKp.publicKey
          );
          console.log("userTokenAccountB:", userTokenAccountB);

          // Get minimum rent for token accounts
          const rentExemptionAmount =
            await connection.getMinimumBalanceForRentExemption(165); // 165 bytes for token account
          console.log(
            "rentExemptionAmount:",
            rentExemptionAmount
          );


          const vaultA = getPdaLaunchpadVaultId(
            programId,
            poolId,
            mintA
          ).publicKey;
          console.log("vaultA:", vaultA);

          const vaultB = getPdaLaunchpadVaultId(
            programId,
            poolId,
            mintB
          ).publicKey;
          console.log("vaultB:", vaultB);

          const shareATA = getATAAddress(mainKp.publicKey, mintB).publicKey;
          const authProgramId = getPdaLaunchpadAuth(programId).publicKey;
          const minMintAAmount = new BN(0);

          const userAtaInfo = await connection.getAccountInfo(
            userTokenAccountA
          );
          console.log("userAtaInfo:", userAtaInfo);
          const userAtaInfoB = await connection.getAccountInfo(
            userTokenAccountB
          );
          console.log("userAtaInfoB:", userAtaInfoB);

        //   const associatedToken = await getAssociatedTokenAddress(
        //     mintA,
        //     mainKp.publicKey,
        //     false,
        //     programId,
        //     ASSOCIATED_TOKEN_PROGRAM_ID
        //   );

        //   const instructions: TransactionInstruction[] = [];
        //   instructions.push(
        //     createAssociatedTokenAccountIdempotentInstruction(
        //       mainKp.publicKey,
        //       associatedToken,
        //       mainKp.publicKey,
        //       mintA,
        //       programId,
        //       ASSOCIATED_TOKEN_PROGRAM_ID
        //     )
        //   );
        //   const createAtaInstruction = instructions;
        //   console.log(
        //     "createAtaInstruction:",
        //     createAtaInstruction
        //   );

        //   if (createAtaInstruction) {
        //     buyInstruction.push(...createAtaInstruction);
        //   }

          const instruction = sellExactInInstruction(
            programId,
            mainKp.publicKey,
            authProgramId,
            configId,
            new PublicKey("4Bu96XjU84XjPDSpveTVf6LYGCkfW5FK7SNkREWcEfV4"),
            poolId,
            userTokenAccountA,
            userTokenAccountB,
            vaultA,
            vaultB,
            mintA,
            mintB,
            TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            tokenAmountBN,
            minSolAmount,
            new BN(10000),
            shareATA
          );

          sellInstruction.push(instruction);
        }
      }

      const { blockhash } = await connection.getLatestBlockhash();
      const messageV0 = new TransactionMessage({
        payerKey: sellerKps[i].publicKey,
        recentBlockhash: blockhash,
        instructions: sellInstruction,
      }).compileToV0Message([lookupTableAccount]);

      const tx = new VersionedTransaction(messageV0);
      const signers = sellerKps.slice(i, endIdx).filter(Boolean);
      tx.sign(signers);
      console.log("tx:", tx);

      const txSize = tx.serialize().length;
      console.log("Transaction size:", txSize, "bytes");

      if (txSize > 1232) {
        console.warn(
          "Warning: Transaction size exceeds 1232 bytes limit:",
          txSize
        );
      }

      buyTxs.push(tx);

      try {
        console.log(
          "tx simulate:",
          await connection.simulateTransaction(tx, { sigVerify: true })
        );
        const simResult = await connection.simulateTransaction(tx);
        console.log("simResult:", simResult);
        console.log(
          `Simulation result for batch ${i / batchSize + 1}:`,
          simResult.value.err || "Success"
        );
      } catch (err) {
        console.error(`Simulation error for batch ${i / batchSize + 1}:`, err);
        throw err;
      }
      console.log("buyTxs:", buyTxs);
    }

    return { transactions: buyTxs };
  } catch (err) {
    console.error("makeBuyTx error", err);
    throw err;
  }
}