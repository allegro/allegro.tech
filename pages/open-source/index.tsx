import Head from 'next/head'
import React from "react";

const OldPodcastUrl = () => {
    return (
        <Head>
            <title>Redirecting...</title>
            <meta httpEquiv="refresh" content={`0;url=https://allegro.tech/`}/>
        </Head>
    )
}

OldPodcastUrl.getInitialProps = async () => ({});

export default OldPodcastUrl;
