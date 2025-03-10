// youtube_alert.js
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const youtube = google.youtube('v3');
const sendEmail = require('./api/sendemail/sendEmail'); // Import sendEmail

// Validate environment variables
if (!process.env.YOUTUBE_API_KEY) {
    console.error('Error: YOUTUBE_API_KEY is not set in .env.local file');
    process.exit(1);
}

if (!process.env.SEARCH_KEYWORDS) {
    console.error('Error: SEARCH_KEYWORDS is not set in .env.local file');
    process.exit(1);
}

const API_KEY = process.env.YOUTUBE_API_KEY;
const KEYWORDS = process.env.SEARCH_KEYWORDS.split(',').map(k => k.trim());
const DAYS_AGO = parseInt(process.env.DAYS_AGO) || 7;

// Validate API key and keywords
if (API_KEY.length < 10) {
    console.error('Error: YOUTUBE_API_KEY appears to be invalid');
    process.exit(1);
}

if (KEYWORDS.length === 0) {
    console.error('Error: No search keywords provided');
    process.exit(1);
}

async function searchYouTubeVideos() {
    const now = new Date();
    const pastDate = new Date(now.setDate(now.getDate() - DAYS_AGO));
    const publishedAfter = pastDate.toISOString();
    const results = [];

    try {
        for (const keyword of KEYWORDS) {
            const response = await youtube.search.list({
                key: API_KEY,
                part: 'snippet',
                q: keyword,
                type: 'video',
                order: 'date',
                publishedAfter: publishedAfter,
                maxResults: 50 //max for api
            });

            response.data.items.forEach(item => {
                const videoId = item.id.videoId;
                if (!results.some(result => result.videoId === videoId)) {
                    const title = item.snippet.title;
                    const url = `https://www.youtube.com/watch?v=${videoId}`;
                    const publishedAt = new Date(item.snippet.publishedAt);
                    const formattedDate = publishedAt.toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZoneName: 'short'
                    });

                    results.push({
                        videoId,
                        title,
                        url,
                        publishedDate: formattedDate,
                        channel: item.snippet.channelTitle,
                        description: item.snippet.description.substring(0, 100) + '...'
                    });
                }
            });
        }
        return results; // Return results for email
    } catch (error) {
        console.error('Error occurred:', error.message);
        if (error.response) {
            console.error('API response error:', error.response.data);
        }
        throw error; // Propagate error to catch block
    }
}

// Execute search and send email
searchYouTubeVideos()
    .then(results => {
        const startDate = new Date(new Date().setDate(new Date().getDate() - DAYS_AGO))
            .toISOString().split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];

        // Format search results for email
        let searchResults = ``;
         results.forEach((video, index) => {
             searchResults += `&lt;br/&gt; ${index + 1}. Title: ${video.title} &lt;br/&gt;`;
             searchResults += `   URL: ${video.url} &lt;br/&gt;`;
             searchResults += `   Published: ${video.publishedDate} &lt;br/&gt;`;
             searchResults += `   Channel: ${video.channel} &lt;br/&gt;`;
             searchResults += `   Description: ${video.description} &lt;br/&gt;`;
         });
        console.log(`searchResults ${searchResults}`)

        // Send email
        return sendEmail({
            receiverEmail: "alvin.kong@hku.hk",
            templateId: "4262396",
            systemId: "YOUTUBE_ALERT",
            substitutionVars: {
                '[CUSTOMFIELD1]': startDate,
                '[CUSTOMFIELD2]': endDate,
                '[CUSTOMFIELD4]': KEYWORDS.join(', '),
                //'CUSTOMFIELD3': 'TEST_SEARCH_RESULTS'
                '[CUSTOMFIELD3]': searchResults || '&lt;br/&gt; No videos found.'
            },
            
            cc: ["lamkay2@hku.hk", "san310@hku.hk", "ctyw@hku.hk", "katyw@hku.hk"],
            language: 'zh-hk'
        });
    })
    .then(console.log) // Log success
    .catch(console.error); // Log errors