document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('https://allegro.tech/feed.xml');
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const posts = Array.from(xml.querySelectorAll('item'), render);
    document.querySelector('.blog').innerHTML = posts.join('');
});

function render(item) {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const date = item.querySelector('pubDate').textContent;
    const link = item.querySelector('link').textContent;
    const tags = Array.from(item.querySelectorAll('category'), category => category.textContent);
    const fragment = document.createElement('div');
    fragment.innerHTML = description;
    const excerpt = fragment.textContent.split(' ').slice(0, 55).join(' ') + '...';

    return `
        <article itemid="${link}" itemscope itemtype="https://schema.org/Blog" class="m-color-bg_card m-padding-top_16 m-padding-top_24_lg m-padding-right_16 m-padding-right_24_lg m-padding-bottom_16 m-padding-bottom_24_lg m-padding-left_16 m-padding-left_24_lg m-card">
          <img alt="${title}" itemprop="image" src="https://via.placeholder.com/300x150"/>
          <h1 itemprop="headline" class="m-font-family_roboto m-margin-left_0 m-margin-right_0 m-link-height_130 m-color_text m-margin-bottom_8 m-font-weight_400 m-font-size_23">${title}</h1>
          <div itemprop="blogPost" itemscope itemtype="https://schema.org/BlogPosting">
            <p itemprop="headline" class="m-font-family_sans m-margin-right_0 m-margin-bottom_0 m-margin-left_0 m-color_text m-font-size_21 m-font-size_25_sm m-font-weight_300 m-line-height_normal m-margin-top_16">${excerpt}</p>
            <p class="m-font-family_sans">
                <time itemprop="datePublished" content="2015-03-09T13:17:00-07:00">${date}</time>
            </p>
            <ul>
                ${tags.map(tag => `<li>${tag}</li>`).join('')}
            </ul>
          </div>
        </article>`;
}