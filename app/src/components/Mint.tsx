import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { sendAndConfirmTransaction, Transaction, TransactionSignature } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';

import { Buffer } from 'buffer';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';

import idl from '../idl.json'
import { TOKEN_PROGRAM_ID } from '@project-serum/anchor/dist/cjs/utils/token';
import { getAssociatedTokenAddress } from '@solana/spl-token';

const { SystemProgram } = web3;

const programID = new PublicKey(idl.metadata.address);

export const Mint: FC = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { getUserSOLBalance } = useUserSOLBalanceStore();

    const getProvider = () => {
        const connection = new Connection("https://api.devnet.solana.com");
        const provider = new AnchorProvider(
            connection,
            wallet,
            AnchorProvider.defaultOptions()
        );
        return provider;
    };

    const onClick = useCallback(async () => {
        const idl = await Program.fetchIdl(programID, getProvider())
        if (!wallet.publicKey) {
            console.log('error', 'Wallet not connected!');
            notify({ type: 'error', message: 'error', description: 'Wallet not connected!' });
            return;
        }


        let pda = PublicKey.findProgramAddressSync(
            [Buffer.from("ubi_info7"), wallet.publicKey.toBytes()],
            programID
        )

        let provider = null

        try {
            provider = getProvider()
        } catch (error) { console.log(error) }

        let mint_signer = PublicKey.findProgramAddressSync(
            [Buffer.from("minter")],
            programID
        )

        let ata = await getAssociatedTokenAddress(
            new PublicKey("2LkCYPkW7zJu8w7Wa12ABgxcbzp8cH8siskPCjPLwV67"), // mint
            wallet.publicKey, // owner
            false // allow owner off curve
        );

        let signature: TransactionSignature = '';

        try {

            const program = new Program(idl, programID, provider)

            let transaction = new Transaction();

            console.log("pk ", wallet.publicKey.toString())
            console.log("ata ", ata.toString())
            console.log("ubi info ", pda[0].toString())

            transaction.add(
                await program.methods.mintToken().accounts({
                    mintSigner: mint_signer[0],
                    ubiMint: "2LkCYPkW7zJu8w7Wa12ABgxcbzp8cH8siskPCjPLwV67",
                    userAuthority: wallet.publicKey,
                    ubiTokenAccount: ata,
                    ubiInfo: pda[0],
                    state: "BfNHs2d373sCcxw5MjNmgLgQCEoFHM3Hv8XpEvqePLjD",
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                }).instruction()
            );

            signature = await wallet.sendTransaction(transaction, connection);

            const latestBlockHash = await connection.getLatestBlockhash();

            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signature,
            });

            console.log("Your transaction signature", signature.toString());
            notify({ type: 'success', message: 'You have successfully minted some NUBI. Come back in 24 hours!', txid: signature });
        } catch (error) {
            notify({ type: 'error', message: `Transaction failed!`, description: error?.message, txid: signature });
            console.log('error', `Transaction failed! ${error?.message}`, signature);
        }

    }, [wallet.publicKey, connection, getUserSOLBalance]);

    return (
        <div>
            <button
                className="px-8 m-2 btn bg-gradient-to-r from-[#c53fe9ff] to-[#e4d33aff] hover:from-pink-500 hover:to-yellow-500 max-width-200 width-20 ..."
                onClick={onClick}
            >
                <span>mint</span>
            </button>
        </div>
    );
};

