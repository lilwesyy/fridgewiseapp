// MongoDB initialization script
db = db.getSiblingDB('fridgewise');

// Create a user for the application
db.createUser({
  user: 'fridgewise_user',
  pwd: 'fridgewise_password',
  roles: [
    {
      role: 'readWrite',
      db: 'fridgewise'
    }
  ]
});

// Create collections with some basic structure
db.createCollection('users');
db.createCollection('recipes');
db.createCollection('analyses');

print('Database initialized successfully');