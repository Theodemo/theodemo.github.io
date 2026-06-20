---
featured: true
title: "Duckiebot RL – Isaac Sim Lab"
description: >-
  End-of-studies internship at Scalian — training a Duckiebot with reinforcement learning in NVIDIA Isaac Sim Lab and deploying it sim-to-real on the physical robot via ROS
image: '@assets/projects/duckiebot-rl-isaac-sim/main.png'
startDate: 2025-12-01
endDate: 2026-05-29
skills:
  - Reusable Simulation Pipeline
  - Reinforcement Learning (PPO)
  - Sim-to-Real Transfer
  - NVIDIA Isaac Sim / Isaac Lab
  - PyTorch / Stable-Baselines3
  - ROS
  - Python
---

# Vehicle simulation and guidance through reinforcement learning

Six-month end-of-studies internship carried out within the **Simulation & AI Center of Excellence** at **Scalian Rennes**, as part of the internal R&D project. The goal: build a **reusable simulation-to-reality pipeline** — from training in **NVIDIA Isaac Sim Lab** to deployment on the **real robot** — on a ground vehicle, the **Duckiebot DB21J**, and measure how reliably learned policies transfer from simulation to reality.

---

## Context

Reinforcement learning (RL) lets an agent learn complex behaviors by interacting with its environment, without explicit programming. But training directly on a physical robot is expensive, risky for the hardware and hard to parallelize. Simulation answers those constraints — provided the learned policies actually transfer to the real world.

## Problem statement

> *How can Isaac Sim Lab be leveraged to build a generalizable autonomous-navigation framework, and which configurations maximize the quality of sim-to-real transfer to a Duckiebot?*

## How reinforcement learning works

An RL agent learns through an interaction loop: it observes the state of its environment (camera image, front distance, speed…), picks an action according to its **policy** (wheel commands), receives the new state plus a scalar **reward**, and adjusts its policy to maximize future rewards.

![Agent–environment interaction loop in RL](/images/projects/duckiebot-rl-isaac-sim/rl-loop.png)

The whole internship focused on **PPO** (*Proximal Policy Optimization*), an Actor–Critic *policy-gradient* algorithm that has become a standard for its balance of stability, simplicity and performance. PPO natively handles the continuous wheel commands through a Gaussian policy, and its hallmark *clipping* mechanism bounds each update so a single step can't collapse the policy — a robustness that proved invaluable in an exploratory workflow where one factor was changed at a time.

![PPO Actor–Critic scheme](/images/projects/duckiebot-rl-isaac-sim/ppo-scheme.png)

## NVIDIA Isaac Sim & Isaac Lab

Isaac Sim is NVIDIA's robotics simulation platform, built on Omniverse and the PhysX 5 engine. The stack is layered: Omniverse provides the low-level building blocks, Isaac Sim adds the robotics layer, and Isaac Lab adds the RL-specific layer on top. Compared to classic simulators (Gazebo, Webots…), it stands out with photorealistic ray-traced rendering, GPU-accelerated physics enabling hundreds of parallel environments, and the USD format.

![NVIDIA Isaac layered architecture](/images/projects/duckiebot-rl-isaac-sim/nvidia-stack.png)

PPO is *on-policy*: it only uses data freshly collected by the current policy, which demands a large volume of simulation. Isaac Lab's GPU parallelization answers this — with 14 environments rendered in parallel (the GPU-memory limit for camera rendering), a rollout is collected in seconds instead of minutes, bringing a full training run down from days to hours.

![Several Duckiebots and their Duckietown tracks rendered in parallel in Isaac Sim](/images/projects/duckiebot-rl-isaac-sim/isaac-sim-parallel.png)

## The Duckietown platform & the Duckiebot DB21J

Duckietown is an educational and research platform for autonomous driving, launched in 2016 by MIT, ETH Zurich and the Duckietown Foundation. It reproduces road-traffic rules in miniature (lane markings, signs, traffic lights) on a low-cost robot (≈ $350) to make autonomous-navigation research reproducible, comparable and accessible.

