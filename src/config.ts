import { Raydium, TxVersion } from '@raydium-io/raydium-sdk-v2'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import dotenv from "dotenv";

dotenv.config();


const HELIUS_RPC= process.env.HTTP_ENDPOINT!;

export const connection = new Connection(HELIUS_RPC) 
export const BONK_PLATFROM_ID = new PublicKey("FfYek5vEz23cMkWsdJwG2oa6EphsvXSHrGpdALN4g6W1")
export const JITO_FEE = 0.0001;
export const txVersion = TxVersion.LEGACY
const cluster = 'mainnet'

let raydium: Raydium | undefined

export const initSdk = async (wallet: PublicKey, params?: { loadToken?: boolean }) => {
    if (raydium) return raydium

    if (connection.rpcEndpoint === clusterApiUrl('mainnet-beta')) {// mainnet-beta
        console.warn('Using free RPC node might cause unexpected errors. Consider using a paid RPC node.')
    }

    raydium = await Raydium.load({
        owner: wallet,
        connection,
        cluster,
        disableFeatureCheck: true,
        disableLoadToken: !params?.loadToken,
        blockhashCommitment: 'confirmed',
    })

    return raydium
}


export interface Metadata {
  name: string,
  symbol: string,
  description: string,
  file:string,
  twitter?:string,
  telegram?:string,
  website?:string
}


  