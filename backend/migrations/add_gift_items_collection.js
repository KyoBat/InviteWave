// migrations/add_gift_items_collection.js
module.exports = {
    async up(db) {
      await db.createCollection('giftitems');
      await db.collection('giftitems').createIndex({ eventId: 1 });
      await db.collection('giftitems').createIndex({ 'reservations.guestId': 1 });
    },
    async down(db) {
      await db.collection('giftitems').drop();
    }
  };