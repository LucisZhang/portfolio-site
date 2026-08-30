import assert from "node:assert/strict";
import test from "node:test";
import {
  COUNT_UP_DURATION_MS,
  countUpValueAtElapsed,
  formatCountUpValue,
  startCountUp,
} from "../src/lib/count-up";

test("count-up uses the single allowed 400ms duration and clamps its progress", () => {
  assert.equal(COUNT_UP_DURATION_MS, 400);
  assert.equal(countUpValueAtElapsed(10, 30, -1), 10);
  assert.equal(countUpValueAtElapsed(10, 30, 200), 20);
  assert.equal(countUpValueAtElapsed(10, 30, 400), 30);
  assert.equal(countUpValueAtElapsed(10, 30, 800), 30);
});

test("count-up formatting preserves prefixes, suffixes, and requested precision", () => {
  assert.equal(formatCountUpValue(35.678, { decimals: 2, prefix: "$" }), "$35.68");
  assert.equal(formatCountUpValue(99.05, { decimals: 2, suffix: "%" }), "99.05%");
});

test("reduced motion and a missing observer render the final value directly", () => {
  for (const runtime of [
    { reducedMotion: true, observe: () => assert.fail("must not observe") },
    { reducedMotion: false },
  ]) {
    const values = [];
    const stop = startCountUp({
      start: 0,
      end: 99,
      onValue: (value) => values.push(value),
      runtime: {
        now: () => 0,
        requestFrame: () => assert.fail("must not schedule a frame"),
        cancelFrame: () => assert.fail("must not cancel a frame"),
        ...runtime,
      },
    });
    assert.deepEqual(values, [99]);
    stop();
  }
});

test("entering the viewport starts one 400ms run and cleanup cancels pending work", () => {
  const values = [];
  const frames = [];
  const cancelled = [];
  let enter = () => {};
  let disconnected = 0;
  const stop = startCountUp({
    start: 10,
    end: 30,
    onValue: (value) => values.push(value),
    runtime: {
      reducedMotion: false,
      observe: (callback) => {
        enter = callback;
        return () => { disconnected += 1; };
      },
      now: () => 0,
      requestFrame: (callback) => {
        frames.push(callback);
        return frames.length;
      },
      cancelFrame: (frame) => cancelled.push(frame),
    },
  });

  assert.deepEqual(values, [10]);
  enter();
  enter();
  assert.equal(disconnected, 1);
  assert.equal(frames.length, 1);
  frames.shift()(200);
  assert.equal(values.at(-1), 20);
  assert.equal(frames.length, 1);
  frames.shift()(400);
  assert.equal(values.at(-1), 30);
  assert.equal(frames.length, 0);

  stop();
  assert.deepEqual(cancelled, []);
});

test("cleanup before completion disconnects observation and cancels the active frame", () => {
  let enter = () => {};
  const cancelled = [];
  const stop = startCountUp({
    start: 0,
    end: 1,
    onValue: () => {},
    runtime: {
      reducedMotion: false,
      observe: (callback) => {
        enter = callback;
        return () => {};
      },
      now: () => 0,
      requestFrame: () => 17,
      cancelFrame: (frame) => cancelled.push(frame),
    },
  });
  enter();
  stop();
  assert.deepEqual(cancelled, [17]);
});
