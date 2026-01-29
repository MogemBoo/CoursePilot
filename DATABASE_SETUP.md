# Database Setup Guide

## MongoDB Collections Created

Your CoursePilot project now has the following MongoDB collections (models):

1. **Users** - Admin and student accounts
2. **CourseMaterials** - Course content (Theory & Lab) with metadata
3. **ChatSessions** - Conversational chat interface data
4. **GeneratedContent** - AI-generated learning materials
5. **ValidationResults** - Validation results for generated content
6. **HandwrittenNotes** - Digitized handwritten notes (Bonus Task 1)
7. **VideoSummaries** - Video summaries of course materials (Bonus Task 2)
8. **CommunityPosts** - Community discussion posts (Bonus Task 3)

## How to Inject Data into Database

You have **two options** to populate your database with sample data:

### Option 1: Using the API Route (Recommended for Quick Testing)

1. Start your server:
   ```bash
   node server.js
   ```

2. Make a POST request to the seed endpoint:
   ```bash
   # Using curl
   curl -X POST http://localhost:5000/api/seed

   # Or using Postman/Thunder Client
   POST http://localhost:5000/api/seed
   ```

### Option 2: Using the Seed Script Directly

1. Run the seed script:
   ```bash
   node scripts/seedData.js
   ```

## Sample Data Included

The seed script will create:

- **3 Users**: 1 admin, 2 students
- **8 Course Materials**: 4 Theory materials, 4 Lab materials
- **1 Chat Session**: Sample conversation with context
- **2 Generated Content**: 1 theory notes, 1 lab code
- **3 Validation Results**: Various validation types
- **1 Handwritten Note**: Sample digitized note
- **1 Video Summary**: Sample video summary
- **2 Community Posts**: Sample discussions with replies

## Important Notes

⚠️ **Warning**: The seed script will **DELETE all existing data** in these collections before inserting sample data. If you want to keep existing data, comment out the `deleteMany()` calls in `scripts/seedData.js`.

## Next Steps

After seeding:
- Test your API endpoints
- Verify data in MongoDB Atlas dashboard
- Start building your frontend to interact with these collections
- Implement the AI features (RAG, content generation, etc.)
