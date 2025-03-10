# InviteWave
# Guide d'Implémentation - Fonctionnalité de Liste de Cadeaux

Ce guide explique comment intégrer la nouvelle fonctionnalité de liste de cadeaux/objets dans l'application InviteWave.

## Table des matières

- [Architecture](#architecture)
- [Installation du Backend](#installation-du-backend)
- [Installation du Frontend](#installation-du-frontend)
- [Configuration](#configuration)
- [Tests](#tests)
- [Extensions futures](#extensions-futures)
- [Dépannage](#dépannage)

## Architecture

La fonctionnalité de liste de cadeaux/objets s'intègre à l'architecture existante d'InviteWave :

```
backend/
  ├── models/
  │   └── giftItem.js         # Modèle de données pour les cadeaux
  ├── controllers/
  │   └── giftItemController.js  # Logique de contrôle
  ├── routes/
  │   └── giftItem.js         # Définition des endpoints API
  └── services/
      └── emailService.js     # Service de notification (mis à jour)

web-client/
  ├── src/
  │   ├── components/
  │   │   └── gifts/          # Composants React pour les cadeaux
  │   ├── services/
  │   │   └── gift.js         # Service d'interaction avec l'API
  │   └── styles/
  │       └── gifts.css       # Styles spécifiques
```

## Installation du Backend

### 1. Ajout des fichiers

Copiez les fichiers suivants dans leur emplacement respectif :

- `backend/models/giftItem.js`
- `backend/controllers/giftItemController.js`
- `backend/routes/giftItem.js`

### 2. Mise à jour des fichiers existants

Mettez à jour les fichiers suivants pour intégrer la nouvelle fonctionnalité :

#### models/index.js

```javascript
// backend/models/index.js
const User = require('./user');
const Event = require('./events');
const Guest = require('./guest');
const Invitation = require('./invitation');
const GiftItem = require('./giftItem'); // Nouveau modèle

module.exports = {
  User,
  Event,
  Guest,
  Invitation,
  GiftItem // Ajout à l'exportation
};
```

#### controllers/index.js

```javascript
// backend/controllers/index.js
const authController = require('./authController');
const userController = require('./userController');
const eventController = require('./eventController');
const guestController = require('./guestController');
const invitationController = require('./invitationController');
const giftItemController = require('./giftItemController'); // Nouveau contrôleur

module.exports = {
  authController,
  userController,
  eventController,
  guestController,
  invitationController,
  giftItemController // Ajout à l'exportation
};
```

#### routes/index.js

```javascript
// backend/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const userRoutes = require('./user');
const eventRoutes = require('./event');
const guestRoutes = require('./guest');
const invitationRoutes = require('./invitation');
const webhookRoutes = require('./webhook');
const giftItemRoutes = require('./giftItem'); // Nouvelle importation

// Routes principales
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/guests', guestRoutes);
router.use('/invitations', invitationRoutes);
router.use('/webhooks', webhookRoutes);

// Intégration des routes de cadeaux comme sous-routes des événements
router.use('/events/:eventId/gifts', giftItemRoutes);

module.exports = router;
```

#### services/emailService.js

Ajoutez les nouvelles méthodes au service d'email existant :

```javascript
/**
 * Envoie une notification à l'organisateur lorsqu'un invité réserve un cadeau
 */
exports.sendGiftReservationNotification = async (to, data) => {
  const subject = `[${data.eventName}] Nouvelle réservation de cadeau`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Nouvelle réservation de cadeau</h2>
      <p>Bonjour,</p>
      <p>Un invité a réservé un élément de votre liste de cadeaux pour ${data.eventName}.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Invité:</strong> ${data.guestName}</p>
        <p><strong>Cadeau:</strong> ${data.giftName}</p>
        <p><strong>Quantité:</strong> ${data.quantity}</p>
        ${data.message !== 'Aucun message' ? `<p><strong>Message:</strong> ${data.message}</p>` : ''}
      </div>
      <p>Vous pouvez consulter votre liste de cadeaux sur la page de détail de votre événement.</p>
      <p>Cordialement,<br>L'équipe InviteWave</p>
    </div>
  `;
  
  return await sendEmail(to, subject, html);
};

/**
 * Envoie une notification à l'organisateur lorsqu'un invité annule sa réservation
 */
exports.sendGiftCancellationNotification = async (to, data) => {
  const subject = `[${data.eventName}] Annulation d'une réservation de cadeau`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Annulation d'une réservation de cadeau</h2>
      <p>Bonjour,</p>
      <p>Un invité a annulé sa réservation d'un élément de votre liste de cadeaux pour ${data.eventName}.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Invité:</strong> ${data.guestName}</p>
        <p><strong>Cadeau:</strong> ${data.giftName}</p>
      </div>
      <p>Cet élément est maintenant disponible pour d'autres invités.</p>
      <p>Vous pouvez consulter votre liste de cadeaux sur la page de détail de votre événement.</p>
      <p>Cordialement,<br>L'équipe InviteWave</p>
    </div>
  `;
  
  return await sendEmail(to, subject, html);
};
```

### 3. Migration de base de données

Si vous utilisez un système de migration, créez une migration pour la nouvelle collection :

```javascript
// backend/migrations/20230101_add_gift_items.js
module.exports = {
  async up(db) {
    await db.createCollection('giftitems');
    await db.collection('giftitems').createIndex({ eventId: 1 });
  },

  async down(db) {
    await db.collection('giftitems').drop();
  }
};
```

## Installation du Frontend

### 1. Création des composants React

Dans le dossier `web-client/src/components/gifts/`, créez les fichiers suivants :

- `GiftList.js` - Affichage de la liste complète
- `GiftListItem.js` - Affichage d'un élément individuel
- `GiftForm.js` - Formulaire d'ajout/modification
- `GiftAssignmentModal.js` - Modal pour réserver un élément
- `GiftManagement.js` - Interface de gestion des cadeaux pour l'organisateur

### 2. Création du service API

Créez le fichier `web-client/src/services/gift.js` pour interagir avec l'API :

```javascript
// web-client/src/services/gift.js
import api from './api';

// Obtenir tous les cadeaux pour un événement
export const getAllGifts = async (eventId, params = {}) => {
  return api.get(`/events/${eventId}/gifts`, { params });
};

// Obtenir un cadeau spécifique
export const getGiftById = async (eventId, giftId, params = {}) => {
  return api.get(`/events/${eventId}/gifts/${giftId}`, { params });
};

// Créer un nouveau cadeau
export const createGift = async (eventId, giftData) => {
  return api.post(`/events/${eventId}/gifts`, giftData);
};

// Mettre à jour un cadeau
export const updateGift = async (eventId, giftId, giftData) => {
  return api.put(`/events/${eventId}/gifts/${giftId}`, giftData);
};

// Supprimer un cadeau
export const deleteGift = async (eventId, giftId) => {
  return api.delete(`/events/${eventId}/gifts/${giftId}`);
};

// Réserver un cadeau
export const assignGift = async (eventId, giftId, assignData) => {
  return api.post(`/events/${eventId}/gifts/${giftId}/assign`, assignData);
};

// Annuler la réservation d'un cadeau
export const unassignGift = async (eventId, giftId, guestId) => {
  return api.post(`/events/${eventId}/gifts/${giftId}/unassign`, { guestId });
};

// Réorganiser les cadeaux
export const reorderGifts = async (eventId, items) => {
  return api.put(`/events/${eventId}/gifts/reorder`, { items });
};

// Obtenir les réservations d'un invité
export const getGuestReservations = async (eventId, guestId) => {
  return api.get(`/events/${eventId}/gifts/reservations/${guestId}`);
};
```

### 3. Ajout du fichier CSS

Créez le fichier `web-client/src/styles/gifts.css` pour les styles spécifiques.

### 4. Mise à jour des fichiers existants

#### Mise à jour du index.js pour importer les styles

```javascript
// web-client/src/index.js
import './styles/main.css';
import './styles/auth.css';
import './styles/events.css';
import './styles/guests.css';
import './styles/invitations.css';
import './styles/dashboard.css';
import './styles/profile.css';
import './styles/gifts.css'; // Nouveau fichier CSS
```

#### Mise à jour du composant EventDetail

```jsx
// web-client/src/components/events/EventDetail.js
// Ajoutez un nouvel onglet pour les cadeaux

import GiftManagement from '../gifts/GiftManagement';

// Dans le composant
<Tabs>
  <TabList>
    <Tab>Détails</Tab>
    <Tab>Invités</Tab>
    <Tab>Invitations</Tab>
    <Tab>Cadeaux</Tab> {/* Nouvel onglet */}
  </TabList>
  <TabPanel>
    {/* Contenu existant */}
  </TabPanel>
  <TabPanel>
    {/* Contenu existant */}
  </TabPanel>
  <TabPanel>
    {/* Contenu existant */}
  </TabPanel>
  <TabPanel>
    <GiftManagement eventId={event._id} isOrganizer={true} />
  </TabPanel>
</Tabs>
```

#### Mise à jour du composant PublicInvitation

```jsx
// web-client/src/components/invitations/PublicInvitation.js
// Ajoutez la section liste de cadeaux

import GiftList from '../gifts/GiftList';

// Dans le composant
<div className="invitation-section">
  <h3>Liste de cadeaux</h3>
  <GiftList 
    eventId={eventId} 
    guestId={guestId} 
    isOrganizer={false} 
    isPublic={true} 
  />
</div>
```

## Configuration

### 1. Permissions et sécurité

Assurez-vous que les middlewares d'authentification sont correctement configurés pour protéger les routes réservées aux organisateurs.

### 2. Limites et optimisation

Configurez les limites appropriées pour éviter les abus :

```javascript
// backend/middlewares/rateLimit.js
const rateLimit = require('express-rate-limit');

// Limite pour les réservations (éviter les spams)
const assignLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 réservations par IP
  message: 'Trop de réservations depuis cette IP, veuillez réessayer plus tard'
});

module.exports = {
  assignLimiter
};

// Appliquer dans routes/giftItem.js
const { assignLimiter } = require('../middlewares/rateLimit');
router.post('/:giftId/assign', assignLimiter, assignValidation, validateRequest, giftItemController.assignGiftItem);
```

## Tests

### 1. Tests unitaires

Exécutez les tests unitaires pour le modèle et le contrôleur :

```bash
npm test tests/unit/giftItem.unit.test.js
npm test tests/unit/giftItemController.unit.test.js
```

### 2. Tests d'intégration

Exécutez les tests d'intégration pour vérifier le bon fonctionnement des API :

```bash
npm test tests/giftItem.test.js
```

### 3. Tests Frontend

Testez les composants React avec Jest et React Testing Library.

## Extensions futures

Voici quelques idées pour étendre cette fonctionnalité à l'avenir :

1. **Synchronisation en temps réel** : Utiliser WebSockets pour mettre à jour la liste en temps réel lorsqu'un invité réserve un cadeau.
2. **Galerie d'images** : Permettre l'ajout de plusieurs images pour chaque cadeau.
3. **Partage sur réseaux sociaux** : Permettre aux invités de partager leurs réservations.
4. **Intégration avec des registres en ligne** : Connecter la liste à des registres de mariage existants.
5. **Analyse et statistiques** : Ajouter un tableau de bord pour voir les tendances de réservation.

## Dépannage

### Problèmes courants

1. **Les réservations ne se mettent pas à jour correctement**
   - Vérifiez que le middleware pre-save dans le modèle GiftItem fonctionne correctement.
   - Assurez-vous que quantityReserved est recalculé lors de chaque sauvegarde.

2. **Erreurs de permission**
   - Vérifiez que le middleware d'authentification est correctement appliqué.
   - Vérifiez que l'événement appartient bien à l'utilisateur pour les actions réservées à l'organisateur.

3. **Problèmes de performance avec de grandes listes**
   - Implémentez la pagination pour limiter le nombre d'éléments renvoyés.
   - Utilisez l'indexation MongoDB pour optimiser les requêtes fréquentes.

Pour tout autre problème, consultez les logs du serveur et vérifiez les erreurs dans la console du navigateur.

---

Pour toute question ou assistance supplémentaire, contactez l'équipe de développement à dev@invitewave.com.
