const express = require('express');
const path = require('path');
const instagramGetUrl = require('instagram-url-direct');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint
app.get('/api/fetch-instagram-media', async (req, res) => {
    const instagramPostUrl = req.query.url;

    if (!instagramPostUrl) {
        return res.status(400).json({ success: false, message: 'Instagram URL is required.' });
    }
    console.log(`Processing Instagram link: ${instagramPostUrl}`);

    try {
        const results = await instagramGetUrl(instagramPostUrl);
        if (results && results.url_list && results.url_list.length > 0) {
            const media_urls = results.url_list.map(url => {
                let type = 'unknown';
                if (url.includes('.mp4')) type = 'video';
                else if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp')) type = 'image';
                return { url, type };
            });
            console.log(`Media URLs found:`, media_urls);
            res.json({ success: true, message: 'Media links retrieved successfully!', media_urls });
        } else {
            console.error('No URL found or unexpected result:', results);
            res.status(404).json({ success: false, message: 'Media not found. It might be private, deleted, or unsupported.' });
        }
    } catch (error) {
        console.error('Error fetching media link:', error.name, error.message);
        let userFriendlyMessage = 'An unknown error occurred while processing the link.';
        if (error.message && error.message.toLowerCase().includes('not found')) {
            userFriendlyMessage = 'Post not found or it is from a private account.';
        } else if (error.message && error.message.toLowerCase().includes('private')) {
            userFriendlyMessage = 'This seems to be a private post. Private posts cannot be downloaded.';
        } else if (error.message) {
            userFriendlyMessage = `An error occurred. Please try another link.`;
        }
        res.status(500).json({ success: false, message: userFriendlyMessage });
    }
});

// Fallback for SPA: serve index.html for any other GET request not handled by static or API
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Access frontend at: http://localhost:${PORT}`);
});