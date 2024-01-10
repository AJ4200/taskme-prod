import { type AppType } from "next/dist/shared/lib/utils";

import "~/styles/globals.css";
import '~/styles/splash.css';
import "~/styles/notepad.scss"
import Footer from "~/components/Footer";

const MyApp: AppType = ({ Component, pageProps }) => {
  return <><Component {...pageProps} /><Footer/></>;
};

export default MyApp;
