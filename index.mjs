import dotenv from "dotenv";
dotenv.config({ path: `${process.cwd()}/.env` });
import express from "express";
import geoip from "geoip-lite";
import axios from "axios";

const app = express();


app.get("/", (req, res) => {
  res.send("HNG stage one task");
});

app.get("/api/hello", async (req, res) => {
  const { visitor_name } = req.query;
  const clientIp = req.ip.replace("::ffff:", "");
  const geo = geoip.lookup("104.28.219.97");
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.ll[0]}&longitude=${geo.ll[1]}&hourly=temperature_2m`;

  if(!visitor_name) {
    return res.status(400).json({
      status: 400,
      message: "Please provide visitor name",
    });
  }
  try {
    const result = await axios.get(url);
    const {hourly, hourly_units } = result.data;

    const temp = `${hourly.temperature_2m[0]} ${hourly_units.temperature_2m}`;
    return res.status(200).json({
      client_ip: clientIp,
      location: geo.city,
      greeting: `Hello ${visitor_name}, the temperature is ${temp} degrees Celsius in ${geo.city}`,
    });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    next(err);
  }
});

app.use("*", (req, res, next) => {
  const err = new Error("Not Found");
  err.statusCode = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: err.statusCode,
    message: err.message,
    stack: err.stack,
  });
});

const PORT = process.env.PORT || 5055;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
