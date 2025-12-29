const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const TARGET_URL = "https://www.fullmatch-hd.com";

app.use(cors());
app.use(express.json());

async function scrapeTodayMatches() {
  const { data: html } = await axios.get(TARGET_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 15000,
  });

  const matches = [];

  // Match each AY_Match block (lazy, handles newlines)
  const ayalaRegex = /<div class="AY_Match[^>]*">([\s\S]*?)<\/a><\/div>/g;
  let matchBlock;

  while ((matchBlock = ayalaRegex.exec(html)) !== null) {
    const block = matchBlock[1];

    // Team 1
    const team1Name = /<div class="TM1">[\s\S]*?<div class="TM_Name">([\s\S]*?)<\/div>/.exec(block)?.[1]?.trim() || null;
    const team1Logo = /<div class="TM1">[\s\S]*?<img[^>]+(?:data-src|src)="([^"]+)"/.exec(block)?.[1]?.trim() || null;

    // Team 2
    const team2Name = /<div class="TM2">[\s\S]*?<div class="TM_Name">([\s\S]*?)<\/div>/.exec(block)?.[1]?.trim() || null;
    const team2Logo = /<div class="TM2">[\s\S]*?<img[^>]+(?:data-src|src)="([^"]+)"/.exec(block)?.[1]?.trim() || null;

    // Time
    const time = /<span class="MT_Time">([\s\S]*?)<\/span>/.exec(block)?.[1]?.trim() || null;

    // Status
    const status = /<div class="MT_Stat">([\s\S]*?)<\/div>/.exec(block)?.[1]?.trim() || null;

    // Result
    const result = /<span class="MT_Result">([\s\S]*?)<\/span>/.exec(block)?.[1]?.replace(/<[^>]+>/g, "").replace(/\s+/g, "") || null;

    // Info (channel, commentator, league)
    const infoMatches = [...block.matchAll(/<li><span>([^<]+)<\/span><\/li>/g)];
    const channel = infoMatches[0]?.[1]?.trim() || null;
    const commentator = infoMatches[1]?.[1]?.trim() || null;
    let league = infoMatches[2]?.[1]?.trim() || null;
    if (league) league = `🏆 ${league}`;

    matches.push({
      team1: { name: team1Name, logo: team1Logo },
      team2: { name: team2Name, logo: team2Logo },
      time,
      status,
      result,
      channel,
      commentator,
      league
    });
  }

  return matches;
}

/* =======================
   API ROUTES
======================= */

app.get("/api/today-matches", async (req, res) => {
  try {
    const data = await scrapeTodayMatches();
    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch matches",
      error: err.message
    });
  }
});

app.get("/", (req, res) => {
  res.send("⚽ Matric API is running");
});

/* 🔴 Vercel */
module.exports = app;
