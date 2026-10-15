
const dns = require("dns");
const mongoose = require("mongoose");
require("dotenv").config();

const resolver = new dns.Resolver();
resolver.setServers(["8.8.8.8", "8.8.4.4"]);

resolver.resolveSrv(
  "_mongodb._tcp.cluster0.cdfxxab.mongodb.net",
  async (err, records) => {
    if (err) {
      console.error("SRV lookup failed:", err.message);
      return;
    }

    console.log("SRV records found:", records.length);

    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000
      });
      console.log("MongoDB connected successfully");
      await mongoose.disconnect();
    } catch (error) {
      console.error("MongoDB connection failed:", error.message);
    }
  }
);
