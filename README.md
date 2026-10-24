# Ask Service – application mobile (clients)

Application Android / iOS pour les **clients** d'Ask Service : faire une demande de service et,
plus tard, suivre ses demandes et devis. La partie prestataires reste sur askservice.fr.

Expo SDK 58 (React Native), TypeScript, Expo Router, React Query.

## Contenu du prototype (v0.1)

Parcours « Faire une demande », branché sur l'API Ask Service :

1. Accueil : « De quoi avez-vous besoin ? », recherche et services (icônes choisies dans l'admin)
2. Choix du service (groupé par catégorie) + Particulier / Entreprise
3. Lieu de l'intervention : adresse, ville ou code postal (Base Adresse Nationale), ou position GPS
4. Questions du service (admin), une étape par écran ; choix unique = gros boutons
5. Coordonnées
6. Code de vérification (SMS pour un nouveau client, e-mail pour un client connu)
7. Demande envoyée

Le suivi des demandes, les devis, la messagerie, le compte et les notifications push viendront
dans la version suivante (écran « Bientôt disponible » en attendant).

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

Attention : avec l'API de production, une demande envoyée depuis l'application est une vraie
demande (prestataires prévenus, SMS envoyé).

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
