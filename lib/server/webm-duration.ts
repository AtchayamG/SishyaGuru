const EBML = 0x1a45dfa3;
const SEGMENT = 0x18538067;
const INFO = 0x1549a966;
const TRACKS = 0x1654ae6b;
const CLUSTER = 0x1f43b675;
const SEGMENT_LEVEL_IDS = new Set([
  0x114d9b74,
  INFO,
  TRACKS,
  CLUSTER,
  0x1c53bb6b,
  0x1941a469,
  0x1043a770,
  0x1254c367,
]);
const MAX_DURATION_NS = 60_000_000_000n;

type Element = { id: number; dataStart: number; dataEnd?: number };
type State = {
  elements: number;
  blocks: number;
  lastTimestampNs?: bigint;
  maxEndNs: bigint;
};

function fail(): never {
  throw new Error("invalid WebM");
}

function vintLength(first: number | undefined, max: number) {
  if (!first) fail();
  let marker = 0x80;
  let length = 1;
  while (!(first & marker) && length <= max) {
    marker >>= 1;
    length += 1;
  }
  if (length > max) fail();
  return { length, marker };
}

function readElement(bytes: Uint8Array, offset: number, limit: number, state: State): Element {
  if (++state.elements > 50_000) fail();
  const idVint = vintLength(bytes[offset], 4);
  if (offset + idVint.length > limit) fail();
  let id = 0;
  for (let index = 0; index < idVint.length; index += 1) id = id * 256 + bytes[offset + index]!;

  const sizeOffset = offset + idVint.length;
  const sizeVint = vintLength(bytes[sizeOffset], 8);
  if (sizeOffset + sizeVint.length > limit) fail();
  let size = BigInt(bytes[sizeOffset]! & (sizeVint.marker - 1));
  for (let index = 1; index < sizeVint.length; index += 1) {
    size = size * 256n + BigInt(bytes[sizeOffset + index]!);
  }
  const dataStart = sizeOffset + sizeVint.length;
  if (size === (1n << BigInt(sizeVint.length * 7)) - 1n) return { id, dataStart };
  if (size > BigInt(limit - dataStart)) fail();
  return { id, dataStart, dataEnd: dataStart + Number(size) };
}

function unsigned(bytes: Uint8Array, start: number, end: number) {
  if (end <= start || end - start > 8) fail();
  let value = 0n;
  for (let index = start; index < end; index += 1) value = value * 256n + BigInt(bytes[index]!);
  return value;
}

function children(bytes: Uint8Array, parent: Element, state: State, visit: (child: Element) => void) {
  if (parent.dataEnd === undefined) fail();
  for (let cursor = parent.dataStart; cursor < parent.dataEnd; ) {
    const child = readElement(bytes, cursor, parent.dataEnd, state);
    if (child.dataEnd === undefined) fail();
    visit(child);
    cursor = child.dataEnd;
  }
}

function parseHeader(bytes: Uint8Array, header: Element, state: State) {
  let docType: string | undefined;
  children(bytes, header, state, (child) => {
    if (child.id === 0x4282) {
      if (docType !== undefined) fail();
      docType = new TextDecoder("utf-8", { fatal: true }).decode(
        bytes.subarray(child.dataStart, child.dataEnd),
      );
    }
  });
  if (docType !== "webm") fail();
}

function parseInfo(bytes: Uint8Array, info: Element, state: State) {
  let scale = 1_000_000n;
  let seen = false;
  children(bytes, info, state, (child) => {
    if (child.id === 0x2ad7b1) {
      if (seen) fail();
      scale = unsigned(bytes, child.dataStart, child.dataEnd!);
      if (scale <= 0n) fail();
      seen = true;
    }
  });
  return scale;
}

function parseTracks(bytes: Uint8Array, tracks: Element, state: State) {
  const entries: bigint[] = [];
  children(bytes, tracks, state, (entry) => {
    if (entry.id !== 0xae) return;
    let number: bigint | undefined;
    let type: bigint | undefined;
    let codec: string | undefined;
    children(bytes, entry, state, (child) => {
      if (child.id === 0x23314f) fail(); // TrackTimestampScale is unsupported by WebM.
      if (child.id === 0xd7) {
        if (number !== undefined) fail();
        number = unsigned(bytes, child.dataStart, child.dataEnd!);
      } else if (child.id === 0x83) {
        if (type !== undefined) fail();
        type = unsigned(bytes, child.dataStart, child.dataEnd!);
      } else if (child.id === 0x86) {
        if (codec !== undefined) fail();
        codec = new TextDecoder("utf-8", { fatal: true }).decode(
          bytes.subarray(child.dataStart, child.dataEnd),
        );
      }
    });
    if (!number || type !== 2n || codec !== "A_OPUS") fail();
    entries.push(number);
  });
  if (entries.length !== 1) fail();
  return entries[0]!;
}

function blockTrack(bytes: Uint8Array, offset: number, limit: number) {
  const vint = vintLength(bytes[offset], 8);
  if (offset + vint.length > limit) fail();
  let value = BigInt(bytes[offset]! & (vint.marker - 1));
  for (let index = 1; index < vint.length; index += 1) {
    value = value * 256n + BigInt(bytes[offset + index]!);
  }
  if (!value) fail();
  return { value, length: vint.length };
}

