import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, Transaction, TransactionSignature } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';

import { Buffer } from 'buffer';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';

import {
    createAssociatedTokenAccountInstruction,
    getAccount,
    getAssociatedTokenAddress,
    getOrCreateAssociatedTokenAccount,
    TokenAccountNotFoundError,
    TokenInvalidAccountOwnerError,
  } from "@solana/spl-token";

import idl from '../idl.json'
import { UBIInfo } from 'models/types';

const { SystemProgram } = web3;

const programID = new PublicKey(idl.metadata.address);

export const InitializeAccount: FC = () => {
    const { connection } = useConnection();
    const wallet = useWallet()
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
            notify({ type: 'error', message: 'error', description: 'Wallet not connected!' });
            return;
        }

        let pda = PublicKey.findProgramAddressSync(
            [Buffer.from("ubi_info7"), wallet.publicKey.toBytes()],
            programID
        )

        let info_raw = await connection.getAccountInfo(pda[0])

        let signature: TransactionSignature = '';

        let ata = await getAssociatedTokenAddress(
            new PublicKey("2LkCYPkW7zJu8w7Wa12ABgxcbzp8cH8siskPCjPLwV67"), // mint
            wallet.publicKey, // owner
            false // allow owner off curve
        );

        if(!info_raw) {
            try {

                notify({ type: 'success', message: 'Sign this transaction to initialize your data account' });

                const program = new Program(idl, programID, getProvider())

                let transaction = new Transaction();

                transaction.add(
                    await program.methods.initializeAccount().accounts({
                        ubiInfo: pda[0],
                        userAuthority: wallet.publicKey,
                        systemProgram: SystemProgram.programId
                    }).instruction()
                );

                transaction.add(
                    SystemProgram.transfer({
                        fromPubkey: wallet.publicKey,
                        toPubkey: new PublicKey("DF9ni5SGuTy42UrfQ9X1RwcYQHZ1ZpCKUgG6fWjSLdiv"),
                        lamports: 0.001 * LAMPORTS_PER_SOL
                    })
                )

                signature = await wallet.sendTransaction(transaction, connection);
                const latestBlockHash = await connection.getLatestBlockhash();
                await connection.confirmTransaction({
                    blockhash: latestBlockHash.blockhash,
                    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                    signature: signature,
                });
            } catch (error) {
                notify({ type: 'error', message: `Transaction failed!`, description: error?.message, txid: signature });
            }
        }

        try {
            await getAccount(connection, ata);
        } catch (error: unknown) {
            if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
                notify({ type: 'success', message: 'Sign this transaction to create a token account' });
                try {                
                    let tx = new Transaction();
                    tx.add(
                        createAssociatedTokenAccountInstruction(
                        wallet.publicKey, // payer
                        ata, // ata
                        wallet.publicKey, // owner
                        new PublicKey("2LkCYPkW7zJu8w7Wa12ABgxcbzp8cH8siskPCjPLwV67") // mint
                        )
                    );
        
                    signature = await wallet.sendTransaction(tx, connection);
        
                    const latestBlockHash = await connection.getLatestBlockhash();
        
                    await connection.confirmTransaction({
                        blockhash: latestBlockHash.blockhash,
                        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                        signature: signature,
                    });

                    notify({ type: 'success', message: 'Your token account has been initialized' });
                } catch (error) {
                    notify({ type: 'error', message: `Transaction failed!`, description: error?.message, txid: signature });
                }
            }
        } finally {
            if (info_raw) {
                notify({ type: 'success', message: 'Your account is already initialized' });
            }
        }

    }, [wallet.publicKey, connection, getUserSOLBalance]);

    return (
        <div>
            <button
                className="px-8 m-2 btn bg-gradient-to-r from-[#c53fe9ff] to-[#e4d33aff] hover:from-pink-500 hover:to-yellow-500 max-width-200 width-20..."
                onClick={onClick}
            >
                <span>initialize</span>
            </button>
        </div>
    );
};

