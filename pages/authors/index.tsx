import Head from 'next/head'
import React from "react";

const OldAuthorsUrl = () => {
    return (
        <Head>
            <title>Redirecting...</title>
            <meta httpEquiv="refresh" content={`0;url=https://blog.allegro.tech/authors/`}/>
        </Head>
    )
}

OldAuthorsUrl.getInitialProps = async () => ({});

export default OldAuthorsUrl;
