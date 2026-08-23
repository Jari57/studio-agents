'use strict';

const KNOWN_USER_SUBCOLLECTIONS = Object.freeze([
  'assets',
  'billing_history',
  'credit_history',
  'generations',
  'projects',
  'sessions',
  'voices',
]);

const TOP_LEVEL_USER_COLLECTIONS = Object.freeze([
  'creditReservations',
  'pending_video_operations',
  'video_jobs',
  'video_operations',
]);

function isStripeMissingResource(error) {
  return error?.code === 'resource_missing'
    || error?.raw?.code === 'resource_missing'
    || error?.statusCode === 404;
}

async function deleteStripeCustomer({ getStripe, userData }) {
  const customerId = String(userData?.stripeCustomerId || '').trim();
  if (!customerId) return { deleted: false, reason: 'no-customer' };

  const stripe = typeof getStripe === 'function' ? getStripe() : null;
  if (!stripe?.customers?.del) {
    const error = new Error('Billing deletion is temporarily unavailable. The Studio Agents account was left intact.');
    error.code = 'BILLING_DELETE_UNAVAILABLE';
    throw error;
  }

  try {
    const result = await stripe.customers.del(customerId);
    if (result?.deleted !== true) {
      const error = new Error('Stripe did not confirm customer deletion. The Studio Agents account was left intact.');
      error.code = 'BILLING_DELETE_UNCONFIRMED';
      throw error;
    }
    return { deleted: true, customerId };
  } catch (error) {
    if (isStripeMissingResource(error)) {
      return { deleted: true, customerId, alreadyDeleted: true };
    }
    throw error;
  }
}

async function deleteUserStorage({ getStorageBucket, userId }) {
  const bucket = typeof getStorageBucket === 'function' ? getStorageBucket() : null;
  if (!bucket) {
    const error = new Error('Private asset storage is temporarily unavailable. The Studio Agents account was left intact.');
    error.code = 'STORAGE_DELETE_UNAVAILABLE';
    throw error;
  }

  await bucket.deleteFiles({ prefix: `users/${userId}/`, force: true });
  return { deleted: true };
}

async function deleteQueryDocuments(query, db) {
  let deleted = 0;
  for (;;) {
    const snapshot = await query.limit(100).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    for (const document of snapshot.docs) {
      batch.delete(document.ref);
      deleted += 1;
    }
    await batch.commit();
    if (snapshot.size < 100) break;
  }
  return deleted;
}

async function deleteKnownSubcollections(db, userRef) {
  let deleted = 0;
  for (const name of KNOWN_USER_SUBCOLLECTIONS) {
    deleted += await deleteQueryDocuments(userRef.collection(name), db);
  }
  return deleted;
}

async function deleteUserData({ db, userId, userRef }) {
  let topLevelDeleted = 0;
  for (const collectionName of TOP_LEVEL_USER_COLLECTIONS) {
    const query = db.collection(collectionName).where('userId', '==', userId);
    topLevelDeleted += await deleteQueryDocuments(query, db);
  }

  if (typeof db.recursiveDelete === 'function') {
    await db.recursiveDelete(userRef);
    return { deleted: true, topLevelDeleted, recursive: true };
  }

  const subcollectionDeleted = await deleteKnownSubcollections(db, userRef);
  await userRef.delete();
  return {
    deleted: true,
    topLevelDeleted,
    subcollectionDeleted,
    recursive: false,
  };
}

async function deleteFirebaseIdentity({ admin, userId }) {
  try {
    await admin.auth().deleteUser(userId);
    return { deleted: true };
  } catch (error) {
    if (error?.code === 'auth/user-not-found') {
      return { deleted: true, alreadyDeleted: true };
    }
    throw error;
  }
}

function createAccountDeletionHandler({
  getFirestoreDb,
  getStorageBucket,
  getStripe,
  admin,
  logger = console,
  hasActiveUserWork = () => false,
  operations = {},
}) {
  const deleteBilling = operations.deleteStripeCustomer || deleteStripeCustomer;
  const deleteStorage = operations.deleteUserStorage || deleteUserStorage;
  const deleteData = operations.deleteUserData || deleteUserData;
  const deleteIdentity = operations.deleteFirebaseIdentity || deleteFirebaseIdentity;

  return async function deleteAccount(req, res) {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (String(req.body?.confirmation || '').trim() !== 'DELETE') {
      return res.status(400).json({
        error: 'Type DELETE exactly to confirm permanent account deletion.',
        code: 'DELETE_CONFIRMATION_REQUIRED',
      });
    }

    if (hasActiveUserWork(userId)) {
      return res.status(409).json({
        error: 'A generation is still processing. Wait for it to finish or fail before deleting the account.',
        code: 'ACTIVE_GENERATION',
      });
    }

    const db = typeof getFirestoreDb === 'function' ? getFirestoreDb() : null;
    if (!db) {
      return res.status(503).json({
        error: 'Account deletion is temporarily unavailable. No customer data was changed.',
        code: 'ACCOUNT_DELETE_UNAVAILABLE',
      });
    }

    const userRef = db.collection('users').doc(userId);
    const userSnapshot = await userRef.get();
    const userData = userSnapshot.exists ? userSnapshot.data() : {};

    try {
      // Billing goes first. If Stripe cannot confirm deletion, preserve all
      // local records and assets so the customer is never silently billed by
      // an orphaned remote customer after losing access to Studio Agents.
      await deleteBilling({ getStripe, userData, userId });
      await deleteStorage({ getStorageBucket, userId });
      await deleteData({ db, userId, userRef });
      await deleteIdentity({ admin, userId });

      res.setHeader('Cache-Control', 'no-store, max-age=0');
      return res.status(200).json({
        success: true,
        deleted: true,
        message: 'Your Studio Agents account, private assets, saved work, credit history, and billing identity were deleted.',
      });
    } catch (error) {
      logger.error?.('[account-deletion] deletion failed', {
        userId,
        code: error?.code || null,
        error: error?.message || String(error),
      });

      const billingFailure = String(error?.code || '').startsWith('BILLING_')
        || Boolean(userData?.stripeCustomerId && !isStripeMissingResource(error));
      return res.status(billingFailure ? 502 : 503).json({
        error: billingFailure
          ? 'Studio Agents could not confirm deletion of the remote billing profile, so the account was left intact.'
          : 'Studio Agents could not complete account deletion. Sign in again before retrying or contact support.',
        code: error?.code || 'ACCOUNT_DELETE_FAILED',
      });
    }
  };
}

function registerAccountDeletionRoute(app, dependencies) {
  const handler = createAccountDeletionHandler(dependencies);
  app.delete('/api/user/account', dependencies.verifyFirebaseToken, handler);
  return handler;
}

module.exports = {
  KNOWN_USER_SUBCOLLECTIONS,
  TOP_LEVEL_USER_COLLECTIONS,
  createAccountDeletionHandler,
  deleteFirebaseIdentity,
  deleteQueryDocuments,
  deleteStripeCustomer,
  deleteUserData,
  deleteUserStorage,
  isStripeMissingResource,
  registerAccountDeletionRoute,
};
