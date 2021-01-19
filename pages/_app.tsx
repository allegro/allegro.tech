import '../styles/global.scss'
import easterEgg from "../utils/easterEgg";

const App = ({ Component, pageProps }) => <Component {...pageProps} />

if (typeof window !== 'undefined') {
    easterEgg();
}

export default App;
