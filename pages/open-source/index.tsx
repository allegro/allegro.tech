import Head from 'next/head'
import React from "react";

const OldOpenSourceUrl = () => {
    return (
        <Head>
            <title>Redirecting...</title>
            <meta httpEquiv="refresh" content={`0;url=https://allegro.tech/`}/>
        </Head>
    )
}

OldOpenSourceUrl.getInitialProps = async () => ({});

export default OldOpenSourceUrl;
