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
import { CivicTrust } from 'components/CivicTrust';
import { GatewayProvider } from '@civic/solana-gateway-react';
import { PublicKey } from '@solana/web3.js';
import { Swap } from 'components/Swap';

export const HomeView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();

  const balance = useUserSOLBalanceStore((s) => s.balance)
  const { getUserSOLBalance } = useUserSOLBalanceStore()

  useEffect(() => {
    if (wallet.publicKey) {
      console.log(wallet.publicKey, " connected")
    }
  }, [wallet.publicKey, connection, getUserSOLBalance])

  return (

    <div className="hero-content container mx-auto p-4">
      <div className="wrap w-full">
        <a href='https://nuclear-ubi.com'>
          <img className="max-width-100 midImg" src="/cooler-light.svg" />
        </a>

        <div className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#c53fe9ff] to-[#e4d33aff]">
          <h1><a href='https://nuclear-ubi.com'>Nuclear UBI</a></h1>
        </div>

        <h4 className="md:w-full text-center text-slate-100 my-2 text-2xl">
          <a href='https://nuclear-ubi.com'>Universal Basic Income on Solana</a>
        </h4>
      </div>

      <div className="max-w-screen mx-auto mockup-code bg-dark-blue pad-r-12">
        <pre data-prefix=">">
          <code className="truncate">Initialize your account </code>
        </pre>
        <pre data-prefix=">">
          <code className="truncate">Get verified with Civic pass</code>
        </pre>
        <pre data-prefix=">">
          <code className="truncate">Or ask 8 users to trust you</code>
        </pre>
        <pre data-prefix=">">
          <code className="truncate">Mint some NUBI every 24 hours</code>
        </pre>
      </div>

      <div className="text-center buttons">
        <GatewayProvider
          wallet={wallet}
          gatekeeperNetwork={new PublicKey("uniqobk8oGh4XBLMqM68K8M2zNu3CdYX7q5go7whQiv")}
          clusterUrl={"https://palpable-sparkling-gadget.solana-mainnet.discover.quiknode.pro/781b15636590ca9a832e3f1fbe4c7ff84791de75/"}
          cluster={"mainnet"}>
          <InitializeAccount />
          <Mint />
          <TrustUser />
          <CivicTrust />
          <Swap />
        </GatewayProvider>
      </div>
    </div>
  );
};
