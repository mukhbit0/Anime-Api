import express from 'express';
import cors from 'cors';
import axios from 'axios';

import {
  scrapeGenre,
  scrapeTopAiringAnime,
  scrapeAnimeMovies,
  scrapePopularAnime,
  scrapeRecentPage,
  scrapeOngoingSeries,
  scrapeAnimeList,
  scrapeRecentlyAdded,
  scrapeAnimeAZ,
  scrapeAnimeAZPage,
  scrapeNewSeason,
  scrapeAnimeListPage,
  scrapeMoviePage,
  scrapeGenrePage,
  scrapeSubCategoryPage,
  scrapeRecentRelease,
  scrapeOngoingAnime,
  scrapeNewSeasonPage,
  scrapeSearch,
  scrapePopularPage,
  scrapeSearchPage,
  scrapeAnimeDetails,
  scrapeOngoingPage,
  scrapeCompletedPage,
  scrapeSeason,
  scrapeCompletedAnime,
  scrapeWatchAnime,
  scrapeThread,
  DownloadReferer,
  scrapeMangaItems,
  info,
  scrapeTrendingManga,
  scrapeMangaDetailsWithChapters,
  scrapeChapterDataFromUrl,
  scrapeManhuaItems,
  scrapeManhuaGoldDetailsWithChapters,
  scrapeManhuaGoldChapterDataFromUrl,
scrapeReaperItems,
scrapeReaperDetailsWithChapters,
scrapeReaperChapterDataFromUrl,
  scrapeReaperPopular,
  scrapeReadItems,
scrapeReadDetailsWithChapters,
scrapeReadChapterDataFromUrl,
  scrapeMangaReadManhuaItems,
scrapeMangaReadMangaItems,
  scrapeReadSearch,
  scrapeAsuraSearch,
  scrapeGenreReadMangaItems,
  scrapeOrderReadMangaItems,
  scrapeMangaRollReadMangaItems,
scrapeMangaRollDetailsWithChapters,
scrapeMangaRollChapterDataFromUrl,
} from './anime_parser.js';

const port = process.env.PORT || 3000;

const corsOptions = {
  origin: '*',
  credentails: true,
  optionSuccessStatus: 200,
  port: port,
};

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json('WORKING');
});

app.get('/asura', async (req, res) => {
    try {
        const pageNumber = req.query.page || 1; // Default to page 1 if no page query parameter is provided
        const data = await scrapeMangaItems(pageNumber);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            status: 500,
            error: 'Internal Error',
            message: err,
        });
    }
});

app.get('/reaper-popular', async (req, res) => {
  try {
    const data = await scrapeReaperPopular();

    res.status(200).json(data);
  } catch (err) {
    res.status(500).send({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/reaper', async (req, res) => {
    try {
        const pageNumber = req.query.page || 1; // Default to page 1 if no page query parameter is provided
        const data = await scrapeReaperItems(pageNumber);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            status: 500,
            error: 'Internal Error',
            message: err,
        });
    }
});

app.get('/read-manhua', async (req, res) => {
    try {
        const pageNumber = req.query.page || 1; // Default to page 1 if no page query parameter is provided
        const data = await scrapeMangaReadManhuaItems(pageNumber);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            status: 500,
            error: 'Internal Error',
            message: err,
        });
    }
});

app.get('/read-manga', async (req, res) => {
    try {
        const pageNumber = req.query.page || 1; // Default to page 1 if no page query parameter is provided
        const data = await scrapeMangaReadMangaItems(pageNumber);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            status: 500,
            error: 'Internal Error',
            message: err,
        });
    }
});

app.get('/genres/:genre/:page', async (req, res) => {
    try {
        const pageNumber = req.params.page || 1; // Default to page 1 if no page parameter is provided
        const genre = req.params.genre || 'all'; // Default to 'all' if no genre parameter is provided
        const data = await scrapeGenreReadMangaItems(pageNumber, genre);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            status: 500,
            error: 'Internal Error',
            message: err.message,
        });
    }
});

