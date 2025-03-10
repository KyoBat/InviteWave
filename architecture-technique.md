# Architecture Technique - Application d'Organisation de Fêtes

## 1. Vue d'ensemble

L'application d'organisation de fêtes sera développée avec une architecture moderne, évolutive et sécurisée :

- **Frontend Mobile** : Application développée avec React Native pour couvrir iOS et Android
- **Frontend Web** : Application développée avec React.js
- **Backend** : API RESTful développée avec Node.js (Express.js)
- **Base de données** : MongoDB (NoSQL) pour la flexibilité des schémas
- **Authentification** : JWT (JSON Web Tokens)
- **Stockage de fichiers** : AWS S3 pour les images et médias
- **Intégrations** : 
  - API WhatsApp Business
  - SendGrid pour l'envoi d'emails
  - Firebase pour les notifications

## 2. Structure des composants

### 2.1 Backend (Node.js/Express)

```
backend/
├── config/               # Configuration de l'application
├── controllers/          # Contrôleurs pour la logique métier
├── middlewares/          # Middlewares pour l'authentification et la validation
├── models/               # Modèles de données MongoDB
├── routes/               # Définition des routes API
├── services/             # Services externes (WhatsApp, Email)
├── utils/                # Fonctions utilitaires
├── app.js                # Point d'entrée de l'application
└── package.json          # Dépendances
```

### 2.2 Frontend Web (React.js)

```
web-client/
├── public/               # Fichiers statiques
├── src/
│   ├── assets/           # Images et ressources
│   ├── components/       # Composants réutilisables
│   ├── contexts/         # Contextes React (état global)
│   ├── hooks/            # Hooks personnalisés
│   ├── pages/            # Pages de l'application
│   ├── services/         # Services d'API
│   ├── styles/           # Fichiers CSS/SCSS
│   ├── utils/            # Fonctions utilitaires
│   ├── App.js            # Composant principal
│   └── index.js          # Point d'entrée
└── package.json          # Dépendances
```

### 2.3 Application Mobile (React Native)

```
mobile-client/
├── android/              # Configuration spécifique à Android
├── ios/                  # Configuration spécifique à iOS
├── src/
│   ├── assets/           # Images et ressources
│   ├── components/       # Composants réutilisables
│   ├── contexts/         # Contextes React (état global)
│   ├── hooks/            # Hooks personnalisés
│   ├── navigation/       # Configuration de la navigation
│   ├── screens/          # Écrans de l'application
│   ├── services/         # Services d'API
│   ├── styles/           # Styles partagés
│   ├── utils/            # Fonctions utilitaires
│   └── App.js            # Composant principal
└── package.json          # Dépendances
```

## 3. Modèles de données

### 3.1 Utilisateur (User)
```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String",
  "password": "String (hashed)",
  "phone": "String",
  "profilePicture": "String (URL)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 3.2 Événement (Event)
```json
{
  "_id": "ObjectId",
  "creator": "ObjectId (ref: User)",
  "name": "String",
  "description": "String",
  "date": "Date",
  "location": {
    "address": "String",
    "coordinates": {
      "latitude": "Number",
      "longitude": "Number"
    }
  },
  "theme": "String",
  "coverImage": "String (URL)",
  "status": "String (active, completed, cancelled)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 3.3 Invité (Guest)
```json
{
  "_id": "ObjectId",
  "user": "ObjectId (ref: User)", // Optionnel, si l'invité a un compte
  "name": "String",
  "email": "String",
  "phone": "String",
  "category": "String (family, friends, colleagues, etc.)",
  "createdBy": "ObjectId (ref: User)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 3.4 Invitation (Invitation)
```json
{
  "_id": "ObjectId",
  "event": "ObjectId (ref: Event)",
  "guest": "ObjectId (ref: Guest)",
  "uniqueCode": "String",
  "sendMethod": "String (whatsapp, email)",
  "message": "String",
  "status": "String (pending, sent, failed)",
  "response": {
    "status": "String (yes, no, maybe, pending)",
    "message": "String",
    "respondedAt": "Date"
  },
  "sentAt": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## 4. API Endpoints

### 4.1 Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh-token` - Actualisation du token
- `POST /api/auth/forgot-password` - Mot de passe oublié

### 4.2 Utilisateurs
- `GET /api/users/me` - Profil de l'utilisateur
- `PUT /api/users/me` - Modification du profil
- `PUT /api/users/me/password` - Modification du mot de passe

### 4.3 Événements
- `GET /api/events` - Liste des événements
- `POST /api/events` - Création d'un événement
- `GET /api/events/:id` - Détails d'un événement
- `PUT /api/events/:id` - Modification d'un événement
- `DELETE /api/events/:id` - Suppression d'un événement

### 4.4 Invités
- `GET /api/guests` - Liste des invités
- `POST /api/guests` - Ajout d'un invité
- `GET /api/guests/:id` - Détails d'un invité
- `PUT /api/guests/:id` - Modification d'un invité
- `DELETE /api/guests/:id` - Suppression d'un invité
- `POST /api/guests/import` - Importation d'invités

### 4.5 Invitations
- `GET /api/events/:eventId/invitations` - Liste des invitations d'un événement
- `POST /api/events/:eventId/invitations` - Création d'invitations
- `GET /api/invitations/:code` - Détails d'une invitation (public)
- `PUT /api/invitations/:code/respond` - Réponse à une invitation (public)
- `POST /api/events/:eventId/invitations/send` - Envoi des invitations

### 4.6 Statistiques
- `GET /api/events/:eventId/stats` - Statistiques d'un événement

## 5. Intégrations

### 5.1 WhatsApp Business API
- Interface pour l'envoi de messages
- Gestion des webhooks pour les réponses
- Modèles de message personnalisés

### 5.2 Système d'Emails
- Modèles HTML pour les invitations
- Tracking d'ouverture et de clics
- Gestion des rebonds

### 5.3 Notifications Push
- Alertes sur les nouvelles réponses
- Rappels pour les événements à venir
- Notifications de statut d'envoi

## 6. Sécurité

- Authentification JWT
- Encryption des données sensibles
- Rate limiting pour éviter les abus
- Validation des entrées utilisateur
- HTTPS pour toutes les communications
- Conformité RGPD
  - Consentement explicite
  - Droit à l'oubli
  - Exportation des données
