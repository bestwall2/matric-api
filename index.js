const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/api/today-matches", async (req, res) => {
  try {
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.goto("https://www.fullmatch-hd.com/matches-today/", { waitUntil: "networkidle2" });

    const matches = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".AY_Match")).map(match => {
        const team1 = match.querySelector(".TM1 .TM_Name")?.textContent.trim() || null;
        const team2 = match.querySelector(".TM2 .TM_Name")?.textContent.trim() || null;
        const logo1 = match.querySelector(".TM1 img")?.getAttribute("data-src") || null;
        const logo2 = match.querySelector(".TM2 img")?.getAttribute("data-src") || null;
        const time = match.querySelector(".MT_Time")?.textContent.trim() || null;
        const status = match.querySelector(".MT_Stat")?.textContent.trim() || null;
        const result = Array.from(match.querySelectorAll(".RS-goals")).map(g => g.textContent.trim()).join("-");
        const info = match.querySelectorAll(".MT_Info li span");
        const channel = info[0]?.textContent.trim() || null;
        const commentator = info[1]?.textContent.trim() || "غير معروف";
        const league = info[2]?.textContent.trim() ? `🏆 ${info[2].textContent.trim()}` : null;

        return {
          team1: { name: team1, logo: logo1 },
          team2: { name: team2, logo: logo2 },
          time, status, result, channel, commentator, league
        };
      });
    });

    await browser.close();
    res.json({ success: true, count: matches.length, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/", (req, res) => res.send("⚽ Matric API is running"));

module.exports = app;
