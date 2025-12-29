const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const TARGET_URL = "https://www.fullmatch-hd.com/matches-today/";

async function scrapeTodayMatches() {
  const { data: html } = await axios.get(TARGET_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 15000,
  });

  const matchBlocks = html.match(/<div class="AY_Match[\s\S]*?<\/div><\/div><\/div>/g) || [];
  const matches = matchBlocks.map(block => {
    const team1Name = /<div class="TM1">[\s\S]*?<div class="TM_Name">([\s\S]*?)<\/div>/i.exec(block)?.[1]?.trim() || null;
    const team1Logo = /<div class="TM1">[\s\S]*?<img[^>]*(?:data-src|src)="([^"]+)"/i.exec(block)?.[1]?.trim() || null;

    const team2Name = /<div class="TM2">[\s\S]*?<div class="TM_Name">([\s\S]*?)<\/div>/i.exec(block)?.[1]?.trim() || null;
    const team2Logo = /<div class="TM2">[\s\S]*?<img[^>]*(?:data-src|src)="([^"]+)"/i.exec(block)?.[1]?.trim() || null;

    const time = /<span class='MT_Time'>([\s\S]*?)<\/span>/i.exec(block)?.[1]?.trim() || null;
    const status = /<div class='MT_Stat'>([\s\S]*?)<\/div>/i.exec(block)?.[1]?.trim() || null;
    const result = /<span class="MT_Result">[\s\S]*?<span class="RS-goals">([\s\S]*?)<\/span>[\s\S]*?<span class="RS-goals">([\s\S]*?)<\/span>/i.exec(block)
      ?.slice(1, 3)
      .join("-") || "0";

    const info = block.match(/<div class="MT_Info">[\s\S]*?<ul>([\s\S]*?)<\/ul>/i)?.[1] || "";
    const channel = /<li><span>([\s\S]*?)<\/span><\/li>/i.exec(info)?.[1]?.trim() || null;
    const commentator = /<li><span>[\s\S]*?<\/span><\/li>/g.exec(info)?.[2]?.trim() || "غير معروف";
    let league = /<li><span>([\s\S]*?)<\/span><\/li>/g.exec(info)?.[3]?.trim() || null;
    if (league) league = `🏆 ${league}`;

    return {
      team1: { name: team1Name, logo: team1Logo },
      team2: { name: team2Name, logo: team2Logo },
      time,
      status,
      result,
      channel,
      commentator,
      league,
    };
  });

  return matches;
}

app.get("/api/today-matches", async (req, res) => {
  try {
    const data = await scrapeTodayMatches();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch matches", error: err.message });
  }
});

app.get("/", (req, res) => res.send("⚽ Matric API is running"));

module.exports = app;