app.get('/order/:order/:page', async (req, res) => {
    try {
        const pageNumber = req.params.page || 1; // Default to page 1 if no page parameter is provided
        const order = req.params.order || 'latest'; // Default to 'latest' if no order parameter is provided
        const data = await scrapeOrderReadMangaItems(pageNumber, order);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            status: 500,
            error: 'Internal Error',
            message: err.message,
        });
    }
});




app.get('/reaper/:animeId', async (req, res) => {
  const animeId = req.params.animeId;
  try {
    const scrapedData = await scrapeReaperDetailsWithChapters({ id: animeId });
    res.json(scrapedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape anime details and episodes.' });
  }
});


app.get('/reaper/chapters/:mangaId/:chapterId', async (req, res) => {
    const mangaId = req.params.mangaId;
    const chapterId = req.params.chapterId;
    const chapterUrl = `https://reaper-scans.com/${chapterId}`;

    try {
        // Scrape chapter data
        const chapterData = await scrapeReaperChapterDataFromUrl(chapterUrl, mangaId);

        res.json(chapterData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chapter data' });
    }
});


app.get('/manhuagold', async (req, res) => {
    try {
        const pageNumber = req.query.page || 1; // Default to page 1 if no page query parameter is provided
        const data = await scrapeManhuaItems(pageNumber);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            status: 500,
            error: 'Internal Error',
            message: err,
        });
    }
});

app.get('/manhuagold/:animeId', async (req, res) => {
  const animeId = req.params.animeId;
  try {
    const scrapedData = await scrapeManhuaGoldDetailsWithChapters({ id: animeId });
    res.json(scrapedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape anime details and episodes.' });
  }
});


app.get('/manhuagold/chapters/:mangaId/:chapterId', async (req, res) => {
    const mangaId = req.params.mangaId;
    const chapterId = req.params.chapterId;
    const chapterUrl = `https://manhuagold.top/manga/${mangaId}/${chapterId}`;

    try {
        // Scrape chapter data
        const chapterData = await scrapeManhuaGoldChapterDataFromUrl(chapterUrl, mangaId);

        res.json(chapterData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chapter data' });
    }
});



app.get('/read', async (req, res) => {
    try {
        const pageNumber = req.query.page || 1; // Default to page 1 if no page query parameter is provided
        const data = await scrapeReadItems(pageNumber);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            status: 500,
            error: 'Internal Error',
            message: err,
        });
    }
});

app.get('/read/:animeId', async (req, res) => {
  const animeId = req.params.animeId;
  try {
    const scrapedData = await scrapeReadDetailsWithChapters({ id: animeId });
    res.json(scrapedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape anime details and episodes.' });
  }
});



app.get('/read/chapters/:mangaId/:chapterId', async (req, res) => {
    const mangaId = req.params.mangaId;
    const chapterId = req.params.chapterId;
    const chapterUrl = `https://www.mangaread.org/manga/${mangaId}/${chapterId}`;

    try {
        // Scrape chapter data
        const chapterData = await scrapeReadChapterDataFromUrl(chapterUrl, mangaId);

        res.json(chapterData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chapter data' });
    }
});

app.get('/mangaroll/:animeId', async (req, res) => {
  const animeId = req.params.animeId;
  try {
    const scrapedData = await scrapeMangaRollDetailsWithChapters({ id: animeId });
    res.json(scrapedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape anime details and episodes.' });
  }
});

app.get('/mangaroll/chapters/:mangaId/:chapterId', async (req, res) => {
    const mangaId = req.params.mangaId;
    const chapterId = req.params.chapterId;
    const chapterUrl = `https://mangarolls.net/manga/${mangaId}/${chapterId}`;

    try {
        // Scrape chapter data
        const chapterData = await scrapeMangaRollChapterDataFromUrl(chapterUrl, mangaId);

        res.json(chapterData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chapter data' });
    }
});

app.get('/mangaroll/:order/:page', async (req, res) => {
    try {
        const pageNumber = req.params.page || 1; // Default to page 1 if no page parameter is provided
        const order = req.params.order || 'latest'; // Default to 'latest' if no order parameter is provided
        const data = await scrapeMangaRollReadMangaItems(pageNumber, order);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            status: 500,
            error: 'Internal Error',
            message: err.message,
        });
    }
});

app.get('/readsearch', async (req, res) => {
  try {
    // Extract query parameters from request
    const { keyw, page } = req.query;

    // Call scrapeReadSearch function to scrape data
    const data = await scrapeReadSearch({ keyw, page });

    // Send scraped data as JSON response
    res.status(200).json(data);
  } catch (err) {
    // Handle errors
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err.message, // Use err.message to get the error message
    });
  }
});


