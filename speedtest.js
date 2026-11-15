#!/usr/bin/env node

const REQUESTS = 10;
const DEFAULT_URL = "https://speed.cloudflare.com/__down?bytes=1000000";

function formatBytes(bytes) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(2)} KB`;
  return `${bytes} B`;
}

function formatDuration(ms) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  return `${ms.toFixed(0)} ms`;
}

async function downloadOnce(url) {
  const started = performance.now();
  const response = await fetch(url, {
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const elapsedMs = performance.now() - started;

  return { bytes: buffer.byteLength, elapsedMs };
}

async function main() {
  const url = process.argv[2] ?? DEFAULT_URL;

  try {
    new URL(url);
  } catch {
    console.error(`Некорректный URL: ${url}`);
    process.exit(1);
  }

  console.log(`URL: ${url}`);
  console.log(`Запросов: ${REQUESTS} (последовательно)\n`);

  let totalBytes = 0;
  let totalMs = 0;

  for (let i = 1; i <= REQUESTS; i++) {
    process.stdout.write(`  [${i}/${REQUESTS}] ... `);
    try {
      const { bytes, elapsedMs } = await downloadOnce(url);
      totalBytes += bytes;
      totalMs += elapsedMs;
      console.log(
        `${formatBytes(bytes)} за ${formatDuration(elapsedMs)}`
      );
    } catch (err) {
      console.log("ошибка");
      console.error(`\nЗапрос ${i} не удался: ${err.message}`);
      process.exit(1);
    }
  }

  const avgMs = totalMs / REQUESTS;
  const speedBps = totalBytes / (totalMs / 1000); // байт/с
  const speedMbps = (speedBps * 8) / 1e6; // Мбит/с
  const speedMBps = speedBps / 1e6; // МБ/с

  console.log("\n--- Результат ---");
  console.log(`Среднее время запроса: ${formatDuration(avgMs)}`);
  console.log(`Общий объём данных:    ${formatBytes(totalBytes)}`);
  console.log(
    `Скорость скачивания:   ${speedMbps.toFixed(2)} Mbps (${speedMBps.toFixed(2)} MB/s)`
  );
}

main();
