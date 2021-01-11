import React from 'react';
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

const HomePage: React.FunctionComponent<HomePageProps> = ({ posts }) => (
    <React.Fragment>
        <Header />
        <Container className="m-padding-top-24">
            <Heading size="xlarge" className="m-padding-left-24 m-padding-right-24">Blog</Heading>
            <Grid>
                {posts.map(data => (
                    <Grid.Col key={data.link} size={3} className="m-display-flex">
                        <Post {...data} />
                    </Grid.Col>
                ))}
            </Grid>
        </Container>
        <Footer />
    </React.Fragment>
);

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
