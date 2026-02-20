---
# auto-generated: true
title: "Snake Reinforcement"
description: >-
  Q-Learning agent that learns to play Snake on a 15x15 grid using reinforcement learning, with Pygame visualization
startDate: 2025-10-21
skills:
  - Jupyter Notebook
  - Software Development
demoLink: https://github.com/Theodemo/snake_reinforcement
sourceLink: https://github.com/Theodemo/snake_reinforcement
---

# Q-Learning Snake

## Overview
Ce projet met en oeuvre un **agent d'apprentissage par renforcement (Q-Learning)** qui apprend a jouer au Snake.
L'agent se deplace sur une grille 15x15, mange des pommes pour grandir, et apprend a eviter les murs ainsi que son propre corps.
Une visualisation **Pygame** permet d'observer les deplacements de l'agent apres l'entrainement.

---

## Structure du projet

```
├── main.py                # Script principal : Q-learning + visualisation
├── data/
│   ├── sprites/
│   │   ├── snake.png      # Sprite du serpent
│   │   └── apple.png      # Sprite de la pomme
│   └── map/
│       └── map_snake.tmx  # Carte du jeu (Tiled Map Editor)
├── test/
│   ├── test_subject.py    # Tests du Snake
│   ├── test_master.py     # Tests du QLearningAgent
│   └── test_runprogram.py # Tests du Trainer et Environment
└── README.md
```

---

## Fonctionnement

### 1. Entrainement (Q-Learning)

L'agent (`Snake`) apprend a atteindre les pommes placees aleatoirement sur la grille tout en evitant les collisions (murs et son propre corps).

**Actions relatives** (par rapport a la direction actuelle) :
| Action | Description |
|--------|-------------|
| 0 | Tout droit |
| 1 | Tourner a droite |
| 2 | Tourner a gauche |

**Etat encode** (representation compacte, 864 etats possibles) :
| Composante | Valeurs | Description |
|------------|---------|-------------|
| danger_tout_droit | 0/1 | Mur ou corps devant |
| danger_droite | 0/1 | Mur ou corps a droite |
| danger_gauche | 0/1 | Mur ou corps a gauche |
| direction | 0-3 | Haut / Droite / Bas / Gauche |
| nourriture_dx | -1/0/1 | Position relative de la pomme en X |
| nourriture_dy | -1/0/1 | Position relative de la pomme en Y |

#### Parametres d'apprentissage :
| Parametre | Symbole | Valeur | Role |
|-----------|---------|--------|------|
| Taux d'apprentissage | alpha | 0.1 | Pondere la mise a jour de la Q-table |
| Facteur de reduction | gamma | 0.9 | Importance des recompenses futures |
| Epsilon initial | epsilon | 1.0 | Exploration maximale au debut |
| Epsilon minimum | epsilon_min | 0.01 | Exploration minimale apres decay |
| Decay d'epsilon | epsilon_decay | 0.995 | Reduction progressive de l'exploration |

#### Recompenses :
- **Manger une pomme** : `+10`
- **Collision (mur ou corps)** : `-10`
- **Chaque pas** : `-0.01`

### 2. Visualisation (Pygame)

Apres l'entrainement, un episode d'evaluation est lance avec `epsilon=0` (exploitation pure).
L'animation affiche la carte, le snake complet (tous les segments), la pomme, et la taille actuelle.

---

## Classes principales

| Classe | Role |
|--------|------|
| **`Snake`** | Agent : position, deplacement relatif, croissance, detection auto-collision |
| **`Environment`** | Grille, placement aleatoire de la pomme, detection collisions murs |
| **`QLearningAgent`** | Q-learning : encodage d'etat, choix d'action epsilon-greedy, mise a jour Q-table, decay |
| **`Trainer`** | Boucle d'entrainement et mode evaluation |
| **`Visualizer`** | Affichage Pygame avec gestion des evenements et FPS |

---

## Lancer le projet

### 1. Installer les dependances

```bash
pip install pygame pytmx numpy
```

### 2. Lancer l'entrainement

```bash
python main.py
```

### 3. Lancer les tests

```bash
pytest test/
```

---

## Concepts utilises

* **Q-Learning** : apprentissage tabulaire base sur l'equation de Bellman
* **Epsilon-greedy avec decay** : exploration forte au debut, exploitation progressive
* **Etat relatif** : representation compacte basee sur les dangers et la direction de la nourriture
* **Actions relatives** : tout droit / tourner a droite / tourner a gauche (empeche les demi-tours)

---

## Ameliorations possibles

* Sauvegarde/chargement de la Q-table (`numpy.save` / `numpy.load`)
* Graphiques matplotlib pour suivre l'evolution des recompenses
* Passage a **Deep Q-Learning (DQN)** avec PyTorch pour gerer un espace d'etats plus riche
* Ajout d'obstacles sur la carte

---

## Licence

Projet libre a usage educatif.