![Overview of a Duckietown track](/images/projects/duckiebot-rl-isaac-sim/duckietown-track.png)

The **Duckiebot DB21J** is a two-wheel differential robot with a wide-angle camera and a front Time-of-Flight (ToF) distance sensor, running an NVIDIA Jetson Nano that allows on-board neural-network inference. Crucially, it has **no absolute-localization sensor** (no GPS, no external positioning).

The robot was received as a kit. Assembling it gave a fine-grained understanding of the hardware — exact camera and ToF placement, chassis geometry, masses — which later proved essential for the USD modeling in Isaac Sim.

![Duckiebot DB21J assembly, step 1](/images/projects/duckiebot-rl-isaac-sim/assembly-1.png)
![Duckiebot DB21J assembly, step 2](/images/projects/duckiebot-rl-isaac-sim/assembly-2.png)
![Duckiebot DB21J assembly, step 3](/images/projects/duckiebot-rl-isaac-sim/assembly-3.png)

## Modeling the Duckiebot in Isaac Sim

Modeling started from Isaac Sim's **Jetbot** as a template — a small differential robot whose structure (two driven wheels, rear caster, front camera) is very close to the Duckiebot. The 3D meshes of the DB21J parts come from the Duckietown GitHub repository, prepared in Blender (each part isolated, origin recentered on its rotation axis) before import.

![Simulated scene: the modeled Duckiebot (left) vs. the Isaac Sim Jetbot used as a template (right)](/images/projects/duckiebot-rl-isaac-sim/duckiebot-vs-jetbot.png)
![USD model of the Duckiebot in Isaac Sim: rigid bodies, joints and collision volumes](/images/projects/duckiebot-rl-isaac-sim/duckiebot-usd.png)

Several USD scenes were built for the different tasks: a closed track with a yellow lane for *lane following*, an arena with cylinders for *obstacle avoidance*, and a scene 3D-scanned from a real environment, meant to bring the simulation closer to deployment conditions.

![USD scenes: closed yellow-lane track, cylinder arena, 3D-scanned real environment](/images/projects/duckiebot-rl-isaac-sim/scene-rc-track.png)
![Oval arena with cylinders](/images/projects/duckiebot-rl-isaac-sim/scene-oval.png)
![3D-scanned scene of a real environment](/images/projects/duckiebot-rl-isaac-sim/scene-scan.png)

<figure>
  <video src="/images/projects/duckiebot-rl-isaac-sim/scan-scene-1.mp4" autoplay loop muted playsinline controls></video>
  <figcaption>Driving inside the 3D-scanned scene, designed to narrow the sim-to-real gap.</figcaption>
</figure>

<figure>
  <video src="/images/projects/duckiebot-rl-isaac-sim/scan-scene-2.mp4" autoplay loop muted playsinline controls></video>
  <figcaption>Another pass through the scanned environment.</figcaption>
</figure>

## Modular software architecture

To compare configurations systematically, I designed an RL environment where each building block is swappable from a single YAML file. Changing a component is a one-line edit:

| Block | Available implementations |
|--------|------------------------------|
| **Rewards** | `lane_following`, `obstacle_avoidance`, `wheelie`, `goal_navigator` |
| **Observations** | HSV offset (Kornia/GPU), RGB CNN, yellow mask, RGB+ToF, IMU, dead-reckoning |
| **Terminations** | `line_lost`, `off_track`, `stuck`, `goal_reached` |
| **Spawn** | fixed, uniform, waypoints, *curriculum* |
| **Scenes** | RC track, oval track with random obstacles, scan track |

Each component follows the same scheme: an abstract base class, separate implementations with a `@dataclass` config, an `Enum` registry mapping names to classes, a factory, and a YAML `type:` selector. A **batch runner** then chains many runs unattended, versioning configs and logs as `YYYY-MM-DD_HHhMM_<name>` so every experiment is archived and comparable independently.

### Policy network & feature maps

For image-based observations, the policy uses the **NatureCNN** architecture: a convolutional feature extractor that "reads" the image, followed by an MLP that "decides" the wheel commands. The edges → shapes → objects hierarchy isn't hand-coded — it emerges from training. The activation maps below highlight the visual cues the network reacts to (center line, obstacles).

