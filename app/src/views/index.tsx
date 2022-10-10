import common_ko from "/home/alex/Documenti/solana-ubi/app/src/translations/en/common.json";
import common_en from "/home/alex/Documenti/solana-ubi/app/src/translations/en/common.json";
import i18next from "i18next";
i18next.init({
    interpolation: { escapeValue: false },  // React already does escaping
    lng: 'en',                              // language to use
    resources: {
        en: {
            common: common_en               // 'common' is our custom namespace
        },
        ko: {
            common: common_ko
        },
    },
});

export { HomeView } from "./home";
