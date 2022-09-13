import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>UBI on Solana</title>
        <meta
          name="description"
          content="UBI on Solana"
        />
      </Head>
      <HomeView />
    </div>
  );
};

export default Home;
