const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const TARGET_URL = "https://www.livesoccerhd.info/matches-today/";

app.use(cors());
app.use(express.json());

async function scrapeTodayMatches() {
  try {
    const { data: html } = await axios.get(TARGET_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 15000
    });

    const $ = cheerio.load(html);
    const matches = [];

    $(".AY_Match").each((_, match) => {
      const el = $(match);

      const team1 = {
        name: el.find(".TM1 .TM_Name").text().trim() || null,
        logo: el.find(".TM1 .TM_Logo img").attr("data-src") || null
      };

      const team2 = {
        name: el.find(".TM2 .TM_Name").text().trim() || null,
        logo: el.find(".TM2 .TM_Logo img").attr("data-src") || null
      };

      const time = el.find(".MT_Time").text().trim() || null;
      const status = el.find(".MT_Stat").text().trim() || null;
      const result = el.find(".MT_Result .RS-goals").map((i, g) => $(g).text()).get().join("-") || "0";

      const info = el.find(".MT_Info li span");
      const channel = info.eq(0).text().trim() || null;
      const commentator = info.eq(1).text().trim() || null;
      let league = info.eq(2).text().trim() || null;
      if (league) league = `🏆 ${league}`;

      matches.push({ team1, team2, time, status, result, channel, commentator, league });
    });

    return matches;

  } catch (err) {
    console.error("Scrape error:", err.message);
    return [];
  }
}

/* =======================
   API ROUTES
======================= */
app.get("/api/today-matches", async (req, res) => {
  const data = await scrapeTodayMatches();
  res.json({
    success: true,
    count: data.length,
    data
  });
});

app.get("/", (req, res) => {
  res.send("⚽ Matric API is running");
});

/* 🔴 For Vercel */
module.exports = app;

/* Local test */
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