app.get('/asurasearch', async (req, res) => {
  try {
    // Extract query parameters from request
    const { keyw, page } = req.query;

    // Call scrapeReadSearch function to scrape data
    const data = await scrapeAsuraSearch({ keyw, page });

    // Send scraped data as JSON response
    res.status(200).json(data);
  } catch (err) {
    // Handle errors
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err.message, // Use err.message to get the error message
    });
  }
});

app.get('/info/:slug', async (req, res) => {

    const result = await info(req.params.slug)
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(result, null, 4))
})


app.get('/trending-manga', async (req, res) => {
  try {
    const data = await scrapeTrendingManga();

    res.status(200).json(data);
  } catch (err) {
    res.status(500).send({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});


// app.get('/chapters/:chapter', async (req, res) => {
//   const chapter = req.params.chapter;
//   const chapterUrl = `https://asuratoon.com/${chapter}/`;

//   try {
//     const chapterData = await scrapeChapterDataFromUrl(chapterUrl);
//     res.json(chapterData);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch chapter data' });
//   }
// });

app.get('/chapters/:mangaId/:chapterId', async (req, res) => {
    const mangaId = req.params.mangaId;
    const chapterId = req.params.chapterId;
    const chapterUrl = `https://asuratoon.com/${chapterId}`;

    try {
        // Scrape chapter data
        const chapterData = await scrapeChapterDataFromUrl(chapterUrl, mangaId);

        res.json(chapterData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chapter data' });
    }
});


app.get('/scrape/:animeId', async (req, res) => {
  const animeId = req.params.animeId;
  try {
    const scrapedData = await scrapeMangaDetailsWithChapters({ id: animeId });
    res.json(scrapedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape anime details and episodes.' });
  }
});





app.get('/search', async (req, res) => {
  try {
    const keyw = req.query.keyw;
    const page = req.query.page;

    const data = await scrapeSearch({ keyw: keyw, page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/getRecentlyAdded', async (req, res) => {
  try {
    const page = req.query.page;
    const data = await scrapeRecentlyAdded({ page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/getOngoingSeries', async (req, res) => {
  try {
    const page = req.query.page;
    const data = await scrapeOngoingSeries({ page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});


app.get('/searchPage', async (req, res) => {
  try {
    const keyw = req.query.keyw;
    const page = req.query.page;

    const data = await scrapeSearchPage({ keyw: keyw, page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/genrePage', async (req, res) => {
  try {
    const genre = req.query.genre;
    const page = req.query.page;

    const data = await scrapeGenrePage({ genre: genre, page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/anime-AZ-page', async (req, res) => {
  try {
    const aph = req.query.aph
    const page = req.query.page;

    const data = await scrapeAnimeAZPage({ aph: aph, page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/anime-list-page', async (req, res) => {
  try {
    const page = req.query.page;

    const data = await scrapeAnimeListPage({ page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/animeList', async (req, res) => {
  try {
    const page = req.query.page;

    const data = await scrapeAnimeList({ page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/animeListAZ', async (req, res) => {
  try {
    const aph = req.query.aph;
    const page = req.query.page;

    const data = await scrapeAnimeAZ({ aph: aph, page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/popularPage', async (req, res) => {
  try {
    const page = req.query.page;

    const data = await scrapePopularPage({ page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/newSeasonPage', async (req, res) => {
  try {
    const page = req.query.page;

    const data = await scrapeNewSeasonPage({ page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/completedPage', async (req, res) => {
  try {
    const page = req.query.page;

    const data = await scrapeCompletedPage({ page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/ongoingPage', async (req, res) => {
  try {
    const page = req.query.page;

    const data = await scrapeOngoingPage({ page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/moviePage', async (req, res) => {
  try {
    const page = req.query.page;

    const data = await scrapeMoviePage({ page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/subCategoryPage', async (req, res) => {
  try {
    const page = req.query.page;
    const subCategory = req.query.subCategory;

    const data = await scrapeSubCategoryPage({ page: page, subCategory: subCategory });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/recent-release-page', async (req, res) => {
  try {
    const page = req.query.page;
    const type = req.query.type;

    const data = await scrapeRecentPage({ page: page, type: type });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/recent-release', async (req, res) => {
  try {
    const page = req.query.page;
    const type = req.query.type;

    const data = await scrapeRecentRelease({ page: page, type: type });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/new-season', async (req, res) => {
  try {
    const page = req.query.page;

    const data = await scrapeNewSeason({ page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/ongoing-anime', async (req, res) => {
  try {
    const page = req.query.page;

    const data = await scrapeOngoingAnime({ page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/completed-anime', async (req, res) => {
  try {
    const page = req.query.page;

    const data = await scrapeCompletedAnime({ page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});


app.get('/popular', async (req, res) => {
  try {
    const page = req.query.page;

    const data = await scrapePopularAnime({ page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/anime-movies', async (req, res) => {
  try {
    const page = req.query.page;
    const alphabet = req.query.aph;

    const data = await scrapeAnimeMovies({ page: page, aph: alphabet });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).send({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/top-airing', async (req, res) => {
  try {
    const page = req.query.page;

    const data = await scrapeTopAiringAnime({ page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).send({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/season/:season', async (req, res) => {
  try {
    const page = req.query.page;
    const season = req.params.season;

    const data = await scrapeSeason({ page: page, season: season });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).send({
      status: 500,
      error: 'Internal Error',
      message: err, php
    });
  }
});

app.get('/genre/:genre', async (req, res) => {
  try {
    const genre = req.params.genre;
    const page = req.query.page;

    const data = await scrapeGenre({ genre: genre, page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).send({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/getAnime/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const data = await scrapeAnimeDetails({ id: id });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/fembed/watch/:id', async (req, res) => {
  try {
    const id = req.params.id;

    //const data = await scrapeFembed({ id: id });

    res.status(410).json({ message: 'Deprecated' });
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});


app.get('/getEpisode/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const data = await scrapeWatchAnime({ id: id });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});





app.get('/thread/:episodeId', async (req, res) => {
  try {
    const episodeId = req.params.episodeId;
    const page = req.query.page;

    const data = await scrapeThread({ episodeId: episodeId, page: page });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/download-links/:episodeId', async (req, res) => {
  try {
    const episodeId = req.params.episodeId;

    //const data = await scrapeDownloadLinks({ episodeId: episodeId });

    res.status(410).json({ message: 'Deprecated' });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.get('/download', async (req, res) => {
  try {
    const downloadLink = req.rawHeaders.find(
      (x) => x.includes('https://') && x.includes('.mp4')
    );

    if (!downloadLink) {
      return res.status(400).json({
        error: 'No downloadLink provided. Make sure to add the downloadLink in the headers.',
      });
    }

    await axios
      .get(downloadLink, {
        headers: { Referer: DownloadReferer },
        responseType: 'stream',
      })
      .then((stream) => {
        return new Promise((r, j) => {
          res.writeHead(200, {
            ...stream.headers,
          });
          stream.data.pipe(res);
        });
      });

    return res.status(200).json('Done Downloading.');
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: 500,
      error: 'Internal Error',
      message: err,
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    status: 404,
    error: 'Not Found',
  });
});




app.listen(port, () => {
  console.log('Express server listening on port %d in %s mode', port, app.settings.env);
});