function opusDurationNs(packet: Uint8Array) {
  const toc = packet[0];
  if (toc === undefined) fail();
  const config = toc >> 3;
  const halfMs =
    config >= 16
      ? [5, 10, 20, 40][config & 3]!
      : config >= 12
        ? [20, 40][config & 1]!
        : [20, 40, 80, 120][config & 3]!;
  const code = toc & 3;
  if (code === 2 && packet.length < 2) fail();
  const frames = code === 0 ? 1 : code < 3 ? 2 : (packet[1] ?? 0) & 0x3f;
  if (!frames || halfMs * frames > 240) fail();
  return BigInt(halfMs * frames) * 500_000n;
}

function parseBlock(
  bytes: Uint8Array,
  block: Element,
  clusterTimestamp: bigint,
  scale: bigint,
  trackNumber: bigint,
  state: State,
  declaredDurationTicks?: bigint,
) {
  if (block.dataEnd === undefined || ++state.blocks > 25_000) fail();
  const track = blockTrack(bytes, block.dataStart, block.dataEnd);
  const header = block.dataStart + track.length;
  if (track.value !== trackNumber || header + 3 >= block.dataEnd) fail();
  const rawRelative = (bytes[header]! << 8) | bytes[header + 1]!;
  const relative = BigInt(rawRelative & 0x8000 ? rawRelative - 0x10000 : rawRelative);
  if (bytes[header + 2]! & 0x06) fail(); // Lacing is outside the accepted recorder shape.
  const ticks = clusterTimestamp + relative;
  if (ticks < 0n) fail();
  const timestampNs = ticks * scale;
  if (state.lastTimestampNs !== undefined && timestampNs < state.lastTimestampNs) fail();
  state.lastTimestampNs = timestampNs;
  let endNs = timestampNs + opusDurationNs(bytes.subarray(header + 3, block.dataEnd));
  if (declaredDurationTicks !== undefined) {
    const declaredEndNs = timestampNs + declaredDurationTicks * scale;
    if (declaredEndNs > endNs) endNs = declaredEndNs;
  }
  if (endNs > MAX_DURATION_NS) fail();
  if (endNs > state.maxEndNs) state.maxEndNs = endNs;
}

function parseBlockGroup(
  bytes: Uint8Array,
  group: Element,
  clusterTimestamp: bigint,
  scale: bigint,
  track: bigint,
  state: State,
) {
  let block: Element | undefined;
  let duration: bigint | undefined;
  children(bytes, group, state, (child) => {
    if (child.id === 0xa1) {
      if (block) fail();
      block = child;
    } else if (child.id === 0x9b) {
      if (duration !== undefined) fail();
      duration = unsigned(bytes, child.dataStart, child.dataEnd!);
    }
  });
  if (!block) fail();
  parseBlock(bytes, block, clusterTimestamp, scale, track, state, duration);
}

function parseCluster(
  bytes: Uint8Array,
  cluster: Element,
  segmentEnd: number,
  scale: bigint,
  track: bigint,
  state: State,
) {
  const end = cluster.dataEnd ?? segmentEnd;
  let timestamp: bigint | undefined;
  let cursor = cluster.dataStart;
  while (cursor < end) {
    const child = readElement(bytes, cursor, end, state);
    if (cluster.dataEnd === undefined && SEGMENT_LEVEL_IDS.has(child.id)) return cursor;
    if (child.dataEnd === undefined) fail();
    if (child.id === 0xe7) {
      if (timestamp !== undefined) fail();
      timestamp = unsigned(bytes, child.dataStart, child.dataEnd);
    } else if (child.id === 0xa3) {
      if (timestamp === undefined) fail();
      parseBlock(bytes, child, timestamp, scale, track, state);
    } else if (child.id === 0xa0) {
      if (timestamp === undefined) fail();
      parseBlockGroup(bytes, child, timestamp, scale, track, state);
    } else if (child.id === 0xaf) {
      fail();
    }
    cursor = child.dataEnd;
  }
  return end;
}

/** Strict duration upper bound for audio-only WebM/Opus emitted by MediaRecorder. */
export function deriveWebmDurationMs(bytes: Uint8Array): number | undefined {
  try {
    const state: State = { elements: 0, blocks: 0, maxEndNs: 0n };
    const header = readElement(bytes, 0, bytes.length, state);
    if (header.id !== EBML || header.dataEnd === undefined) fail();
    parseHeader(bytes, header, state);
    const segment = readElement(bytes, header.dataEnd, bytes.length, state);
    if (segment.id !== SEGMENT) fail();
    const end = segment.dataEnd ?? bytes.length;
    let cursor = segment.dataStart;
    let scale: bigint | undefined;
    let track: bigint | undefined;
    let sawCluster = false;
    while (cursor < end) {
      const child = readElement(bytes, cursor, end, state);
      if (child.id === INFO) {
        if (sawCluster || scale !== undefined) fail();
        scale = parseInfo(bytes, child, state);
      } else if (child.id === TRACKS) {
        if (sawCluster || track !== undefined) fail();
        track = parseTracks(bytes, child, state);
      } else if (child.id === CLUSTER) {
        if (scale === undefined || track === undefined) fail();
        sawCluster = true;
        cursor = parseCluster(bytes, child, end, scale, track, state);
        continue;
      } else if (child.dataEnd === undefined) {
        fail();
      }
      cursor = child.dataEnd!;
    }
    if (!sawCluster || !state.blocks || state.maxEndNs <= 0n) fail();
    return Number((state.maxEndNs + 999_999n) / 1_000_000n);
  } catch {
    return undefined;
  }
}
