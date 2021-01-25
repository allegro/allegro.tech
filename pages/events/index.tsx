import Head from 'next/head'
import React from "react";

const OldEventsUrl = () => {
    return (
        <Head>
            <title>Redirecting...</title>
            <meta httpEquiv="refresh" content={`0;url=https://www.meetup.com/allegrotech/events`}/>
        </Head>
    )
}

OldEventsUrl.getInitialProps = async () => ({});

export default OldEventsUrl;
