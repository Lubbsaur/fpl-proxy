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

  https.get(apiUrl, (proxyRes) => {
    let data = "";

    proxyRes.on("data", (chunk) => (data += chunk));
    proxyRes.on("end", () => {
      res
        .status(proxyRes.statusCode || 200)
        .setHeader("Content-Type", "application/json")
        .send(data);
    });
  }).on("error", (err) => {
    res
      .status(502)
      .json({ error: "Failed to fetch from FPL API", details: err.message });
  });
});

app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
