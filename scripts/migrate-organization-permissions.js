const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym-db';

const DEFAULT_PERMISSIONS = [
  'client:create',
  'client:read',
  'client:update',
  'client:delete',
  'routine:create',
  'routine:read',
  'routine:update',
  'routine:delete',
  'plan:create',
  'plan:read',
  'plan:update',
  'plan:delete',
  'schedule:create',
  'schedule:read',
  'schedule:update',
  'schedule:delete',
  'exercise:create',
  'exercise:read',
  'exercise:update',
  'exercise:delete',
  'organization:admin'
];

async function migrateOrganizationPermissions() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const organizationsCollection = db.collection('organizations');

    // Find organizations without permissions field
    const organizationsWithoutPermissions = await organizationsCollection.find({
      permissions: { $exists: false }
    }).toArray();

    console.log(`Found ${organizationsWithoutPermissions.length} organizations without permissions`);

    // Update each organization with default permissions
    for (const org of organizationsWithoutPermissions) {
      await organizationsCollection.updateOne(
        { _id: org._id },
        { $set: { permissions: DEFAULT_PERMISSIONS } }
      );
      console.log(`Updated organization: ${org.name} with default permissions`);
    }

    // Also update organizations with empty permissions array
    const organizationsWithEmptyPermissions = await organizationsCollection.find({
      permissions: { $exists: true, $size: 0 }
    }).toArray();

    console.log(`Found ${organizationsWithEmptyPermissions.length} organizations with empty permissions`);

    for (const org of organizationsWithEmptyPermissions) {
      await organizationsCollection.updateOne(
        { _id: org._id },
        { $set: { permissions: DEFAULT_PERMISSIONS } }
      );
      console.log(`Updated organization: ${org.name} with default permissions`);
    }

    console.log('Migration completed successfully');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

// Run the migration
migrateOrganizationPermissions();
