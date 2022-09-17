import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, TransactionSignature, sendAndConfirmTransaction } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';

import { Buffer } from 'buffer';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';

import idl from '../idl.json'

const { SystemProgram, Keypair } = web3;

const programID = new PublicKey(idl.metadata.address);

export const TrustUser: FC = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { getUserSOLBalance } = useUserSOLBalanceStore();

    const getProvider = () => {
        //Creating a provider, the provider is authenication connection to solana
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

        let signature: TransactionSignature = '';

        let provider = null

        try {
            provider = getProvider() //checks & verify the dapp it can able to connect solana network

            let pda = PublicKey.findProgramAddressSync(
                [Buffer.from("ubi_info7"), wallet.publicKey.toBytes()],
                programID
            )

            console.log("provider ", provider)

            console.log("pda ", pda[0].toString())

            const program = new Program(idl, programID, provider) //program will communicate to solana network via rpc using lib.json as model
            console.log(program);

            let transaction = new Transaction();
            let trusteePK = prompt("Paste public key of user you wish to trust");

            console.log("is on curve ", PublicKey.isOnCurve(trusteePK))

            if (!PublicKey.isOnCurve(trusteePK)) {
                notify({ type: 'error', message: "Invalid public key!"});
                return;
            }

            let trusteeUbiInfo = PublicKey.findProgramAddressSync(
                [Buffer.from("ubi_info7"), Buffer.from(trusteePK.toString())],
                programID
            )

            transaction.add(
                await program.methods.trust().accounts({
                    trusteeUbiInfo: trusteeUbiInfo[0],
                    trusterUbiInfo: pda[0],
                    trusterAuthority: wallet.publicKey
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
            notify({ type: 'success', message: 'Transaction successful!', txid: signature });
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
                <span>Trust a new user</span>
            </button>
        </div>
    );
};

