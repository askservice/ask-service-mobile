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
npx expo start --tunnel --dev-client   # avec l'app de développement installée sur le téléphone
npx expo start --tunnel --go           # ou avec Expo Go (connexion Google indisponible)
```

App de développement (une fois, puis à refaire seulement quand une dépendance native change) :
`eas build --profile development --platform android`, installer l'APK donné par EAS, l'ouvrir
(écran « Development Build ») et y scanner le QR code de `npx expo start --dev-client`.

API utilisée : `https://api.askservice.fr` par défaut. Pour une autre API, créer un fichier `.env` :

```
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000
```

Builds EAS : l'API est fixée par profil dans `eas.json` (`production` → `https://api.askservice.fr`,
`development` et `preview` → `https://api-dev.askservice.fr`), quel que soit le `.env` du poste.

Attention : avec l'API de production, tout est réel : une demande envoyée prévient les prestataires
(SMS envoyé), accepter ou refuser un devis prévient le prestataire.

## Mises à jour à distance (EAS Update)

Une modification **uniquement JavaScript** (écrans, textes, logique) peut être envoyée aux apps
installées sans nouveau build ni examen des stores, depuis la branche `prod` :

```bash
eas update --channel production --message "Ce qui change"
```

L'app télécharge la mise à jour au démarrage et l'applique au démarrage suivant. Elle ne va qu'aux
apps de la même version (`runtimeVersion` = `version` de `app.json`).

Nouveau build obligatoire (et nouvel examen) dès qu'on change la partie native : ajout ou mise à
jour d'une bibliothèque native, permission, icône, `app.json` (plugins), montée de version d'Expo.
Dans ce cas, **augmenter `version`** dans `app.json` (ex. 1.1.0 → 1.2.0) pour qu'une mise à jour
JavaScript ne soit jamais envoyée à une app dont le code natif ne correspond pas.

Android : les builds de production sont réduits par R8 (`expo-build-properties`). Après un build,
tester en test interne : connexion par code et Google, demande, « Utiliser ma position », devis,
messages, fichier joint.

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
