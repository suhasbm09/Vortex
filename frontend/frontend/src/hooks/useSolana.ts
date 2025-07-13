import { AnchorProvider, Program } from "@coral-xyz/anchor"
import { Connection, PublicKey } from "@solana/web3.js"
import { useMemo } from "react"
import idl from "../smart_contract.json"

const NETWORK = "https://api.devnet.solana.com"

interface Wallet {
  publicKey: PublicKey;
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
}

export const useSolana = (wallet: Wallet | undefined) => {
  // Defensive check for wallet
  if (!wallet || !wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
    return { program: undefined, provider: undefined };
  }

  const provider = useMemo(() => {
    const connection = new Connection(NETWORK, "processed")
    return new AnchorProvider(connection, wallet, {
      preflightCommitment: "processed",
    })
  }, [wallet])

  const program = useMemo(() => {
    if (!idl || !provider) {
      return undefined;
    }
    try {
      return new Program(idl as any, provider);
    } catch (e) {
      console.error("Failed to create Program instance:", e)
      return undefined;
    }
  }, [provider, idl])

  return { program, provider }
}
