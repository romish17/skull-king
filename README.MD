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

## Dépannage : erreur EMFILE (too many open files)

Si Metro affiche `EMFILE: too many open files`, active Watchman ou augmente la limite de fichiers :

1. Installer Watchman (macOS) :

   ```bash
   brew install watchman
   ```

2. Relancer le bundler avec Watchman :

   ```bash
   npm run start:watchman
   ```

3. Réinitialiser les watches Watchman si besoin :

   ```bash
   watchman watch-del-all
   watchman watch-project .
   ```

4. Si besoin, augmenter la limite de fichiers ouverts :

   ```bash
   ulimit -n 10240
   ```

## Utilisation rapide

- Ajoute ou supprime des joueurs dans la section **Équipage**.
- Saisis les **annonces** en phase **Annonces**.
- Passe en **phase Résultats** pour saisir **plis** et **bonus**, puis clique sur **Clôturer la manche**.
- Appuie sur une carte spéciale/extension pour ajouter son bonus au champ actif.
- Ajuste les valeurs des cartes dans **Barème des cartes** pour coller à vos règles.
- Les scores et réglages sont sauvegardés automatiquement sur l'appareil.
