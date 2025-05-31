const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// OAuth login redirect
app.get('/api/login', (req, res) => {
  const redirect = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo`;
  res.redirect(redirect);
});

// OAuth callback → exchange code for access token
app.get('/api/callback', async (req, res) => {
  const code = req.query.code;

  const result = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    },
    { headers: { Accept: 'application/json' } }
  );

  const accessToken = result.data.access_token;
  res.redirect(`https://your-username.github.io/my-storage-app/?token=${accessToken}`);
});

// Upload encrypted file
app.post('/api/upload', async (req, res) => {
  const { token, path, content, message } = req.body;

  try {
    const result = await axios.put(
      `https://api.github.com/repos/your-username/encrypted-storage-data/contents/${path}`,
      {
        message,
        content,
      },
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    res.json(result.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Upload failed." });
  }
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
