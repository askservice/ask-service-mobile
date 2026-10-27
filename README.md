# Ask Service – application mobile (clients)

Application Android / iOS pour les **clients** d’Ask Service : faire une demande de service, puis
suivre ses demandes, devis et messages. La partie prestataires reste sur askservice.fr.

Expo SDK 58 (React Native), TypeScript, Expo Router, React Query.

## Contenu

**Faire une demande** (sans compte) :

1. Accueil : « De quoi avez-vous besoin ? », recherche ouvrant la liste des services (icônes de l'admin)
2. Votre besoin : service choisi + Particulier / Entreprise
3. Lieu de l'intervention : adresse, ville ou code postal (Base Adresse Nationale), ou position GPS
4. Questions du service (admin), une étape par écran ; choix unique = gros boutons, date = calendrier
5. Coordonnées, puis code de vérification (SMS pour un nouveau client, e-mail pour un client connu)
6. Demande envoyée

**Suivre mes demandes** (client connecté) :

- Connexion sans mot de passe : e-mail, puis code à 6 chiffres reçu par e-mail (comptes prestataires refusés)
- Mes demandes (en cours / terminées), détail, devis reçus : accepter, refuser, écrire au prestataire, clôturer
- Messagerie : conversations et messages en temps réel (socket.io), texte seulement
- Compte : préférences de notifications, liens d'aide, déconnexion, suppression du compte

Pas encore : notifications push (il faut une version de développement EAS + Firebase), photos dans
la messagerie.

## Lancer l'application

```bash
npm ci
npx expo start            # QR code à scanner avec Expo Go (Android / iOS)
npx expo start --tunnel   # si le téléphone n'est pas sur le même réseau que l'ordinateur
```

API utilisée : `https://api.askservice.fr` par défaut. Pour une autre API, créer un fichier `.env` :

```
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000
```

Attention : avec l'API de production, tout est réel : une demande envoyée prévient les prestataires
(SMS envoyé), accepter ou refuser un devis prévient le prestataire.

## Vérifications

```bash
npm test             # tests (jest-expo)
npm run typecheck    # TypeScript
npx expo lint        # ESLint
npx expo-doctor      # dépendances et configuration Expo
```

## Organisation

| Dossier | Rôle |
|---|---|
| `src/app/` | Écrans (Expo Router : un fichier = un écran), parcours de demande dans `src/app/demande/` |
| `src/api/` | Appels à l'API Ask Service, jeton de session (SecureStore) |
| `src/lib/` | Logique sans interface (questions, contenu de la demande, téléphone, adresses), testée |
| `src/state/` | Demande en cours de saisie et enchaînement des écrans |
| `src/components/` | Boutons, champs, barre du bas, icônes des services |
| `src/theme.ts` | Couleurs et police du site (bleu client #1B4FFF, Bricolage Grotesque) |
