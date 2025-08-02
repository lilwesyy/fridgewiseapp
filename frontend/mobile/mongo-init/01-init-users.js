// MongoDB Initialization Script for FridgeWiseAI
// This script creates the application database and user

// Switch to the fridgewiseai database
db = db.getSiblingDB('fridgewiseai');

// Create application user with read/write permissions
db.createUser({
  user: 'fridgewiseai_app',
  pwd: 'FridgeWiseAI_App_User_2025_P@ssw0rd!',
  roles: [
    {
      role: 'readWrite',
      db: 'fridgewiseai'
    }
  ]
});

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'createdAt'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string',
          minLength: 8
        },
        name: {
          bsonType: 'string'
        },
        avatar: {
          bsonType: 'string'
        },
        preferences: {
          bsonType: 'object'
        },
        dietaryRestrictions: {
          bsonType: 'array'
        },
        createdAt: {
          bsonType: 'date'
        },
        updatedAt: {
          bsonType: 'date'
        }
      }
    }
  }
});

db.createCollection('recipes', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'ingredients', 'instructions', 'userId', 'createdAt'],
      properties: {
        title: {
          bsonType: 'string',
          minLength: 1
        },
        ingredients: {
          bsonType: 'array',
          minItems: 1
        },
        instructions: {
          bsonType: 'array',
          minItems: 1
        },
        userId: {
          bsonType: 'objectId'
        },
        images: {
          bsonType: 'array'
        },
        tags: {
          bsonType: 'array'
        },
        difficulty: {
          bsonType: 'string',
          enum: ['easy', 'medium', 'hard']
        },
        cookingTime: {
          bsonType: 'int',
          minimum: 1
        },
        servings: {
          bsonType: 'int',
          minimum: 1
        },
        rating: {
          bsonType: 'double',
          minimum: 0,
          maximum: 5
        },
        createdAt: {
          bsonType: 'date'
        },
        updatedAt: {
          bsonType: 'date'
        }
      }
    }
  }
});

db.createCollection('ingredients', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'userId', 'createdAt'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1
        },
        userId: {
          bsonType: 'objectId'
        },
        category: {
          bsonType: 'string'
        },
        expirationDate: {
          bsonType: 'date'
        },
        quantity: {
          bsonType: 'string'
        },
        unit: {
          bsonType: 'string'
        },
        image: {
          bsonType: 'string'
        },
        createdAt: {
          bsonType: 'date'
        },
        updatedAt: {
          bsonType: 'date'
        }
      }
    }
  }
});

db.createCollection('cooking_sessions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['recipeId', 'userId', 'status', 'createdAt'],
      properties: {
        recipeId: {
          bsonType: 'objectId'
        },
        userId: {
          bsonType: 'objectId'
        },
        status: {
          bsonType: 'string',
          enum: ['started', 'in_progress', 'completed', 'abandoned']
        },
        photos: {
          bsonType: 'array'
        },
        notes: {
          bsonType: 'string'
        },
        rating: {
          bsonType: 'double',
          minimum: 0,
          maximum: 5
        },
        createdAt: {
          bsonType: 'date'
        },
        completedAt: {
          bsonType: 'date'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'createdAt': 1 });

db.recipes.createIndex({ 'userId': 1 });
db.recipes.createIndex({ 'title': 'text', 'ingredients': 'text' });
db.recipes.createIndex({ 'tags': 1 });
db.recipes.createIndex({ 'createdAt': -1 });
db.recipes.createIndex({ 'rating': -1 });

db.ingredients.createIndex({ 'userId': 1 });
db.ingredients.createIndex({ 'name': 1 });
db.ingredients.createIndex({ 'expirationDate': 1 });
db.ingredients.createIndex({ 'category': 1 });

db.cooking_sessions.createIndex({ 'userId': 1 });
db.cooking_sessions.createIndex({ 'recipeId': 1 });
db.cooking_sessions.createIndex({ 'status': 1 });
db.cooking_sessions.createIndex({ 'createdAt': -1 });

print('FridgeWiseAI database initialized successfully!');
print('Created collections: users, recipes, ingredients, cooking_sessions');
print('Created indexes for optimal performance');
print('Application user created: fridgewiseai_app');