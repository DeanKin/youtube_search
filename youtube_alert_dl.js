// youtube_alert_dl.js for download the txt only
require("dotenv").config({ path: ".env.local" });
const { google } = require("googleapis");
const fs = require('fs'); // Import the fs module
const youtube = google.youtube("v3");
const sendEmail = require("./api/sendemail/sendEmail"); // Import sendEmail

// Validate environment variables
if (!process.env.YOUTUBE_API_KEY) {
  console.error("Error: YOUTUBE_API_KEY is not set in .env.local file");
  process.exit(1);
}

if (!process.env.SEARCH_KEYWORDS) {
  console.error("Error: SEARCH_KEYWORDS is not set in .env.local file");
  process.exit(1);
}

const API_KEY = process.env.YOUTUBE_API_KEY;
const KEYWORDS = process.env.SEARCH_KEYWORDS.split(",").map((k) => k.trim());
//const KEYWORDS = "香港大學醫學院".split(",").map((k) => k.trim());
const DAYS_AGO = parseInt(process.env.DAYS_AGO) || 7;

// Validate API key and keywords
if (API_KEY.length < 10) {
  console.error("Error: YOUTUBE_API_KEY appears to be invalid");
  process.exit(1);
}

if (KEYWORDS.length === 0) {
  console.error("Error: No search keywords provided");
  process.exit(1);
}

async function searchYouTubeVideos() {
   //const now = new Date();
   //const pastDate = new Date(now.setDate(now.getDate() - DAYS_AGO));
  const now = new Date("2025-03-06");//to
  const pastDate = new Date("2025-03-01");//from

  const publishedAfter = pastDate.toISOString();
  const publishedBefore = now.toISOString();//new add
  const results = [];

  try {
    for (const keyword of KEYWORDS) {
      let nextPageToken = null;
      let totalResults = 0;

      do {
        const response = await youtube.search.list({
          key: API_KEY,
          part: "snippet",
          q: keyword,
          type: "video",
          order: "date",
          publishedAfter: publishedAfter,
          publishedBefore: publishedBefore,
          maxResults: 100, // Use 50 to minimize API quota usage
          pageToken: nextPageToken, // Pass the page token for pagination
        });

        // Process the current page of results
        response.data.items.forEach((item) => {
          const videoId = item.id.videoId;
          if (!results.some((result) => result.videoId === videoId)) {
            const title = item.snippet.title;
            const url = `https://www.youtube.com/watch?v=${videoId}`;
            const publishedAt = new Date(item.snippet.publishedAt);
            const formattedDate = publishedAt.toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZoneName: "short",
            });

            results.push({
              videoId,
              title,
              url,
              publishedDate: formattedDate,
              channel: item.snippet.channelTitle,
              description: item.snippet.description.substring(0, 500) + "...",
            });
          }
        });

        // Update the nextPageToken and totalResults
        nextPageToken = response.data.nextPageToken;
        totalResults += response.data.items.length;

        console.log(`Fetched ${totalResults} results for keyword: ${keyword}`);
      } while (nextPageToken); // Continue until there are no more pages
    }

    return results; // Return all results
  } catch (error) {
    console.error("Error occurred:", error.message);
    if (error.response) {
      console.error("API response error:", error.response.data);
    }
    throw error; // Propagate error to catch block
  }
}

// Execute search and send email
searchYouTubeVideos()
  .then((results) => {
    const startDate = new Date(
      new Date().setDate(new Date().getDate() - DAYS_AGO)
    )
      .toISOString()
      .split("T")[0];
    const endDate = new Date().toISOString().split("T")[0];

    // Format search results for email
    let searchResults = ``;
    results.forEach((video, index) => {
      searchResults += ` ${index + 1}. Title: ${video.title} \n`;
      searchResults += `   URL: ${video.url} \n`;
      searchResults += `   Published: ${video.publishedDate} \n`;
      searchResults += `   Channel: ${video.channel} \n`;
      searchResults += `   Description: ${video.description} \n\n`;
    });
    //console.log(`searchResults ${searchResults}`);


    // Write search results to a text file
    fs.writeFile("youtube_search_results.txt", searchResults, (err) => {
      if (err) {
        console.error("Error writing to file:", err);
      } else {
        console.log(
          "Search results successfully written to youtube_search_results.txt"
        );
      }
    });

    // Send email
    // return sendEmail({
    //     receiverEmail: "deanltk@hku.hk",
    //     templateId: "3895227",
    //     systemId: "YOUTUBE_ALERT",
    //     substitutionVars: {
    //         '[CUSTOMFIELD1]': startDate,
    //         '[CUSTOMFIELD2]': endDate,
    //         '[CUSTOMFIELD4]': KEYWORDS.join(', '),
    //         //'CUSTOMFIELD3': 'TEST_SEARCH_RESULTS'
    //         '[CUSTOMFIELD3]': searchResults || 'No videos found.'
    //     },

    //     cc: ["jatsang@hku.hk"],
    //     language: 'zh-hk'
    // });
  })
  .then(console.log) // Log success
  .catch(console.error); // Log errors
