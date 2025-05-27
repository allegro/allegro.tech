import React from 'react';
import Head from "next/head";
import Post, {IPost} from "../components/Post";
import Header from "../components/Header";
import Grid from "../metrum/Grid";
import Container from '../metrum/Container';
import Heading from "../metrum/Heading";
import Footer from "../components/Footer";
import Job, {IJob} from "../components/Job";
import Link from "../metrum/Link";
import Event, {IEvent} from "../components/Event";
import Podcast, {IPodcast} from "../components/Podcast";
import Tracking from "../components/Tracking";
import {extract} from '@extractus/feed-extractor'

interface HomePageProps {
    posts: IPost[];
    jobs: IJob[];
    events: IEvent[];
    podcasts: IPodcast[];
}


const HomePage: React.FunctionComponent<HomePageProps> = ({posts, jobs, events, podcasts}) => {
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
                <link rel="prefetch" href="https://allegrotechio.disqus.com/count.js"/>
                <meta name="viewport" content="initial-scale=1.0, width=device-width"/>
                <meta name="description"
                      content="Allegro Tech to miejsce, w którym nasi inżynierowie dzielą się wiedzą oraz case study z wybranych projektów w firmie - w formie artykułów, podcastów oraz eventów."/>
                <title>Allegro Tech</title>
                <meta property="og:site_name" content="allegro.tech"/>
                <meta property="og:title" content="allegro.tech"/>
                <meta property="og:url" content="https://allegro.tech"/>
                <meta property="og:type" content="site"/>
                <meta property="og:image" content="https://allegro.tech/images/allegro-tech.png"/>
                <link rel="shortcut icon" href="favicon.ico"/>
                <link rel="canonical" href="https://allegro.tech" itemProp="url"/>
                <link rel="preload" href="images/splash.jpg" as="image"/>
                <link rel="author" href="humans.txt"/>
                <script defer data-domain="allegro.tech" src="https://plausible.io/js/script.js"></script>
            </Head>
            <Header/>
            <Container className="m-padding-top-24">
                <Heading size="xlarge" className="m-padding-left-24 m-padding-right-24">Blog</Heading>
                <Grid>
                    {posts.map(post => (
                        <Grid.Col key={post.id} size={12} smSize={6} xlSize={3}
                                  className="m-display-flex m-flex-direction_column">
                            <Post {...post} />
                        </Grid.Col>
                    ))}
                </Grid>
                <Link
                    button
                    className="m-display_block m-margin-bottom_8 m-width_100"
                    href="https://blog.allegro.tech">
                    Zobacz więcej wpisów
                </Link>
            </Container>
            <Container className="m-padding-top-24">
                <Heading size="xlarge" className="m-padding-left-24 m-padding-right-24">Podcasty</Heading>
                <Grid>
                    {podcasts.map(podcast => (
                        <Grid.Col key={podcast.id} size={12} smSize={6} xlSize={3}
                                  className="m-display-flex m-flex-direction_column">
                            <Podcast {...podcast}/>
                        </Grid.Col>
                    ))}
                </Grid>
                <Link
                    button
                    className="m-display_block m-margin-bottom_8 m-width_100"
                    href="https://podcast.allegro.tech">
                    Zobacz więcej podcastów
                </Link>
            </Container>
            <Container className="m-padding-top-24">
                <Heading size="xlarge" className="m-padding-left-24 m-padding-right-24">Wydarzenia</Heading>
                <Grid>
                    {events.map(event => (
                        <Grid.Col key={event.id} size={12} smSize={6} xlSize={6}
                                  className="m-display-flex m-flex-direction_column">
                            <Event {...event}/>
                        </Grid.Col>
                    ))}
                </Grid>
                <Link
                    button
                    className="m-display_block m-margin-bottom_8 m-width_100"
                    href="https://www.meetup.com/allegrotech/events/">Zobacz więcej wydarzeń</Link>
            </Container>
            <Container className="m-padding-top-24">
                <Heading size="xlarge" className="m-padding-left-24 m-padding-right-24">Oferty pracy</Heading>
                <Container>
                    {jobs.map(job => (
                        <Job key={job.id} id={job.id} name={job.name} location={job.location}/>
                    ))}
                </Container>
                <Link
                    button
                    className="m-display_block m-margin-bottom_8 m-width_100"
                    href="https://jobs.allegro.eu">Zobacz więcej ofert</Link>
            </Container>
            <Footer/>
            <Tracking/>
        </React.Fragment>
    );
}

export async function getStaticProps() {
    const posts = await extract('https://blog.allegro.tech/feed.xml');
    const podcasts = await extract('https://podcast.allegro.tech/feed.xml');
    const jobsPromise = await fetch('https://api.smartrecruiters.com/v1/companies/allegro/postings?custom_field.58c13159e4b01d4b19ddf729=2572770')
        .then(response => response.json())
        .then(json => json.content);

    return {
        props: {
            posts: posts.entries.slice(0, 4),
            jobs: jobs.slice(0, 5),
            events: [],
            podcasts: podcasts.entries.slice(0, 4)
        },
    }
}

export default HomePage
