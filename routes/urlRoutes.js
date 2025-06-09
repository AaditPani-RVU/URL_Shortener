const express = require('express');
const router = express.Router();
const shortid = require('shortid');
const validUrl = require('valid-url');
const { body, validationResult } = require('express-validator');
const Url = require('../models/url');

const baseUrl = process.env.BASE_URL || 'http://localhost:5000'; // fallback

// POST /api/shorten
router.post(
  '/shorten',
  [
    body('originalUrl')
      .notEmpty()
      .withMessage('originalUrl is required')
      .bail()
      .isURL({ require_protocol: true })
      .withMessage('Invalid URL format')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { originalUrl } = req.body;

    try {
      // Check if URL already exists
      let url = await Url.findOne({ originalUrl });

      if (url) {
        return res.json({
          originalUrl: url.originalUrl,
          shortUrl: `${baseUrl}/${url.shortCode}`,
          shortCode: url.shortCode,
          date: url.date,
          clicks: url.clicks,
        });
      }

      // Generate a new shortCode
      let shortCode;
      do {
        shortCode = shortid.generate();
      } while (await Url.findOne({ shortCode })); // avoid collisions

      // Expiration (7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create and save
      url = new Url({
        originalUrl,
        shortCode,
        date: new Date(),
        clicks: 0,
        expiresAt,
      });

      await url.save();

      res.status(201).json({
        originalUrl,
        shortUrl: `${baseUrl}/${shortCode}`,
        shortCode,
        date: url.date,
        clicks: url.clicks,
        expiresAt,
      });
    } catch (err) {
      console.error('Error in POST /shorten:', err);
      res.status(500).json({ error: 'Server error while shortening URL' });
    }
  }
);

// GET /:shortCode — Redirect to original URL
router.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;

    const url = await Url.findOne({ shortCode });

    if (!url) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    // Expiration check
    if (url.expiresAt && new Date() > url.expiresAt) {
      return res.status(410).json({ error: 'Short URL has expired' });
    }

    // Increment click count
    url.clicks++;
    await url.save();

    return res.redirect(url.originalUrl);
  } catch (err) {
    console.error('Error in GET /:shortCode:', err);
    res.status(500).json({ error: 'Server error during redirect' });
  }
});

module.exports = router;
