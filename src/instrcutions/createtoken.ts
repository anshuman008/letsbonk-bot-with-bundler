import { Keypair } from "@solana/web3.js";
import { BONK_PLATFROM_ID, connection, initSdk, Metadata } from "../config";
import { NATIVE_MINT } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import {
  getPdaLaunchpadConfigId,
  TxVersion,
  LAUNCHPAD_PROGRAM,
  LaunchpadConfig,
} from "@raydium-io/raydium-sdk-v2";


export const createBonkTokenTx = async (
  tokenmetadata: Metadata,
  metadata_uri: string,
  solBuyAmount: number,
  mainKp: Keypair,
  mintKp: Keypair
) => {
  try {
    if (!metadata_uri) {
      throw new Error("Token metadata URI is undefined");
    }

    // Initialize SDK
    const raydium = await initSdk(mainKp.publicKey);

    // Get config info
    const configId = getPdaLaunchpadConfigId(
      LAUNCHPAD_PROGRAM,
      NATIVE_MINT,
      0,
      0
    ).publicKey;
    const configData = await connection.getAccountInfo(configId);

    if (!configData) {
      throw new Error("Config not found");
    }

    const configInfo = LaunchpadConfig.decode(configData.data);
    const mintBInfo = await raydium.token.getTokenInfo(configInfo.mintB);

    // Set up transaction parameters
    const buyAmount = new BN(solBuyAmount * 10 ** 9);
    const slippageAmount = 0.1;
    const slippage = new BN(slippageAmount * 100);

    // Create launchpad transaction
    const { transactions } = await raydium.launchpad.createLaunchpad({
      programId: LAUNCHPAD_PROGRAM,
      mintA: mintKp.publicKey,
      decimals: 6,
      name: tokenmetadata.name,
      symbol: tokenmetadata.symbol,
      migrateType: "amm",
      uri: metadata_uri,
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
      },
    });

    return transactions[0].instructions;
  } catch (error) {
    console.error("createTokenTx error:", error);
    throw error;
  }
};
