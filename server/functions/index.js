const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.updateSubscription = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  try {
    const { userId, action, subscriptionData } = req.body;
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);

    if (action === 'upgrade') {
      await userRef.update({
        subscriptionStatus: 'active',
        subscriptionId: subscriptionData.subscriptionId,
        priceId: subscriptionData.priceId,
        customerId: subscriptionData.customerId,
        plan: 'pro',
        subscription: 'pro',
        limits: {
          pdfUploads: {
            used: 0,
            limit: 80
          },
          websiteUploads: {
            used: 0,
            limit: 50
          }
        },
        usage: {
          generationsPerUpload: 3,
          generationsUsed: {}
        }
      });
    } else if (action === 'cancel') {
      await userRef.update({
        subscriptionStatus: 'cancelled',
        subscriptionId: null,
        priceId: null,
        plan: 'free',
        subscription: 'free',
        limits: {
          pdfUploads: {
            used: 0,
            limit: 2
          },
          websiteUploads: {
            used: 0,
            limit: 1
          }
        },
        usage: {
          generationsPerUpload: 1,
          generationsUsed: {}
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: error.message });
  }
}); 