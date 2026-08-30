import type { LoggerMessage, Worker } from "tesseract.js";

export type PrivacyOcrLanguage = "eng" | "eng+chi_sim";

let activeLanguage: PrivacyOcrLanguage | null = null;
let activeWorkerPromise: Promise<Worker> | null = null;
let progressListener: ((message: LoggerMessage) => void) | null = null;
let operationQueue: Promise<void> = Promise.resolve();
let workerGeneration = 0;

export const PRIVACY_OCR_RECOGNITION_TIMEOUT_MS = 45_000;

export class PrivacyOcrTimeoutError extends Error {
  constructor() {
    super("Local OCR recognition timed out.");
    this.name = "PrivacyOcrTimeoutError";
  }
}

async function terminateActiveWorker() {
  const workerPromise = activeWorkerPromise;
  activeWorkerPromise = null;
  activeLanguage = null;
  progressListener = null;
  if (!workerPromise) return;
  try {
    const worker = await workerPromise;
    await worker.terminate();
  } catch {
    // A failed initialization has no reusable worker to preserve.
  }
}

/**
 * Cancels the active OCR work immediately instead of waiting behind the serialized queue.
 * Tesseract has no per-recognition AbortSignal, so terminating the worker is the only reliable
 * way to recover a mobile browser from a stalled WASM recognition call.
 */
export function cancelPrivacyOcrWorker() {
  workerGeneration += 1;
  const workerPromise = activeWorkerPromise;
  activeWorkerPromise = null;
  activeLanguage = null;
  progressListener = null;
  if (!workerPromise) return Promise.resolve();
  return workerPromise.then((worker) => worker.terminate()).catch(() => undefined);
}

export async function withPrivacyOcrTimeout<T>(
  operation: Promise<T>,
  timeoutMs = PRIVACY_OCR_RECOGNITION_TIMEOUT_MS,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          void cancelPrivacyOcrWorker();
          reject(new PrivacyOcrTimeoutError());
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function getWorker(language: PrivacyOcrLanguage) {
  if (activeWorkerPromise && activeLanguage !== language) await terminateActiveWorker();
  if (!activeWorkerPromise) {
    activeLanguage = language;
    activeWorkerPromise = import("tesseract.js").then(({ createWorker, OEM }) => createWorker(
      language === "eng" ? "eng" : ["eng", "chi_sim"],
      OEM.LSTM_ONLY,
      {
        workerPath: "/generated/privacy-ocr/worker.min.js",
        corePath: "/generated/privacy-ocr/core",
        langPath: "/generated/privacy-ocr/lang",
        // Read and write Tesseract's browser cache. The previous per-scan `none` setting forced
        // every language pack and runtime initialization to start over on mobile Safari.
        cacheMethod: "write",
        logger: (message) => progressListener?.(message),
      },
    )).catch((error) => {
      activeWorkerPromise = null;
      activeLanguage = null;
      throw error;
    });
  }
  return activeWorkerPromise;
}

/**
 * Serializes OCR work through one session-level worker. Reusing the worker keeps the WASM runtime
 * and language data warm across image/PDF scans without allowing two components to race the same
 * Tesseract instance.
 */
export function withPrivacyOcrWorker<T>(
  language: PrivacyOcrLanguage,
  onProgress: (message: LoggerMessage) => void,
  task: (worker: Worker) => Promise<T>,
) {
  const requestedGeneration = workerGeneration;
  const result = operationQueue.catch(() => undefined).then(async () => {
    if (requestedGeneration !== workerGeneration) throw new Error("Local OCR was cancelled.");
    progressListener = onProgress;
    try {
      const worker = await withPrivacyOcrTimeout(getWorker(language));
      if (requestedGeneration !== workerGeneration) throw new Error("Local OCR was cancelled.");
      return await task(worker);
    } catch (error) {
      await terminateActiveWorker();
      throw error;
    } finally {
      progressListener = null;
    }
  });
  operationQueue = result.then(() => undefined, () => undefined);
  return result;
}

export function disposePrivacyOcrWorker() {
  return cancelPrivacyOcrWorker();
}
