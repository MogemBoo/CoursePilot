const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('../models/User');
const CourseMaterial = require('../models/CourseMaterial');
const ChatSession = require('../models/ChatSession');
const GeneratedContent = require('../models/GeneratedContent');
const ValidationResult = require('../models/ValidationResult');
const HandwrittenNote = require('../models/HandwrittenNote');
const VideoSummary = require('../models/VideoSummary');
const CommunityPost = require('../models/CommunityPost');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://admin:admin@cluster0.spmmxwe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB for seeding");

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("🗑️  Clearing existing data...");
    await User.deleteMany({});
    await CourseMaterial.deleteMany({});
    await ChatSession.deleteMany({});
    await GeneratedContent.deleteMany({});
    await ValidationResult.deleteMany({});
    await HandwrittenNote.deleteMany({});
    await VideoSummary.deleteMany({});
    await CommunityPost.deleteMany({});

    // 1. Create Users
    console.log("👥 Creating users...");
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@coursepilot.com',
      passwordHash: 'hashed_password_here', // In production, use bcrypt
      role: 'admin'
    });

    const student1 = await User.create({
      username: 'student1',
      email: 'student1@coursepilot.com',
      passwordHash: 'hashed_password_here',
      role: 'student'
    });

    const student2 = await User.create({
      username: 'student2',
      email: 'student2@coursepilot.com',
      passwordHash: 'hashed_password_here',
      role: 'student'
    });

    console.log(`✅ Created ${await User.countDocuments()} users`);

    // 2. Create Course Materials (Theory & Lab)
    console.log("📚 Creating course materials...");
    const theoryMaterials = await CourseMaterial.insertMany([
      {
        title: 'Introduction to Data Structures',
        type: 'slide',
        category: 'Theory',
        link: 'https://example.com/slides/week1-intro.pdf',
        content: 'Introduction to fundamental data structures including arrays, linked lists, stacks, and queues. Covers time complexity analysis.',
        contentType: 'lecture_slide',
        metadata: {
          topic: 'Data Structures Basics',
          week: 1,
          tags: ['data-structures', 'arrays', 'linked-lists', 'fundamentals'],
          description: 'Week 1 lecture slides covering basic data structures'
        },
        uploadedBy: adminUser._id
      },
      {
        title: 'Binary Trees and Traversal',
        type: 'pdf',
        category: 'Theory',
        link: 'https://example.com/materials/binary-trees.pdf',
        content: 'Detailed explanation of binary trees, tree traversal algorithms (inorder, preorder, postorder), and tree operations.',
        contentType: 'textbook_chapter',
        metadata: {
          topic: 'Trees',
          week: 3,
          tags: ['trees', 'binary-trees', 'traversal', 'algorithms'],
          description: 'Comprehensive guide to binary trees'
        },
        uploadedBy: adminUser._id
      },
      {
        title: 'Graph Algorithms Overview',
        type: 'note',
        category: 'Theory',
        link: 'https://example.com/notes/graph-algorithms.md',
        content: 'Notes on graph representation, BFS, DFS, shortest path algorithms (Dijkstra, Bellman-Ford), and minimum spanning trees.',
        contentType: 'lecture_notes',
        metadata: {
          topic: 'Graphs',
          week: 5,
          tags: ['graphs', 'bfs', 'dfs', 'algorithms'],
          description: 'Lecture notes on graph algorithms'
        },
        uploadedBy: adminUser._id
      },
      {
        title: 'Sorting Algorithms Comparison',
        type: 'pdf',
        category: 'Theory',
        link: 'https://example.com/materials/sorting-algorithms.pdf',
        content: 'Comparison of various sorting algorithms: bubble sort, merge sort, quick sort, heap sort. Includes time and space complexity analysis.',
        contentType: 'textbook_chapter',
        metadata: {
          topic: 'Sorting',
          week: 2,
          tags: ['sorting', 'algorithms', 'complexity'],
          description: 'Detailed comparison of sorting algorithms'
        },
        uploadedBy: adminUser._id
      }
    ]);

    const labMaterials = await CourseMaterial.insertMany([
      {
        title: 'Lab 1: Array Operations',
        type: 'code',
        category: 'Lab',
        link: 'https://github.com/coursepilot/labs/lab1-array-operations',
        content: 'Implement basic array operations: insertion, deletion, search. Includes test cases and expected outputs.',
        contentType: 'lab_manual',
        metadata: {
          topic: 'Arrays',
          week: 1,
          tags: ['arrays', 'lab', 'python', 'exercises'],
          description: 'First lab assignment on array operations'
        },
        uploadedBy: adminUser._id
      },
      {
        title: 'Lab 2: Linked List Implementation',
        type: 'code',
        category: 'Lab',
        link: 'https://github.com/coursepilot/labs/lab2-linked-list',
        content: 'Implement a singly linked list with operations: insert, delete, search, reverse. Includes starter code and test suite.',
        contentType: 'lab_manual',
        metadata: {
          topic: 'Linked Lists',
          week: 2,
          tags: ['linked-lists', 'lab', 'python', 'data-structures'],
          description: 'Lab assignment on linked list implementation'
        },
        uploadedBy: adminUser._id
      },
      {
        title: 'Lab 3: Binary Search Tree',
        type: 'code',
        category: 'Lab',
        link: 'https://github.com/coursepilot/labs/lab3-bst',
        content: 'Implement a binary search tree with insert, delete, search, and traversal methods. Includes visualization requirements.',
        contentType: 'lab_manual',
        metadata: {
          topic: 'Trees',
          week: 3,
          tags: ['trees', 'bst', 'lab', 'python'],
          description: 'Lab assignment on binary search trees'
        },
        uploadedBy: adminUser._id
      },
      {
        title: 'Lab 4: Graph Traversal',
        type: 'code',
        category: 'Lab',
        link: 'https://github.com/coursepilot/labs/lab4-graph-traversal',
        content: 'Implement BFS and DFS algorithms for graph traversal. Includes graph representation and path finding.',
        contentType: 'lab_manual',
        metadata: {
          topic: 'Graphs',
          week: 5,
          tags: ['graphs', 'bfs', 'dfs', 'lab', 'python'],
          description: 'Lab assignment on graph traversal algorithms'
        },
        uploadedBy: adminUser._id
      }
    ]);

    console.log(`✅ Created ${theoryMaterials.length + labMaterials.length} course materials`);

    // 3. Create Chat Sessions
    console.log("💬 Creating chat sessions...");
    const chatSession1 = new ChatSession({
      userId: student1._id,
      messages: [
        {
          sender: 'user',
          text: 'What are the main data structures covered in week 1?',
          contextReferences: [{ materialId: theoryMaterials[0]._id, excerpt: 'Introduction to fundamental data structures...' }]
        },
        {
          sender: 'assistant',
          text: 'Week 1 covers arrays, linked lists, stacks, and queues. These are fundamental data structures that form the basis for more complex structures.',
          contextReferences: [{ materialId: theoryMaterials[0]._id }]
        },
        {
          sender: 'user',
          text: 'Can you explain binary trees?',
          contextReferences: [{ materialId: theoryMaterials[1]._id }]
        }
      ],
      context: {
        lastSearchQuery: 'binary trees',
        referencedMaterials: [theoryMaterials[0]._id, theoryMaterials[1]._id]
      }
    });
    await chatSession1.save();

    console.log(`✅ Created ${await ChatSession.countDocuments()} chat sessions`);

    // 4. Create Generated Content
    console.log("🤖 Creating generated content...");
    const generatedContent1 = await GeneratedContent.create({
      type: 'theory',
      format: 'notes',
      topic: 'Data Structures Overview',
      prompt: 'Generate comprehensive notes on data structures covered in week 1',
      content: '# Data Structures Overview\n\n## Arrays\nArrays are contiguous memory structures...\n\n## Linked Lists\nLinked lists consist of nodes...',
      sourceMaterials: [theoryMaterials[0]._id],
      validationStatus: 'validated',
      generatedBy: student1._id
    });

    const generatedContent2 = await GeneratedContent.create({
      type: 'lab',
      format: 'code',
      topic: 'Array Operations',
      prompt: 'Generate Python code for array insertion and deletion operations',
      content: 'def insert_element(arr, index, value):\n    """Insert element at given index"""\n    arr.insert(index, value)\n    return arr\n\ndef delete_element(arr, value):\n    """Delete first occurrence of value"""\n    if value in arr:\n        arr.remove(value)\n    return arr',
      sourceMaterials: [labMaterials[0]._id],
      programmingLanguage: 'Python',
      validationStatus: 'pending',
      generatedBy: student1._id
    });

    console.log(`✅ Created ${await GeneratedContent.countDocuments()} generated content items`);

    // 5. Create Validation Results
    console.log("✅ Creating validation results...");
    await ValidationResult.create([
      {
        generatedContentId: generatedContent1._id,
        validationType: 'grounding',
        status: 'pass',
        score: 95,
        details: 'Content is well-grounded in source materials. All key concepts match uploaded course materials.',
        timestamp: new Date()
      },
      {
        generatedContentId: generatedContent2._id,
        validationType: 'syntax',
        status: 'pass',
        score: 100,
        details: 'Python syntax is correct. Code follows PEP 8 style guidelines.',
        timestamp: new Date()
      },
      {
        generatedContentId: generatedContent2._id,
        validationType: 'test_case',
        status: 'pass',
        score: 90,
        details: 'All test cases passed. Functions work correctly for edge cases.',
        timestamp: new Date()
      }
    ]);

    console.log(`✅ Created ${await ValidationResult.countDocuments()} validation results`);

    // 6. Create Handwritten Notes (Bonus Task 1)
    console.log("✍️  Creating handwritten notes...");
    await HandwrittenNote.create({
      userId: student1._id,
      originalImagePath: '/uploads/handwritten/week1-notes.jpg',
      digitizedText: '# Week 1 Notes\n\n## Data Structures\n- Arrays: O(1) access\n- Linked Lists: O(n) search\n\n## Key Points\n- Memory allocation differs...',
      format: 'markdown',
      associatedMaterialId: theoryMaterials[0]._id,
      metadata: {
        course: 'Data Structures',
        topic: 'Introduction',
        week: 1
      }
    });

    console.log(`✅ Created ${await HandwrittenNote.countDocuments()} handwritten notes`);

    // 7. Create Video Summaries (Bonus Task 2)
    console.log("🎥 Creating video summaries...");
    await VideoSummary.create({
      courseMaterialId: theoryMaterials[0]._id,
      videoUrl: 'https://example.com/videos/week1-intro-summary.mp4',
      summaryText: 'This video summarizes week 1 lecture on data structures, covering arrays, linked lists, stacks, and queues with visual examples.',
      duration: 300, // 5 minutes
      metadata: {
        title: 'Week 1: Data Structures Introduction',
        description: 'Quick summary of fundamental data structures',
        thumbnailUrl: 'https://example.com/thumbnails/week1.jpg'
      }
    });

    console.log(`✅ Created ${await VideoSummary.countDocuments()} video summaries`);

    // 8. Create Community Posts (Bonus Task 3)
    console.log("📝 Creating community posts...");
    const communityPost1 = new CommunityPost({
      userId: student1._id,
      title: 'Help with Binary Tree Traversal',
      content: 'I\'m having trouble understanding the difference between inorder and preorder traversal. Can someone explain with an example?',
      tags: ['trees', 'traversal', 'help'],
      replies: [
        {
          userId: student2._id,
          content: 'Inorder: left-root-right, Preorder: root-left-right. Here\'s an example...',
          isBotReply: false
        },
        {
          userId: adminUser._id,
          content: 'Great question! Check out the course material on binary trees for detailed explanations.',
          isBotReply: false
        }
      ],
      botReplied: false,
      upvotes: 5,
      views: 23
    });
    await communityPost1.save();

    const communityPost2 = new CommunityPost({
      userId: student2._id,
      title: 'Lab 2 Submission Issue',
      content: 'My linked list implementation is failing one test case. The delete operation isn\'t working correctly for edge cases.',
      tags: ['lab', 'linked-lists', 'debugging'],
      replies: [
        {
          userId: adminUser._id,
          content: 'Make sure you handle the case when deleting the head node. Check your pointer updates.',
          isBotReply: false
        }
      ],
      botReplied: false,
      upvotes: 2,
      views: 15
    });
    await communityPost2.save();

    console.log(`✅ Created ${await CommunityPost.countDocuments()} community posts`);

    // Summary
    const summary = {
      users: await User.countDocuments(),
      courseMaterials: await CourseMaterial.countDocuments(),
      chatSessions: await ChatSession.countDocuments(),
      generatedContent: await GeneratedContent.countDocuments(),
      validationResults: await ValidationResult.countDocuments(),
      handwrittenNotes: await HandwrittenNote.countDocuments(),
      videoSummaries: await VideoSummary.countDocuments(),
      communityPosts: await CommunityPost.countDocuments()
    };

    console.log("\n📊 Seeding Summary:");
    console.log(JSON.stringify(summary, null, 2));
    console.log("\n✅ Database seeding completed successfully!");

    await mongoose.connection.close();
    return summary;

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    await mongoose.connection.close();
    throw error;
  }
}

// If running directly (not imported), execute the seed function
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("✅ Seed script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed script failed:", error);
      process.exit(1);
    });
}

module.exports = seedDatabase;
