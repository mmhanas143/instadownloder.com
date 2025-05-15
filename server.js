const express = require('express');
const path = require('path');
const instagramGetUrl = require('instagram-url-direct');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
console.log(`Serving static files from: ${path.join(__dirname, 'public')}`);

app.get('/api/fetch-instagram-media', async (req, res) => {
    const instagramPostUrl = req.query.url;
    console.log(`API Call: /api/fetch-instagram-media, URL: ${instagramPostUrl}`);

    if (!instagramPostUrl) {
        console.log('API Error: Instagram URL is required.');
        return res.status(400).json({ success: false, message: 'Instagram URL is required.' });
    }

    try {
        const results = await instagramGetUrl(instagramPostUrl);
        console.log('instagram-url-direct results:', results);

        if (results && results.url_list && results.url_list.length > 0) {
            const media_urls = results.url_list.map(url => {
                let type = 'unknown';
                if (url.includes('.mp4')) type = 'video';
                else if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp')) type = 'image';
                return { url, type };
            });
            console.log(`API Success: Media URLs found:`, media_urls);
            res.json({ success: true, message: 'Media links retrieved successfully!', media_urls });
        } else {
            console.log('API Info: No media found or unexpected result from library for URL:', instagramPostUrl);
            res.status(404).json({ success: false, message: 'Media not found. It might be private, deleted, or unsupported by the library.' });
        }
    } catch (error) {
        console.error(`API Error for URL ${instagramPostUrl}: ${error.name} - ${error.message}`);
        let userFriendlyMessage = 'An unknown error occurred while processing the link.';
        if (error.message) {
            if (error.message.toLowerCase().includes('not found') || error.message.toLowerCase().includes('unavailable')) {
                userFriendlyMessage = 'Post not found, it may be private or deleted.';
            } else if (error.message.toLowerCase().includes('private post')) { // Specific check for private post if library provides it
                userFriendlyMessage = 'This seems to be a private post. Private posts cannot be downloaded.';
            } else if (error.message.toLowerCase().includes('login required')){
                 userFriendlyMessage = 'This content may require login or is restricted.';
            }
             else {
                userFriendlyMessage = `Error processing link. Please check the URL or try again.`;
            }
        }
        res.status(500).json({ success: false, message: userFriendlyMessage });
    }
});

app.get('*', (req, res) => {
    console.log(`Fallback: Serving index.html for ${req.url}`);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Ensure "public" folder and "public/icons" folder (with icons) exist correctly.');
});
