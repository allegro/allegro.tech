import { useRouter } from 'next/router'
import Head from 'next/head'
import React from "react";

const OldPodcastEpisode = () => {
    const router = useRouter()
    const { slug } = router.query

    return (
            <Head>
                <title>Redirecting...</title>
                <meta httpEquiv="refresh" content={`0;url=https://podcast.allegro.tech/#${slug}`}/>
            </Head>
    )
}

OldPodcastEpisode.getInitialProps = async () => ({});

export default OldPodcastEpisode;