![CNN feature maps: input views (top) and activation maps (bottom) — warm areas mark the patterns the network reacts to](/images/projects/duckiebot-rl-isaac-sim/cnn-feature-maps.png)

### Hyperparameter tuning & run comparison

**Optuna** (Bayesian optimization) was used to tune PPO hyperparameters — mostly to *rule out a doubt* when a configuration underperformed, confirming the issue was a design choice rather than a bad setting.

![Hyperparameter importance ranking produced by Optuna](/images/projects/duckiebot-rl-isaac-sim/optuna.png)

To keep up with the growing number of runs, I built an interactive **Streamlit** dashboard that auto-discovers runs, reads their TensorBoard logs and overlays learning curves, filters by configuration, and visualizes top-down robot trajectories — decisive for judging a configuration change at a glance.

![Streamlit dashboard: run list with filters and overlaid learning curves](/images/projects/duckiebot-rl-isaac-sim/dashboard-1.png)
![Top-down visualization of robot trajectories](/images/projects/duckiebot-rl-isaac-sim/dashboard-2.png)

## Task 1 — Lane following

The simplest of the three tasks: the robot must stay centered on a dashed yellow line on a closed track. The line position in the field of view is estimated by elementary image processing (HSV segmentation of yellow pixels) and fed, with a detection flag, to an MLP. A curriculum spawn (fixed, then random) and an early termination on a long-lost line completed the reference configuration.

![Training scene for lane following](/images/projects/duckiebot-rl-isaac-sim/task-lane.png)

<figure>
  <video src="/images/projects/duckiebot-rl-isaac-sim/lane-step-0.mp4" autoplay loop muted playsinline controls></video>
  <figcaption>Start of training (step 0): the untrained policy wanders off the line.</figcaption>
</figure>

<figure>
  <video src="/images/projects/duckiebot-rl-isaac-sim/lane-trained.mp4" autoplay loop muted playsinline controls></video>
  <figcaption>After training: the agent follows the yellow line continuously.</figcaption>
</figure>

An ablation study (one element changed at a time) confirmed the role of each ingredient: the **speed reward** is the motor term (without it the robot learns to stand still), the **centering penalty** is the most critical (lateral error jumps from 4 cm to 53 cm without it), and replacing the preprocessed offset by a raw CNN-on-image observation failed to converge within the available step budget.

<figure>
  <video src="/images/projects/duckiebot-rl-isaac-sim/lane-real.mp4" autoplay loop muted playsinline controls></video>
  <figcaption>Sim-to-real: the reference policy following the yellow line on the physical Duckiebot.</figcaption>
</figure>

## Task 2 — Obstacle avoidance

The robot must drive continuously in an arena of cylinders whose positions are reshuffled every 5 episodes, without colliding. Perception here relies on the front **ToF** sensor rather than the camera — a compact representation that both learns faster and transfers better than a raw image.

![Training scene for obstacle avoidance](/images/projects/duckiebot-rl-isaac-sim/task-obstacle.png)

<figure>
  <video src="/images/projects/duckiebot-rl-isaac-sim/obstacle-sim-1.mp4" autoplay loop muted playsinline controls></video>
  <figcaption>Obstacle avoidance in simulation (~378k steps).</figcaption>
</figure>

<figure>
  <video src="/images/projects/duckiebot-rl-isaac-sim/obstacle-sim-2.mp4" autoplay loop muted playsinline controls></video>
  <figcaption>Later in training (~448k steps): smoother, more confident avoidance.</figcaption>
</figure>

**Sim-to-real deployment.** The ToF-only policy was then exported and run on the physical Duckiebot. It avoids obstacles placed in front of it, with behavior comparable to simulation — the trade-off of the single front sensor being that anything outside the ToF's frontal beam goes undetected.

<figure>
  <video src="/images/projects/duckiebot-rl-isaac-sim/obstacle-real.mp4" autoplay loop muted playsinline controls></video>
  <figcaption>Sim-to-real: the obstacle-avoidance policy (~448k steps) running on the real Duckiebot.</figcaption>
