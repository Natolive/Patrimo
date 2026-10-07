import type { PriceTick } from '../domain/price-tick.entity.js';

// Message `pricing` du flux Yahoo : protobuf en base64. Champs lus : 1 symbole, 2 cours, 3 heure (ms, zigzag),
// 8 variation du jour en %, 9 volume du jour (zigzag), 12 variation du jour ; les autres sont sautés.
// ponytail: décodeur protobuf minimal (5 champs) plutôt que protobufjs et le .proto de Yahoo.
export function decodePricing(base64: string): PriceTick | null {
  const buf = Buffer.from(base64, 'base64');
  const fields = new Map<number, number | bigint | string>();
  let i = 0;
  const varint = () => {
    let value = 0n;
    for (let shift = 0n; ; shift += 7n) {
      const byte = buf[i++]!;
      value |= BigInt(byte & 0x7f) << shift;
      if (!(byte & 0x80)) return value;
    }
  };
  const zigzag = (v: bigint) => Number((v >> 1n) ^ -(v & 1n));
  while (i < buf.length) {
    const tag = Number(varint());
    const [field, wire] = [tag >> 3, tag & 7];
    if (wire === 0) fields.set(field, varint());
    else if (wire === 1) i += 8;
    else if (wire === 2) {
      const length = Number(varint());
      fields.set(field, buf.toString('utf8', i, i + length));
      i += length;
    } else if (wire === 5) {
      fields.set(field, buf.readFloatLE(i));
      i += 4;
    } else return null;
  }
  const [symbol, price, time] = [fields.get(1), fields.get(2), fields.get(3)];
  if (typeof symbol !== 'string' || typeof price !== 'number' || typeof time !== 'bigint') return null;
  const number = (field: number) => (typeof fields.get(field) === 'number' ? (fields.get(field) as number) : 0);
  const volume = fields.get(9);
  return {
    symbol,
    price,
    time: new Date(zigzag(time)),
    change: number(12),
    changeRate: number(8) / 100,
    dayVolume: typeof volume === 'bigint' ? zigzag(volume) : 0,
  };
}
