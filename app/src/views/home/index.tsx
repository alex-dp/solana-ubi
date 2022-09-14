// Next, React
import { FC, useEffect, useState } from 'react';
import Link from 'next/link';

// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// Components
import pkg from '../../../package.json';

// Store
import useUserSOLBalanceStore from '../../stores/useUserSOLBalanceStore';
import { InitializeAccount } from 'components/InitializeAccount';
import { Mint } from 'components/Mint';
import { InitializeState } from 'components/InitializeState'
import { TrustUser } from 'components/TrustUser'

export const HomeView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();

  const balance = useUserSOLBalanceStore((s) => s.balance)
  const { getUserSOLBalance } = useUserSOLBalanceStore()

  useEffect(() => {
    if (wallet.publicKey) {
      console.log(wallet.publicKey.toBase58())
      getUserSOLBalance(wallet.publicKey, connection)
    }
  }, [wallet.publicKey, connection, getUserSOLBalance])

  return (

    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]">
          Solana UBI
        </h1>
        <h4 className="md:w-full text-center text-slate-300 my-2">
          Universal Basic Income on Solana
        </h4>
        <div className="max-w-md mx-auto mockup-code bg-primary p-6 my-2">
          <pre data-prefix=">">
            <code className="truncate">Initialize your account </code>
          </pre>
          <pre data-prefix=">">
            <code className="truncate">Use Discord or Telegram to find people</code>
          </pre>
          <pre data-prefix=">">
            <code className="truncate">Ask them to trust your address</code>
          </pre>
          <pre data-prefix=">">
            <code className="truncate">Mint some UBI every 24 hours</code>
          </pre>
        </div>        
          <div className="text-center">
          <InitializeAccount />
          <Mint />
          <InitializeState/>
          <TrustUser/>
          </div>
        
      </div>
    </div>
  );
};
