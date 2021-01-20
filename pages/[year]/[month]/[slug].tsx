import { useRouter } from 'next/router'
import Head from 'next/head'
import React from "react";

const OldPost = () => {
    const router = useRouter()
    const { year, month, slug } = router.query

    return (
        <Head>
            <title>Redirecting...</title>
            <meta http-equiv="refresh" content={`0;url=/blog/${year}/${month}/${slug}`}/>
        </Head>
    )
}

OldPost.getInitialProps = async () => ({});

export default OldPost;
