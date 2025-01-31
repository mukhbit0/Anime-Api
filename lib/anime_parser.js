import axios from 'axios';
import cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { Client, GatewayIntentBits } from 'discord.js';
import schedule from 'node-schedule';
import dotenv from 'dotenv'
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


// Load environment variables from .env file
dotenv.config();

import {
  generateEncryptAjaxParameters,
  decryptEncryptAjaxResponse,
} from './helpers/extractors/goload.js';
import { extractStreamSB } from './helpers/extractors/streamsb.js';
import { extractFembed } from './helpers/extractors/fembed.js';
import { USER_AGENT, renameKey } from './utils.js';

const BASE_URL = 'https://anitaku.so';
const BASE_URL2 = 'https://anitaku.so';
const ajax_url = 'https://ajax.gogocdn.net/';
const anime_info_url = 'https://anitaku.so/category/';
const anime_movies_path = '/anime-movies.html';
const popular_path = '/popular.html';
const new_season_path = '/new-season.html';
const search_path = '/search.html';
const popular_ongoing_url = `${ajax_url}ajax/page-recent-release-ongoing.html`;
const recent_release_url = `${ajax_url}ajax/page-recent-release.html`;
const list_episodes_url = `${ajax_url}ajax/load-list-episode`;
const seasons_url = 'https://anitaku.so/sub-category/';

const Referer = 'https://gogoplay.io/';
const goload_stream_url = 'https://embtaku.pro/streaming.php';
export const DownloadReferer = 'https://embtaku.pro/';

const disqus_iframe = (episodeId) =>
  `https://disqus.com/embed/comments/?base=default&f=gogoanimetv&t_u=https%3A%2F%2Fgogoanime.vc%2F${episodeId}&s_o=default#version=cfefa856cbcd7efb87102e7242c9a829`;
const disqus_api = (threadId, page) =>
  `https://disqus.com/api/3.0/threads/listPostsThreaded?limit=100&thread=${threadId}&forum=gogoanimetv&order=popular&cursor=${page}:0:0&api_key=E8Uh5l5fHZ6gD8U3KycjAIAk46f68Zw7C6eW8WSjZvCLXebZ7p0r1yrYDrLilk2F`;

const Genres = [
  'action',
  'adventure',
  'cars',
  'comedy',
  'crime',
  'dementia',
  'demons',
  'drama',
  'dub',
  'ecchi',
  'family',
  'fantasy',
  'game',
  'gourmet',
  'harem',
  'hentai',
  'historical',
  'horror',
  'josei',
  'kids',
  'magic',
  'martial-arts',
  'mecha',
  'military',
  'Mmusic',
  'mystery',
  'parody',
  'police',
  'psychological',
  'romance',
  'samurai',
  'school',
  'sci-fi',
  'seinen',
  'shoujo',
  'shoujo-ai',
  'shounen',
  'shounen-ai',
  'slice-of-life',
  'space',
  'sports',
  'super-power',
  'supernatural',
  'suspense',
  'thriller',
  'vampire',
  'yaoi',
  'yuri',
  'isekai',
];

// export const scrapeTrendingManga = async () => {
//   try {
//     const trending_url = 'https://asuratoon.com/page/1/'; // Trending manga URL
//     const trending_page = await axios.get(trending_url);
//     const $ = cheerio.load(trending_page.data);

//     const trendingList = [];

//     $('.bsx a').each((i, el) => {
//       trendingList.push({
//         mangaId: $(el).attr('href').split('/').slice(-2)[0], // Extract manga ID from URL
//         mangaTitle: $(el).attr('title'),
//         mangaImg: $(el).find('img').attr('src').replace('https://img.asuracomics.com/unsafe/fit-in/330x450/filters:format(webp)/', ''), // Remove unwanted portion of image URL
//         mangaUrl: $(el).attr('href').replace('https://asuratoon.com/manga/', ''), // Remove unwanted portion of manga URL
//         latestChapter: $(el).find('.epxs').text().trim().replace('Chapter ', ''), // Extract chapter number
//         rating: parseFloat($(el).find('.numscore').text().trim()), // Parse rating as float
//       });
//     });

//     return trendingList;
//   } catch (err) {
//     console.log(err);
//     return { error: err };
//   }
// };



export const scrapeReaperPopular = async () => {
  try {
        const trendingUrl = 'https://reaper-scans.com/page/1/'; // Trending manga URL
        const trendingPage = await axios.get(trendingUrl);
        const $ = cheerio.load(trendingPage.data);

        const trendingList = [];

        $('.listupd.popularslider .bs').each((i, el) => {
            const mangaUrl = $(el).find('a').attr('href'); // Extract manga URL
            const mangaId = mangaUrl.split('/').slice(-2)[0]; // Extract manga ID from URL
            const mangaTitle = $(el).find('.tt').text().trim();
            const chapterNumber = $(el).find('.epxs').text().trim().replace('Chapter ', ''); // Extract chapter number
            const rating = parseFloat($(el).find('.numscore').text().trim()); // Parse rating as float
            let mangaImg = $(el).find('img').attr('data-src'); // Extract image URL
            mangaImg = mangaImg.replace(/-\d+x\d+/, ''); // Remove image size portion

            trendingList.push({
                mangaId,
                mangaTitle,
                mangaImg,
                mangaUrl,
                chapterNumber,
                rating,
            });
        });

        return trendingList;
    } catch (err) {
        console.log(err);
        return { error: err };
    }
};


async function scrapeReaperItems(pageNumber) {
    const url = `https://reaper-scans.com/page/${pageNumber}/`;
    let m_list = [];

    try {
        // Scrape manga items on the current page
        const mangaPageData = await scrapeReaperCurrentPage(url);
        m_list = mangaPageData.list;

        return m_list;
    } catch (error) {
        console.error('An error occurred:', error);
        return [];
    }
}

async function scrapeReaperCurrentPage(url) {
   let m_list = [];

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        $('.bs.styletere.stylefiv').each((index, element) => {
            const $item = $(element);
            const title = $item.find('a').attr('title');
            const imageUrl = $item.find('.limit img').attr('data-src');
            const mangaUrl = $item.find('a').attr('href')
            const mangaId = mangaUrl ? mangaUrl.split('/').filter(part => part.trim() !== '').pop() : null;
            const chapters = $item.find('.chfiv li').map((i, e) => {
                const $chapter = $(e);
                const chapterTitle = $chapter.find('.fivchap').text().trim();
                const chapterUrl = $chapter.find('a').attr('href');
                const chapterId = chapterUrl ? chapterUrl.split('/').filter(part => part.trim() !== '').pop() : null;
                const chapterDate = $chapter.find('.fivtime').text().trim();
                return {
                    chapterTitle,
                    chapterUrl,
                    chapterId,
                    chapterDate
                };
            }).get();

            m_list.push({
                title,
                imageUrl,
                mangaUrl,
                mangaId,
                chapters
            });
        });
    } catch (error) {
        console.error('An error occurred:', error);
    }

    return {
        list: m_list
    };
}


export { scrapeReaperItems };








export const scrapeTrendingManga = async () => {
  try {
    const trending_url = 'https://asuratoon.com/page/1/'; // Trending manga URL
    const trending_page = await axios.get(trending_url);
    const $ = cheerio.load(trending_page.data);

    const trendingList = [];

    $('.serieslist.pop.wpop.wpop-weekly li').each((i, el) => {
      const mangaUrl = $(el).find('.series').attr('href'); // Extract manga URL
      const mangaId = new URL(mangaUrl).pathname.split('/').slice(-2)[0]; // Extract manga ID from URL
      const mangaTitle = $(el).find('.series').text().trim();
      const mangaImg = $(el).find('.series img').attr('src').replace(/.*?\/fit-in\/\d+x\d+\/filters:format\(webp\)\/(.*)/, '$1'); // Remove unwanted portion of image URL
      const genres = $(el).find('span > a').map((i, el) => $(el).text().trim()).get(); // Extract genres as an array
      const rating = parseFloat($(el).find('.numscore').text().trim()); // Parse rating as float

      trendingList.push({
        mangaId,
        mangaTitle,
        mangaImg,
        mangaUrl,
        genres,
        rating,
      });
    });

    return trendingList;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};


async function scrapeReadItems(pageNumber) {
    const url = `https://www.mangaread.org/genres/manhwa/page/${pageNumber}/`;
    let m_list = [];

    try {
        // Scrape manga items on the current page
        const mangaPageData = await scrapeReadCurrentPage(url);
        m_list = mangaPageData.list;

        return m_list;
    } catch (error) {
        console.error('An error occurred:', error);
        return [];
    }
}

async function scrapeReadCurrentPage(url) {
    let m_list = [];

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        $('.page-item-detail.manga').each((index, element) => {
            const $item = $(element);
            const title = $item.find('.post-title a').text().trim();
            let imageUrl = $item.find('.item-thumb img').attr('src');
            // Remove any dimensions from imageUrl suffix
            if (imageUrl) {
                imageUrl = imageUrl.replace(/-\d+x\d+(\.\w+)$/, '$1');
            }            const mangaUrl = $item.find('.post-title a').attr('href');
            const mangaId = mangaUrl ? mangaUrl.split('/').filter(part => part.trim() !== '').pop() : null;
            const chapters = $item.find('.list-chapter .chapter-item').map((i, e) => {
                const $chapter = $(e);
                const chapterTitle = $chapter.find('.chapter a').text().trim();
                const chapterUrl = $chapter.find('.chapter a').attr('href');
                const chapterId = chapterUrl ? chapterUrl.split('/').filter(part => part.trim() !== '').pop() : null;
                const chapterDate = $chapter.find('.post-on').text().trim();
                return {
                    chapterTitle,
                    chapterUrl,
                    chapterId,
                    chapterDate
                };
            }).get();

            m_list.push({
                title,
                imageUrl,
                mangaUrl,
                mangaId,
                chapters
            });
        });
    } catch (error) {
        console.error('An error occurred:', error);
    }

    return {
        list: m_list
    };
}



