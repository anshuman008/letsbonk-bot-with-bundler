import { getATAAddress, getPdaLaunchpadAuth, getPdaLaunchpadConfigId, getPdaLaunchpadPoolId, getPdaLaunchpadVaultId, LAUNCHPAD_PROGRAM, LaunchpadConfig, sleep, SYSTEM_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AddressLookupTableProgram, ComputeBudgetProgram, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { connection } from "../config";
import { createAndSendV0Tx } from "../../exucutor/legacy";





export async function addBonkAddressesToTable(lutAddress: PublicKey, mint: PublicKey, walletKPs: Keypair[], mainKp: Keypair) {
  const walletPKs: PublicKey[] = walletKPs.map(wallet => wallet.publicKey);
  try {
    const configId = getPdaLaunchpadConfigId(LAUNCHPAD_PROGRAM, NATIVE_MINT, 0, 0).publicKey;
    const configData = await connection.getAccountInfo(configId);
    if (!configData) {
      throw new Error('Config not found');
    }
    const platformId = new PublicKey("4Bu96XjU84XjPDSpveTVf6LYGCkfW5FK7SNkREWcEfV4")
    const poolId = getPdaLaunchpadPoolId(LAUNCHPAD_PROGRAM, mint, NATIVE_MINT).publicKey
    const vaultA = getPdaLaunchpadVaultId(LAUNCHPAD_PROGRAM, poolId, mint).publicKey;
    const vaultB = getPdaLaunchpadVaultId(LAUNCHPAD_PROGRAM, poolId, NATIVE_MINT).publicKey;
    const userTokenAccountB = getAssociatedTokenAddressSync(NATIVE_MINT, mainKp.publicKey)
    const shareATA = getATAAddress(mainKp.publicKey, NATIVE_MINT, TOKEN_PROGRAM_ID).publicKey;
    const authProgramId = getPdaLaunchpadAuth(LAUNCHPAD_PROGRAM).publicKey;

    let i = 0
    while (true) {
      if (i > 5) {
        console.log("Extending LUT failed, Exiting...")
        return
      }
      // Step 1 - Adding bundler wallets
      const addAddressesInstruction = AddressLookupTableProgram.extendLookupTable({
        payer: mainKp.publicKey,
        authority: mainKp.publicKey,
        lookupTable: lutAddress,
        addresses: walletPKs,
      });
      const result = await createAndSendV0Tx([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 50_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 500_000 }),
        addAddressesInstruction
      ], mainKp, connection);
      if (result) {
        console.log("Successfully added wallet addresses.")
        i = 0
        break
      } else {
        console.log("Trying again with step 1")
      }
    }
    await sleep(10000)

    // Step 2 - Adding wallets' token ata
    while (true) {
      if (i > 5) {
        console.log("Extending LUT failed, Exiting...")
        return
      }

      console.log(`Adding atas for the token ${mint.toBase58()}`)
      const baseAtas: PublicKey[] = []

      for (const wallet of walletKPs) {
        const baseAta = getAssociatedTokenAddressSync(mint, wallet.publicKey)
        baseAtas.push(baseAta);
      }
      console.log("Base atas address num to extend: ", baseAtas.length)
      const addAddressesInstruction1 = AddressLookupTableProgram.extendLookupTable({
        payer: mainKp.publicKey,
        authority: mainKp.publicKey,
        lookupTable: lutAddress,
        addresses: baseAtas,
      });
      const result = await createAndSendV0Tx([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 50_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 500_000 }),
        addAddressesInstruction1
      ], mainKp, connection);

      if (result) {
        console.log("Successfully added base ata addresses.")
        i = 0
        break
      } else {
        console.log("Trying again with step 2")
      }
    }
    await sleep(10000)

    // Step 3 - Adding wallets' wsol accounts
    while (true) {
      if (i > 5) {
        console.log("Extending LUT failed, Exiting...")
        return
      }

      console.log(`Adding atas for the token ${mint.toBase58()}`)
      const wsolAccs: PublicKey[] = []

      for (const wallet of walletKPs) {
        const wsolAcc = getAssociatedTokenAddressSync(NATIVE_MINT, wallet.publicKey)
        wsolAccs.push(wsolAcc);
      }
      console.log("Wsol Account address num to extend: ", wsolAccs.length)
      const addAddressesInstruction1 = AddressLookupTableProgram.extendLookupTable({
        payer: mainKp.publicKey,
        authority: mainKp.publicKey,
        lookupTable: lutAddress,
        addresses: wsolAccs,
      });
      const result = await createAndSendV0Tx([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 50_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 500_000 }),
        addAddressesInstruction1
      ], mainKp, connection);

      if (result) {
        console.log("Successfully added Wsol Account addresses.")
        i = 0
        break
      } else {
        console.log("Trying again with step 2")
      }
    }
    await sleep(10000)

    // Step 4 - Adding main wallet and static keys
    while (true) {
      if (i > 5) {
        console.log("Extending LUT failed, Exiting...")
        return
      }

      const addAddressesInstruction3 = AddressLookupTableProgram.extendLookupTable({
        payer: mainKp.publicKey,
        authority: mainKp.publicKey,
        lookupTable: lutAddress,
        addresses: [mainKp.publicKey, mint, LAUNCHPAD_PROGRAM, SYSTEM_PROGRAM_ID, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, SystemProgram.programId, SYSVAR_RENT_PUBKEY, ComputeBudgetProgram.programId, configId, platformId, poolId, vaultA, vaultB, userTokenAccountB, shareATA, authProgramId],
      });

      const result = await createAndSendV0Tx([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 50_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 500_000 }),
        addAddressesInstruction3
      ], mainKp, connection);

      if (result) {
        console.log("Successfully added main wallet address.")
        i = 0
        break
      } else {
        console.log("Trying again with step 3")
      }
    }
    await sleep(10000)
    console.log("Lookup Table Address extended successfully!")
    console.log(`Lookup Table Entries: `, `https://explorer.solana.com/address/${lutAddress.toString()}/entries`)
  }
  catch (err) {
    console.log("There is an error in adding addresses in LUT. Please retry it.")
    return;
  }
}

