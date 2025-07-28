// MongoDB initialization script
db = db.getSiblingDB('fridgewiseai');

// Create a user for the application
db.createUser({
  user: 'fridgewiseai_user',
  pwd: 'fridgewiseai_password',
  roles: [
    {
      role: 'readWrite',
      db: 'fridgewiseai'
    }
  ]
});

// Create collections with some basic structure
db.createCollection('users');
db.createCollection('recipes');
db.createCollection('analyses');

print('Database initialized successfully');