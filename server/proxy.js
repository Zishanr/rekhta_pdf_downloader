const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 4000;

app.get("/proxy", async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).json({ error: "Missing url parameter" });
    }

    try {
        const binary = req.query.binary === "1";
        const response = await axios.get(url, {
            responseType: binary ? "arraybuffer" : "text",
            headers: {
                Accept: req.headers.accept || "*/*",
                "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            },
        });

        if (response.headers["content-type"]) {
            res.set("Content-Type", response.headers["content-type"]);
        }
        res.set("Access-Control-Allow-Origin", "*");
        res.send(response.data);
    } catch (error) {
        res.status(502).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
});
