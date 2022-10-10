// Next, React
import { FC, useEffect } from 'react';

import {useTranslation} from "react-i18next";

// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// Store
import useUserSOLBalanceStore from '../../stores/useUserSOLBalanceStore';
import { InitializeAccount } from 'components/InitializeAccount';
import { Mint } from 'components/Mint';
import { TrustUser } from 'components/TrustUser'

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    fallbackLng: 'ko'
  });

export const HomeView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();

  useEffect(() => {}, [wallet.publicKey, connection])

  const { t } = useTranslation('common');

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
      <a href='https://nuclear-ubi.com'>{t("nuclear") + " " + t("ubi").toUpperCase()}</a></h1>
      </div>
      <h4 className="md:w-full text-center text-slate-300 my-2">
        
      <a href='https://nuclear-ubi.com'>Universal Basic Income on Solana</a>
      <div className="text-center font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#c53fe9ff] to-[#e4d33aff]">
        Now on mainnet
      </div>
      </h4>
      <div className="max-w-screen mx-auto mockup-code bg-primary pad-r-12">
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