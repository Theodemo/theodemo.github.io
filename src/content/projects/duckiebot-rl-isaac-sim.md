---
featured: true
title: "Duckiebot RL – Isaac Sim Lab"
description: >-
  Stage de fin d'études chez Scalian — entraînement par renforcement d'un Duckiebot dans NVIDIA Isaac Sim Lab et déploiement sim-to-real sur le robot physique via ROS
image: '@assets/projects/duckiebot-rl-isaac-sim/main.png'
startDate: 2025-12-01
endDate: 2026-05-29
skills:
  - Python
  - Reinforcement Learning
  - NVIDIA Isaac Sim
  - PyTorch
  - ROS
  - Software Development
---

# Simulation et guidage de véhicule par apprentissage par renforcement

Stage de fin d'études (6 mois) effectué au sein du **Centre d'Excellence Simulation & IA** de **Scalian Rennes**, dans le cadre du projet R&D interne **SIGMA**. Le but : éprouver la chaîne **NVIDIA Isaac Sim Lab → robot réel** sur un véhicule terrestre, le **Duckiebot DB21J**, et mesurer la fiabilité du transfert sim-to-real.

---

## Contexte

L'apprentissage par renforcement (RL) permet à un agent d'apprendre des comportements complexes par interaction avec son environnement, sans programmation explicite. Mais l'entraînement direct sur un robot physique est coûteux, risqué pour le matériel et difficilement parallélisable. La simulation répond à ces contraintes — encore faut-il que les politiques apprises transfèrent correctement au monde réel.

Deux stages précédents (Olivier Meyer 2022, Maxime Baudet 2023) avaient exploré la démarche sur des cas aérospatiaux simulés (Unreal Engine, Simulink). Ce stage étend SIGMA à un **véhicule terrestre réel**, avec rendu *ray-tracing* temps réel et simulation physique GPU-accélérée (Isaac Sim Lab).

## Problématique

> *Comment exploiter Isaac Sim Lab pour développer un framework de navigation autonome généralisable, et quelles configurations maximisent la qualité du transfert sim-to-real vers un Duckiebot ?*

## Objectifs atteints

- **Suivi de voie** : entraînement d'un agent PPO capable de suivre la ligne jaune en continu.
- **Évitement d'obstacles** : navigation continue avec contournement de cylindres positionnés aléatoirement sur la piste.
- **Pipeline sim-to-real complet** : export ONNX/PyTorch des politiques, nœud ROS d'inférence sur le Duckiebot physique.

## Stack technique

- **Simulation** : NVIDIA Isaac Sim, Isaac Lab (modélisation USD du Duckiebot et des pistes Duckietown).
- **Frameworks RL testés** : Stable Baselines 3, SKRL, RSL-RL, RL-Games, Ray RLlib.
- **Algorithme** : PPO sur politiques MLP, CNN (NatureCNN) et MultiInput (image + ToF).
- **Robot** : Duckiebot DB21J (Raspberry Pi, caméra fisheye, capteur ToF, IMU) sous ROS.
- **Outils** : Optuna pour le tuning d'hyperparamètres, TensorBoard pour le suivi des métriques.

## Architecture modulaire

Pour permettre une comparaison systématique des configurations, j'ai conçu un environnement RL où chaque brique est interchangeable via un simple YAML :

| Brique | Implémentations disponibles |
|--------|------------------------------|
| **Récompenses** | `lane_following`, `obstacle_avoidance`, `wheelie`, `goal_navigator` |
| **Observations** | offset HSV (Kornia/GPU), RGB CNN, masque jaune, RGB+ToF, IMU, dead-reckoning |
| **Terminaisons** | `line_lost`, `off_track`, `stuck`, `goal_reached` |
| **Spawn** | fixe, uniforme, waypoints, *curriculum* |
| **Scènes** | piste RC, piste ovale avec obstacles aléatoires, scan track |

Chaque expérience est définie comme une entrée nommée dans un *batch runner* qui versionne configs et logs (`YYYY-MM-DD_HHhMM_<nom>`), pour archiver et comparer chaque run indépendamment.

## Sim-to-Real

```
Isaac Sim (entraînement) → Export ONNX/PT → Docker → Duckiebot (ROS)
```

Le nœud `wheel_control` reproduit exactement le pipeline d'observation utilisé en simulation (HSV jaune, masque CNN ou ToF), exécute l'inférence du réseau de politique et publie les commandes moteur sur `/duckiebot/wheels_driver_node/wheels_cmd`.

## Livrables

- Framework RL modulaire réutilisable sur de futurs projets clients (notamment **COLIBOT** pour la DGA — IA embarquée pour le guidage d'un colis aérolargué).
- Guide d'utilisation et retour d'expérience capitalisés pour les équipes Scalian.
- Rapport de stage et soutenance ENIB.

## Encadrement

Stage encadré par **Florian Regnault** et **Maxime Broy** chez Scalian Rennes, dans le cadre de la 5ᵉ année à l'**École Nationale d'Ingénieurs de Brest (ENIB)**.
