import Head from 'next/head'
import React from "react";

const OldJobsUrl = () => {
    return (
        <Head>
            <title>Redirecting...</title>
            <meta httpEquiv="refresh" content={`0;url=https://jobs.allegro.eu`}/>
        </Head>
    )
}

OldJobsUrl.getInitialProps = async () => ({});

export default OldJobsUrl;
