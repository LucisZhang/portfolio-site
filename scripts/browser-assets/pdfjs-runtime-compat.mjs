/*
 * Runtime compatibility required by PDF.js 6 on older iOS WebKit releases.
 *
 * Keep this file dependency-free: it is loaded in both the browser window and
 * the PDF.js module worker before either PDF.js bundle is evaluated.
 */

if (typeof Promise.withResolvers !== "function") {
  Object.defineProperty(Promise, "withResolvers", {
    configurable: true,
    writable: true,
    value() {
      let resolve;
      let reject;
      const promise = new this((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
      });
      return { promise, resolve, reject };
    },
  });
}

if (typeof Promise.try !== "function") {
  Object.defineProperty(Promise, "try", {
    configurable: true,
    writable: true,
    value(callback, ...args) {
      return new this((resolve) => resolve(callback(...args)));
    },
  });
}

if (typeof AbortSignal.any !== "function") {
  Object.defineProperty(AbortSignal, "any", {
    configurable: true,
    writable: true,
    value(signals) {
      const controller = new AbortController();
      const abort = (signal) => {
        if (!controller.signal.aborted) controller.abort(signal.reason);
      };
      for (const signal of signals) {
        if (signal.aborted) {
          abort(signal);
          break;
        }
        signal.addEventListener("abort", () => abort(signal), { once: true });
      }
      return controller.signal;
    },
  });
}

if (typeof URL.parse !== "function") {
  Object.defineProperty(URL, "parse", {
    configurable: true,
    writable: true,
    value(value, base) {
      try {
        return base === undefined ? new URL(value) : new URL(value, base);
      } catch {
        return null;
      }
    },
  });
}

if (typeof Uint8Array.fromBase64 !== "function") {
  Object.defineProperty(Uint8Array, "fromBase64", {
    configurable: true,
    writable: true,
    value(value) {
      const decoded = atob(value);
      return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
    },
  });
}

if (typeof Uint8Array.prototype.toBase64 !== "function") {
  Object.defineProperty(Uint8Array.prototype, "toBase64", {
    configurable: true,
    writable: true,
    value() {
      let binary = "";
      const chunkSize = 0x8000;
      for (let offset = 0; offset < this.length; offset += chunkSize) {
        binary += String.fromCharCode(...this.subarray(offset, offset + chunkSize));
      }
      return btoa(binary);
    },
  });
}

if (typeof Response.prototype.bytes !== "function") {
  Object.defineProperty(Response.prototype, "bytes", {
    configurable: true,
    writable: true,
    async value() {
      return new Uint8Array(await this.arrayBuffer());
    },
  });
}

/*
 * Safari can expose ReadableStream without the async-iteration surface used by
 * PDF.js getTextContent(). Playwright's bundled WebKit already implements this,
 * so keep an explicit compatibility shim for real Safari/iOS WebKit.
 */
if (typeof ReadableStream !== "undefined") {
  const streamPrototype = ReadableStream.prototype;

  if (typeof streamPrototype.values !== "function") {
    Object.defineProperty(streamPrototype, "values", {
      configurable: true,
      writable: true,
      async *value(options = {}) {
        const reader = this.getReader();
        let finished = false;
        try {
          while (true) {
            const result = await reader.read();
            if (result.done) {
              finished = true;
              return;
            }
            yield result.value;
          }
        } finally {
          try {
            if (!finished && !options.preventCancel) await reader.cancel();
          } finally {
            reader.releaseLock();
          }
        }
      },
    });
  }

  if (typeof streamPrototype[Symbol.asyncIterator] !== "function") {
    Object.defineProperty(streamPrototype, Symbol.asyncIterator, {
      configurable: true,
      writable: true,
      value(options) {
        return this.values(options);
      },
    });
  }
}
