// modules imported
const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const ejs = require("ejs");

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));

// database connection
mongoose.connect(
  "mongodb+srv://Gauravd:gauravd@cluster0.hbhwc24.mongodb.net/",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// prefered Schema
const CryptoData = mongoose.model("CryptoData", {
  name: String,
  last: Number,
  buy: Number,
  sell: Number,
  volume: Number,
  base_unit: String,
});

// fetching data from provided url
app.get("/fetch-data", async (req, res) => {
  try {
    const response = await axios.get("https://api.wazirx.com/api/v2/tickers");
    if (
      typeof response.data === "object" &&
      Object.keys(response.data).length > 0
    ) {
      const cryptoData = response.data;
      const top10Data = Object.values(cryptoData).slice(0, 10);
      await CryptoData.deleteMany({});
      await CryptoData.insertMany(top10Data);
      res.status(200).json({ top10Data });
    } else {
      res.status(500).json({
        error: "API response is empty or has an unexpected structure",
      });
    }
  } catch (error) {
    console.error("Error fetching and storing data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Actual data fetching on frontend as a listing
app.get("/", async (req, res) => {
  try {
    const data = await CryptoData.find({});
    const modifiedData = data.map((crypto) => ({
      ...crypto,
      name: crypto.name,
      last: `₹${crypto.last}`,
      buy: `₹${crypto.buy}`,
      sell: `₹${crypto.sell}`,
      volume: crypto.volume,
      base_unit: crypto.base_unit,
    }));

    res.render("index", { cryptoData: modifiedData });
  } catch (error) {
    console.error("Error fetching data from the database:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
