# Skull King - Application mobile (React Native)

Application mobile (iOS & Android) pour compter les points au jeu Skull King, avec support des cartes d'extension et un thème pirate.

## Prérequis

- Node.js 18+
- Expo CLI (via `npx`)
- Un téléphone iOS/Android avec l'app Expo Go, ou un simulateur iOS / Android Studio.

## Installation

1. Installer les dépendances :

   ```bash
   npm install
   ```

2. Lancer l'application :

   ```bash
   npm run start
   ```

3. Ouvrir sur mobile :

   - iOS/Android : scanner le QR code avec Expo Go.
   - Simulateur :
     - iOS : `npm run ios`
     - Android : `npm run android`

## Utilisation rapide

- Ajoute ou supprime des joueurs dans la section **Équipage**.
- Saisis les **annonces** en phase **Annonces**.
- Passe en **phase Résultats** pour saisir **plis** et **bonus**, puis clique sur **Clôturer la manche**.
- Appuie sur une carte spéciale/extension pour ajouter son bonus au champ actif.
- Ajuste les valeurs des cartes dans **Barème des cartes** pour coller à vos règles.
- Les scores et réglages sont sauvegardés automatiquement sur l'appareil.
