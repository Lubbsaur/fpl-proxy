import express from "express";
import cors from "cors";
import https from "https";

const app = express();
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 4000;
const FPL_API = "https://fantasy.premierleague.com/api";

app.use(cors());

app.get("/api/fpl/:endpoint(*)", (req, res) => {
  const apiUrl = `${FPL_API}/${req.params.endpoint}`;
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
});