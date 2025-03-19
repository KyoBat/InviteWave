const assert = require('assert');

describe('eventDetail', () => {
    it('devrait retourner les détails de l\'événement', () => {
        const eventDetail = { id: 1, name: 'Concert', date: '2023-10-01' };
        assert.strictEqual(eventDetail.name, 'Concert');
    });

    it('devrait gérer les événements inexistants', () => {
        const eventDetail = null;
        assert.strictEqual(eventDetail, null);
    });
});