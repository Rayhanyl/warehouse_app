import { isValidEan13 } from "@/features/master-data/stocks/utils/barcode";

const EAN13_PARITY = [
  "LLLLLL",
  "LLGLGG",
  "LLGGLG",
  "LLGGGL",
  "LGLLGG",
  "LGGLLG",
  "LGGGLL",
  "LGLGLG",
  "LGLGGL",
  "LGGLGL",
];

const EAN13_L = [
  "0001101",
  "0011001",
  "0010011",
  "0111101",
  "0100011",
  "0110001",
  "0101111",
  "0111011",
  "0110111",
  "0001011",
];

const EAN13_G = [
  "0100111",
  "0110011",
  "0011011",
  "0100001",
  "0011101",
  "0111001",
  "0000101",
  "0010001",
  "0001001",
  "0010111",
];

const EAN13_R = [
  "1110010",
  "1100110",
  "1101100",
  "1000010",
  "1011100",
  "1001110",
  "1010000",
  "1000100",
  "1001000",
  "1110100",
];

// Standar pola lebar bar/space Code-128 (0..106)
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312",
  "132212", "221213", "221312", "231212", "112232", "122132", "122231", "113222",
  "123122", "123221", "223211", "221132", "221231", "213212", "223112", "312131",
  "311222", "321122", "321221", "312212", "322112", "322211", "212123", "212321",
  "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121",
  "313121", "211331", "231131", "213113", "213311", "213131", "311123", "311321",
  "331121", "312113", "312311", "332111", "314111", "221411", "431111", "111224",
  "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114",
  "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112",
  "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113",
  "114311", "411113", "411311", "113141", "114131", "311141", "411131", "211412",
  "211214", "211232", "2331112",
];

function patternToBits(pattern: string): string {
  let bits = "";
  for (let i = 0; i < pattern.length; i += 1) {
    const width = Number(pattern[i]);
    bits += (i % 2 === 0 ? "1" : "0").repeat(width);
  }
  return bits;
}

export function encodeEan13Bits(code: string): string {
  const firstDigit = Number(code[0]);
  const parity = EAN13_PARITY[firstDigit] ?? "LLLLLL";
  let bits = "101";
  for (let i = 1; i <= 6; i += 1) {
    const digit = Number(code[i]);
    const mode = parity[i - 1];
    bits += mode === "G" ? EAN13_G[digit] : EAN13_L[digit];
  }
  bits += "01010";
  for (let i = 7; i <= 12; i += 1) {
    const digit = Number(code[i]);
    bits += EAN13_R[digit];
  }
  bits += "101";
  return bits;
}

export function encodeCode128BBits(value: string): string {
  const clean = value.trim();
  const startCodeB = 104;
  let checksum = startCodeB;
  let bits = patternToBits(CODE128_PATTERNS[startCodeB]);

  for (let i = 0; i < clean.length; i += 1) {
    const charCode = clean.charCodeAt(i);
    const symbolValue = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0;
    checksum += symbolValue * (i + 1);
    bits += patternToBits(CODE128_PATTERNS[symbolValue]);
  }

  const checkSymbol = checksum % 103;
  bits += patternToBits(CODE128_PATTERNS[checkSymbol]);
  bits += patternToBits(CODE128_PATTERNS[106]);
  return bits;
}

export interface BarcodeVisualProps {
  value: string;
  height?: number;
  showValue?: boolean;
  subtitle?: string;
  className?: string;
}

export function BarcodeVisual({
  value,
  height = 44,
  showValue = true,
  subtitle,
  className = "",
}: BarcodeVisualProps) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const isEan = isValidEan13(trimmed);
  const bits = isEan ? encodeEan13Bits(trimmed) : encodeCode128BBits(trimmed);
  const quietZone = 8;
  const totalUnits = bits.length + quietZone * 2;

  const rects: Array<{ x: number; width: number }> = [];
  let index = 0;
  while (index < bits.length) {
    if (bits[index] === "1") {
      let runLength = 1;
      while (index + runLength < bits.length && bits[index + runLength] === "1") {
        runLength += 1;
      }
      rects.push({ x: quietZone + index, width: runLength });
      index += runLength;
    } else {
      index += 1;
    }
  }

  return (
    <div
      aria-label={`Visual barcode ${trimmed}`}
      className={`inline-flex flex-col items-center rounded-[var(--radius-sm)] bg-white px-2.5 py-1.5 text-ink-950 ${className}`}
    >
      <svg
        aria-hidden="true"
        className="w-full max-w-[260px]"
        height={height}
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${totalUnits} ${height}`}
      >
        <rect fill="#ffffff" height={height} width={totalUnits} x={0} y={0} />
        {rects.map((bar) => (
          <rect
            fill="#090d16"
            height={height}
            key={bar.x}
            width={bar.width}
            x={bar.x}
            y={0}
          />
        ))}
      </svg>
      {showValue && (
        <span className="mt-1 font-mono text-xs font-bold tracking-widest text-ink-950 tabular-nums">
          {trimmed}
        </span>
      )}
      {subtitle && (
        <span className="text-[10px] font-medium text-slate-600">
          {subtitle}
        </span>
      )}
    </div>
  );
}

export interface BarcodeStickerSheetProps {
  title: string;
  code: string;
  secondaryCode?: string | null;
  metaLabel?: string | null;
  badgeText?: string;
  visibleOnScreen?: boolean;
}

export function BarcodeStickerSheet({
  title,
  code,
  secondaryCode,
  metaLabel,
  badgeText = "LABEL BARANG WMS",
  visibleOnScreen = false,
}: BarcodeStickerSheetProps) {
  return (
    <section
      aria-label={`Label stiker barcode ${code}`}
      className={`printable-document-sheet ${
        visibleOnScreen ? "mt-4 block" : "hidden"
      } rounded-[var(--radius-md)] border-2 border-dashed border-ink-950/60 bg-white p-4 text-center text-ink-950 print:mt-0 print:block print:max-w-[58mm] print:border print:border-ink-950 print:p-2`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-ink-950/30 pb-1 text-[10px] font-bold tracking-wider uppercase">
        <span>JEJAKSTOK</span>
        <span>{badgeText}</span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs font-bold leading-4 text-ink-950">
        {title}
      </p>
      <div className="mt-1.5 flex justify-center">
        <BarcodeVisual className="w-full py-1" height={42} value={code} />
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-ink-950/30 pt-1 text-[10px] font-semibold text-slate-700 tabular-nums">
        <span>{secondaryCode ? `SKU: ${secondaryCode}` : `KODE: ${code}`}</span>
        {metaLabel && <span>{metaLabel}</span>}
      </div>
    </section>
  );
}