export { scrapeReadItems };






async function scrapeManhuaItems(pageNumber) {
    const url = `https://manhuagold.top/all-manga/${pageNumber}/`;
    let m_list = [];

    try {
        // Fetch HTML content of the page
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Extract manga items
        $('.b-img').each((index, element) => {
            const $item = $(element);
            //let image = $item.find('img').attr('data-src');
                        let image = $item.find('img.lazy').attr('data-src'); // Target data-src attribute directly
            if (image) {
                image = `https://i1.wp.com/manhuagold.top/${image}`; // Prepend image URL
            }
            const mangaLink = $item.find('.block.pt-140p'); // Select the manga link element
            const mangaTitle = mangaLink.find('img').attr('alt').trim(); // Extract manga title from the alt attribute of the image
            const mangaUrl = mangaLink.attr('href');
            const mangaId = new URL(mangaUrl).pathname.split('/').slice(-1)[0]; // Extract manga ID from URL
            const chapterLink = $item.next('.text-center').next(); // Select the chapter link element
            let chapterUrl = '';
            let chapterTitle = '';
            let chapterDate = '';
            let chapterId = '';

            if (chapterLink.length > 0) {
                chapterUrl = chapterLink.attr('href'); // Extract chapter URL
                chapterId = new URL(chapterUrl).pathname.split('/').slice(-1)[0]; // Extract manga ID from URL
                chapterTitle = chapterLink.text().trim();
                chapterDate = $item.find('.s2.timeline').text().trim(); // Extract chapter date
            }

            m_list.push({
                'title': mangaTitle,
                'manhuaID' : mangaId,
                'image': image,
                'url': mangaUrl,
                'chapters': [{
                    'c_title': chapterTitle,
                    'c_Id' : chapterId,
                    'c_url': chapterUrl,
                    'c_date': chapterDate // Include chapter date
                }]
            });
        });

        return m_list;
    } catch (error) {
        console.error('An error occurred:', error);
        return [];
    }
}

export { scrapeManhuaItems };






async function info(slug) {
    let genres = []

    try{
        res = await axios.get(`https://hiperdex.com/manga/${slug}`)
        const body = await res.data;
        const $ = cheerio.load(body)

        let manhwa_title = $('.post-title > h1:nth-child(1)').text().trim()
        let poster = $('.summary_image img').attr('src')
        let author = $('.author-content a').text().trim()
        let artist = $('.artist-content a').text().trim()

        let genres_e = $('.genres-content a')

        $(genres_e).each((i,e)=>{
            genres.push($(e).text().trim())
        })

        let other_name = $('div.post-content_item:nth-child(5) > div:nth-child(2)').text().trim()

        let status = $('div.post-content_item:nth-child(2) > div:nth-child(2)').text().trim()

        let description = $('.description-summary').text().trim()

        let ch_list = await chaptersList(`https://hiperdex.com/manga/${slug}/ajax/chapters/`)

         return await ({
            'page': manhwa_title,
            'other_name': other_name,
            'poster': poster,
            'authors': author,
            'artists': artist,
            'genres':genres,
            'status': status,
            'description': description,
            ch_list
        })
     } catch (error) {
            console.log(error);
return await ({'error': 'Sorry dude, an error occured! No Info!'})
     }

}

async function chaptersList(url){
    let ch_list = []

    try{
        res = await axios.post(url)
        const body = await res.data;
        const $ = cheerio.load(body)

        $('.version-chap li').each((index, element) => {

                $elements = $(element)
                title = $elements.find('a').text().trim()
                url = $elements.find('a').attr('href')
                time = $elements.find('.chapter-release-date').find('i').text()
                status = $elements.find('.chapter-release-date').find('a').attr('title')

                chapters = {'ch_title': title, 'time': time, 'status': status, 'url': url}

                ch_list.push(chapters)
        })

        return await (ch_list)
    } catch(error) {
            console.log(error);
return await ('Error Getting Chapters!')
    }
}
export { info };


async function scrapeMangaItems(pageNumber) {
    const url = `https://asuratoon.com/page/${pageNumber}/`;
    let m_list = [];

    try {
        // Scrape manga items on the current page
        const mangaPageData = await scrapeCurrentPage(url);
        m_list = mangaPageData.list;

        return m_list;
    } catch (error) {
        console.error('An error occurred:', error);
        return [];
    }
}

async function scrapeCurrentPage(url) {
    let m_list = [];

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        $('.uta').each((index, element) => {
            const $item = $(element);
            let image = $item.find('.imgu img').attr('src');
            // image = image.replace('https://img.asuracomics.com/unsafe/fit-in/200x260/filters:format(webp)/', '');
            // image = image.replace(/-\d+x\d+/, '');

            const url = $item.find('.luf a.series').attr('href');
            const title = $item.find('.luf a.series h4').text().trim();
            const chapters = $item.find('.luf ul.Manhwa li').map((j, e) => {
                const $chapter = $(e);
                return {
                    c_title: $chapter.find('a').text().trim(),
                    c_url: $chapter.find('a').attr('href').split('/').slice(-2)[0],
                    c_date: $chapter.find('span').text().trim()
                };
            }).get();

            const modifiedUrl = url.split('/').slice(-2)[0];

            m_list.push({
                'title': title,
                'image': image,
                'url': modifiedUrl,
                'chapters': chapters
            });
        });

    } catch (error) {
        console.error('An error occurred:', error);
    }

    return {
        'list': m_list
    };
}





 export { scrapeMangaItems };











