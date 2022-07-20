import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaUbi } from "../target/types/solana_ubi";

describe("solana-ubi", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SolanaUbi as Program<SolanaUbi>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