</figure>

<figure>
  <video src="/images/projects/duckiebot-rl-isaac-sim/obstacle-cnn.mp4" autoplay loop muted playsinline controls></video>
  <figcaption>CNN-based observation variant (RGB + distance) — degraded the behavior and never transferred to the real robot.</figcaption>
</figure>

### Reward hacking

A recurring pitfall of RL: the agent finds a shortcut that maximizes the reward without doing the intended task. Here the robot learned to **spin in place** to farm the speed reward while never approaching an obstacle. Adding an angular-velocity penalty fixed it; the ablation reproduces the pathology exactly (≈ 13.9 rad/s without the penalty vs. ≈ 1.0 in the reference).

<figure>
  <video src="/images/projects/duckiebot-rl-isaac-sim/reward-hacking-spin.mp4" autoplay loop muted playsinline controls></video>
  <figcaption>Reward hacking: spinning in place to game the speed reward.</figcaption>
</figure>

<figure>
  <video src="/images/projects/duckiebot-rl-isaac-sim/reward-hacking-obstacle.mp4" autoplay loop muted playsinline controls></video>
  <figcaption>Another reward-hacking run on the obstacle-avoidance task.</figcaption>
</figure>

## Task 3 — Goal navigation

The hardest task: the robot must reach a point it cannot see in its field of view, relying solely on its own position estimate (*dead reckoning* — integrating wheel speeds and orientation, which drifts over time). The observation is a 6-value vector (goal vector, distance, estimated heading, front ToF) fed to an MLP, with periodic randomization of both obstacles and the goal point.

![Training scene for goal navigation](/images/projects/duckiebot-rl-isaac-sim/task-goal.png)

<figure>
  <video src="/images/projects/duckiebot-rl-isaac-sim/goal-early.mp4" autoplay loop muted playsinline controls></video>
  <figcaption>Goal navigation, early episode.</figcaption>
</figure>

<figure>
  <video src="/images/projects/duckiebot-rl-isaac-sim/goal-trained.mp4" autoplay loop muted playsinline controls></video>
  <figcaption>Goal navigation, later episode: the agent heads toward the target while avoiding obstacles.</figcaption>
</figure>

A known limitation remains: the arrival bonus is paid at *every* step inside the goal zone, so the agent can accumulate it by hovering near the target rather than parking precisely (final distance ≈ 0.15 m for a 0.09 m threshold). With more time, this term would have been reworked.

## Sim-to-Real

```
Isaac Sim (training) → ONNX/PT export → Docker → Duckiebot (ROS)
```

The `wheel_control` node reproduces exactly the observation pipeline used in simulation (HSV yellow, CNN mask or ToF), runs the policy network inference and publishes motor commands on `/duckiebot/wheels_driver_node/wheels_cmd`.

The deployment yielded qualitative — but decisive — lessons:

- **Lane following** transferred well; the top-crop observation effectively suppressed false detections from ceiling lighting.
- **Obstacle avoidance** worked for obstacles in front of the robot, but the single front ToF can't see anything outside its frontal beam, so lateral obstacles cause collisions with no avoidance attempt.
- **Goal navigation** did not reproduce its simulated behavior on the real robot — the exact cause couldn't be identified within the internship timeframe.

![Deploying the obstacle-avoidance policy on the real Duckiebot](/images/projects/duckiebot-rl-isaac-sim/sim2real-collision.png)

Several ablations were actually *driven by* the real robot: the anti-jerk penalty (real motors handle abrupt command changes poorly) and the curriculum spawn (the real robot initially only knew how to turn one way) both came from sim-to-real observations.

## Deliverables

- A reusable modular RL framework for future client projects (notably **COLIBOT** for the DGA — embedded AI for guiding an air-dropped package).
- A usage guide and lessons-learned capitalized for the Scalian teams.
- Internship report and ENIB defense.

## Supervision

Internship supervised by **Florian Regnault** and **Maxime Broy** at Scalian Rennes, as part of the 5th year at the **École Nationale d'Ingénieurs de Brest (ENIB)**.
