import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SystemProgram } from "@solana/web3.js";
import { SolanaUbi } from "../target/types/solana_ubi";

describe("solana-ubi", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SolanaUbi as Program<SolanaUbi>;
  
  it("Is initialized!", async () => {
    let arr = new Uint8Array(32).fill(7);
    arr[5] = 2
    let auth = anchor.web3.Keypair.fromSeed(arr);
    console.log(auth.publicKey.toString())
    let pda = anchor.utils.publicKey.findProgramAddressSync(
    	["ubi_info1"],// auth.publicKey.toString().substr(0,16)],
    	program.programId
    )
    console.log(pda[0].toString())
    // Add your test here.
    const tx = await program.methods.initialize().accounts({
          ubiInfo: pda[0],
          userAuthority: auth.publicKey,
          systemProgram: SystemProgram.programId
      }).signers([auth]).rpc();
    console.log("Your transaction signature", tx);
  });
});
