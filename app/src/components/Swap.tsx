import { useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';

import { Buffer } from 'buffer';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@project-serum/anchor';
import idl from '../idl.json'
import { UBIInfo } from 'models/types';
import { GatewayProvider, useGateway } from '@civic/solana-gateway-react';

const programID = new PublicKey(idl.metadata.address);


export const Swap: FC = () => {
    const connection = new Connection("https://palpable-sparkling-gadget.solana-mainnet.discover.quiknode.pro/781b15636590ca9a832e3f1fbe4c7ff84791de75/");
    const moniker = connection.rpcEndpoint.includes("mainnet") ? "mainnet-beta" : "devnet"
    const wallet = useWallet()
    const { getUserSOLBalance } = useUserSOLBalanceStore();
    const { gatewayToken, gatewayStatus, requestGatewayToken } = useGateway();

    const getProvider = () => {
        return new AnchorProvider(
            connection,
            wallet,
            AnchorProvider.defaultOptions()
        );
    };

    const provider = getProvider()

    async function verify(info) {
        try {
            let idl = await Program.fetchIdl(programID, provider)

            const program = new Program(idl, programID, provider)

            let transaction = new Transaction();
            transaction.add(
                await program.methods.civicTrust(gatewayToken.gatekeeperNetworkAddress).accounts({
                    owner: wallet.publicKey,
                    gatewayToken: gatewayToken.publicKey,
                    ubiInfo: info[0]
                }).instruction()
            );

            let signature = await wallet.sendTransaction(transaction, connection);

            const latestBlockHash = await connection.getLatestBlockhash();

            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signature,
            });
        } finally {
            notify({ type: "success", message: "You are now verified" })
        }
    }

    const onClick = useCallback(async () => {
        window.open(
            'https://raydium.io/swap?inputCurrency=4HgYp2eiokKcqe5AVAxpwCsfUE5pwCNTiPXvpSxYnDi6&outputCurrency=sol&inputAmount=0&fixed=in',
            '_blank'
        );
    }, [wallet.publicKey, connection, getUserSOLBalance]);

    return (
        <button
            className="px-8 m-2 btn bg-gradient-to-r from-[#5ac4beff] via-[#3773feff] to-[#c200fbff] hover:from-[#303030] hover:to-[#303030] max-width-200 width-20 ..."
            onClick={onClick}>
            <img src='raydium.svg' className='btn-img-text-large'></img> &nbsp; Swap
        </button>
    );
};

