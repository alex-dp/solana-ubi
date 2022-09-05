import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, TransactionSignature, sendAndConfirmTransaction } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';

import { Buffer } from 'buffer';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';

import idl from '../pages/idl.json'

const { SystemProgram, Keypair } = web3;

const programID = new PublicKey(idl.metadata.address);

const network = clusterApiUrl("devnet")

let arr = new Uint8Array(32).fill(7);
arr[5] = 2
let auth = Keypair.fromSeed(arr)

let pda = PublicKey.findProgramAddressSync(
    [Buffer.from("ubi_info7"), auth.publicKey.toBytes()],
    programID
)

export const InitializeAccount: FC = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const { getUserSOLBalance } = useUserSOLBalanceStore();

    const getProvider = () => {
        //Creating a provider, the provider is authenication connection to solana
        const connection = new Connection("https://api.devnet.solana.com");
        const provider = new AnchorProvider(
            connection,
            window.solflare,
            AnchorProvider.defaultOptions()
        );
        return provider;
    };

    const onClick = useCallback(async () => {

        if (!publicKey) {
            console.log('error', 'Wallet not connected!');
            notify({ type: 'error', message: 'error', description: 'Wallet not connected!' });
            return;
        }

        let signature: TransactionSignature = '';

        let provider = null

        try {
            provider = getProvider() //checks & verify the dapp it can able to connect solana network
        } catch (error) { console.log(error) }

        console.log("provider ", provider)

        console.log("pda ", pda[0].toString())

        try {
            console.log(auth.publicKey.toString())

            const program = new Program(idl, programID, provider) //program will communicate to solana network via rpc using lib.json as model
            console.log(program);

            let transaction = new Transaction();

            transaction.add(
                await program.methods.initializeAccount().accounts({
                    ubiInfo: pda[0],
                    userAuthority: auth.publicKey,
                    systemProgram: SystemProgram.programId
                }).instruction()
            );

            sendAndConfirmTransaction(connection, transaction, [auth])
            console.log("Your transaction signature", transaction.signature.toString());
        } catch (error) { console.log(error) }
        return;
        //  notify({ type: 'error', message: `Airdrop failed!`, description: error?.message, txid: signature });

    }, [publicKey, connection, getUserSOLBalance]);

    return (
        <div>
            <button
                className="px-8 m-2 btn animate-pulse bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ..."
                onClick={onClick}
            >
                <span>initialize</span>
            </button>
        </div>
    );
};

