import {useTranslation} from "react-i18next";

import { FC } from 'react';
import dynamic from 'next/dynamic';

import i18next from "i18next";

const LangSwitch: FC = () => {

  const { t, ready, i18n } = useTranslation('common', { useSuspense: false });

  function changeLang(l) {
    if(!i18next.isInitialized) i18next.init()
    console.log(t)
    i18n.changeLanguage(l)
    i18next.changeLanguage(l)

    let b=i18n.getResourceBundle("en", "common")
    let q=i18n.languages
    console.log(q)
    console.log(b)
    console.log("LANGUAGE CHANGED --> " + l)
    console.log("CURRENT LANGUAGE", i18n.language)
    console.log("CURRENT LANGUAGE next", i18next.language)
    console.log(t("nuclear"))
    return true
  }

  return (
    <label className="cursor-pointer label">
      <a>{t("Language")}</a>
      <select             
        value={i18next.language}
        onChange={(e) => changeLang(e.target.value)} 
        className="select max-w-xs"
      >
        <option value="ko">ko</option>
        <option value="en">en</option>
        </select>
    </label>
  );
};

export default dynamic(() => Promise.resolve(LangSwitch), {
  ssr: false
})