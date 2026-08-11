---
id: trading-engine-part-1
title: "Part 1: Foundations — Market Data & the Indicator Framework"
date: 2026-08-11
part: 1
tags: [C++, CMake, Market Data, Indicators, Testing]
summary: A deep dive into what's built so far — the CSV and market data pipeline, the indicator abstraction, five implemented indicators, and 338 tests.
---

This is the first post of the [Trading Engine series](blog.html?series=trading-engine). If you haven't read the [project overview](blog.html?post=trading-engine-overview) yet, it's worth a quick skim — this post assumes you know *why* the engine exists and focuses on *what exists today*.

## The state of the project

The repository (48 commits at the time of writing) is organized as a set of loosely coupled CMake libraries under the `TradingEngine` namespace. Here's where each piece stands:

- **CSV parser** (`Core/CSV`) — Complete: line parser, reader, input iterator, 51 tests
- **Market data types** (`MarketData/Domain`) — Complete: `Candle`, `CandleSeries`, `TimeFrame`, 65 tests
- **Data loading** (`MarketData/Loaders`) — Complete: generic `load_series` template
- **CSV provider** (`MarketData/Providers`) — Complete: column mapping, timestamp parsing, validation, 48 tests
- **Indicator framework** (`Indicators/Domain`) — Complete: `IIndicator` interface, signal types
- **Indicators: SMA, EMA, ATR, MACD, RSI** — Complete: 124 tests across the five
- **Indicator manager** — Complete: owns and drives indicators, 14 tests
- **Build system & CI** — Complete: CMake, GCC/Clang matrix, format checks
- **Back-testing, strategies, optimization** — Planned

That's **338 unit tests across 10 suites** — and the number matters, because the whole project is a test-driven engineering exercise as much as a trading system.

## The data foundation

Everything upstream depends on two things: a way to read candle data, and a well-defined `Candle` type.

### Core types

`Core::Timestamp` is `std::chrono::sys_time<std::chrono::milliseconds>` — millisecond-precision wall time, with `make_timestamp` and parse helpers in `Core`. The `Candle` struct carries open, high, low, close, an optional volume, and a timestamp:

```cpp
struct Candle {
  Price open, high, low, close;
  std::optional<int> volume;
  Core::Timestamp timestamp;

  bool validate() const noexcept;  // finiteness + high/low/open/close consistency
  bool is_bullish() const noexcept;
  Price typical_price() const noexcept;   // (low + high + close) / 3
};
```

`Candle::validate()` is a nice touch: every candle that enters the system is checked for internal consistency (high >= max(open, close), low <= min(open, close), non-negative volume, finite prices). Garbage data gets rejected at the boundary, not deep inside a back-test.

`CandleSeries` wraps a `std::vector<Candle>` plus a `TimeFrame` (`M10` … `W1`) — the engine targets 4-hour candles, and the type system keeps the timeframe explicit everywhere.

### Reading CSV the C++20 way

The CSV module was the first real engineering milestone. `CSVReader` exposes a nested input iterator paired with `std::default_sentinel`, so you read files with plain range-for and get lazy streaming instead of slurping the whole file into memory:

```cpp
CSVReader reader{"EURUSD_H4.csv"};   // header parsed automatically
for (const auto &row : reader) {
  // each row is a std::vector<std::string>
}
```

Design details worth stealing: CRLF handling in the line parser, `reset()` for re-reading, `get_header()` access, and a separate `CSVLineParser` so parsing logic is testable in isolation.

### The provider abstraction

`MarketData` defines a `HistoricalRange` concept — anything that is a range of `Candle`s. `load_series` is a tiny template that drains any provider into a `CandleSeries`:

```cpp
template <HistoricalRange Provider>
CandleSeries load_series(Provider &provider, TimeFrame time_frame);
```

The first real provider is `CSVProvider`, and it's more than a thin CSV wrapper. It takes a `CSVImporterConfiguration` with a `ColumnMapping` (which column is timestamp, open, high, low, close, volume), a configurable `TimestampParser` (`std::function`), delimiter, and header flag. Columns are bounds-checked, the timestamp format `YYYY-MM-DD HH:MM` is validated, and every parsed row becomes a `Candle` that must pass `validate()` or the read throws. Bad data fails loudly — never silently.

## The indicator framework

This was the second major milestone and where the architecture starts to pay off. The domain defines a clean interface:

```cpp
class IIndicator {
public:
  virtual ~IIndicator() = default;
  virtual std::optional<IndicatorResult> update(const MarketData::Candle &) = 0;
  [[nodiscard]] virtual const InputRequirements &requirements() const = 0;
  [[nodiscard]] virtual SignalType signal_type() const noexcept = 0;
};
```

`IndicatorResult` carries an `IndicatorId`, the candle's timestamp, and a `SignalOutput` — two doubles (`signal1`, `signal2`) that comfortably fit everything from a single line (EMA, ATR) to a pair (MACD line + signal, RSI + threshold). `InputData` and `SignalType` enums describe what an indicator eats (`Close`, `High`…) and how its signals are consumed (`ZeroCross`, `TwoLineCross`, `PriceCross`, `ThresholdCross`) — metadata the future NNFX strategy and signal engine will rely on.

`IndicatorManager` owns `std::unique_ptr<IIndicator>`s and fans each candle out to all of them:

```cpp
std::vector<std::optional<IndicatorResult>> update_all(const MarketData::Candle &);
```

The `std::optional` return is the key convention: indicators return `nullopt` during their **warm-up window** instead of inventing garbage values. A back-tester can skip results honestly, and a strategy never trades on a half-warmed indicator.

### What's implemented

- **SMA** — simple rolling average over a window.
- **EMA** — with a configurable smoothing factor; `alpha = smoothing / (1 + period)`, seeded on the first value.
- **ATR** — true range over a rolling window, computed in **O(1) per candle** by maintaining a running sum over a `boost::circular_buffer` instead of re-summing the window.
- **MACD** — composed of three EMAs (fast, slow, signal), with a constructor that rejects `fast >= slow` at the boundary.
- **RSI** — three variants: the classic Wilder smoothing, exponential, and a simple version, all sharing the `IIndicator` interface.

Composition over inheritance is visible here: MACD is built *from* EMAs rather than re-implementing smoothing, and each variant of RSI is a small, independently testable class.

## The testing discipline

Every public component ships with a GoogleTest suite. The tests go beyond happy paths: ATR tests cover warm-up semantics, rolling window updates, zero and negative prices, large swings, and death tests for invalid periods. The CSV provider tests verify column mapping bounds, malformed timestamps, and candle validation. As of today there are 338 tests, all green on CI.

## Build & CI

The build system was treated as infrastructure, not afterthought: CMake with `FetchContent` for GoogleTest, spdlog, and Eigen, Boost for the circular buffer and future networking, and a `format` target wired to clang-format. The GitHub Actions pipeline runs **Debug and Release × GCC and Clang**, plus tests and format checks on every push — the same rigor you'd expect from a commercial codebase.

## What's next

With data plumbing and indicators done, the engine's core loop is in place. Next on the list:

- **Deterministic back-testing** — chronological simulation, no look-ahead bias, reproducible results
- **The NNFX strategy** — baseline + confirmation + volume indicators, ATR-based stops, position sizing
- **Parameter optimization** and performance statistics
- **MetaTrader 5 integration**, then a Raspberry Pi deployment

I'll document each of those as it lands. In the meantime, the code lives on GitHub, and the full project requirements and vision are tracked in the repository's `docs/` folder.
