---
id: trading-engine-overview
title: "The NNFX Trading Engine: Project Overview & Goals"
date: 2026-08-11
part: 2
tags: [C++, Trading, Back-testing, C++20]
summary: An introduction to my algorithmic trading engine — what it is, why I'm building it, and the goals that drive every design decision.
---

Every once in a while you start a project that has to be *both* genuinely useful and a serious engineering exercise. The NNFX Trading Engine is exactly that. This post gives the overview and the goals; the detailed build log lives in the [Trading Engine series](blog.html?series=trading-engine).

## What it is

The engine is a **modular algorithmic trading platform** written in modern C++20. It implements the **No Nonsense Forex (NNFX)** trading methodology: it will download historical market data, calculate technical indicators, run deterministic back-tests, optimize parameters, and — eventually — execute trades automatically through MetaTrader 5 on a Raspberry Pi.

## Why I'm building it

The project serves two equally important purposes:

1. **A reliable trading system** — a systematic, rules-based engine capable of evaluating and trading a proven methodology without emotion, with long-term operation in mind.
2. **A C++ mastery exercise** — applying clean architecture, dependency injection, test-driven development, and CI to a real, non-trivial codebase. Every phase teaches new engineering skills, not just new features.

## Architecture

The design flows from raw market data up through indicators and strategies to back-testing and optimization, with each layer loosely coupled and exposed as an independent CMake library:

```text
Strategies → Indicators / BackTesting / Optimization
                          ↓
                       MarketData
                          ↓
              Storage / Providers / Core (types, CSV)
```

Modules live under the `TradingEngine` namespace and interact through well-defined interfaces — the goal is that swapping a data provider or adding a strategy never ripples through the whole codebase.

## Where things stand

- **Complete:** CSV parser, market data types and CSV provider, indicator framework (SMA, EMA, ATR, MACD, RSI), indicator manager, build system, CI pipeline
- **Planned:** back-testing engine, NNFX strategy, optimization, MetaTrader 5 integration, Raspberry Pi deployment

## Goals

- Implement the full NNFX methodology on 4-hour candles
- Deterministic, look-ahead-free back-testing
- Robust performance statistics and parameter optimization
- Autonomous 24/7 operation on a Raspberry Pi

The first post in the series is a deep dive into everything built so far — [read it here](blog.html?series=trading-engine), or browse the full [Trading Engine series](blog.html?series=trading-engine) for the complete build log.
