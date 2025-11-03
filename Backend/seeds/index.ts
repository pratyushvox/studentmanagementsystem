import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedSubjects } from "./seeders/subjectSeeder.js"; // Add .js extension
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

const runSeeders = async () => {
  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI!);
    console.log("✅ Connected to MongoDB\n");
    console.log("=".repeat(60));
    console.log();

    // Run seeders
    await seedSubjects();

    console.log();
    console.log("=".repeat(60));
    console.log("\n🎉 All seeders completed successfully!");
    
    // Disconnect
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    
    process.exit(0);
  } catch (error: any) {
    console.error("\n💥 Seeding failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run seeders
runSeeders();