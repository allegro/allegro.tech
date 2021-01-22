import Head from 'next/head'
import React from "react";

const OldBlogUrl = () => {
    return (
        <Head>
            <title>Redirecting...</title>
            <meta httpEquiv="refresh" content={`0;url=https://blog.allegro.tech/`}/>
        </Head>
    )
}

OldBlogUrl.getInitialProps = async () => ({});

export default OldBlogUrl;
