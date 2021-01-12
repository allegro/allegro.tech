import React from 'react';
import Head from "next/head";
import Parser from 'rss-parser';
import Post, {IPost} from "../components/Post";
import Header from "../components/Header";
import Grid from "../metrum/Grid";
import Container from '../metrum/Container';
import Heading from "../metrum/Heading";
import Footer from "../components/Footer";

interface HomePageProps {
    posts: IPost[]
}

const HomePage: React.FunctionComponent<HomePageProps> = ({ posts }) => {
    React.useEffect(() => {
        const script = document.createElement('script');
        script.src = '//allegrotechio.disqus.com/count.js';
        script.async = true;
        script.setAttribute('id', 'dsq-count-scr');
        document.body.appendChild(script);
    }, []);

    return (
        <React.Fragment>
            <Head>
                <link rel="prefetch" href="//allegrotechio.disqus.com/count.js" />
                <meta name="viewport" content="initial-scale=1.0, width=device-width" />
                <meta name="description" content="We use Open Source solutions on a daily basis here at Allegro Group. Why not work on our karma and give something in return? Welcome to our open source technology blog." />
                <title>Allegro Tech</title>
                <meta property="og:site_name" content="allegro.tech"/>
                <meta property="og:title" content="allegro.tech"/>
                <meta property="og:url" content="https://allegro.tech/"/>
                <meta property="og:type" content="site"/>
                <meta property="og:image" content="https://allegro.tech/img/allegro-tech.png"/>
            </Head>
            <Header />
            <Container className="m-padding-top-24">
                <Heading size="xlarge" className="m-padding-left-24 m-padding-right-24">Blog</Heading>
                <Grid>
                    {posts.map(data => (
                        <Grid.Col key={data.link} size={12} smSize={6} lgSize={3} className="m-display-flex">
                            <Post {...data} />
                        </Grid.Col>
                    ))}
                </Grid>
            </Container>
            <Footer />
        </React.Fragment>
    );
}

export async function getStaticProps() {
    const parser = new Parser({});
    const feed = await parser.parseURL('https://allegro.tech/feed.xml');

    return {
        props: {
            posts: feed.items.slice(0, 8).map(({ title, categories, link, isoDate, contentSnippet }) => {
                const excerpt = contentSnippet.split(' ').slice(0, 15).join(' ') + '…';

                return {
                    title,
                    isoDate,
                    categories,
                    link,
                    excerpt
                };
            })
        },
    }
}

export default HomePage
