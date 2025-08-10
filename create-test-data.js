const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://devs:jCnk171cE8LqVt9m@dev.3btug.mongodb.net/';
const dbName = 'test'; // Assuming default database name

async function createTestData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const gymAccessCollection = db.collection('gymaccesses');
    
    // Create test access record for today
    const today = new Date();
    const accessDay = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const testAccess = {
      clientId: new require('mongodb').ObjectId(),
      cedula: '12345678',
      accessDate: today,
      accessDay: accessDay,
      successful: true,
      clientName: 'Cliente Prueba',
      createdAt: today,
      updatedAt: today
    };
    
    const result = await gymAccessCollection.insertOne(testAccess);
    console.log('Test access record created:', result.insertedId);
    
    // Create a few more test records
    const moreTestData = [
      {
        clientId: new require('mongodb').ObjectId(),
        cedula: '87654321',
        accessDate: today,
        accessDay: accessDay,
        successful: true,
        clientName: 'María García',
        createdAt: today,
        updatedAt: today
      },
      {
        clientId: new require('mongodb').ObjectId(),
        cedula: '11111111',
        accessDate: today,
        accessDay: accessDay,
        successful: false,
        reason: 'Cliente no encontrado',
        clientName: 'Cliente Inexistente',
        createdAt: today,
        updatedAt: today
      }
    ];
    
    const bulkResult = await gymAccessCollection.insertMany(moreTestData);
    console.log('Additional test records created:', bulkResult.insertedIds);
    
    console.log('Test data created successfully!');
    
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await client.close();
  }
}

createTestData();