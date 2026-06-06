---
id: fuzzy-logic-rust
title: Building a Fuzzy Logic Library in Rust
date: 2025-06-01
part: 1
tags: [Rust, Fuzzy Logic, Control Systems]
summary: How I built fuzzy-logic_rs — a type-I fuzzy logic library in Rust — what I learned, and where it's headed next.
---

Fuzzy logic has always fascinated me. Unlike crisp Boolean logic, it handles the messy in-between states that real physical systems live in. A motor isn't just on or off — it's running at 73% capacity under a light load. Fuzzy controllers capture that nuance naturally.

## Why Rust?

I wanted something fast enough to run on embedded targets and safe enough that I wouldn't spend weekends debugging memory corruption. Rust's ownership model enforces the discipline at compile time. That trade-off paid off — the library compiles to a small binary with zero runtime allocations in its hot path.

## How it works

The core of any fuzzy system is three steps: **fuzzification** (mapping crisp inputs to membership degrees), **rule evaluation** (applying the rule base), and **defuzzification** (collapsing the fuzzy output back to a crisp value). I implemented all three, with centroid defuzzification as the default.

The API looks roughly like this:

```rust
let mut system = FuzzySystem::new();
system.add_input("temperature", vec![
    MembershipFn::triangle("cold", 0.0, 10.0, 20.0),
    MembershipFn::triangle("warm", 15.0, 25.0, 35.0),
]);
system.add_rule("IF temperature IS warm THEN fan IS medium");
let output = system.evaluate(&[("temperature", 22.0)]);
```

## What's next

The library currently handles type-I systems. Type-II fuzzy systems — where membership functions are themselves fuzzy — are on the roadmap. They're significantly more powerful for handling uncertainty, which matters a lot in ADAS applications.

You can find the crate on [crates.io](https://crates.io/crates/fuzzy-logic_rs). Contributions and issues are very welcome.
