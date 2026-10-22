import { useEffect, useState } from 'react';
import { KaleidoscopeRenderer } from '../engine/KaleidoscopeRenderer';
import type { KaleidoscopeState } from '../store/kaleidoscopeStore';

const thumbnailCache = new Map<string, string>();
const pendingThumbnails = new Map<string, Promise<string>>();
const thumbnailQueue: Array<{
  cacheKey: string;
  settings: KaleidoscopeState;
  resolve: (thumbnail: string) => void;
  reject: (error: unknown) => void;
}> = [];
const thumbnailQueueCreatedAt = performance.now();
const thumbnailInitialDelay = 3600;
let isThumbnailQueueRunning = false;

export function useKaleidoscopeThumbnail(cacheKey: string, settings: KaleidoscopeState | null) {
  const [thumbnail, setThumbnail] = useState(() => thumbnailCache.get(cacheKey) ?? '');

  useEffect(() => {
    let isCancelled = false;

    if (!settings) {
      setThumbnail('');
      return () => {
        isCancelled = true;
      };
    }

    const cached = thumbnailCache.get(cacheKey);
    if (cached) {
      setThumbnail(cached);
      return () => {
        isCancelled = true;
      };
    }

    queueThumbnailCapture(cacheKey, settings)
      .then((dataUrl) => {
        if (!isCancelled) {
          setThumbnail(dataUrl);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setThumbnail('');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [cacheKey, settings]);

  return thumbnail;
}

function queueThumbnailCapture(cacheKey: string, settings: KaleidoscopeState) {
  const cached = thumbnailCache.get(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = pendingThumbnails.get(cacheKey);
  if (pending) {
    return pending;
  }

  const promise = new Promise<string>((resolve, reject) => {
    thumbnailQueue.push({ cacheKey, settings, resolve, reject });
    void runThumbnailQueue();
  });

  pendingThumbnails.set(cacheKey, promise);
  return promise;
}

async function runThumbnailQueue() {
  if (isThumbnailQueueRunning) {
    return;
  }

  isThumbnailQueueRunning = true;

  const timeUntilIntroSettles =
    thumbnailInitialDelay - (performance.now() - thumbnailQueueCreatedAt);
  if (timeUntilIntroSettles > 0) {
    await delay(timeUntilIntroSettles);
  }

  while (thumbnailQueue.length > 0) {
    const job = thumbnailQueue.shift();
    if (!job) {
      continue;
    }

    const cached = thumbnailCache.get(job.cacheKey);
    if (cached) {
      pendingThumbnails.delete(job.cacheKey);
      job.resolve(cached);
      continue;
    }

    try {
      const thumbnail = await captureThumbnail(job.settings);
      thumbnailCache.set(job.cacheKey, thumbnail);
      pendingThumbnails.delete(job.cacheKey);
      job.resolve(thumbnail);
    } catch (error) {
      pendingThumbnails.delete(job.cacheKey);
      job.reject(error);
    }

    await delay(80);
  }

  isThumbnailQueueRunning = false;
}

async function captureThumbnail(settings: KaleidoscopeState) {
  const host = document.createElement('div');
  host.className = 'thumbnail-render-host';
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = '360px';
  host.style.height = '210px';
  host.style.pointerEvents = 'none';
  document.body.appendChild(host);

  const renderer = new KaleidoscopeRenderer(host, settings, {
    preserveDrawingBuffer: true,
    renderScale: 1,
  });

  try {
    await delay(360);
    return renderer.captureFrame(5.4);
  } finally {
    renderer.dispose();
    host.remove();
  }
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
