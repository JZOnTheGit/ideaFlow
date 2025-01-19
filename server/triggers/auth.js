const admin = require('firebase-admin');

// Initialize default user data in Firestore when a new user signs up
exports.onUserCreated = async (user) => {
  try {
    const userDoc = admin.firestore().collection('users').doc(user.uid);
    
    // Set default user data
    await userDoc.set({
      email: user.email,
      subscription: 'free',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      usage: {
        pdfUploads: {
          used: 0,
          limit: 2
        },
        websiteUploads: {
          used: 0,
          limit: 1
        },
        generationsPerUpload: 1,
        generationsUsed: {}
      },
      stripeCustomerId: null,
      stripeSubscriptionId: null
    });

    console.log(`Created new user document for ${user.email}`);
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
}; 