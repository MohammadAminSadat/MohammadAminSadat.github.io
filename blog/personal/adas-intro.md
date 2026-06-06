---
id: adas-intro
title: What I've Learned Working on ADAS Systems
date: 2025-05-10
part: 1
tags: [ADAS, Control Engineering, Automotive]
summary: Six months into working on Advanced Driver Assistance Systems — the surprises, the hard problems, and why control theory is still king.
---

I joined SoftwareMotion at the start of 2025 as an ADAS Control Engineer. Coming from robotics and fuzzy control, I expected the transition to automotive to feel natural. In many ways it did — but the scale of the safety requirements was something I hadn't fully appreciated.

## The real challenge isn't the algorithm

Every engineer working on autonomous systems quickly discovers the same thing: the algorithm is maybe 20% of the problem. The remaining 80% is validating that it behaves correctly under every edge case you can imagine, then discovering the ones you couldn't.

ISO 26262 functional safety standards exist for good reason. Every function in a safety-relevant path needs a defined ASIL level, fault detection coverage, and a way to transition to a safe state when something goes wrong.

## Control theory is still king

There's a tendency in modern robotics to reach for neural networks first. But in automotive control loops — where you need deterministic latency, formal stability guarantees, and the ability to explain behaviour to a safety auditor — classical control theory earns its place every time.

MPC (Model Predictive Control) has become my favourite tool. It's predictive, handles constraints naturally, and its cost function is interpretable. That last point matters more than people admit.

## What I'd tell my past self

Read the standards early, not after you've already designed something. And get comfortable with **MATLAB/Simulink** — love it or hate it, it's the industry lingua franca and fighting it wastes energy better spent on the actual problem.
