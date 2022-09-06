import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, TransactionSignature, sendAndConfirmTransaction } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';

import { Buffer } from 'buffer';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';

import idl from '../idl.json'

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

        if (!wallet.publicKey) {
            console.log('error', 'Wallet not connected!');
            notify({ type: 'error', message: 'error', description: 'Wallet not connected!' });
            return;
        }

        let pda = PublicKey.findProgramAddressSync(
            [Buffer.from("ubi_info7"), wallet.publicKey.toBytes()],
            programID
        )

        let signature: TransactionSignature = '';

        let provider = null

        try {
            console.log("provider ", provider)

            console.log("pda ", pda[0].toString())

            const program = new Program(idl, programID, getProvider())
            console.log(program);

            let transaction = new Transaction();

            transaction.add(
                await program.methods.initializeAccount().accounts({
                    ubiInfo: pda[0],
                    userAuthority: wallet.publicKey,
                    systemProgram: SystemProgram.programId
                }).instruction()
            );

            signature = await wallet.sendTransaction(transaction, connection);

            await connection.confirmTransaction(signature);
            console.log(signature);

            console.log("Your transaction signature", signature.toString());
            notify({ type: 'success', message: 'Transaction successful!', txid: signature });
        } catch (error) {
            notify({ type: 'error', message: `Transaction failed!`, description: error?.message, txid: signature });
            console.log('error', `Transaction failed! ${error?.message}`, signature);
        }

    }, [wallet.publicKey, connection, getUserSOLBalance]);

    return (
        <div>
            <button
                className="px-8 m-2 btn bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."
                onClick={onClick}
            >
                <span>initialize</span>
            </button>
        </div>
    );
};

