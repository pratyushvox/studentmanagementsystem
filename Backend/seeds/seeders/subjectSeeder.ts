import mongoose from "mongoose";
import Subject from "../../src/models/Subject.js"; // Add .js
import User from "../../src/models/User.js"; // Add .js
import { bitSubjects } from "../data/subjects.js"; // Add .js

export const seedSubjects = async () => {
  try {
    console.log("🌱 Starting subject seeding process...\n");

    // Step 1: Find existing admin user
    console.log("👤 Looking for existing admin user...");
    const adminUser = await User.findOne({ role: "admin" });

    if (!adminUser) {
      throw new Error("❌ No admin user found! Please create one manually before seeding subjects.");
    }

    console.log(`✅ Found admin: ${adminUser.fullName} (${adminUser.email})\n`);

    // Step 2: Clear existing subjects
    const deleteResult = await Subject.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing subjects\n`);

    // Step 3: Add createdBy field to each subject
    const subjectsWithCreator = bitSubjects.map(subject => ({
      ...subject,
      createdBy: adminUser._id
    }));

    // Step 4: Insert subjects
    console.log("📚 Inserting subjects...");
    const inserted = await Subject.insertMany(subjectsWithCreator);
    console.log(`✅ Successfully seeded ${inserted.length} subjects!\n`);

    // Step 5: Show breakdown by semester
    console.log("📊 Subjects per semester:");
    for (let sem = 1; sem <= 8; sem++) {
      const semesterSubjects = inserted.filter((s) => s.semester === sem);
      const totalCredits = semesterSubjects.reduce((sum, s) => sum + s.credits, 0);
      console.log(`   Semester ${sem}: ${semesterSubjects.length} courses (${totalCredits} credits)`);
      
      semesterSubjects.forEach(s => {
        console.log(`      - ${s.code}: ${s.name} (${s.credits} cr)`);
      });
      console.log();
    }

    // Step 6: Summary statistics
    const totalCredits = inserted.reduce((sum, s) => sum + s.credits, 0);
    const activeCount = inserted.filter(s => s.isActive).length;
    
    console.log("📈 Summary:");
    console.log(`   Total Subjects: ${inserted.length}`);
    console.log(`   Active Subjects: ${activeCount}`);
    console.log(`   Total Credits: ${totalCredits}`);
    console.log(`   Average Credits per Semester: ${(totalCredits / 8).toFixed(1)}`);

    return inserted;
  } catch (error: any) {
    console.error("❌ Error seeding subjects:", error.message);
    throw error;
  }
};