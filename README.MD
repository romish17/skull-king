# Skull King - Compteur de points pirate

Application web mobile pour compter les points au jeu Skull King, avec support des cartes d'extension et un thème pirate.

## Prérequis

- Un navigateur moderne (mobile ou desktop).
- Optionnel : Python 3 (pour lancer un petit serveur local).

## Installation (locale)

1. Cloner le dépôt :

   ```bash
   git clone <URL_DU_DEPOT>
   cd skull-king
   ```

2. Ouvrir l'application :

   **Option A — ouverture directe**
   - Ouvre `index.html` dans ton navigateur.

   **Option B — serveur local (recommandé)**
   - Lance un serveur local depuis la racine du projet :

     ```bash
     python -m http.server 8000
     ```

   - Puis ouvre : `http://localhost:8000`

## Utilisation rapide

- Ajoute ou supprime des joueurs dans la section **Équipage**.
- Sélectionne la manche et saisis **annonce**, **plis**, et **bonus**.
- Clique sur une carte spéciale/extension pour ajouter son bonus au champ actif.
- Ajuste les valeurs des cartes dans **Barème des cartes** pour coller à vos règles.
- Les scores et réglages sont sauvegardés automatiquement sur l'appareil.

## Personnalisation

Les cartes spéciales et d'extension sont configurables depuis l'interface. Tu peux modifier leurs valeurs (ex. Kraken, Baleine, Baleine blanche, Butin) pour refléter votre extension ou une variante maison.
