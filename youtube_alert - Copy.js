require('dotenv').config({ path: '.env.local' });
const express = require('express');
const { google } = require('googleapis');
const youtube = google.youtube('v3');
const sendEmail = require('./api/sendemail/sendEmail');

//const app = express();
//const PORT = process.env.PORT || 3020;

// Validate environment variables
if (!process.env.YOUTUBE_API_KEY || !process.env.SEARCH_KEYWORDS) {
    console.error('Missing required environment variables in .env.local');
    process.exit(1);
}

const API_KEY = process.env.YOUTUBE_API_KEY;
const KEYWORDS = process.env.SEARCH_KEYWORDS.split(',').map(k => k.trim());
const DAYS_AGO = parseInt(process.env.DAYS_AGO) || 7;

if (API_KEY.length < 10 || KEYWORDS.length === 0) {
    console.error('Invalid configuration parameters');
    process.exit(1);
}

async function searchYouTubeVideos() {
    const now = new Date();
    const pastDate = new Date(now.setDate(now.getDate() - DAYS_AGO));
    const results = [];
    const keywordList = KEYWORDS.join(', ');
    console.log(`30`);
    
    try {
        for (const keyword of KEYWORDS) {
            const response = await youtube.search.list({
                key: API_KEY,
                part: 'snippet',
                q: keyword,
                type: 'video',
                order: 'date',
                publishedAfter: pastDate.toISOString(),
                maxResults: 10
            });

            response.data.items.forEach(item => {
                if (!results.some(v => v.videoId === item.id.videoId)) {
                    results.push({
                        videoId: item.id.videoId,
                        title: item.snippet.title,
                        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                        published: new Date(item.snippet.publishedAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZoneName: 'short'
                        }),
                        channel: item.snippet.channelTitle
                    });
                }
            });
        }

        let customField3 = `Searching for videos with keyword(s): ${keywordList}\n---------------------------------------------------------------\n`;
        
        if (results.length > 0) {
            customField3 += results.map(video => 
                `• ${video.title}\n  Published: ${video.published}\n  Channel: ${video.channel}\n  URL: ${video.url}\n`
            ).join('\n');
        } else {
            customField3 += 'No video found';
        }

        const emailData = {
            receiverEmail: "medhsys1@hku.hk",
            templateId: "3895227",
            systemId: "YOUTUBE_ALERT",
            substitutionVars: {
                "[CUSTOMFIELD1]": pastDate.toISOString().split('T')[0],
                "[CUSTOMFIELD2]": now.toISOString().split('T')[0],
                "[CUSTOMFIELD3]": customField3
            },
            cc: ["medhsys2@hku.hk"],
            language: "en"
        };
        
        try {
            console.log('Attempting to send email with data:', JSON.stringify(emailData, null, 2));
            const result = await sendEmail(emailData);
            console.log('Email sent successfully:', result);
            return results;
        } catch (error) {
            console.error('Failed to send email:', error.message);
            console.error('Error details:', error);
            throw error; // Propagate the error instead of exiting
        }

    } catch (error) {
        console.error('Operation failed:', error);
        throw error;
    }
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Initial execution
    searchYouTubeVideos()
        .catch(error => console.error('Initial search failed:', error));
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});