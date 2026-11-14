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
