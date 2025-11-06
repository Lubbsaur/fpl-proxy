import express from "express";
import cors from "cors";
import https from "https";

const app = express();
const PORT = process.env.PORT || 4000;
const FPL_API = "https://fantasy.premierleague.com/api";

app.use(cors());

app.get("/api/fpl/*", (req, res) => {
  try {
    const endpoint = req.params[0];
    const apiUrl = `${FPL_API}/${endpoint}`;
    console.log("Proxying to:", apiUrl);

    const options = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
        "Accept": "application/json,text/html;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    };

    https
      .get(apiUrl, options, (proxyRes) => {
        let data = "";

        proxyRes.on("data", (chunk) => (data += chunk));
        proxyRes.on("end", () => {
          res
            .status(proxyRes.statusCode || 200)
            .setHeader("Content-Type", "application/json")
            .send(data);
        });
      })
      .on("error", (err) => {
        console.error("Proxy error:", err.message);
        res.status(502).json({ error: "Failed to fetch from FPL API" });
      });
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => console.log(`✅ Proxy running on port ${PORT}`));
