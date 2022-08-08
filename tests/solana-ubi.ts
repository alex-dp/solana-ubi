import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { SolanaUbi } from "../target/types/solana_ubi";


//auth pk
//As96uoN5tdDCJFDVvLXY4bYuMvUrEkhW9r6R5kLs1ALR
//auth token acc
//DvwFPuVY6167XR8s8Bdak1gNCDLkYbeVLFsTcMwfkYrv
//ubi info pda
//44NtGZAwJLB49mRkWTLkkUhzathzsHvQ4NXN8ry52vi5

describe("solana-ubi", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SolanaUbi as Program<SolanaUbi>;
  
	let arr = new Uint8Array(32).fill(7);
	arr[5] = 2
	let auth = anchor.web3.Keypair.fromSeed(arr);
	let pda = anchor.utils.publicKey.findProgramAddressSync(
    	["ubi_info5", auth.publicKey.toBytes()],
    	program.programId
    )
    
  let mint_signer = anchor.utils.publicKey.findProgramAddressSync(
    	["minter"],
    	program.programId
    )
    
  console.log("auth", auth.publicKey.toString())
  console.log("mint signer", mint_signer[0].toString())
  console.log("ubi info pda", pda[0].toString())
  
  it("Is initialized!", async () => {
    const tx = await program.methods.initialize().accounts({
          ubiInfo: pda[0],
          userAuthority: auth.publicKey,
          systemProgram: SystemProgram.programId
      }).signers([auth]).rpc();
    console.log("Your transaction signature", tx);
  });
  
  it("Is minted!", async () => {
     
    const tx = await program.methods.mintToken().accounts({
          mintSigner: mint_signer[0],
          ubiMint: "4jzEiVCdX5DbcadqChrrvWaYJT7YHGy3cnH4peN3fc54",
          userAuthority: auth.publicKey,
          ubiTokenAccount: "DvwFPuVY6167XR8s8Bdak1gNCDLkYbeVLFsTcMwfkYrv",
          ubiInfo: pda[0],
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY
      }).signers([auth]).rpc();
    console.log("Your transaction signature", tx);
  });
});
