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
import { UBIInfo, getMint } from 'models/types';

const { SystemProgram } = web3;

const programID = new PublicKey(idl.metadata.address);

export const Mint: FC = () => {
    const { connection } = useConnection();
    const moniker = connection.rpcEndpoint.includes("mainnet") ? "mainnet-beta" : "devnet"
    const wallet = useWallet();
    const { getUserSOLBalance } = useUserSOLBalanceStore();

    const getProvider = () => {
        const connection = new Connection("https://api."+moniker+".solana.com");
        const provider = new AnchorProvider(
            connection,
            wallet,
            AnchorProvider.defaultOptions()
        );
        return provider;
    };

    const onClick = useCallback(async () => {
        let idl = await Program.fetchIdl(programID, getProvider())
        console.log(idl)
        if (!wallet.publicKey) {
            notify({ type: 'error', message: 'error', description: 'Wallet not connected!' });
            return;
        }


        let pda = PublicKey.findProgramAddressSync(
            [Buffer.from("ubi_info7"), wallet.publicKey.toBytes()],
            programID
        )

        let provider:AnchorProvider = null

        try {
            provider = getProvider()
        } catch (error) { console.log(error) }

        let mint_signer = PublicKey.findProgramAddressSync(
            [Buffer.from("minter")],
            programID
        )

        let ata = await getAssociatedTokenAddress(
            new PublicKey(getMint(moniker)), // mint
            wallet.publicKey, // owner
            false // allow owner off curve
        );

        let signature: TransactionSignature = '';

        let info_raw = await connection.getAccountInfo(pda[0])
        if(info_raw) {
            let info = new UBIInfo(info_raw.data)

            console.log("info ", info)
            if(!info.getIsTrusted().valueOf()) {
                notify({ type: 'error', message: "Need 3 trusters in order to mint"})
                return
            } else if(new Date().getTime() / 1000 < info.getLastIssuance() + 24*3600) {
                notify({ type: 'error', message: "You minted NUBI less than 24 hours ago"})
                return
            } else if(info.getIsTrusted()) {
                try {

                    const program = new Program(idl, programID, provider)
        
                    let transaction = new Transaction();
        
                    transaction.add(
                        await program.methods.mintToken().accounts({
                            mintSigner: mint_signer[0],
                            ubiMint: getMint(moniker),
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
        
                    notify({ type: 'success', message: 'You have successfully minted some NUBI. Come back in 24 hours!', txid: signature });
                } catch (error) {
                    notify({ type: 'error', message: `Transaction failed!`, description: error?.message, txid: signature });
                }
            } else {
                notify({ type: 'error', message: "You must have 3 people trust your address before you can mint"})
            }
        } else {
            notify({ type: 'error', message: "Please initialize your account"})
        }

    }, [wallet.publicKey, connection, getUserSOLBalance]);

    return (
        <div>
            <button
                className="px-8 m-2 btn bg-gradient-to-r from-[#c53fe9ff] to-[#e4d33aff] hover:from-[#131825] hover:to-[#131825] max-width-200 width-20 ..."
                onClick={onClick}
            >
                <span>mint</span>
            </button>
        </div>
    );
};

