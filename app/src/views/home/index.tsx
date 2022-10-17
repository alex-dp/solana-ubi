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

      <div className="hero-content flex flex-col">
      <div className="wrap w-full">

<a href='https://nuclear-ubi.com'>
  <img className="max-width-100 midImg" src="/cooler-light.svg"/>
  </a>
</div>

      
      <div className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#c53fe9ff] to-[#e4d33aff]">
      
        <h1>
          
      <a href='https://nuclear-ubi.com'>Nuclear UBI</a></h1>
      </div>
      <h4 className="md:w-full text-center text-slate-100 my-2 text-2xl">
        
      <a href='https://nuclear-ubi.com'>Universal Basic Income on Solana</a>
      <div className="text-center font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#c53fe9ff] to-[#e4d33aff]">
        Now on mainnet
      </div>
      </h4>
      <div className="max-w-screen mx-auto mockup-code bg-dark-blue pad-r-12">
        <pre data-prefix=">">
          <code className="truncate">Initialize your account </code>
        </pre>
        <pre data-prefix=">">
          <code className="truncate">Use Discord to find people</code>
        </pre>
        <pre data-prefix=">">
          <code className="truncate">Ask them to trust your address</code>
        </pre>
        <pre data-prefix=">">
          <code className="truncate">Mint some NUBI every 24 hours</code>
        </pre>
      </div>
      <div className="text-center">
        <table className="buttons">
            <tbody>
              <tr><InitializeAccount /></tr>
              <tr><Mint /></tr>
              <tr><TrustUser /></tr>
            </tbody>
        </table>
      </div>
    </div>
  </div>
  );
};
