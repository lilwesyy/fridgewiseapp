// MongoDB initialization script
db = db.getSiblingDB('fridgewiseai');

// Create users collection with indexes
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });

// Create recipes collection with indexes
db.createCollection('recipes');
db.recipes.createIndex({ userId: 1, createdAt: -1 });
db.recipes.createIndex({ dietaryTags: 1 });
db.recipes.createIndex({ language: 1 });

// Create analyses collection with indexes
db.createCollection('analyses');
db.analyses.createIndex({ userId: 1, createdAt: -1 });
db.analyses.createIndex({ status: 1 });

print('Database initialized with collections and indexes');