export const scrapeSearch = async ({ list = [], keyw, page = 1 }) => {
  try {
    const searchPage = await axios.get(
      `${BASE_URL + search_path}?keyword=${keyw}&page=${page}`
    );
    const $ = cheerio.load(searchPage.data);

    $('div.last_episodes > ul > li').each((i, el) => {
      list.push({
        anime_id: $(el).find('p.name > a').attr('href').split('/')[2],
        name: $(el).find('p.name > a').attr('title'),
        img_url: $(el).find('div > a > img').attr('src'),
        status: $(el).find('p.released').text().trim(),
      });
    });

    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeRecentRelease = async ({ list = [], page = 1, type = 1 }) => {
  try {
    const mainPage = await axios.get(`
        ${recent_release_url}?page=${page}&type=${type}
        `);
    const $ = cheerio.load(mainPage.data);

    $('div.last_episodes.loaddub > ul > li').each((i, el) => {
      list.push({
        animeId: $(el).find('p.name > a').attr('href').split('/')[1].split('-episode-')[0],
        episodeId: $(el).find('p.name > a').attr('href').split('/')[1],
        name: $(el).find('p.name > a').attr('title'),
        episodeNum: $(el).find('p.episode').text().replace('Episode ', '').trim(),
        subOrDub: $(el).find('div > a > div').attr('class').replace('type ic-', ''),
        imgUrl: $(el).find('div > a > img').attr('src')
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};



export const scrapeAnimeList = async ({ list = [], page = 1 }) => {
  try {
    const AnimeList = await axios.get(`${BASE_URL}/anime-list.html?page=${page}`);
    const $ = cheerio.load(AnimeList.data);

    $('div.anime_list_body > ul.listing > li').each((i, el) => {
      list.push({
        animeTitle: $(el).find('a').html().replace(/"/g, ""),
        animeId: $(el).find('a').attr('href').replace("/category/", ""),
        liTitle: $(el).attr('title')
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeAnimeAZ = async ({ list = [], aph, page = 1 }) => {
  try {
    const AnimeAZ = await axios.get(`${BASE_URL}/anime-list-${aph}?page=${page}`);
    const $ = cheerio.load(AnimeAZ.data);

    $('div.anime_list_body > ul.listing > li').each((i, el) => {
      list.push({
        animeTitle: $(el).find('a').html().replace(/"/g, ""),
        animeId: $(el).find('a').attr('href').replace("/category/", ""),
        liTitle: $(el).attr('title')
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeRecentlyAdded = async ({list = [], page = 1}) => {
  try {
    const RecentlyAdded = await axios.get(`${BASE_URL}/?page=${page}`);
    const $ = cheerio.load(RecentlyAdded.data);

    $('div.added_series_body.final ul.listing li').each((i, el) => {
      list.push({
        animeId: $(el).find('a').attr('href'),
        animeName: $(el).find('a').text()
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeOngoingSeries = async ({list = [], page = 1}) => {
  try {
    const OngoingSeries = await axios.get(`${BASE_URL}/?page=${page}`);
    const $ = cheerio.load(OngoingSeries.data);

    $('nav.menu_series.cron ul li').each((i, el) => {
      list.push({
        animeId: $(el).find('a').attr('href'),
        animeName: $(el).find('a').text()
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeNewSeason = async ({ list = [], page = 1 }) => {
  try {
    const popularPage = await axios.get(`
        ${BASE_URL + new_season_path}?page=${page}
        `);
    const $ = cheerio.load(popularPage.data);

    $('div.last_episodes > ul > li').each((i, el) => {
      list.push({
        animeId: $(el).find('p.name > a').attr('href').split('/')[2],
        animeTitle: $(el).find('p.name > a').attr('title'),
        imgUrl: $(el).find('div > a > img').attr('src'),
        status: $(el).find('p.released').text().trim()
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeOngoingAnime = async ({ list = [], page = 1 }) => {
  try {
    const OngoingAnime = await axios.get(`${BASE_URL}/ongoing-anime.html?page=${page}`);
    const $ = cheerio.load(OngoingAnime.data);

    $('div.main_body div.last_episodes ul.items li').each((i, el) => {
      list.push({
        animeId: $(el).find('p.name > a').attr('href').split('/')[2],
        animeTitle: $(el).find('p.name > a').attr('title'),
        imgUrl: $(el).find('div > a > img').attr('src'),
        status: $(el).find('p.released').text().trim()
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeCompletedAnime = async ({ list = [], page = 1 }) => {
  try {
    const CompletedAnime = await axios.get(`${BASE_URL}/completed-anime.html?page=${page}`);
    const $ = cheerio.load(CompletedAnime.data);

    $('div.main_body div.last_episodes ul.items li').each((i, el) => {
      list.push({
        animeId: $(el).find('p.name > a').attr('href').split('/')[2],
        animeTitle: $(el).find('p.name > a').attr('title'),
        imgUrl: $(el).find('div > a > img').attr('src'),
        status: $(el).find('p.released').text().trim()
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapePopularAnime = async ({ list = [], page = 1 }) => {
  try {
    const popularPage = await axios.get(`
        ${BASE_URL + popular_path}?page=${page}
       `);
    const $ = cheerio.load(popularPage.data);

    $('div.last_episodes > ul > li').each((i, el) => {
      list.push({
        animeId: $(el).find('p.name > a').attr('href').split('/')[2],
        animeTitle: $(el).find('p.name > a').attr('title'),
        imgUrl: $(el).find('div > a > img').attr('src'),
        status: $(el).find('p.released').text().trim()
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeAnimeMovies = async ({ list = [], aph = '', page = 1 }) => {
  try {
    const popularPage = await axios.get(`
        ${BASE_URL + anime_movies_path}?aph=${aph.trim().toUpperCase()}&page=${page}
        `);
    const $ = cheerio.load(popularPage.data);

    $('div.last_episodes > ul > li').each((i, el) => {
      list.push({
        animeId: $(el).find('p.name > a').attr('href').split('/')[2],
        animeTitle: $(el).find('p.name > a').attr('title'),
        imgUrl: $(el).find('div > a > img').attr('src'),
        status: $(el).find('p.released').text().trim(),
      });
    });
    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeTopAiringAnime = async ({ list = [], page = 1 }) => {
  try {
    if (page == -1) {
      let pageNum = 1;
      let hasMore = true;
      while (hasMore) {
        const popular_page = await axios.get(`
                ${popular_ongoing_url}?page=${pageNum}
                `);
        const $ = cheerio.load(popular_page.data);

        if ($('div.added_series_body.popular > ul > li').length == 0) {
          hasMore = false;
          continue;
        }
        $('div.added_series_body.popular > ul > li').each((i, el) => {
          let genres = [];
          $(el)
            .find('p.genres > a')
            .each((i, el) => {
              genres.push($(el).attr('title'));
            });
          list.push({
            animeId: $(el).find('a:nth-child(1)').attr('href').split('/')[2],
            animeTitle: $(el).find('a:nth-child(1)').attr('title'),
            animeImg: $(el)
              .find('a:nth-child(1) > div')
              .attr('style')
              .match('(https?://.*.(?:png|jpg))')[0],
            latestEp: $(el).find('p:nth-child(4) > a').text().trim(),
            animeUrl: BASE_URL + '/' + $(el).find('a:nth-child(1)').attr('href'),
            genres: genres,
          });
        });
        pageNum++;
      }
      return list;
    }

    const popular_page = await axios.get(`
        ${popular_ongoing_url}?page=${page}
        `);
    const $ = cheerio.load(popular_page.data);

    $('div.added_series_body.popular > ul > li').each((i, el) => {
      let genres = [];
      $(el)
        .find('p.genres > a')
        .each((i, el) => {
          genres.push($(el).attr('title'));
        });
      list.push({
        animeId: $(el).find('a:nth-child(1)').attr('href').split('/')[2],
        animeTitle: $(el).find('a:nth-child(1)').attr('title'),
        animeImg: $(el)
          .find('a:nth-child(1) > div')
          .attr('style')
          .match('(https?://.*.(?:png|jpg))')[0],
        latestEp: $(el).find('p:nth-child(4) > a').text().trim(),
        animeUrl: BASE_URL + '/' + $(el).find('a:nth-child(1)').attr('href'),
        genres: genres,
      });
    });

    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeGenre = async ({ list = [], genre, page = 1 }) => {
  try {
    genre = genre.trim().replace(/ /g, '-').toLowerCase();

    if (Genres.indexOf(genre) > -1) {
      const genrePage = await axios.get(`${BASE_URL}genre/${genre}?page=${page}`);
      const $ = cheerio.load(genrePage.data);

      $('div.last_episodes > ul > li').each((i, elem) => {
        list.push({
          animeId: $(elem).find('p.name > a').attr('href').split('/')[2],
          animeTitle: $(elem).find('p.name > a').attr('title'),
          animeImg: $(elem).find('div > a > img').attr('src'),
          releasedDate: $(elem).find('p.released').text().trim(),
          animeUrl: BASE_URL + '/' + $(elem).find('p.name > a').attr('href'),
        });
      });
      return list;
    }
    return { error: 'Genre Not Found' };
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

// scrapeGenre({ genre: "cars", page: 1 }).then((res) => console.log(res))

/**
 * @param {string} id anime id.
 * @returns Resolves when the scraping is complete.
 * @example
 * scrapeGoGoAnimeInfo({id: "naruto"})
 * .then((res) => console.log(res)) // => The anime information is returned in an Object.
 * .catch((err) => console.log(err))
 *
 */
export const scrapeAnimeDetails = async ({ id }) => {
  try {
    const animePage = await axios.get(`https://hianime.to/${id}`);
    const $ = cheerio.load(animePage.data);

    const animeTitle = $('h2.film-name.dynamic-name').text().trim();
    const japaneseTitle = $('.anisc-info .item-title:nth-child(2) .name').text().trim();
    const synonyms = $('.anisc-info .item-title:nth-child(3) .name').text().trim();
    const imageUrl = $('.film-poster-img').attr('src');
    const premiered = $('.anisc-info .item-title:nth-child(5) .name').text().trim();
    const aired = $('.anisc-info .item-title:nth-child(4) .name').text().trim();
    const duration = $('.anisc-info .item-title:nth-child(6) .name').text().trim();
    const status = $('.anisc-info .item-title:nth-child(7) .name').text().trim();
    const malScore = $('.anisc-info .item-title:nth-child(8) .name').text().trim();

    // Extracting genres
    const genres = $('.anisc-info .item-list a').map(function() {
      return $(this).text().trim();
    }).get();

    // Extracting producers
    const producers = $('.anisc-info .item-title:nth-child(11) .name').map(function() {
      return $(this).text().trim();
    }).get();

    // Extracting studios
    const studios = $('.anisc-info .item-title:nth-child(10) .name').map(function() {
      return $(this).text().trim();
    }).get();

    // Constructing the synopsis
    const synopsis = $('.film-description .text').text().trim();

    // Extracting anime ID from the URL
    const animeId = id;

    // Constructing anime URL
    const animeUrl = `https://hianime.to/${id}`;

    // Extracting anime type
    const type = $('.film-stats .item:contains("TV")').text().trim(); // Adjust this according to the actual HTML structure

    return {
      animeId: animeId,
      animeUrl: animeUrl,
      name: animeTitle,
      japaneseTitle: japaneseTitle,
      synonyms: synonyms,
      imageUrl: imageUrl,
      aired: aired,
      premiered: premiered,
      duration: duration,
      status: status,
      synopsis: synopsis,
      malScore: malScore,
      genres: genres,
      producers: producers,
      studios: studios,
      type: type
    };
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeSeason = async ({ list = [], season, page = 1 }) => {
  try {
    const season_page = await axios.get(`${seasons_url}${season}?page=${page}`);
    const $ = cheerio.load(season_page.data);

    $('div.last_episodes > ul > li').each((i, el) => {
      list.push({
        animeId: $(el).find('div > a').attr('href').split('/')[2],
        animeTitle: $(el).find('div > a').attr('title'),
        imgUrl: $(el).find('div > a > img').attr('src'),
        status: $(el).find('p.released').html().trim(),
      });
    });

    return list;
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeThread = async ({ episodeId, page = 0 }) => {
  try {
    let threadId = null;

    const thread_page = await axios.get(disqus_iframe(decodeURIComponent(episodeId)));
    const $ = cheerio.load(thread_page.data, { xmlMode: true });

    const thread = JSON.parse($('#disqus-threadData')[0].children[0].data);

    if (thread.code === 0 && thread.cursor.total > 0) {
      threadId = thread.response.thread.id;
    }

    const thread_api_res = (await axios.get(disqus_api(threadId, page))).data;

    return {
      threadId: threadId,
      currentPage: page,
      hasNextPage: thread_api_res.cursor.hasNext,
      comments: thread_api_res.response,
    };
  } catch (err) {
    if (err.response.status === 400) {
      return { error: 'Invalid page. Try again.' };
    }
    return { error: err };
  }
};


export const scrapeWatchAnime = async ({ id }) => {
  try {
    let genres = [];
    let epList = [];

    const WatchAnime = await axios.get(`https://anitaku.so/${id}`);

    const $ = cheerio.load(WatchAnime.data);

    const anime_category = $('div.anime-info a').attr('href').replace('/category/', '')
    const episode_page = $('ul#episode_page').html()
    const movie_id = $('#movie_id').attr('value');
    const alias = $('#alias_anime').attr('value');
    const episode_link = $('div.play-video > iframe').attr('src')
    const gogoserver = $('li.vidcdn > a').attr('data-video')
    const streamsb = $('li.streamsb > a').attr('data-video')
    const xstreamcdn = $('li.xstreamcdn > a').attr('data-video')
    const anime_name_with_ep = $('div.title_name h2').text()
    const ep_num = $('div.anime_video_body > input.default_ep').attr('value')
    const download = $('li.dowloads a').attr('href')
    const nextEpText = $('div.anime_video_body_episodes_r a').text()
    const nextEpLink = $('div.anime_video_body_episodes_r > a').attr('href')
    const prevEpText = $('div.anime_video_body_episodes_l a').text()
    const prevEpLink = $('div.anime_video_body_episodes_l > a').attr('href')

    return {
      video: episode_link,
      gogoserver: gogoserver,
      streamsb: streamsb,
      xstreamcdn: xstreamcdn,
      animeNameWithEP: anime_name_with_ep.toString(),
      ep_num: ep_num,
      ep_download: download,
      anime_info: anime_category,
      movie_id: movie_id,
      alias: alias,
      episode_page: episode_page,
      nextEpText: nextEpText,
      nextEpLink: nextEpLink,
      prevEpLink: prevEpLink,
      prevEpText: prevEpText,

    };
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeSearchPage = async ({ keyw, page }) => {
  try {
    const SearchPage = await axios.get(`${BASE_URL + search_path}?keyword=${keyw}&page=${page}`);

    const $ = cheerio.load(SearchPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapePopularPage = async ({ page }) => {
  try {
    const PopularPage = await axios.get(`${BASE_URL}/popular.html?page=${page}`);

    const $ = cheerio.load(PopularPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeCompletedPage = async ({ page }) => {
  try {
    const CompletedPage = await axios.get(`${BASE_URL}/completed-anime.html?page=${page}`);

    const $ = cheerio.load(CompletedPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeOngoingPage = async ({ page }) => {
  try {
    const OngoingPage = await axios.get(`${BASE_URL}/ongoing-anime.html?page=${page}`);

    const $ = cheerio.load(OngoingPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeMoviePage = async ({ page }) => {
  try {
    const MoviePage = await axios.get(`${BASE_URL}/anime-movies.html?aph=&page=${page}`);

    const $ = cheerio.load(MoviePage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};


export const scrapeSubCategoryPage = async ({ subCategory, page }) => {
  try {
    const SubCategoryPage = await axios.get(`${BASE_URL}/sub-category/${subCategory}?page=${page}`);

    const $ = cheerio.load(SubCategoryPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeRecentPage = async ({ page, type }) => {
  try {
    const RecentPage = await axios.get(`${recent_release_url}?page=${page}&type=${type}`);

    const $ = cheerio.load(RecentPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeNewSeasonPage = async ({ page }) => {
  try {
    const NewSeasonPage = await axios.get(`${BASE_URL}/new-season.html?page=${page}`);

    const $ = cheerio.load(NewSeasonPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeGenrePage = async ({ genre, page }) => {
  try {
    const GenrePage = await axios.get(`${BASE_URL}/genre/${genre}?page=${page}`);

    const $ = cheerio.load(GenrePage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeAnimeListPage = async ({ page }) => {
  try {
    const AnimeListPage = await axios.get(`${BASE_URL}/anime-list.html?page=${page}`);

    const $ = cheerio.load(AnimeListPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};

export const scrapeAnimeAZPage = async ({ aph, page = 1 }) => {
  try {
    const AnimeAZPage = await axios.get(`${BASE_URL}/anime-list-${aph}?page=${page}`);

    const $ = cheerio.load(AnimeAZPage.data);

    const pagination = $('ul.pagination-list').html()

    return {
      pagination: pagination.replace("selected", "active"),
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  }
};





export async function scrapeEpisodeData(id) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`https://9animetv.to/watch/${id}`);

  // Wait for the dynamic content to load
  await page.waitForSelector('.episodes-ul a.item.ep-item');

  // Extract episode data
  const episodeData = await page.evaluate(() => {
    const episodes = document.querySelectorAll('.episodes-ul a.item.ep-item');
    const data = [];
    episodes.forEach(episode => {
      const episodeUrl = episode.getAttribute('href');
      const dataId = episode.getAttribute('data-id');
      const title = episode.getAttribute('title');
      const episodeNumber = episode.querySelector('.order').textContent;
      data.push({
        episodeUrl,
        dataId,
        title,
        episodeNumber
      });
    });
    return data;
  });

  await browser.close();
  return episodeData;
}


export const scrapeMangaDetailsWithChapters = async ({ id }) => {
    try {
        const mangaDetails = await scrapeMangaDetail({ id });
        const chapterData = await scrapeChapterData(mangaDetails.mangaId);
        return { ...mangaDetails, chapters: chapterData };
    } catch (error) {
        console.error('Error:', error);
        return { error: 'Failed to fetch manga details and chapters.' };
    }
};

const scrapeChapterData = async (id) => {
    try {
        const response = await axios.get(`https://asuratoon.com/manga/${id}`);
        const $ = cheerio.load(response.data);

        const chapterData = [];

        $('#chapterlist .clstyle li').each((index, element) => {
            const $chapter = $(element);
            const chapterUrl = $chapter.find('a').attr('href');
            const chapterNum = $chapter.find('.chapternum').text().trim();
            const chapterDate = $chapter.find('.chapterdate').text().trim();
            const chapterId = $chapter.attr('data-num');
            const chapterIds =$chapter.find('a').attr('href').split('/').slice(-2)[0];

            chapterData.push({
                chapterId,
                chapterIds,
                chapterUrl,
                chapterNum,
                chapterDate
            });
        });

        return chapterData;
    } catch (error) {
        console.error('Error:', error);
        return { error: 'Failed to fetch chapter data.' };
    }
};

const scrapeMangaDetail = async ({ id }) => {
    try {
        const mangaPage = await axios.get(`https://asuratoon.com/manga/${id}`);
        const $ = cheerio.load(mangaPage.data);

        const mangaTitle = $('h1.entry-title').text().trim();
        const imageUrl = $('.thumb img.wp-post-image').attr('src');
        const status = $('.imptdt:contains("Status")').next().text().trim();
        const type = $('.imptdt:contains("Type")').next().find('a').text().trim();
        const released = $('.flex-wrap:contains("Released")').next().text().trim().replace(/\s+/g, ' ');
        const genres = $('.wd-full:contains("Genres") .mgen a').map((index, element) => $(element).text().trim()).get();
        const artist = $('.flex-wrap:contains("Artist")').next().text().trim().replace(/\s+/g, ' ');
        const author = $('.flex-wrap:contains("Author")').next().text().trim().replace(/\s+/g, ' ');
        const postedOn = $('div.flex-wrap:contains("Posted On")').next().find('time').attr('datetime');
        const updatedOn = $('div.flex-wrap:contains("Updated On")').next().find('time').attr('datetime');


       // Scrape the synopsis based on its container class
        let synopsisContainer;
        if ($('.entry-content-single').find('[class*="description"]').length) {
            synopsisContainer = $('.entry-content-single').find('[class*="description"]');
        } else if ($('.entry-content-single').find('[class*="message-content"]').length) {
            synopsisContainer = $('.entry-content-single').find('[class*="message-content"]');
        } else {
            // If neither class is found, default to selecting the first div with class entry-content-single
            synopsisContainer = $('.entry-content-single').first();
        }
        const synopsis = synopsisContainer.text().trim();

        return {
            mangaId: id,
            mangaTitle,
            imageUrl,
            status,
            type,
            synopsis,
            released,
            genres,
            artist,
            author,
            postedOn,
            updatedOn
        };
    } catch (error) {
        console.error('Error:', error);
        return { error: 'Failed to fetch manga details.' };
    }
};




// export const scrapeChapterDataFromUrl = async (chapterUrl) => {
//   try {
//     const response = await axios.get(chapterUrl);
//     const htmlContent = response.data;
//     const $ = cheerio.load(htmlContent);
//     const chapterData = {};

//     // Fetch title
//     const titleElement = $('.entry-title');
//     chapterData.title = titleElement.text().trim();

//     // Fetch previous button
//     const prevButton = $('.ch-prev-btn');
//     chapterData.prevButton = prevButton.attr('href');

//     // Fetch next button
//     const nextButton = $('.ch-next-btn');
//     chapterData.nextButton = nextButton.attr('href');

//     // Fetch manga ID
//     let mangaId = chapterUrl.split('/').slice(-2)[0];
//     mangaId = mangaId.replace(/-chapter-\d+$/, ''); // Remove chapter part from manga ID
//     chapterData.mangaId = mangaId;

//     // Fetch chapter ID

//   let chapterId = chapterUrl.split('/').slice(-2)[0];
//     chapterData.chapterId = chapterId;



//     // Fetch chapter images
//     const chapterImages = [];

//     $('#readerarea img').each((i, el) => {
//       const imageUrl = $(el).attr('src');
//       chapterImages.push(imageUrl);
//     });

//     chapterData.images = chapterImages;

//     return chapterData;
//   } catch (error) {
//     console.error('Error fetching chapter data:', error);
//     return { error: error.message };
//   }
// };


export const scrapeChapterDataFromUrl = async (chapterUrl, mangaId) => {
    try {
        const response = await axios.get(chapterUrl);
        const htmlContent = response.data;
        const $ = cheerio.load(htmlContent);
        const chapterData = {};

        // Fetch title
        const titleElement = $('.entry-title');
        chapterData.title = titleElement.text().trim();

        // Fetch previous button
        const prevButton = $('.ch-prev-btn');
        chapterData.prevButton = prevButton.attr('href');

        // Fetch next button
        const nextButton = $('.ch-next-btn');
        chapterData.nextButton = nextButton.attr('href');

        // Fetch chapter ID
        const chapterId = chapterUrl.split('/').slice(-1)[0];
        chapterData.chapterId = chapterId;

        // Set manga ID
        chapterData.mangaId = mangaId;

        // Fetch chapter images
        const chapterImages = [];
        $('#readerarea img').each((i, el) => {
            const imageUrl = $(el).attr('src');
            chapterImages.push(imageUrl);
        });
        chapterData.images = chapterImages;

        return chapterData;
    } catch (error) {
        console.error('Error fetching chapter data:', error);
        return { error: error.message };
    }
};




export const scrapeManhuaGoldDetailsWithChapters = async ({ id }) => {
    try {
        const mangaDetails = await scrapeManhuaGoldDetail({ id });
        const chapterData = await scrapeManhuaGoldChapterData(id);
        return { ...mangaDetails, chapters: chapterData };
    } catch (error) {
        console.error('Error:', error);
        return { error: 'Failed to fetch manga details and chapters.' };
    }
};

const scrapeManhuaGoldChapterData = async (id) => {
    try {
        const response = await axios.get(`https://manhuagold.top/manga/${id}`);
        const $ = cheerio.load(response.data);

       const chapters = [];
        $('#myUL li').each((index, element) => {
            const $chapter = $(element);
            const chapterUrl = $chapter.find('a').attr('href');
            const chapterTitle = $chapter.text().trim();
            const chapterNum = chapterTitle.match(/Chapter \d+/)[0]; // Extracting chapter number
            const chapterDate = chapterTitle.split(' ').slice(-2).join(' '); // Extracting chapter date
            const chapterId = chapterUrl.split('/').pop(); // Extracting chapterId from the URL

            chapters.push({
                chapterUrl,
                chapterNum,
                chapterDate,
                chapterId // Adding chapterId to the chapter object
            });
        });

        return chapters;
    } catch (error) {
        console.error('Error:', error);
        return { error: 'Failed to fetch chapter data.' };
    }
};

const scrapeManhuaGoldDetail = async ({ id }) => {
    try {
        const mangaPage = await axios.get(`https://manhuagold.top/manga/${id}`);
        const $ = cheerio.load(mangaPage.data);

        const mangaTitle = $('header h1').text().trim();
        let imageUrl = $('img.full.r2.md-w120').attr('src');
        if (imageUrl) {
                imageUrl = `https://i1.wp.com/manhuagold.top${imageUrl}`; // Prepend image URL
            }        const description = $('#syn-target').text().trim();
        const otherNames = $('p.m-0').text().trim().split(':')[1].trim().split(';').map(name => name.trim()); // Split and trim names
        const status = $('.y6x11p:contains("Status")').find('.dt').text().trim();
        const type = $('.y6x11p:contains("Type")').find('.dt').text().trim();
        const views = $('.y6x11p:contains("Views")').find('.dt').text().trim();
        const authors = $('.y6x11p:contains("Authors")').find('.dt').text().trim();
        const created = $('.y6x11p:contains("Created")').find('.dt').text().trim();
        const updated = $('.y6x11p:contains("Update")').find('.dt').text().trim();

        return {
            mangaId: id,
            mangaTitle,
            imageUrl,
            otherNames,
            status,
            type,
            description,
            views,
            authors,
            created,
            updated,
        };
    } catch (error) {
        console.error('Error:', error);
        return { error: 'Failed to fetch manga details.' };
    }
};




export const scrapeManhuaGoldChapterDataFromUrl = async (chapterUrl, mangaId) => {
    try {
        const browser = await puppeteer.launch({
            // Add any necessary launch options here
            // For example:
            headless: true, // Run in headless mode
             args: ['--no-sandbox', '--disable-setuid-sandbox'], // Additional arguments for better performance
        });

        const page = await browser.newPage();

        // Set a longer timeout to allow more time for pages to load
        await page.setDefaultNavigationTimeout(30000); // 30 seconds

        // Implement retry logic for page navigation
        let attempts = 0;
        while (attempts < 3) { // Retry up to 3 times
            try {
                await page.goto(chapterUrl);
                break; // If successful, exit the retry loop
            } catch (error) {
                attempts++;
                console.error(`Attempt ${attempts} failed to navigate to ${chapterUrl}: ${error}`);
            }
        }

        // Wait for the XPath selector to become available, with retry logic
        await page.waitForXPath('//*[@id="chapterContent"]', { timeout: 10000 }); // 10 seconds

        const chapterData = {};

        // Fetch title
        const titleElement = await page.$('.m-0.fs-25.tac.c-0.fs-20.mt-5');
        if (titleElement) {
            let titleText = await page.evaluate(title => title.textContent.trim(), titleElement);
            // Remove newline and extra spaces from the title
            titleText = titleText.replace(/\n|\s{2,}/g, ' ');
            chapterData.title = titleText;
        } else {
            throw new Error('Chapter title element not found.');
        }

        // Fetch chapter ID
        const chapterId = chapterUrl.split('/').pop();
        chapterData.chapterId = chapterId;

        // Add manga ID
        chapterData.mangaId = mangaId;

        // Fetch chapter images
        const imageUrls = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('#chapterContent img'));
            return images.map(img => img.src);
        });

        chapterData.images = imageUrls;

        await browser.close();

        return chapterData;
    } catch (error) {
        console.error('Error fetching chapter data:', error);
        return { error: error.message };
    }
};






const scrapeReaperDetailsWithChapters = async ({ id }) => {
    try {
        const mangaDetails = await scrapeReaperDetail({ id });
        const chapterData = await scrapeReaperChapterData(id);
        return { ...mangaDetails, chapters: chapterData };
    } catch (error) {
        console.error('Error:', error);
        return { error: 'Failed to fetch manga details and chapters.' };
    }
};

const scrapeReaperChapterData = async (id) => {
    try {
        const response = await axios.get(`https://reaper-scans.com/manga/${id}`);
        const $ = cheerio.load(response.data);

        const chapters = [];
        $('#chapterlist li').each((index, element) => {
            const $chapter = $(element);
            const chapterUrl = $chapter.find('a').attr('href');
            const chapterNum = $chapter.find('.chapternum').text().trim();
            const chapterDate = $chapter.find('.chapterdate').text().trim();
            const chapterIdMatch = chapterUrl ? chapterUrl.match(/\/([^/]+)\/?$/) : null;
            const chapterId = chapterIdMatch ? chapterIdMatch[1] : null;
            chapters.push({
                chapterUrl,
                chapterNum,
                chapterDate,
                chapterId // Adding chapterId to the chapter object
            });
        });

        return chapters;
    } catch (error) {
        console.error('Error:', error);
        return { error: 'Failed to fetch chapter data.' };
    }
};

const scrapeReaperDetail = async ({ id }) => {
    try {
        const mangaPage = await axios.get(`https://reaper-scans.com/manga/${id}`);
        const $ = cheerio.load(mangaPage.data);

        const mangaTitle = $('.entry-title').text().trim();
        const imageUrl = $('div.bigbanner').css('background-image').match(/url\(['"]?([^'"]+)['"]?\)/)[1];
        const description = $('div.entry-content p').first().text().trim();
        const otherNames = $('.seriestualt').text().trim().split(',').map(name => name.trim()); // Split and trim names
        const status = $('.infotable td:contains("Status")').next().text().trim();
        const type = $('.infotable td:contains("Type")').next().text().trim();
        const authors = $('.infotable td:contains("Author")').next().text().trim();
        const created = $('.infotable td:contains("Released")').next().text().trim();
        const updated = $('.infotable td:contains("Updated On")').next().text().trim();
        const artist = $('.infotable td:contains("Artist")').next().text().trim();
        const serialization = $('.infotable td:contains("Serialization")').next().text().trim();

        return {
            mangaId: id,
            mangaTitle,
            imageUrl,
            otherNames,
            status,
            type,
            description,
            authors,
            created,
            updated,
            artist,
            serialization
        };
    } catch (error) {
        console.error('Error:', error);
        return { error: 'Failed to fetch manga details.' };
    }
};

export { scrapeReaperDetailsWithChapters };


export const scrapeReaperChapterDataFromUrl = async (chapterUrl, mangaId) => {
    try {
        const response = await axios.get(chapterUrl);
        const htmlContent = response.data;
        const $ = cheerio.load(htmlContent);
        const chapterData = {};

        // Fetch title
        const titleElement = $('b').first();
        chapterData.title = titleElement.text().trim();

        // Fetch chapter ID
        const chapterIdMatch = chapterUrl ? chapterUrl.match(/(?:https?:\/\/[^/]+\/)(.+)\/?$/) : null;
        const chapterId = chapterIdMatch ? chapterIdMatch[1] : null;
        chapterData.chapterId = chapterId;

        // Set manga ID
        chapterData.mangaId = mangaId;

        // Fetch chapter images
        const chapterImages = [];
        $('#readerarea img').each((i, el) => {
            const imageUrl = $(el).attr('src');
            // Check if the URL is valid and points to an image
            if (imageUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl)) {
                chapterImages.push(imageUrl);
            }
        });

        // Fetch images from data-src attribute within #readerarea
        $('#readerarea img[data-src]').each((i, el) => {
            const imageUrl = $(el).attr('data-src');
            // Check if the URL is valid and points to an image
            if (imageUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl)) {
                // Remove newline character (\n) from the image URL
                const cleanImageUrl = imageUrl.replace(/\n/g, '');
                chapterImages.push(cleanImageUrl);
            }
        });

        chapterData.images = chapterImages;

        return chapterData;
    } catch (error) {
        console.error('Error fetching chapter data:', error);
        return { error: error.message };
    }
};








const scrapeReadDetailsWithChapters = async ({ id }) => {
    try {
        const mangaDetails = await scrapeReadDetail({ id });
        const chapterData = await scrapeReadChapterData(id);
        return { ...mangaDetails, chapters: chapterData };
    } catch (error) {
        console.error('Error:', error);
        return { error: 'Failed to fetch manga details and chapters.' };
    }
};



const scrapeReadChapterData = async (id) => {
    try {
        const response = await axios.get(`https://www.mangaread.org/manga/${id}`);
        const $ = cheerio.load(response.data);

        const chapters = [];
        $('.listing-chapters_wrap ul.main.version-chap li.wp-manga-chapter').each((index, element) => {
            const $chapter = $(element);
            const chapterUrl = $chapter.find('a').attr('href');
            const chapterNum = $chapter.find('a').text().trim();
            const chapterDate = $chapter.find('.chapter-release-date i').text().trim();
            const chapterIdMatch = chapterUrl ? chapterUrl.match(/\/([^/]+)\/?$/) : null;
            const chapterId = chapterIdMatch ? chapterIdMatch[1] : null;
            chapters.push({
                chapterUrl,
                chapterNum,
                chapterDate,
                chapterId // Adding chapterId to the chapter object
            });
        });

        return chapters;
    } catch (error) {
        console.error('Error:', error);
        return { error: 'Failed to fetch chapter data.' };
    }
};


const scrapeReadDetail = async ({ id }) => {
    try {
        const mangaPage = await axios.get(`https://www.mangaread.org/manga/${id}`);
        const $ = cheerio.load(mangaPage.data);

        const mangaTitle = $('.post-title h1').text().trim();
        const imageUrl = $('.summary_image img').attr('src').replace(/-\d+x\d+/, ''); // Remove dimensions from image URL
        const synopsis = $('.description-summary .summary__content').text().trim();
        const otherNames = $('.post-content_item:contains("Alternative") .summary-content').text().trim().split(',').map(name => name.trim());
        const status = $('.post-content_item:contains("Status") .summary-content').text().trim();
        const type = $('.post-content_item:contains("Type") .summary-content').text().trim();
        const authors = $('.post-content_item:contains("Author(s)") .author-content a').text().trim();
        const created = $('.post-content_item:contains("Release") .summary-content').text().trim();
        const artist = $('.post-content_item:contains("Artist(s)") .artist-content a').text().trim();
        const genres = $('.post-content_item:contains("Genre(s)") .genres-content a').map((_, element) => $(element).text().trim()).get();

        return {
            mangaId: id,
            mangaTitle,
            imageUrl,
            otherNames,
            status,
            type,
            synopsis,
            authors,
            created,
            artist,
            genres
        };
    } catch (error) {
        console.error('Error:', error);
        return { error: 'Failed to fetch manga details.' };
    }
};


export { scrapeReadDetailsWithChapters };

export const scrapeReadChapterDataFromUrl = async (chapterUrl, mangaId) => {
    try {
        const response = await axios.get(chapterUrl);
        const htmlContent = response.data;
        const $ = cheerio.load(htmlContent);
        const chapterData = {};

        // Fetch title
        const titleElement = $('#chapter-heading');
        chapterData.title = titleElement.text().trim();

        // Fetch chapter ID
        const chapterIdMatch = chapterUrl.match(/\/([^/]+)\/?$/);
        const chapterId = chapterIdMatch ? chapterIdMatch[1] : null;
        chapterData.chapterId = chapterId;

        // Set manga ID
        chapterData.mangaId = mangaId;

        // Fetch chapter images
        const chapterImages = [];
        $('.page-break.no-gaps img').each((i, el) => {
            const imageUrl = $(el).attr('src').trim();
            // Add the image URL to the array directly without checking
            const cleanImageUrl = imageUrl.trim();
            chapterImages.push(cleanImageUrl);
        });

        chapterData.images = chapterImages;

        return chapterData;
    } catch (error) {
        console.error('Error fetching chapter data:', error);
        return { error: error.message };
    }
};






async function scrapeMangaReadManhuaItems(pageNumber) {
    const url = `https://www.mangaread.org/genres/manhua/page/${pageNumber}/`;
    let m_list = [];

    try {
        // Scrape manga items on the current page
        const mangaPageData = await scrapeMangaReadManhuaCurrentPage(url);
        m_list = mangaPageData.list;

        return m_list;
    } catch (error) {
        console.error('An error occurred:', error);
        return [];
    }
}

async function scrapeMangaReadManhuaCurrentPage(url) {
    let m_list = [];

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        $('.page-item-detail.manga').each((index, element) => {
            const $item = $(element);
            const title = $item.find('.post-title a').text().trim();
            let imageUrl = $item.find('.item-thumb img').attr('src');
            // Remove any dimensions from imageUrl suffix
            if (imageUrl) {
                imageUrl = imageUrl.replace(/-\d+x\d+(\.\w+)$/, '$1');
            }            const mangaUrl = $item.find('.post-title a').attr('href');
            const mangaId = mangaUrl ? mangaUrl.split('/').filter(part => part.trim() !== '').pop() : null;
            const chapters = $item.find('.list-chapter .chapter-item').map((i, e) => {
                const $chapter = $(e);
                const chapterTitle = $chapter.find('.chapter a').text().trim();
                const chapterUrl = $chapter.find('.chapter a').attr('href');
                const chapterId = chapterUrl ? chapterUrl.split('/').filter(part => part.trim() !== '').pop() : null;
                const chapterDate = $chapter.find('.post-on').text().trim();
                return {
                    chapterTitle,
                    chapterUrl,
                    chapterId,
                    chapterDate
                };
            }).get();

            m_list.push({
                title,
                imageUrl,
                mangaUrl,
                mangaId,
                chapters
            });
        });
    } catch (error) {
        console.error('An error occurred:', error);
    }

    return {
        list: m_list
    };
}



export { scrapeMangaReadManhuaItems };







async function scrapeMangaReadMangaItems(pageNumber) {
    const url = `https://www.mangaread.org/genres/manga/page/${pageNumber}/`;
    let m_list = [];

    try {
        // Scrape manga items on the current page
        const mangaPageData = await scrapeMangaReadMangaCurrentPage(url);
        m_list = mangaPageData.list;

        return m_list;
    } catch (error) {
        console.error('An error occurred:', error);
        return [];
    }
}

async function scrapeMangaReadMangaCurrentPage(url) {
    let m_list = [];

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        $('.page-item-detail.manga').each((index, element) => {
            const $item = $(element);
            const title = $item.find('.post-title a').text().trim();
            let imageUrl = $item.find('.item-thumb img').attr('src');
            // Remove any dimensions from imageUrl suffix
            if (imageUrl) {
                imageUrl = imageUrl.replace(/-\d+x\d+(\.\w+)$/, '$1');
            }            const mangaUrl = $item.find('.post-title a').attr('href');
            const mangaId = mangaUrl ? mangaUrl.split('/').filter(part => part.trim() !== '').pop() : null;
            const chapters = $item.find('.list-chapter .chapter-item').map((i, e) => {
                const $chapter = $(e);
                const chapterTitle = $chapter.find('.chapter a').text().trim();
                const chapterUrl = $chapter.find('.chapter a').attr('href');
                const chapterId = chapterUrl ? chapterUrl.split('/').filter(part => part.trim() !== '').pop() : null;
                const chapterDate = $chapter.find('.post-on').text().trim();
                return {
                    chapterTitle,
                    chapterUrl,
                    chapterId,
                    chapterDate
                };
            }).get();

            m_list.push({
                title,
                imageUrl,
                mangaUrl,
                mangaId,
                chapters
            });
        });
    } catch (error) {
        console.error('An error occurred:', error);
    }

    return {
        list: m_list
    };
}



export { scrapeMangaReadMangaItems };





async function scrapeReadSearch({ keyw, page = 1 }) {
    const url = `https://www.mangaread.org/page/${page}/?s=${keyw}&post_type=wp-manga&op=&author=&artist=&release=&adult=`;
    let mangaList = [];

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        $('.c-tabs-item__content').each((index, element) => {
            const $item = $(element);
            const title = $item.find('.post-title > h3 > a').text().trim();
            const mangaUrl = $item.find('.post-title > h3 > a').attr('href');
            const mangaId = mangaUrl.split('/')[4];
            const imageUrl = $item.find('.tab-thumb > a > img').attr('src');
            const chapterTitle = $item.find('.meta-item.latest-chap > .chapter > a').text().trim();
            const chapterUrl = $item.find('.meta-item.latest-chap > .chapter > a').attr('href');
            const chapterId = chapterUrl ? chapterUrl.split('/').filter(part => part.trim() !== '').pop() : null;
            const chapterDate = $item.find('.meta-item.post-on > .font-meta').text().trim();

            mangaList.push({
                title,
                imageUrl,
                mangaUrl,
                mangaId,
                chapter: {
                    chapterTitle,
                    chapterUrl,
                    chapterId,
                    chapterDate,
                },
            });
        });
    } catch (error) {
        console.error('An error occurred:', error);
    }

    return mangaList;
}

export { scrapeReadSearch };


async function scrapeAsuraSearch({ keyw, page = 1 }) {
    const url = `https://asuratoon.com/page/${page}/?s=${keyw}`;
    let mangaList = [];

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        $('#wpop-items .serieslist.pop.wpop.wpop-weekly ul li').each((index, element) => {
            const $item = $(element);
            const title = $item.find('h2 > a.series').text().trim();
            const mangaUrl = $item.find('h2 > a.series').attr('href');
            const mangaId = mangaUrl.split('/')[4];
            const imageUrl = $item.find('.imgseries > a.series > img').attr('src');
            const genres = [];
            $item.find('.leftseries span a[rel="tag"]').each((i, el) => {
                genres.push($(el).text().trim());
            });
            const rating = parseFloat($item.find('.rt .numscore').text().trim());

            mangaList.push({
                title,
                imageUrl,
                mangaUrl,
                mangaId,
                genres,
                rating
            });
        });
    } catch (error) {
        console.error('An error occurred:', error);
    }

    return mangaList;
}


export { scrapeAsuraSearch };













async function scrapeGenreReadMangaItems(pageNumber, genre) {
    const url = `https://www.mangaread.org/genres/${genre}/page/${pageNumber}/`;
    let m_list = [];

    try {
        // Scrape manga items on the current page
        const mangaPageData = await scrapeGenreReadMangaCurrentPage(url);
        m_list = mangaPageData.list;

        return m_list;
    } catch (error) {
        console.error('An error occurred:', error);
        return [];
    }
}

async function scrapeGenreReadMangaCurrentPage(url) {
    let m_list = [];

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        $('.page-item-detail.manga').each((index, element) => {
            const $item = $(element);
            const title = $item.find('.post-title a').text().trim();
            let imageUrl = $item.find('.item-thumb img').attr('src');
            // Remove any dimensions from imageUrl suffix
            if (imageUrl) {
                imageUrl = imageUrl.replace(/-\d+x\d+(\.\w+)$/, '$1');
            }            const mangaUrl = $item.find('.post-title a').attr('href');
            const mangaId = mangaUrl ? mangaUrl.split('/').filter(part => part.trim() !== '').pop() : null;
            const chapters = $item.find('.list-chapter .chapter-item').map((i, e) => {
                const $chapter = $(e);
                const chapterTitle = $chapter.find('.chapter a').text().trim();
                const chapterUrl = $chapter.find('.chapter a').attr('href');
                const chapterId = chapterUrl ? chapterUrl.split('/').filter(part => part.trim() !== '').pop() : null;
                const chapterDate = $chapter.find('.post-on').text().trim();
                return {
                    chapterTitle,
                    chapterUrl,
                    chapterId,
                    chapterDate
                };
            }).get();

            m_list.push({
                title,
                imageUrl,
                mangaUrl,
                mangaId,
                chapters
            });
        });
    } catch (error) {
        console.error('An error occurred:', error);
    }

    return {
        list: m_list
    };
}



export { scrapeGenreReadMangaItems };












async function scrapeOrderReadMangaItems(pageNumber, order) {
    const url = `https://www.mangaread.org/manga/page/${pageNumber}/?m_orderby=${order}`;
    let m_list = [];

    try {
        // Scrape manga items on the current page
        const mangaPageData = await scrapeOrderReadMangaCurrentPage(url);
        m_list = mangaPageData.list;

        return m_list;
    } catch (error) {
        console.error('An error occurred:', error);
        return [];
    }
}

async function scrapeOrderReadMangaCurrentPage(url) {
    let m_list = [];

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        $('.page-item-detail.manga').each((index, element) => {
            const $item = $(element);
            const title = $item.find('.post-title a').text().trim();
            let imageUrl = $item.find('.item-thumb img').attr('src');
            // Remove any dimensions from imageUrl suffix
            if (imageUrl) {
                imageUrl = imageUrl.replace(/-\d+x\d+(\.\w+)$/, '$1');
            }            const mangaUrl = $item.find('.post-title a').attr('href');
            const mangaId = mangaUrl ? mangaUrl.split('/').filter(part => part.trim() !== '').pop() : null;
            const chapters = $item.find('.list-chapter .chapter-item').map((i, e) => {
                const $chapter = $(e);
                const chapterTitle = $chapter.find('.chapter a').text().trim();
                const chapterUrl = $chapter.find('.chapter a').attr('href');
                const chapterId = chapterUrl ? chapterUrl.split('/').filter(part => part.trim() !== '').pop() : null;
                const chapterDate = $chapter.find('.post-on').text().trim();
                return {
                    chapterTitle,
                    chapterUrl,
                    chapterId,
                    chapterDate
                };
            }).get();

            m_list.push({
                title,
                imageUrl,
                mangaUrl,
                mangaId,
                chapters
            });
        });
    } catch (error) {
        console.error('An error occurred:', error);
    }

    return {
        list: m_list
    };
}



export { scrapeOrderReadMangaItems };







async function scrapeMangaRollReadMangaItems(pageNumber, order) {
    const url = `https://mangarolls.net/manga/page/${pageNumber}/?m_orderby=${order}`;
    let m_list = [];

    try {
        // Scrape manga items on the current page
        const mangaPageData = await scrapeMangaRollReadMangaCurrentPage(url);
        m_list = mangaPageData.list;

        return m_list;
    } catch (error) {
        console.error('An error occurred:', error);
        return [];
    }
}

async function scrapeMangaRollReadMangaCurrentPage(url) {
    let m_list = [];

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        $('.page-item-detail.manga').each((index, element) => {
            const $item = $(element);
            const title = $item.find('.post-title a').text().trim();
            let imageUrl = $item.find('.item-thumb img').attr('data-src');
            // Remove any dimensions from imageUrl suffix
            if (imageUrl) {
                imageUrl = imageUrl.replace(/-\d+x\d+(\.\w+)$/, '$1');
            }
            const mangaUrl = $item.find('.post-title a').attr('href');
            const mangaId = mangaUrl ? mangaUrl.split('/').filter(part => part.trim() !== '').pop() : null;
            const chapters = $item.find('.list-chapter .chapter-item').map((i, e) => {
                const $chapter = $(e);
                const chapterTitle = $chapter.find('.chapter a').text().trim();
                const chapterUrl = $chapter.find('.chapter a').attr('href');
                const chapterId = chapterUrl ? chapterUrl.split('/').filter(part => part.trim() !== '').pop() : null;
                let chapterDate = $chapter.find('.post-on').text().trim();
                // Handle case where there is no chapter date
                if (!chapterDate) {
                    chapterDate = 'New';
                }
                return {
                    chapterTitle,
                    chapterUrl,
                    chapterId,
                    chapterDate
                };
            }).get();

            m_list.push({
                title,
                imageUrl,
                mangaUrl,
                mangaId,
                chapters
            });
        });
    } catch (error) {
        console.error('An error occurred:', error);
    }

    return {
        list: m_list
    };
}



export { scrapeMangaRollReadMangaItems };







const scrapeMangaRollDetailsWithChapters = async ({ id }) => {
    try {
        const mangaDetails = await scrapeMangaRollDetail({ id });
        const chapterData = await scrapeMangaRollChapterData(id);
        return { ...mangaDetails, chapters: chapterData };
    } catch (error) {
        console.error('Error:', error);
        return { error: 'Failed to fetch manga details and chapters.' };
    }
};


const scrapeMangaRollChapterData = async (id) => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.goto(`https://mangarolls.net/manga/${id}`);

        // Wait for a child element of the chapter list to appear
        const chapterListSelector = '.listing-chapters_wrap ul.main.version-chap';
        await page.waitForSelector(chapterListSelector);

        const chapters = await page.evaluate(() => {
            const chapterElements = document.querySelectorAll('.listing-chapters_wrap ul.main.version-chap li.wp-manga-chapter');
            const chaptersData = [];

            chapterElements.forEach(element => {
                const chapterAnchor = element.querySelector('a');
                if (chapterAnchor) {
                    const chapterUrl = chapterAnchor.getAttribute('href');
                    const chapterNum = chapterAnchor.textContent.trim();
                    const chapterDateElement = element.querySelector('.chapter-release-date i');
                    let chapterDate = chapterDateElement ? chapterDateElement.textContent.trim() : '';
                // Handle case where there is no chapter date
                if (!chapterDate) {
                    chapterDate = 'New';
                }
                    const chapterIdMatch = chapterUrl ? chapterUrl.match(/\/([^/]+)\/?$/) : null;
                    const chapterId = chapterIdMatch ? chapterIdMatch[1] : null;

                    chaptersData.push({
                        chapterUrl,
                        chapterNum,
                        chapterDate,
                        chapterId
                    });
                }
            });

            return chaptersData;
        });

        await browser.close();
        return chapters;
    } catch (error) {
        console.error('Error:', error);
        return { error: 'Failed to fetch chapter data.' };
    }
};


const scrapeMangaRollDetail = async ({ id }) => {
    try {
        const mangaPage = await axios.get(`https://mangarolls.net/manga/${id}`);
        const $ = cheerio.load(mangaPage.data);

        const mangaTitle = $('.post-title h1').text().trim();
        const imageUrl = $('.summary_image img').attr('data-src').replace(/-\d+x\d+/, ''); // Remove dimensions from image URL
        const synopsis = $('.description-summary .summary__content').text().trim();
        const otherNames = $('.post-content_item:contains("Alternative") .summary-content').text().trim().split(',').map(name => name.trim());
        const status = $('.post-content_item:contains("Status") .summary-content').text().trim();
        const type = $('.post-content_item:contains("Type") .summary-content').text().trim();
        const authors = $('.post-content_item:contains("Author(s)") .author-content a').text().trim();
        const created = $('.post-content_item:contains("Release") .summary-content').text().trim();
        const artist = $('.post-content_item:contains("Artist(s)") .artist-content a').text().trim();
        const genres = $('.post-content_item:contains("Genre(s)") .genres-content a').map((_, element) => $(element).text().trim()).get();

        return {
            mangaId: id,
            mangaTitle,
            imageUrl,
            otherNames,
            status,
            type,
            synopsis,
            authors,
            created,
            artist,
            genres
        };
    } catch (error) {
        console.error('Error:', error);
        return { error: 'Failed to fetch manga details.' };
    }
};


export { scrapeMangaRollDetailsWithChapters };

export const scrapeMangaRollChapterDataFromUrl = async (chapterUrl, mangaId) => {
    try {
        const response = await axios.get(chapterUrl);
        const htmlContent = response.data;
        const $ = cheerio.load(htmlContent);
        const chapterData = {};

        // Fetch title
        const titleElement = $('#chapter-heading');
        chapterData.title = titleElement.text().trim();

        // Fetch chapter ID
        const chapterIdMatch = chapterUrl.match(/\/([^/]+)\/?$/);
        const chapterId = chapterIdMatch ? chapterIdMatch[1] : null;
        chapterData.chapterId = chapterId;

        // Set manga ID
        chapterData.mangaId = mangaId;

        // Fetch chapter images
        const chapterImages = [];
        $('.page-break.no-gaps img').each((i, el) => {
            const imageUrl = $(el).attr('data-src').trim();
            // Add the image URL to the array directly without checking
            const cleanImageUrl = imageUrl.trim();
            chapterImages.push(cleanImageUrl);
        });

        chapterData.images = chapterImages;

        return chapterData;
    } catch (error) {
        console.error('Error fetching chapter data:', error);
        return { error: error.message };
    }
};
























const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const API_URL = process.env.API_URL;

console.log('API_URL:', API_URL); // Debug output

if (!API_URL) {
  throw new Error('API_URL environment variable is not set.');
}

let postedChapters = new Set();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTED_CHAPTERS_FILE = path.join(__dirname, 'postedChapters.json');

async function loadPostedChapters() {
  try {
    const data = await fs.readFile(POSTED_CHAPTERS_FILE, 'utf-8');
    const parsedData = JSON.parse(data);
    postedChapters = new Set(parsedData);
    console.log('Loaded posted chapters:', [...postedChapters]); // Debug output
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No existing postedChapters file found. Starting fresh.');
    } else {
      console.error('Error reading postedChapters file:', error);
    }
  }
}

async function savePostedChapters() {
  try {
    const data = JSON.stringify([...postedChapters]);
    await fs.writeFile(POSTED_CHAPTERS_FILE, data, 'utf-8');
    console.log('Saved posted chapters:', [...postedChapters]); // Debug output
  } catch (error) {
    console.error('Error writing postedChapters file:', error);
  }
}

async function postToDiscord(manga, chapterTitle, chapterId, chapterDate) {
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

  try {
    await client.login(DISCORD_TOKEN);
    console.log('Bot logged in successfully');

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) {
      throw new Error(`Channel with ID ${CHANNEL_ID} not found`);
    }

    const chapterUrl = `https://reeltocomicvoyage.tech/readList/${manga.mangaId}/${chapterId}`;
    const messageContent = `Image: ${manga.imageUrl}\nNew chapter released: **${manga.title} - ${chapterTitle}**\nRead it here: [${manga.title} - Chapter ${chapterId.split('-')[1]}](${chapterUrl})\nReleased on: ${chapterDate}`;

    await channel.send(messageContent);
    console.log(`Message sent to channel ${CHANNEL_ID}`);
  } catch (error) {
    console.error('Error posting to Discord:', error);
  } finally {
    client.destroy();
  }
  console.log(`Posting to Discord: ${chapterTitle}, ID: ${chapterId}, Date: ${chapterDate}`);
}

async function checkForUpdates() {
  try {
    const response = await axios.get(API_URL);
    const mangaList = response.data;

    if (mangaList.length > 0) {
      const manga = mangaList[0]; // Get the first manga item
      const firstChapter = manga.chapters[0]; // Get the first chapter of the manga

      if (firstChapter) { // Check if there is at least one chapter
        const { chapterTitle, chapterId, chapterDate } = firstChapter;

        // Debugging: Log the chapterId to ensure it's being checked correctly
        console.log(`Checking chapterId: ${chapterId}`);

        // Check if the chapter has already been posted
        if (!postedChapters.has(chapterId)) {
          await postToDiscord(manga, chapterTitle, chapterId, chapterDate);
          postedChapters.add(chapterId);

          // Debugging: Log the postedChapters size and content
          console.log(`Posted chapters: ${[...postedChapters]}`);

          // Save updated postedChapters to file
          await savePostedChapters();

          if (postedChapters.size > 100) {
            const firstItem = postedChapters.values().next().value;
            postedChapters.delete(firstItem);
            await savePostedChapters(); // Save after deleting an item
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching data from API:', error);
  }
}

// Load postedChapters when the application starts
loadPostedChapters().then(() => {
  // Schedule the function to run at a regular interval
  setInterval(checkForUpdates, 10000); // Check for updates every 10 seconds

  // Call the function initially
  checkForUpdates();
});

