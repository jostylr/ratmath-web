// ../../packages/core/src/base-system.js
class BaseSystem {
  #base;
  #characters;
  #charMap;
  #name;
  static #prefixMap = new Map;
  static RESERVED_SYMBOLS = new Set([
    "+",
    "-",
    "*",
    "/",
    "^",
    "!",
    "(",
    ")",
    "[",
    "]",
    ":",
    ".",
    "#",
    "~"
  ]);
  constructor(characters, name) {
    if (typeof characters === "string") {
      this.#characters = characters.split("");
    } else if (Array.isArray(characters)) {
      this.#characters = [...characters];
    } else {
      throw new Error("Characters must be a string or array of strings");
    }
    if (this.#characters.length < 2) {
      throw new Error("Base system must have at least 2 characters");
    }
    this.#base = this.#characters.length;
    this.#charMap = this.#createCharacterMap();
    this.#name = name || `Base ${this.#base}`;
    this.#validateBase();
    this.#checkForConflicts();
  }
  get base() {
    return this.#base;
  }
  get characters() {
    return [...this.#characters];
  }
  get charMap() {
    return new Map(this.#charMap);
  }
  getChar(value) {
    const i = Number(value);
    if (i < 0 || i >= this.#characters.length) {
      throw new Error(`Value ${value} is out of range for base ${this.#base}`);
    }
    return this.#characters[i];
  }
  get name() {
    return this.#name;
  }
  #createCharacterMap() {
    const map = new Map;
    for (let i = 0;i < this.#characters.length; i++) {
      map.set(this.#characters[i], i);
    }
    return map;
  }
  #validateBase() {
    if (this.#base < 2) {
      throw new Error("Base must be at least 2");
    }
    if (this.#base !== this.#characters.length) {
      throw new Error(`Base ${this.#base} does not match character set length ${this.#characters.length}`);
    }
    const uniqueChars = new Set(this.#characters);
    if (uniqueChars.size !== this.#characters.length) {
      throw new Error("Character set contains duplicate characters");
    }
    this.#validateCharacterOrdering();
    if (this.#base > 1000) {
      console.warn(`Very large base system (${this.#base}). This may impact performance.`);
    }
  }
  #validateCharacterOrdering() {
    if (this.#name === "Roman Numerals" || this.#characters.length < 10) {
      return;
    }
    const ranges = [
      { start: "0", end: "9", name: "digits" },
      { start: "a", end: "z", name: "lowercase letters" },
      { start: "A", end: "Z", name: "uppercase letters" }
    ];
    for (const range of ranges) {
      const startCode = range.start.charCodeAt(0);
      const endCode = range.end.charCodeAt(0);
      let rangeChars = [];
      for (let i = 0;i < this.#characters.length; i++) {
        const char = this.#characters[i];
        const code = char.charCodeAt(0);
        if (code >= startCode && code <= endCode) {
          rangeChars.push(char);
        }
      }
      if (rangeChars.length >= 5 && rangeChars.length > (endCode - startCode) / 3) {
        for (let i = 1;i < rangeChars.length; i++) {
          const prevCode = rangeChars[i - 1].charCodeAt(0);
          const currCode = rangeChars[i].charCodeAt(0);
          if (currCode !== prevCode + 1) {
            console.warn(`Non-contiguous ${range.name} range detected in base system`);
            break;
          }
        }
      }
    }
  }
  #checkForConflicts() {
    const conflicts = [];
    for (const char of this.#characters) {
      if (BaseSystem.RESERVED_SYMBOLS.has(char)) {
        conflicts.push(char);
      }
    }
    if (conflicts.length > 0) {
      throw new Error(`Base system characters conflict with parser symbols: ${conflicts.join(", ")}. ` + `Reserved symbols are: ${Array.from(BaseSystem.RESERVED_SYMBOLS).join(", ")}`);
    }
  }
  toDecimal(str) {
    if (typeof str !== "string" || str.length === 0) {
      throw new Error("Input must be a non-empty string");
    }
    let negative = false;
    if (str.startsWith("-")) {
      negative = true;
      str = str.slice(1);
    }
    let result = 0n;
    const baseBigInt = BigInt(this.#base);
    for (let i = 0;i < str.length; i++) {
      const char = str[i];
      if (!this.#charMap.has(char)) {
        throw new Error(`Invalid character '${char}' for ${this.#name} (base ${this.#base})`);
      }
      const digitValue = BigInt(this.#charMap.get(char));
      result = result * baseBigInt + digitValue;
    }
    return negative ? -result : result;
  }
  fromDecimal(value) {
    if (typeof value !== "bigint") {
      throw new Error("Value must be a BigInt");
    }
    if (value === 0n) {
      return this.#characters[0];
    }
    let negative = false;
    if (value < 0n) {
      negative = true;
      value = -value;
    }
    const baseBigInt = BigInt(this.#base);
    const digits = [];
    while (value > 0n) {
      const remainder = Number(value % baseBigInt);
      digits.unshift(this.#characters[remainder]);
      value = value / baseBigInt;
    }
    const result = digits.join("");
    return negative ? "-" + result : result;
  }
  isValidString(str) {
    if (typeof str !== "string") {
      return false;
    }
    if (str.startsWith("-")) {
      str = str.slice(1);
    }
    if (str.length === 0) {
      return false;
    }
    for (const char of str) {
      if (!this.#charMap.has(char)) {
        return false;
      }
    }
    return true;
  }
  getMaxDigit() {
    return this.#characters[this.#characters.length - 1];
  }
  getMinDigit() {
    return this.#characters[0];
  }
  toString() {
    const charPreview = this.#characters.length <= 20 ? this.#characters.join("") : this.#characters.slice(0, 10).join("") + "..." + this.#characters.slice(-10).join("");
    return `${this.#name} (${charPreview})`;
  }
  equals(other) {
    if (!(other instanceof BaseSystem)) {
      return false;
    }
    if (this.#base !== other.#base) {
      return false;
    }
    for (let i = 0;i < this.#characters.length; i++) {
      if (this.#characters[i] !== other.#characters[i]) {
        return false;
      }
    }
    return true;
  }
  static fromBase(base, name) {
    if (!Number.isInteger(base) || base < 2) {
      throw new Error("Base must be an integer >= 2");
    }
    const characters = [];
    if (base <= 62) {
      for (let i = 0;i < Math.min(base, 10); i++) {
        characters.push(String.fromCharCode(48 + i));
      }
      if (base > 10) {
        for (let i = 0;i < Math.min(base - 10, 26); i++) {
          characters.push(String.fromCharCode(97 + i));
        }
      }
      if (base > 36) {
        for (let i = 0;i < base - 36; i++) {
          characters.push(String.fromCharCode(65 + i));
        }
      }
    } else {
      throw new Error("BaseSystem.fromBase() only supports bases up to 62. Use constructor with custom character sequence for larger bases.");
    }
    return new BaseSystem(characters, name || `Base ${base}`);
  }
  static createPattern(pattern, size, name) {
    const characters = [];
    switch (pattern.toLowerCase()) {
      case "alphanumeric":
        if (size > 62) {
          throw new Error(`Alphanumeric pattern only supports up to base 62, got ${size}`);
        }
        return BaseSystem.fromBase(size, name);
      case "digits-only":
        if (size > 10) {
          throw new Error(`Digits-only pattern only supports up to base 10, got ${size}`);
        }
        for (let i = 0;i < size; i++)
          characters.push(String.fromCharCode(48 + i));
        return new BaseSystem(characters, name || `Base ${size} (digits only)`);
      case "letters-only":
        if (size > 52) {
          throw new Error(`Letters-only pattern only supports up to base 52, got ${size}`);
        }
        for (let i = 0;i < Math.min(size, 26); i++) {
          characters.push(String.fromCharCode(97 + i));
        }
        if (size > 26) {
          for (let i = 0;i < size - 26; i++) {
            characters.push(String.fromCharCode(65 + i));
          }
        }
        return new BaseSystem(characters, name || (size <= 26 ? `Base ${size} (lowercase letters)` : `Base ${size} (mixed case letters)`));
      case "uppercase-only":
        if (size > 26) {
          throw new Error(`Uppercase-only pattern only supports up to base 26, got ${size}`);
        }
        for (let i = 0;i < size; i++) {
          characters.push(String.fromCharCode(65 + i));
        }
        return new BaseSystem(characters, name || `Base ${size} (uppercase letters)`);
      default:
        throw new Error(`Unknown pattern: ${pattern}. Supported patterns: alphanumeric, digits-only, letters-only, uppercase-only`);
    }
  }
  static registerPrefix(prefix, baseSystem) {
    if (typeof prefix !== "string" || prefix.length !== 1) {
      throw new Error("Prefix must be a single character");
    }
    if (!(baseSystem instanceof BaseSystem)) {
      throw new Error("Must provide a valid BaseSystem");
    }
    if (!/^[a-zA-Z]$/.test(prefix)) {
      throw new Error("Prefix must be a letter");
    }
    BaseSystem.#prefixMap.set(prefix, baseSystem);
  }
  static unregisterPrefix(prefix) {
    BaseSystem.#prefixMap.delete(prefix);
  }
  static getSystemForPrefix(prefix) {
    if (prefix === "D")
      return null;
    if (BaseSystem.#prefixMap.has(prefix)) {
      return BaseSystem.#prefixMap.get(prefix);
    }
    const lower = prefix.toLowerCase();
    if (BaseSystem.#prefixMap.has(lower)) {
      if (lower === "d" && prefix !== "d")
        return;
      return BaseSystem.#prefixMap.get(lower);
    }
    return;
  }
  static getPrefixForSystem(baseSystem) {
    for (const [prefix, system] of BaseSystem.#prefixMap.entries()) {
      if (system.equals(baseSystem)) {
        return prefix;
      }
    }
    return;
  }
  withCaseSensitivity(caseSensitive) {
    if (caseSensitive === true) {
      return this;
    }
    if (caseSensitive === false) {
      const lowerChars = this.#characters.map((char) => char.toLowerCase());
      const uniqueLowerChars = [...new Set(lowerChars)];
      if (uniqueLowerChars.length !== lowerChars.length) {
        console.warn("Case-insensitive conversion resulted in duplicate characters");
      }
      return new BaseSystem(uniqueLowerChars.join(""), `${this.#name} (case-insensitive)`);
    }
    throw new Error("caseSensitive must be a boolean value");
  }
}
BaseSystem.BINARY = new BaseSystem(["0", "1"], "Binary");
BaseSystem.OCTAL = new BaseSystem(["0", "1", "2", "3", "4", "5", "6", "7"], "Octal");
BaseSystem.DECIMAL = new BaseSystem(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], "Decimal");
BaseSystem.HEXADECIMAL = new BaseSystem(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"], "Hexadecimal");
BaseSystem.BASE36 = new BaseSystem("0123456789abcdefghijklmnopqrstuvwxyz".split(""), "Base 36");
BaseSystem.BASE62 = new BaseSystem("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), "Base 62");
BaseSystem.BASE60 = new BaseSystem("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX".split(""), "Base 60 (Sexagesimal)");
BaseSystem.ROMAN = new BaseSystem(["I", "V", "X", "L", "C", "D", "M"], "Roman Numerals");
BaseSystem.registerPrefix("x", BaseSystem.HEXADECIMAL);
BaseSystem.registerPrefix("b", BaseSystem.BINARY);
BaseSystem.registerPrefix("o", BaseSystem.OCTAL);
BaseSystem.registerPrefix("d", BaseSystem.DECIMAL);

// ../../packages/core/src/rational.js
var bitLength = function(int) {
  if (int === 0n)
    return 0;
  return int < 0n ? (-int).toString(2).length : int.toString(2).length;
};

class Rational {
  #numerator;
  #denominator;
  #isNegative;
  #wholePart;
  #remainder;
  #initialSegment;
  #periodDigits;
  #periodLength;
  #isTerminating;
  #factorsOf2;
  #factorsOf5;
  #leadingZerosInPeriod;
  #initialSegmentLeadingZeros;
  #initialSegmentRest;
  #periodDigitsRest;
  #maxPeriodDigitsComputed;
  static DEFAULT_PERIOD_DIGITS = 20;
  static MAX_PERIOD_DIGITS = 1000;
  static MAX_PERIOD_CHECK = 1e7;
  static POWERS_OF_5 = {
    16: 5n ** 16n,
    8: 5n ** 8n,
    4: 5n ** 4n,
    2: 5n ** 2n,
    1: 5n
  };
  static zero = new Rational(0, 1);
  static one = new Rational(1, 1);
  constructor(numerator, denominator = 1n) {
    if (numerator && typeof numerator === "object" && numerator.constructor.name === "Integer") {
      this.#numerator = numerator.value;
      if (denominator && typeof denominator === "object" && denominator.constructor.name === "Integer") {
        this.#denominator = denominator.value;
      } else if (denominator !== undefined) {
        this.#denominator = BigInt(denominator);
      } else {
        this.#denominator = 1n;
      }
      if (this.#denominator === 0n) {
        throw new Error("Denominator cannot be zero");
      }
      this.#normalize();
      this.#isNegative = this.#numerator < 0n;
      return;
    }
    if (typeof numerator === "string") {
      if (numerator.includes("..")) {
        const mixedParts = numerator.trim().split("..");
        if (mixedParts.length !== 2) {
          throw new Error("Invalid mixed number format. Use 'a..b/c'");
        }
        const wholePart = BigInt(mixedParts[0]);
        const fractionParts = mixedParts[1].split("/");
        if (fractionParts.length !== 2) {
          throw new Error("Invalid fraction in mixed number. Use 'a..b/c'");
        }
        const fracNumerator = BigInt(fractionParts[0]);
        const fracDenominator = BigInt(fractionParts[1]);
        const isNegative = wholePart < 0n;
        const absWhole = isNegative ? -wholePart : wholePart;
        this.#numerator = isNegative ? -(absWhole * fracDenominator + fracNumerator) : wholePart * fracDenominator + fracNumerator;
        this.#denominator = fracDenominator;
      } else {
        if (numerator.includes(".")) {
          const expandedNumerator = Rational.#parseRepeatedDigits(numerator);
          const decimalParts = expandedNumerator.trim().split(".");
          if (decimalParts.length === 2) {
            const integerPart = decimalParts[0] || "0";
            const fractionalPart = decimalParts[1];
            if (!/^-?\d*$/.test(integerPart) || !/^\d*$/.test(fractionalPart)) {
              throw new Error("Invalid decimal format");
            }
            const wholePart = BigInt(integerPart);
            const fractionalValue = BigInt(fractionalPart);
            const denomValue = 10n ** BigInt(fractionalPart.length);
            this.#numerator = wholePart * denomValue + (wholePart < 0n ? -fractionalValue : fractionalValue);
            this.#denominator = denomValue;
          } else {
            throw new Error("Invalid decimal format - multiple decimal points");
          }
        } else {
          const parts = numerator.trim().split("/");
          if (parts.length === 1) {
            this.#numerator = BigInt(parts[0]);
            this.#denominator = BigInt(denominator);
          } else if (parts.length === 2) {
            this.#numerator = BigInt(parts[0]);
            this.#denominator = BigInt(parts[1]);
          } else {
            throw new Error("Invalid rational format. Use 'a/b', 'a', or 'a..b/c'");
          }
        }
      }
    } else {
      this.#numerator = BigInt(numerator);
      this.#denominator = BigInt(denominator);
    }
    if (this.#denominator === 0n) {
      throw new Error("Denominator cannot be zero");
    }
    this.#normalize();
    this.#isNegative = this.#numerator < 0n;
  }
  #normalize() {
    if (this.#denominator < 0n) {
      this.#numerator = -this.#numerator;
      this.#denominator = -this.#denominator;
    }
    if (this.#numerator === 0n) {
      this.#denominator = 1n;
      return;
    }
    const gcd = this.#gcd(this.#numerator < 0n ? -this.#numerator : this.#numerator, this.#denominator);
    this.#numerator = this.#numerator / gcd;
    this.#denominator = this.#denominator / gcd;
  }
  #gcd(a, b) {
    while (b !== 0n) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }
  get numerator() {
    return this.#numerator;
  }
  get denominator() {
    return this.#denominator;
  }
  add(other) {
    if (other.constructor.name === "Integer") {
      const otherAsRational = new Rational(other.value, 1n);
      return this.add(otherAsRational);
    } else if (other instanceof Rational) {
      const a = this.#numerator;
      const b = this.#denominator;
      const c = other.numerator;
      const d = other.denominator;
      const numerator = a * d + b * c;
      const denominator = b * d;
      return new Rational(numerator, denominator);
    } else if (other.low && other.high && typeof other.low.equals === "function") {
      const thisAsInterval = { low: this, high: this };
      const IntervalClass = other.constructor;
      const newThisAsInterval = new IntervalClass(this, this);
      return newThisAsInterval.add(other);
    } else {
      throw new Error(`Cannot add ${other.constructor.name} to Rational`);
    }
  }
  subtract(other) {
    if (other.constructor.name === "Integer") {
      const otherAsRational = new Rational(other.value, 1n);
      return this.subtract(otherAsRational);
    } else if (other instanceof Rational) {
      const a = this.#numerator;
      const b = this.#denominator;
      const c = other.numerator;
      const d = other.denominator;
      const numerator = a * d - b * c;
      const denominator = b * d;
      return new Rational(numerator, denominator);
    } else if (other.low && other.high && typeof other.low.equals === "function") {
      const IntervalClass = other.constructor;
      const newThisAsInterval = new IntervalClass(this, this);
      return newThisAsInterval.subtract(other);
    } else {
      throw new Error(`Cannot subtract ${other.constructor.name} from Rational`);
    }
  }
  multiply(other) {
    if (other.constructor.name === "Integer") {
      const otherAsRational = new Rational(other.value, 1n);
      return this.multiply(otherAsRational);
    } else if (other instanceof Rational) {
      const a = this.#numerator;
      const b = this.#denominator;
      const c = other.numerator;
      const d = other.denominator;
      const numerator = a * c;
      const denominator = b * d;
      return new Rational(numerator, denominator);
    } else if (other.low && other.high && typeof other.low.equals === "function") {
      const IntervalClass = other.constructor;
      const newThisAsInterval = new IntervalClass(this, this);
      return newThisAsInterval.multiply(other);
    } else {
      throw new Error(`Cannot multiply Rational by ${other.constructor.name}`);
    }
  }
  divide(other) {
    if (other.constructor.name === "Integer") {
      if (other.value === 0n) {
        throw new Error("Division by zero");
      }
      const otherAsRational = new Rational(other.value, 1n);
      return this.divide(otherAsRational);
    } else if (other instanceof Rational) {
      if (other.numerator === 0n) {
        throw new Error("Division by zero");
      }
      const a = this.#numerator;
      const b = this.#denominator;
      const c = other.numerator;
      const d = other.denominator;
      const numerator = a * d;
      const denominator = b * c;
      return new Rational(numerator, denominator);
    } else if (other.low && other.high && typeof other.low.equals === "function") {
      const IntervalClass = other.constructor;
      const newThisAsInterval = new IntervalClass(this, this);
      return newThisAsInterval.divide(other);
    } else {
      throw new Error(`Cannot divide Rational by ${other.constructor.name}`);
    }
  }
  negate() {
    return new Rational(-this.#numerator, this.#denominator);
  }
  reciprocal() {
    if (this.#numerator === 0n) {
      throw new Error("Cannot take reciprocal of zero");
    }
    return new Rational(this.#denominator, this.#numerator);
  }
  pow(exponent) {
    const n = BigInt(exponent);
    if (n === 0n) {
      if (this.#numerator === 0n) {
        throw new Error("Zero cannot be raised to the power of zero");
      }
      return new Rational(1);
    }
    if (this.#numerator === 0n && n < 0n) {
      throw new Error("Zero cannot be raised to a negative power");
    }
    if (n < 0n) {
      const reciprocal = this.reciprocal();
      return reciprocal.pow(-n);
    }
    let resultNum = 1n;
    let resultDen = 1n;
    let num = this.#numerator;
    let den = this.#denominator;
    for (let i = n < 0n ? -n : n;i > 0n; i >>= 1n) {
      if (i & 1n) {
        resultNum *= num;
        resultDen *= den;
      }
      num *= num;
      den *= den;
    }
    return new Rational(resultNum, resultDen);
  }
  equals(other) {
    return this.#numerator === other.numerator && this.#denominator === other.denominator;
  }
  compareTo(other) {
    const crossProduct1 = this.#numerator * other.denominator;
    const crossProduct2 = this.#denominator * other.numerator;
    if (crossProduct1 < crossProduct2)
      return -1;
    if (crossProduct1 > crossProduct2)
      return 1;
    return 0;
  }
  lessThan(other) {
    return this.compareTo(other) < 0;
  }
  lessThanOrEqual(other) {
    return this.compareTo(other) <= 0;
  }
  greaterThan(other) {
    return this.compareTo(other) > 0;
  }
  greaterThanOrEqual(other) {
    return this.compareTo(other) >= 0;
  }
  abs() {
    return this.#numerator < 0n ? this.negate() : new Rational(this.#numerator, this.#denominator);
  }
  toString(base) {
    if (base === undefined) {
      if (this.#denominator === 1n) {
        return this.#numerator.toString();
      }
      return `${this.#numerator}/${this.#denominator}`;
    }
    let baseSystem;
    if (base instanceof BaseSystem) {
      baseSystem = base;
    } else if (typeof base === "number") {
      baseSystem = BaseSystem.fromBase(base);
    } else {
      return this.toString();
    }
    return this.toRepeatingBase(baseSystem);
  }
  toRepeatingBase(baseSystem) {
    return this.toRepeatingBaseWithPeriod(baseSystem).baseStr;
  }
  toRepeatingBaseWithPeriod(baseSystem, options = {}) {
    if (!(baseSystem instanceof BaseSystem)) {
      throw new Error("Argument must be a BaseSystem");
    }
    const { useRepeatNotation = true, limit = 1000 } = options;
    if (this.#numerator < 0n) {
      const result2 = this.negate().toRepeatingBaseWithPeriod(baseSystem, options);
      return {
        baseStr: "-" + result2.baseStr,
        period: result2.period,
        limitHit: result2.limitHit
      };
    }
    const baseBigInt = BigInt(baseSystem.base);
    let num = this.#numerator;
    let den = this.#denominator;
    const integerPart = num / den;
    let remainder = num % den;
    let result = baseSystem.fromDecimal(integerPart);
    if (remainder === 0n) {
      return { baseStr: result, period: 0, limitHit: false };
    }
    result += ".";
    const remainders = new Map;
    let fractionParts = [];
    let cycleStartIndex = -1;
    let limitHit = false;
    while (remainder !== 0n) {
      if (remainders.has(remainder)) {
        cycleStartIndex = remainders.get(remainder);
        break;
      }
      if (fractionParts.length >= limit) {
        limitHit = true;
        break;
      }
      remainders.set(remainder, fractionParts.length);
      remainder *= baseBigInt;
      const digit = remainder / den;
      remainder = remainder % den;
      fractionParts.push(baseSystem.getChar(digit));
    }
    let period = 0;
    if (cycleStartIndex !== -1) {
      const nonRepeating = fractionParts.slice(0, cycleStartIndex).join("");
      const repeating = fractionParts.slice(cycleStartIndex).join("");
      period = fractionParts.length - cycleStartIndex;
      const formattedNonRepeating = useRepeatNotation ? Rational.#formatRepeatedDigits(nonRepeating) : nonRepeating;
      const formattedRepeating = useRepeatNotation ? Rational.#formatRepeatedDigits(repeating) : repeating;
      result += formattedNonRepeating + "#" + formattedRepeating;
    } else if (remainder === 0n) {
      const terminating = fractionParts.join("");
      const formattedTerminating = useRepeatNotation ? Rational.#formatRepeatedDigits(terminating) : terminating;
      result += formattedTerminating + "#0";
    } else {
      const partial = fractionParts.join("");
      const formattedPartial = useRepeatNotation ? Rational.#formatRepeatedDigits(partial) : partial;
      result += formattedPartial + "...";
      period = -1;
    }
    return { baseStr: result, period, limitHit };
  }
  periodModulo(baseSystem, limit = 1e6) {
    if (!(baseSystem instanceof BaseSystem)) {
      throw new Error("Argument must be a BaseSystem");
    }
    let num = this.#numerator < 0n ? -this.#numerator : this.#numerator;
    let den = this.#denominator;
    const baseBigInt = BigInt(baseSystem.base);
    if (den === 1n)
      return 0;
    let common = this.#gcd(den, baseBigInt);
    while (common > 1n) {
      den /= common;
      common = this.#gcd(den, baseBigInt);
    }
    if (den === 1n)
      return 0;
    let k = 1;
    let power = baseBigInt % den;
    while (power !== 1n && k <= limit) {
      power = power * baseBigInt % den;
      k++;
    }
    if (k > limit) {
      throw new Error(`Period calculation exceeded limit of ${limit} iterations. Period is likely > ${limit}.`);
    }
    return k;
  }
  toBase(baseSystem) {
    if (!(baseSystem instanceof BaseSystem)) {
      throw new Error("Argument must be a BaseSystem");
    }
    const numStr = baseSystem.fromDecimal(this.#numerator);
    if (this.#denominator === 1n) {
      return numStr;
    }
    const denStr = baseSystem.fromDecimal(this.#denominator);
    return `${numStr}/${denStr}`;
  }
  toMixedString() {
    if (this.#denominator === 1n || this.#numerator === 0n) {
      return this.#numerator.toString();
    }
    this.#computeWholePart();
    if (this.#remainder === 0n) {
      return this.#isNegative ? `-${this.#wholePart}` : `${this.#wholePart}`;
    }
    if (this.#wholePart === 0n) {
      return this.#isNegative ? `-${this.#remainder}/${this.#denominator}` : `${this.#remainder}/${this.#denominator}`;
    } else {
      return this.#isNegative ? `-${this.#wholePart}..${this.#remainder}/${this.#denominator}` : `${this.#wholePart}..${this.#remainder}/${this.#denominator}`;
    }
  }
  toNumber() {
    return Number(this.#numerator) / Number(this.#denominator);
  }
  toRepeatingDecimal() {
    const result = this.toRepeatingDecimalWithPeriod();
    return result.decimal;
  }
  toRepeatingDecimalWithPeriod(useRepeatNotation = true) {
    if (this.#numerator === 0n) {
      return { decimal: "0", period: 0 };
    }
    this.#computeWholePart();
    const maxDigits = useRepeatNotation ? 100 : Rational.DEFAULT_PERIOD_DIGITS;
    this.#computeDecimalMetadata(maxDigits);
    let result = (this.#isNegative ? "-" : "") + this.#wholePart.toString();
    if (this.#isTerminating) {
      if (this.#initialSegment) {
        const formattedInitial = useRepeatNotation ? Rational.#formatRepeatedDigits(this.#initialSegment, 7) : this.#initialSegment;
        result += "." + formattedInitial + "#0";
      } else {}
      return { decimal: result, period: 0 };
    } else {
      let periodDigits = this.#periodDigits;
      if (this.#periodLength > 0 && this.#periodLength <= Rational.MAX_PERIOD_DIGITS && this.#periodDigits.length < this.#periodLength) {
        periodDigits = this.extractPeriodSegment(this.#initialSegment, this.#periodLength, this.#periodLength);
      }
      const formattedInitial = useRepeatNotation ? Rational.#formatRepeatedDigits(this.#initialSegment, 7) : this.#initialSegment;
      let displayPeriod = periodDigits;
      if (useRepeatNotation && this.#leadingZerosInPeriod < 1000) {
        const significantDigits = this.#periodDigitsRest;
        if (significantDigits && significantDigits.length > 0) {
          const leadingZerosFormatted = this.#leadingZerosInPeriod > 6 ? `{0~${this.#leadingZerosInPeriod}}` : this.#leadingZerosInPeriod > 0 ? "0".repeat(this.#leadingZerosInPeriod) : "";
          const maxSignificantDigits = Math.min(significantDigits.length, 20);
          displayPeriod = leadingZerosFormatted + significantDigits.substring(0, maxSignificantDigits);
        } else {
          displayPeriod = useRepeatNotation ? Rational.#formatRepeatedDigits(periodDigits, 7) : periodDigits;
        }
      } else {
        displayPeriod = useRepeatNotation ? Rational.#formatRepeatedDigits(periodDigits, 7) : periodDigits;
      }
      if (this.#initialSegment) {
        result += "." + formattedInitial + "#" + displayPeriod;
      } else {
        result += ".#" + displayPeriod;
      }
      return {
        decimal: result,
        period: this.#periodLength
      };
    }
  }
  static #countFactorsOf2(n) {
    if (n === 0n)
      return 0;
    let count = 0;
    while ((n & 1n) === 0n) {
      n >>= 1n;
      count++;
    }
    return count;
  }
  static #countFactorsOf5(n) {
    if (n === 0n)
      return 0;
    let count = 0;
    const powers = [
      { exp: 16, value: Rational.POWERS_OF_5["16"] },
      { exp: 8, value: Rational.POWERS_OF_5["8"] },
      { exp: 4, value: Rational.POWERS_OF_5["4"] },
      { exp: 2, value: Rational.POWERS_OF_5["2"] },
      { exp: 1, value: Rational.POWERS_OF_5["1"] }
    ];
    for (const { exp, value } of powers) {
      while (n % value === 0n) {
        n /= value;
        count += exp;
      }
    }
    return count;
  }
  bitLength() {
    const numLen = bitLength(this.#numerator);
    const denLen = bitLength(this.#denominator);
    return Math.max(numLen, denLen);
  }
  #computeWholePart() {
    if (this.#wholePart !== undefined)
      return;
    const absNumerator = this.#numerator < 0n ? -this.#numerator : this.#numerator;
    this.#wholePart = absNumerator / this.#denominator;
    this.#remainder = absNumerator % this.#denominator;
  }
  #computeLeadingZerosInPeriod(reducedDen, initialSegmentLength) {
    let adjustedNumerator = this.#remainder * 10n ** BigInt(initialSegmentLength);
    let leadingZeros = 0;
    while (adjustedNumerator < reducedDen && leadingZeros < Rational.MAX_PERIOD_CHECK) {
      adjustedNumerator *= 10n;
      leadingZeros++;
    }
    return leadingZeros;
  }
  #computeDecimalMetadata(maxPeriodDigits = Rational.DEFAULT_PERIOD_DIGITS) {
    if (this.#periodLength !== undefined && this.#maxPeriodDigitsComputed !== undefined && this.#maxPeriodDigitsComputed >= maxPeriodDigits)
      return;
    this.#computeWholePart();
    if (this.#remainder === 0n) {
      this.#initialSegment = "";
      this.#periodDigits = "";
      this.#periodLength = 0;
      this.#isTerminating = true;
      this.#factorsOf2 = 0;
      this.#factorsOf5 = 0;
      this.#leadingZerosInPeriod = 0;
      this.#initialSegmentLeadingZeros = 0;
      this.#initialSegmentRest = "";
      this.#periodDigitsRest = "";
      this.#maxPeriodDigitsComputed = maxPeriodDigits;
      return;
    }
    this.#factorsOf2 = Rational.#countFactorsOf2(this.#denominator);
    this.#factorsOf5 = Rational.#countFactorsOf5(this.#denominator);
    const initialSegmentLength = Math.max(this.#factorsOf2, this.#factorsOf5);
    let reducedDen = this.#denominator;
    for (let i = 0;i < this.#factorsOf2; i++) {
      reducedDen /= 2n;
    }
    for (let i = 0;i < this.#factorsOf5; i++) {
      reducedDen /= 5n;
    }
    if (reducedDen === 1n) {
      const digits = [];
      let currentRemainder2 = this.#remainder;
      for (let i = 0;i < initialSegmentLength && currentRemainder2 !== 0n; i++) {
        currentRemainder2 *= 10n;
        const digit = currentRemainder2 / this.#denominator;
        digits.push(digit.toString());
        currentRemainder2 = currentRemainder2 % this.#denominator;
      }
      this.#initialSegment = digits.join("");
      this.#periodDigits = "";
      this.#periodLength = 0;
      this.#isTerminating = true;
      this.#leadingZerosInPeriod = 0;
      this.#computeDecimalPartBreakdown();
      this.#maxPeriodDigitsComputed = maxPeriodDigits;
      return;
    }
    let periodLength = 1;
    let remainder = 10n % reducedDen;
    while (remainder !== 1n && periodLength < Rational.MAX_PERIOD_CHECK) {
      periodLength++;
      remainder = remainder * 10n % reducedDen;
    }
    this.#periodLength = periodLength >= Rational.MAX_PERIOD_CHECK ? -1 : periodLength;
    this.#isTerminating = false;
    this.#leadingZerosInPeriod = this.#computeLeadingZerosInPeriod(reducedDen, initialSegmentLength);
    const initialDigits = [];
    let currentRemainder = this.#remainder;
    for (let i = 0;i < initialSegmentLength && currentRemainder !== 0n; i++) {
      currentRemainder *= 10n;
      const digit = currentRemainder / this.#denominator;
      initialDigits.push(digit.toString());
      currentRemainder = currentRemainder % this.#denominator;
    }
    const periodDigitsToCompute = this.#periodLength === -1 ? maxPeriodDigits : this.#periodLength > maxPeriodDigits ? maxPeriodDigits : this.#periodLength;
    const periodDigits = [];
    if (currentRemainder !== 0n) {
      for (let i = 0;i < periodDigitsToCompute; i++) {
        currentRemainder *= 10n;
        const digit = currentRemainder / this.#denominator;
        periodDigits.push(digit.toString());
        currentRemainder = currentRemainder % this.#denominator;
      }
    }
    this.#initialSegment = initialDigits.join("");
    this.#periodDigits = periodDigits.join("");
    this.#computeDecimalPartBreakdown();
    this.#maxPeriodDigitsComputed = maxPeriodDigits;
  }
  #computeDecimalPartBreakdown() {
    let leadingZeros = 0;
    const initialSegment = this.#initialSegment || "";
    for (let i = 0;i < initialSegment.length; i++) {
      if (initialSegment[i] === "0") {
        leadingZeros++;
      } else {
        break;
      }
    }
    this.#initialSegmentLeadingZeros = leadingZeros;
    this.#initialSegmentRest = initialSegment.substring(leadingZeros);
    const periodDigits = this.#periodDigits || "";
    let periodLeadingZeros = 0;
    for (let i = 0;i < periodDigits.length; i++) {
      if (periodDigits[i] === "0") {
        periodLeadingZeros++;
      } else {
        break;
      }
    }
    this.#leadingZerosInPeriod = periodLeadingZeros;
    this.#periodDigitsRest = periodDigits.substring(periodLeadingZeros);
  }
  computeDecimalMetadata(maxPeriodDigits = Rational.DEFAULT_PERIOD_DIGITS) {
    if (this.#numerator === 0n) {
      return {
        initialSegment: "",
        periodDigits: "",
        periodLength: 0,
        isTerminating: true
      };
    }
    this.#computeDecimalMetadata(maxPeriodDigits);
    return {
      wholePart: this.#wholePart,
      initialSegment: this.#initialSegment,
      initialSegmentLeadingZeros: this.#initialSegmentLeadingZeros,
      initialSegmentRest: this.#initialSegmentRest,
      periodDigits: this.#periodDigits,
      periodLength: this.#periodLength,
      leadingZerosInPeriod: this.#leadingZerosInPeriod,
      periodDigitsRest: this.#periodDigitsRest,
      isTerminating: this.#isTerminating
    };
  }
  static #formatRepeatedDigits(digits, threshold = 6) {
    if (!digits || digits.length === 0)
      return digits;
    let result = "";
    let i = 0;
    while (i < digits.length) {
      let currentChar = digits[i];
      let count = 1;
      while (i + count < digits.length && digits[i + count] === currentChar) {
        count++;
      }
      if (count >= threshold) {
        result += `{${currentChar}~${count}}`;
      } else {
        result += currentChar.repeat(count);
      }
      i += count;
    }
    return result;
  }
  static #parseRepeatedDigits(formattedDigits) {
    if (!formattedDigits || !formattedDigits.includes("{")) {
      return formattedDigits;
    }
    return formattedDigits.replace(/\{(.+?)~(\d+)\}/g, (match, digits, count) => {
      return digits.repeat(parseInt(count));
    });
  }
  extractPeriodSegment(initialSegment, periodLength, digitsRequested) {
    if (periodLength === 0 || periodLength === -1) {
      return "";
    }
    const digitsToReturn = Math.min(digitsRequested, periodLength);
    const periodDigits = [];
    let currentRemainder = this.#numerator % this.#denominator;
    const isNegative = this.#numerator < 0n;
    if (isNegative) {
      currentRemainder = -currentRemainder;
    }
    for (let i = 0;i < initialSegment.length; i++) {
      currentRemainder *= 10n;
      currentRemainder = currentRemainder % this.#denominator;
    }
    for (let i = 0;i < digitsToReturn; i++) {
      currentRemainder *= 10n;
      const digit = currentRemainder / this.#denominator;
      periodDigits.push(digit.toString());
      currentRemainder = currentRemainder % this.#denominator;
    }
    return periodDigits.join("");
  }
  toDecimal() {
    if (this.#numerator === 0n) {
      return "0";
    }
    const isNegative = this.#numerator < 0n;
    const num = isNegative ? -this.#numerator : this.#numerator;
    const den = this.#denominator;
    const integerPart = num / den;
    let remainder = num % den;
    if (remainder === 0n) {
      return (isNegative ? "-" : "") + integerPart.toString();
    }
    const digits = [];
    const maxDigits = 20;
    for (let i = 0;i < maxDigits && remainder !== 0n; i++) {
      remainder *= 10n;
      const digit = remainder / den;
      digits.push(digit.toString());
      remainder = remainder % den;
    }
    let result = (isNegative ? "-" : "") + integerPart.toString();
    if (digits.length > 0) {
      result += "." + digits.join("");
    }
    return result;
  }
  E(exponent) {
    const exp = BigInt(exponent);
    let powerOf10;
    if (exp >= 0n) {
      powerOf10 = new Rational(10n ** exp, 1n);
    } else {
      powerOf10 = new Rational(1n, 10n ** -exp);
    }
    return this.multiply(powerOf10);
  }
  #generatePeriodInfo(showPeriodInfo) {
    if (!showPeriodInfo || this.#isTerminating) {
      return "";
    }
    const info = [];
    if (this.#initialSegmentLeadingZeros > 0) {
      info.push(`initial: ${this.#initialSegmentLeadingZeros} zeros`);
    }
    if (this.#leadingZerosInPeriod > 0) {
      info.push(`period starts: +${this.#leadingZerosInPeriod} zeros`);
    }
    if (this.#periodLength === -1) {
      info.push("period: >10^7");
    } else if (this.#periodLength > 0) {
      info.push(`period: ${this.#periodLength}`);
    }
    return info.length > 0 ? ` {${info.join(", ")}}` : "";
  }
  toScientificNotation(useRepeatNotation = true, precision = 11, showPeriodInfo = false) {
    if (this.#numerator === 0n) {
      return "0";
    }
    this.#computeWholePart();
    this.#computeDecimalMetadata(100);
    const isNegative = this.#isNegative;
    const prefix = isNegative ? "-" : "";
    if (this.#wholePart > 0n) {
      const wholeStr = this.#wholePart.toString();
      const firstDigit = wholeStr[0];
      const exponent = wholeStr.length - 1;
      let mantissa = firstDigit;
      const hasMoreWholeDigits = wholeStr.length > 1;
      const hasFractionalPart = this.#remainder > 0n;
      if (hasFractionalPart || hasMoreWholeDigits) {
        if (hasFractionalPart && !this.#isTerminating) {
          mantissa += ".";
          const remainingWholeDigits = hasMoreWholeDigits ? wholeStr.substring(1) : "";
          const formattedInitial = useRepeatNotation ? Rational.#formatRepeatedDigits(this.#initialSegment, 7) : this.#initialSegment;
          let periodDigits = this.#periodDigits;
          if (this.#periodLength > 0 && this.#periodLength <= Rational.MAX_PERIOD_DIGITS && periodDigits.length < this.#periodLength) {
            periodDigits = this.extractPeriodSegment(this.#initialSegment, this.#periodLength, Math.min(10, this.#periodLength));
          }
          if (remainingWholeDigits && periodDigits && remainingWholeDigits === periodDigits.substring(0, remainingWholeDigits.length)) {
            mantissa += "#" + periodDigits;
          } else {
            if (hasMoreWholeDigits) {
              mantissa += remainingWholeDigits;
            }
            mantissa += formattedInitial + "#";
            const formattedPeriod = useRepeatNotation ? Rational.#formatRepeatedDigits(periodDigits, 7) : periodDigits.substring(0, Math.max(1, precision - mantissa.length + 1));
            mantissa += formattedPeriod;
          }
        } else {
          if (hasMoreWholeDigits || hasFractionalPart) {
            mantissa += ".";
            if (hasMoreWholeDigits) {
              const remainingDigits = wholeStr.substring(1);
              if (!hasFractionalPart) {
                const trimmedDigits = remainingDigits.replace(/0+$/, "");
                if (trimmedDigits === "") {
                  mantissa = mantissa.slice(0, -1);
                } else {
                  mantissa += trimmedDigits;
                }
              } else {
                mantissa += remainingDigits;
              }
            }
            if (hasFractionalPart) {
              const formattedInitial = useRepeatNotation ? Rational.#formatRepeatedDigits(this.#initialSegment, 7) : this.#initialSegment;
              const trimmedInitial = formattedInitial.replace(/0+$/, "");
              if (trimmedInitial) {
                mantissa += trimmedInitial;
              } else if (!hasMoreWholeDigits) {
                mantissa = mantissa.slice(0, -1);
              }
            }
          }
        }
      } else if (!hasFractionalPart && !hasMoreWholeDigits) {}
      const result = `${prefix}${mantissa}E${exponent}`;
      return result + this.#generatePeriodInfo(showPeriodInfo);
    }
    if (this.#isTerminating) {
      const leadingZeros = this.#initialSegmentLeadingZeros;
      const rest = this.#initialSegmentRest;
      if (rest === "") {
        return prefix + "0";
      }
      const firstDigit = rest[0];
      const exponent = -(leadingZeros + 1);
      let mantissa = firstDigit;
      if (rest.length > 1) {
        const remainingDigits = Math.max(0, precision - 1);
        mantissa += "." + rest.substring(1, remainingDigits + 1);
      }
      return `${prefix}${mantissa}E${exponent}`;
    } else {
      const firstNonZeroInPeriod = this.#periodDigitsRest;
      if (this.#initialSegmentRest !== "") {
        const firstDigit = this.#initialSegmentRest[0];
        const exponent = -(this.#initialSegmentLeadingZeros + 1);
        let mantissa = firstDigit;
        if (this.#initialSegmentRest.length > 1 || this.#periodDigits !== "") {
          mantissa += ".";
          if (this.#initialSegmentRest.length > 1) {
            mantissa += this.#initialSegmentRest.substring(1);
          }
          mantissa += "#";
          if (this.#leadingZerosInPeriod > 0 && useRepeatNotation && this.#leadingZerosInPeriod > 6) {
            mantissa += `{0~${this.#leadingZerosInPeriod}}`;
          } else if (this.#leadingZerosInPeriod > 0) {
            mantissa += "0".repeat(Math.min(this.#leadingZerosInPeriod, 10));
          }
          if (firstNonZeroInPeriod !== "") {
            const remainingLength = Math.max(1, precision - mantissa.length + 1);
            mantissa += firstNonZeroInPeriod.substring(0, remainingLength);
          }
        }
        const result = `${prefix}${mantissa}E${exponent}`;
        return result + this.#generatePeriodInfo(showPeriodInfo);
      } else if (firstNonZeroInPeriod !== "") {
        const firstDigit = firstNonZeroInPeriod[0];
        const totalLeadingZeros = this.#initialSegmentLeadingZeros + this.#leadingZerosInPeriod;
        const exponent = -(totalLeadingZeros + 1);
        let mantissa = firstDigit;
        if (firstNonZeroInPeriod.length > 1) {
          mantissa += ".#";
          const remainingDigits = Math.max(0, precision - 3);
          mantissa += firstNonZeroInPeriod.substring(1, remainingDigits + 1);
        } else {
          mantissa += ".#" + firstDigit;
        }
        const result = `${prefix}${mantissa}E${exponent}`;
        return result + this.#generatePeriodInfo(showPeriodInfo);
      } else {
        return prefix + "0";
      }
    }
  }
  static from(value) {
    if (value instanceof Rational) {
      return new Rational(value.numerator, value.denominator);
    }
    return new Rational(value);
  }
  static DEFAULT_CF_LIMIT = 1000;
  static fromContinuedFraction(cfArray) {
    if (!Array.isArray(cfArray) || cfArray.length === 0) {
      throw new Error("Continued fraction array cannot be empty");
    }
    const cf = cfArray.map((term) => {
      if (typeof term === "number") {
        return BigInt(term);
      } else if (typeof term === "bigint") {
        return term;
      } else {
        throw new Error(`Invalid continued fraction term: ${term}`);
      }
    });
    for (let i = 1;i < cf.length; i++) {
      if (cf[i] <= 0n) {
        throw new Error(`Continued fraction terms must be positive: ${cf[i]}`);
      }
    }
    if (cf.length === 1) {
      return new Rational(cf[0], 1n);
    }
    let p_prev = 1n;
    let p_curr = cf[0];
    let q_prev = 0n;
    let q_curr = 1n;
    const convergents = [new Rational(p_curr, q_curr)];
    for (let i = 1;i < cf.length; i++) {
      const a = cf[i];
      const p_next = a * p_curr + p_prev;
      const q_next = a * q_curr + q_prev;
      convergents.push(new Rational(p_next, q_next));
      p_prev = p_curr;
      p_curr = p_next;
      q_prev = q_curr;
      q_curr = q_next;
    }
    const result = convergents[convergents.length - 1];
    result.cf = cf.slice(1);
    result._convergents = convergents;
    result.wholePart = cf[0];
    return result;
  }
  toContinuedFraction(maxTerms = Rational.DEFAULT_CF_LIMIT) {
    if (this.#denominator === 0n) {
      throw new Error("Cannot convert infinite value to continued fraction");
    }
    if (this.#denominator === 1n) {
      return [this.#numerator];
    }
    const cf = [];
    let num = this.#numerator;
    let den = this.#denominator;
    const isNeg = num < 0n;
    if (isNeg) {
      num = -num;
    }
    let intPart = num / den;
    if (isNeg) {
      intPart = -intPart;
      if (num % den !== 0n) {
        intPart = intPart - 1n;
        num = den - num % den;
      } else {
        num = num % den;
      }
    } else {
      num = num % den;
    }
    cf.push(intPart);
    let termCount = 1;
    while (num !== 0n && termCount < maxTerms) {
      const quotient = den / num;
      cf.push(quotient);
      const remainder = den % num;
      den = num;
      num = remainder;
      termCount++;
    }
    if (cf.length > 1 && cf[cf.length - 1] === 1n) {
      const secondLast = cf[cf.length - 2];
      cf[cf.length - 2] = secondLast + 1n;
      cf.pop();
    }
    this.cf = cf.slice(1);
    if (!this.wholePart) {
      this.wholePart = cf[0];
    }
    return cf;
  }
  toContinuedFractionString() {
    const cf = this.toContinuedFraction();
    if (cf.length === 1) {
      return `${cf[0]}.~0`;
    }
    const intPart = cf[0];
    const cfTerms = cf.slice(1);
    return `${intPart}.~${cfTerms.join("~")}`;
  }
  static fromContinuedFractionString(cfString) {
    const cfMatch = cfString.match(/^(-?\d+)\.~(.*)$/);
    if (!cfMatch) {
      throw new Error("Invalid continued fraction format");
    }
    const [, integerPart, cfTermsStr] = cfMatch;
    const intPart = BigInt(integerPart);
    if (cfTermsStr === "0") {
      return new Rational(intPart, 1n);
    }
    if (cfTermsStr === "") {
      throw new Error("Continued fraction must have at least one term after .~");
    }
    if (cfTermsStr.endsWith("~")) {
      throw new Error("Continued fraction cannot end with ~");
    }
    if (cfTermsStr.includes("~~")) {
      throw new Error("Invalid continued fraction format: double tilde");
    }
    const terms = cfTermsStr.split("~");
    const cfTerms = [];
    for (const term of terms) {
      if (!/^\d+$/.test(term)) {
        throw new Error(`Invalid continued fraction term: ${term}`);
      }
      const termValue = BigInt(term);
      if (termValue <= 0n) {
        throw new Error(`Continued fraction terms must be positive integers: ${term}`);
      }
      cfTerms.push(termValue);
    }
    const cfArray = [intPart, ...cfTerms];
    return Rational.fromContinuedFraction(cfArray);
  }
  convergents(maxCount = Rational.DEFAULT_CF_LIMIT) {
    if (!this._convergents) {
      const cf = this.toContinuedFraction(maxCount);
      if (cf.length === 1) {
        this._convergents = [new Rational(cf[0], 1n)];
      } else {
        let p_prev = 1n;
        let p_curr = cf[0];
        let q_prev = 0n;
        let q_curr = 1n;
        const convergents = [new Rational(p_curr, q_curr)];
        for (let i = 1;i < cf.length; i++) {
          const a = cf[i];
          const p_next = a * p_curr + p_prev;
          const q_next = a * q_curr + q_prev;
          convergents.push(new Rational(p_next, q_next));
          p_prev = p_curr;
          p_curr = p_next;
          q_prev = q_curr;
          q_curr = q_next;
        }
        this._convergents = convergents;
      }
    }
    if (maxCount && this._convergents && this._convergents.length > maxCount) {
      return this._convergents.slice(0, maxCount);
    }
    return this._convergents || [];
  }
  getConvergent(n) {
    const convergents = this.convergents();
    if (n < 0 || n >= convergents.length) {
      throw new Error(`Convergent index ${n} out of range [0, ${convergents.length - 1}]`);
    }
    return convergents[n];
  }
  static convergentsFromCF(cfInput, maxCount = Rational.DEFAULT_CF_LIMIT) {
    let cfArray;
    if (typeof cfInput === "string") {
      const rational2 = Rational.fromContinuedFractionString(cfInput);
      return rational2.convergents(maxCount);
    } else {
      cfArray = cfInput;
    }
    const rational = Rational.fromContinuedFraction(cfArray);
    return rational.convergents(maxCount);
  }
  approximationError(target) {
    if (!(target instanceof Rational)) {
      throw new Error("Target must be a Rational");
    }
    const diff = this.subtract(target);
    return diff.isNegative ? diff.negate() : diff;
  }
  bestApproximation(maxDenominator) {
    const cf = this.toContinuedFraction();
    let bestApprox = new Rational(cf[0], 1n);
    const convergents = this.convergents();
    for (const convergent of convergents) {
      if (convergent.denominator <= maxDenominator) {
        bestApprox = convergent;
      } else {
        break;
      }
    }
    return bestApprox;
  }
  bitLength() {
    return Math.max(bitLength(this.numerator), bitLength(this.denominator));
  }
}

// ../../packages/core/src/rational-interval.js
class RationalInterval {
  #low;
  #high;
  static zero = Object.freeze(new RationalInterval(Rational.zero, Rational.zero));
  static one = Object.freeze(new RationalInterval(Rational.one, Rational.one));
  static unitInterval = Object.freeze(new RationalInterval(Rational.zero, Rational.one));
  constructor(a, b) {
    const aRational = a instanceof Rational ? a : new Rational(a);
    const bRational = b instanceof Rational ? b : new Rational(b);
    if (aRational.lessThanOrEqual(bRational)) {
      this.#low = aRational;
      this.#high = bRational;
    } else {
      this.#low = bRational;
      this.#high = aRational;
    }
  }
  get low() {
    return this.#low;
  }
  get high() {
    return this.#high;
  }
  add(other) {
    if (other.value !== undefined && typeof other.value === "bigint") {
      const otherAsRational = new Rational(other.value, 1n);
      const otherAsInterval = new RationalInterval(otherAsRational, otherAsRational);
      return this.add(otherAsInterval);
    } else if (other.numerator !== undefined && other.denominator !== undefined) {
      const otherAsInterval = new RationalInterval(other, other);
      return this.add(otherAsInterval);
    } else if (other.low && other.high) {
      const newLow = this.#low.add(other.low);
      const newHigh = this.#high.add(other.high);
      return new RationalInterval(newLow, newHigh);
    } else {
      throw new Error(`Cannot add ${other.constructor.name} to RationalInterval`);
    }
  }
  subtract(other) {
    if (other.value !== undefined && typeof other.value === "bigint") {
      const otherAsRational = new Rational(other.value, 1n);
      const otherAsInterval = new RationalInterval(otherAsRational, otherAsRational);
      return this.subtract(otherAsInterval);
    } else if (other.numerator !== undefined && other.denominator !== undefined) {
      const otherAsInterval = new RationalInterval(other, other);
      return this.subtract(otherAsInterval);
    } else if (other.low && other.high) {
      const newLow = this.#low.subtract(other.high);
      const newHigh = this.#high.subtract(other.low);
      return new RationalInterval(newLow, newHigh);
    } else {
      throw new Error(`Cannot subtract ${other.constructor.name} from RationalInterval`);
    }
  }
  multiply(other) {
    if (other.value !== undefined && typeof other.value === "bigint") {
      const otherAsRational = new Rational(other.value, 1n);
      const otherAsInterval = new RationalInterval(otherAsRational, otherAsRational);
      return this.multiply(otherAsInterval);
    } else if (other.numerator !== undefined && other.denominator !== undefined) {
      const otherAsInterval = new RationalInterval(other, other);
      return this.multiply(otherAsInterval);
    } else if (other.low && other.high) {
      const products = [
        this.#low.multiply(other.low),
        this.#low.multiply(other.high),
        this.#high.multiply(other.low),
        this.#high.multiply(other.high)
      ];
      let min = products[0];
      let max = products[0];
      for (let i = 1;i < products.length; i++) {
        if (products[i].lessThan(min))
          min = products[i];
        if (products[i].greaterThan(max))
          max = products[i];
      }
      return new RationalInterval(min, max);
    } else {
      throw new Error(`Cannot multiply RationalInterval by ${other.constructor.name}`);
    }
  }
  divide(other) {
    if (other.value !== undefined && typeof other.value === "bigint") {
      if (other.value === 0n) {
        throw new Error("Division by zero");
      }
      const otherAsRational = new Rational(other.value, 1n);
      const otherAsInterval = new RationalInterval(otherAsRational, otherAsRational);
      return this.divide(otherAsInterval);
    } else if (other.numerator !== undefined && other.denominator !== undefined) {
      if (other.numerator === 0n) {
        throw new Error("Division by zero");
      }
      const otherAsInterval = new RationalInterval(other, other);
      return this.divide(otherAsInterval);
    } else if (other.low && other.high) {
      const zero = Rational.zero;
      if (other.low.equals(zero) && other.high.equals(zero)) {
        throw new Error("Division by zero");
      }
      if (other.containsZero()) {
        throw new Error("Cannot divide by an interval containing zero");
      }
      const quotients = [
        this.#low.divide(other.low),
        this.#low.divide(other.high),
        this.#high.divide(other.low),
        this.#high.divide(other.high)
      ];
      let min = quotients[0];
      let max = quotients[0];
      for (let i = 1;i < quotients.length; i++) {
        if (quotients[i].lessThan(min))
          min = quotients[i];
        if (quotients[i].greaterThan(max))
          max = quotients[i];
      }
      return new RationalInterval(min, max);
    } else {
      throw new Error(`Cannot divide RationalInterval by ${other.constructor.name}`);
    }
  }
  reciprocate() {
    if (this.containsZero()) {
      throw new Error("Cannot reciprocate an interval containing zero");
    }
    return new RationalInterval(this.#high.reciprocal(), this.#low.reciprocal());
  }
  negate() {
    return new RationalInterval(this.#high.negate(), this.#low.negate());
  }
  pow(exponent) {
    const n = BigInt(exponent);
    const zero = Rational.zero;
    if (n === 0n) {
      if (this.#low.equals(zero) && this.#high.equals(zero)) {
        throw new Error("Zero cannot be raised to the power of zero");
      }
      if (this.containsZero()) {
        throw new Error("Cannot raise an interval containing zero to the power of zero");
      }
      return new RationalInterval(Rational.one, Rational.one);
    }
    if (n < 0n) {
      if (this.containsZero()) {
        throw new Error("Cannot raise an interval containing zero to a negative power");
      }
      const positivePower = this.pow(-n);
      const reciprocal = new RationalInterval(positivePower.high.reciprocal(), positivePower.low.reciprocal());
      return reciprocal;
    }
    if (n === 1n) {
      return new RationalInterval(this.#low, this.#high);
    }
    if (n % 2n === 0n) {
      let minVal;
      let maxVal;
      if (this.#low.lessThanOrEqual(zero) && this.#high.greaterThanOrEqual(zero)) {
        minVal = new Rational(0);
        const lowPow = this.#low.abs().pow(n);
        const highPow = this.#high.abs().pow(n);
        maxVal = lowPow.greaterThan(highPow) ? lowPow : highPow;
      } else if (this.#high.lessThan(zero)) {
        minVal = this.#high.pow(n);
        maxVal = this.#low.pow(n);
      } else {
        minVal = this.#low.pow(n);
        maxVal = this.#high.pow(n);
      }
      return new RationalInterval(minVal, maxVal);
    } else {
      return new RationalInterval(this.#low.pow(n), this.#high.pow(n));
    }
  }
  mpow(exponent) {
    let n;
    if (typeof exponent === "bigint") {
      n = exponent;
    } else if (typeof exponent === "number") {
      n = BigInt(exponent);
    } else if (typeof exponent === "string") {
      n = BigInt(exponent);
    } else {
      n = BigInt(exponent);
    }
    const zero = Rational.zero;
    if (n === 0n) {
      throw new Error("Multiplicative exponentiation requires at least one factor");
    }
    if (n < 0n) {
      const recipInterval = this.reciprocate();
      return recipInterval.mpow(-n);
    }
    if (n === 1n) {
      return new RationalInterval(this.#low, this.#high);
    }
    if (n === 1n) {
      return new RationalInterval(this.#low, this.#high);
    }
    let result = new RationalInterval(this.#low, this.#high);
    for (let i = 1n;i < n; i++) {
      result = result.multiply(this);
    }
    return result;
  }
  overlaps(other) {
    return !(this.#high.lessThan(other.low) || other.high.lessThan(this.#low));
  }
  contains(other) {
    return this.#low.lessThanOrEqual(other.low) && this.#high.greaterThanOrEqual(other.high);
  }
  containsValue(value) {
    const r = value instanceof Rational ? value : new Rational(value);
    return this.#low.lessThanOrEqual(r) && this.#high.greaterThanOrEqual(r);
  }
  containsZero() {
    const zero = Rational.zero;
    return this.#low.lessThanOrEqual(zero) && this.#high.greaterThanOrEqual(zero);
  }
  equals(other) {
    return this.#low.equals(other.low) && this.#high.equals(other.high);
  }
  intersection(other) {
    if (!this.overlaps(other)) {
      return null;
    }
    const newLow = this.#low.greaterThan(other.low) ? this.#low : other.low;
    const newHigh = this.#high.lessThan(other.high) ? this.#high : other.high;
    return new RationalInterval(newLow, newHigh);
  }
  union(other) {
    const adjacentRight = this.#high.equals(other.low);
    const adjacentLeft = other.high.equals(this.#low);
    if (!this.overlaps(other) && !adjacentRight && !adjacentLeft) {
      return null;
    }
    const newLow = this.#low.lessThan(other.low) ? this.#low : other.low;
    const newHigh = this.#high.greaterThan(other.high) ? this.#high : other.high;
    return new RationalInterval(newLow, newHigh);
  }
  toString() {
    return `${this.#low.toString()}:${this.#high.toString()}`;
  }
  toMixedString() {
    return `${this.#low.toMixedString()}:${this.#high.toMixedString()}`;
  }
  static point(value) {
    let r;
    if (value instanceof Rational) {
      r = value;
    } else if (typeof value === "number") {
      r = new Rational(String(value));
    } else if (typeof value === "string" || typeof value === "bigint") {
      r = new Rational(value);
    } else {
      r = new Rational(0);
    }
    return new RationalInterval(r, r);
  }
  static fromString(str) {
    const parts = str.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid interval format. Use 'a:b'");
    }
    return new RationalInterval(parts[0], parts[1]);
  }
  toRepeatingDecimal(useRepeatNotation = true) {
    const lowDecimal = this.#low.toRepeatingDecimalWithPeriod(useRepeatNotation).decimal;
    const highDecimal = this.#high.toRepeatingDecimalWithPeriod(useRepeatNotation).decimal;
    return `${lowDecimal}:${highDecimal}`;
  }
  compactedDecimalInterval() {
    const lowStr = this.#low.toDecimal();
    const highStr = this.#high.toDecimal();
    let commonPrefix = "";
    const minLength = Math.min(lowStr.length, highStr.length);
    for (let i = 0;i < minLength; i++) {
      if (lowStr[i] === highStr[i]) {
        commonPrefix += lowStr[i];
      } else {
        break;
      }
    }
    if (commonPrefix.length <= 1 || commonPrefix.startsWith("-") && commonPrefix.length <= 2) {
      return `${lowStr}:${highStr}`;
    }
    const lowSuffix = lowStr.substring(commonPrefix.length);
    const highSuffix = highStr.substring(commonPrefix.length);
    if (!lowSuffix || !highSuffix || lowSuffix.length !== highSuffix.length) {
      return `${lowStr}:${highStr}`;
    }
    if (!/^\d+$/.test(lowSuffix) || !/^\d+$/.test(highSuffix)) {
      return `${lowStr}:${highStr}`;
    }
    return `${commonPrefix}[${lowSuffix},${highSuffix}]`;
  }
  relativeMidDecimalInterval() {
    const midpoint = this.#low.add(this.#high).divide(new Rational(2));
    const offset = this.#high.subtract(midpoint);
    const midpointStr = midpoint.toDecimal();
    const offsetStr = offset.toDecimal();
    return `${midpointStr}[+-${offsetStr}]`;
  }
  relativeDecimalInterval() {
    const shortestDecimal = this.#findShortestPreciseDecimal();
    const offsetLow = shortestDecimal.subtract(this.#low);
    const offsetHigh = this.#high.subtract(shortestDecimal);
    const decimalStr = shortestDecimal.toDecimal();
    const decimalPlaces = decimalStr.includes(".") ? decimalStr.split(".")[1].length : 0;
    let scaledOffsetLow, scaledOffsetHigh;
    if (decimalPlaces === 0) {
      scaledOffsetLow = offsetLow;
      scaledOffsetHigh = offsetHigh;
    } else {
      const scaleFactor = new Rational(10).pow(decimalPlaces + 1);
      scaledOffsetLow = offsetLow.multiply(scaleFactor);
      scaledOffsetHigh = offsetHigh.multiply(scaleFactor);
    }
    const offsetLowStr = scaledOffsetLow.toDecimal();
    const offsetHighStr = scaledOffsetHigh.toDecimal();
    if (offsetLow.subtract(offsetHigh).abs().compareTo(new Rational(1, 1e6)) < 0) {
      const avgOffset = scaledOffsetLow.add(scaledOffsetHigh).divide(new Rational(2));
      return `${decimalStr}[+-${avgOffset.toDecimal()}]`;
    } else {
      return `${decimalStr}[+${offsetHighStr},-${offsetLowStr}]`;
    }
  }
  #findShortestPreciseDecimal() {
    const midpoint = this.#low.add(this.#high).divide(new Rational(2));
    for (let precision = 0;precision <= 20; precision++) {
      const scale = new Rational(10).pow(precision);
      const lowScaled = this.#low.multiply(scale);
      const highScaled = this.#high.multiply(scale);
      const minInt = this.#ceilRational(lowScaled);
      const maxInt = this.#floorRational(highScaled);
      if (minInt.compareTo(maxInt) <= 0) {
        const candidates = [];
        let current = minInt;
        while (current.compareTo(maxInt) <= 0) {
          candidates.push(current.divide(scale));
          current = current.add(new Rational(1));
        }
        if (candidates.length > 0) {
          let best = candidates[0];
          let bestDistance = best.subtract(midpoint).abs();
          for (let i = 1;i < candidates.length; i++) {
            const distance = candidates[i].subtract(midpoint).abs();
            const comparison = distance.compareTo(bestDistance);
            if (comparison < 0 || comparison === 0 && candidates[i].compareTo(best) < 0) {
              best = candidates[i];
              bestDistance = distance;
            }
          }
          return best;
        }
      }
    }
    return midpoint;
  }
  #ceilRational(rational) {
    if (rational.denominator === 1n) {
      return rational;
    }
    const quotient = rational.numerator / rational.denominator;
    if (rational.numerator >= 0n) {
      return new Rational(quotient + 1n, 1n);
    } else {
      return new Rational(quotient, 1n);
    }
  }
  #floorRational(rational) {
    if (rational.denominator === 1n) {
      return rational;
    }
    const quotient = rational.numerator / rational.denominator;
    if (rational.numerator >= 0n) {
      return new Rational(quotient, 1n);
    } else {
      return new Rational(quotient - 1n, 1n);
    }
  }
  bitLength() {
    return Math.max(this.#low.bitLength(), this.#high.bitLength());
  }
  mediant() {
    return new Rational(this.#low.numerator + this.#high.numerator, this.#low.denominator + this.#high.denominator);
  }
  midpoint() {
    return this.#low.add(this.#high).divide(new Rational(2));
  }
  shortestDecimal(base = 10) {
    const baseBigInt = BigInt(base);
    if (baseBigInt <= 1n) {
      throw new Error("Base must be greater than 1");
    }
    if (this.#low.equals(this.#high)) {
      const value = this.#low;
      let k2 = 0;
      let denominator2 = 1n;
      while (k2 <= 50) {
        const numeratorCandidate = value.multiply(new Rational(denominator2));
        if (numeratorCandidate.denominator === 1n) {
          return new Rational(numeratorCandidate.numerator, denominator2);
        }
        k2++;
        denominator2 *= baseBigInt;
      }
      return null;
    }
    const intervalLength = this.#high.subtract(this.#low);
    const lengthAsNumber = Number(intervalLength.numerator) / Number(intervalLength.denominator);
    const baseAsNumber = Number(baseBigInt);
    let maxK = Math.ceil(Math.log(1 / lengthAsNumber) / Math.log(baseAsNumber));
    maxK = Math.max(0, maxK + 2);
    let k = 0;
    let denominator = 1n;
    while (k <= maxK) {
      const minNumerator = this.#ceilRational(this.#low.multiply(new Rational(denominator)));
      const maxNumerator = this.#floorRational(this.#high.multiply(new Rational(denominator)));
      if (minNumerator.lessThanOrEqual(maxNumerator)) {
        return new Rational(minNumerator.numerator, denominator);
      }
      k++;
      denominator *= baseBigInt;
    }
    throw new Error("Failed to find shortest decimal representation (exceeded theoretical bound)");
  }
  randomRational(maxDenominator = 1000) {
    const maxDenom = BigInt(maxDenominator);
    if (maxDenom <= 0n) {
      throw new Error("maxDenominator must be positive");
    }
    const validRationals = [];
    for (let denom = 1n;denom <= maxDenom; denom++) {
      const minNum = this.#ceilRational(this.#low.multiply(new Rational(denom)));
      const maxNum = this.#floorRational(this.#high.multiply(new Rational(denom)));
      for (let num = minNum.numerator;num <= maxNum.numerator; num++) {
        const candidate = new Rational(num, denom);
        if (candidate.numerator === num && candidate.denominator === denom) {
          validRationals.push(candidate);
        }
      }
    }
    if (validRationals.length === 0) {
      return this.midpoint();
    }
    const randomIndex = Math.floor(Math.random() * validRationals.length);
    return validRationals[randomIndex];
  }
  #gcd(a, b) {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b !== 0n) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }
  E(exponent) {
    const exp = BigInt(exponent);
    let powerOf10;
    if (exp >= 0n) {
      powerOf10 = new Rational(10n ** exp, 1n);
    } else {
      powerOf10 = new Rational(1n, 10n ** -exp);
    }
    const newLow = this.#low.multiply(powerOf10);
    const newHigh = this.#high.multiply(powerOf10);
    return new RationalInterval(newLow, newHigh);
  }
  bitLength() {
    const lowBits = this.#low.bitLength();
    const highBits = this.#high.bitLength();
    return Math.max(lowBits, highBits);
  }
}

// ../../packages/core/src/fraction.js
class Fraction {
  #numerator;
  #denominator;
  constructor(numerator, denominator = 1n, options = {}) {
    if (typeof numerator === "string") {
      const parts = numerator.trim().split("/");
      if (parts.length === 1) {
        this.#numerator = BigInt(parts[0]);
        this.#denominator = BigInt(denominator);
      } else if (parts.length === 2) {
        this.#numerator = BigInt(parts[0]);
        this.#denominator = BigInt(parts[1]);
      } else {
        throw new Error("Invalid fraction format. Use 'a/b' or 'a'");
      }
    } else {
      this.#numerator = BigInt(numerator);
      this.#denominator = BigInt(denominator);
    }
    if (this.#denominator === 0n) {
      if (options.allowInfinite && (this.#numerator === 1n || this.#numerator === -1n)) {
        this._isInfinite = true;
      } else {
        throw new Error("Denominator cannot be zero");
      }
    } else {
      this._isInfinite = false;
    }
  }
  get numerator() {
    return this.#numerator;
  }
  get denominator() {
    return this.#denominator;
  }
  get isInfinite() {
    return this._isInfinite || false;
  }
  add(other) {
    if (this.#denominator !== other.denominator) {
      throw new Error("Addition only supported for equal denominators");
    }
    return new Fraction(this.#numerator + other.numerator, this.#denominator);
  }
  subtract(other) {
    if (this.#denominator !== other.denominator) {
      throw new Error("Subtraction only supported for equal denominators");
    }
    return new Fraction(this.#numerator - other.numerator, this.#denominator);
  }
  multiply(other) {
    return new Fraction(this.#numerator * other.numerator, this.#denominator * other.denominator);
  }
  divide(other) {
    if (other.numerator === 0n) {
      throw new Error("Division by zero");
    }
    return new Fraction(this.#numerator * other.denominator, this.#denominator * other.numerator);
  }
  pow(exponent) {
    const n = BigInt(exponent);
    if (n === 0n) {
      if (this.#numerator === 0n) {
        throw new Error("Zero cannot be raised to the power of zero");
      }
      return new Fraction(1, 1);
    }
    if (this.#numerator === 0n && n < 0n) {
      throw new Error("Zero cannot be raised to a negative power");
    }
    if (n < 0n) {
      return new Fraction(this.#denominator ** -n, this.#numerator ** -n);
    }
    return new Fraction(this.#numerator ** n, this.#denominator ** n);
  }
  scale(factor) {
    const scaleFactor = BigInt(factor);
    return new Fraction(this.#numerator * scaleFactor, this.#denominator * scaleFactor);
  }
  static #gcd(a, b) {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b !== 0n) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }
  reduce() {
    if (this.#numerator === 0n) {
      return new Fraction(0, 1);
    }
    const gcd = Fraction.#gcd(this.#numerator, this.#denominator);
    const reducedNum = this.#numerator / gcd;
    const reducedDen = this.#denominator / gcd;
    if (reducedDen < 0n) {
      return new Fraction(-reducedNum, -reducedDen);
    }
    return new Fraction(reducedNum, reducedDen);
  }
  static mediant(a, b) {
    return new Fraction(a.numerator + b.numerator, a.denominator + b.denominator);
  }
  toRational() {
    return new Rational(this.#numerator, this.#denominator);
  }
  static fromRational(rational) {
    return new Fraction(rational.numerator, rational.denominator);
  }
  toString() {
    if (this.#denominator === 1n) {
      return this.#numerator.toString();
    }
    return `${this.#numerator}/${this.#denominator}`;
  }
  equals(other) {
    return this.#numerator === other.numerator && this.#denominator === other.denominator;
  }
  lessThan(other) {
    const leftSide = this.#numerator * other.denominator;
    const rightSide = this.#denominator * other.numerator;
    return leftSide < rightSide;
  }
  lessThanOrEqual(other) {
    const leftSide = this.#numerator * other.denominator;
    const rightSide = this.#denominator * other.numerator;
    return leftSide <= rightSide;
  }
  greaterThan(other) {
    const leftSide = this.#numerator * other.denominator;
    const rightSide = this.#denominator * other.numerator;
    return leftSide > rightSide;
  }
  greaterThanOrEqual(other) {
    const leftSide = this.#numerator * other.denominator;
    const rightSide = this.#denominator * other.numerator;
    return leftSide >= rightSide;
  }
  E(exponent) {
    const exp = BigInt(exponent);
    if (exp >= 0n) {
      const newNumerator = this.#numerator * 10n ** exp;
      return new Fraction(newNumerator, this.#denominator);
    } else {
      const newDenominator = this.#denominator * 10n ** -exp;
      return new Fraction(this.#numerator, newDenominator);
    }
  }
  mediant(other) {
    if (this.isInfinite && other.isInfinite) {
      if (this.#numerator === -1n && other.numerator === 1n) {
        return new Fraction(0n, 1n);
      } else if (this.#numerator === 1n && other.numerator === -1n) {
        return new Fraction(0n, 1n);
      }
      throw new Error("Cannot compute mediant of two infinite fractions");
    }
    if (this.isInfinite || other.isInfinite) {
      const newNum2 = this.#numerator + other.numerator;
      const newDen2 = this.#denominator + other.denominator;
      if (newNum2 === 0n && newDen2 === 0n) {
        throw new Error("Mediant would result in 0/0");
      }
      return new Fraction(newNum2, newDen2);
    }
    const newNum = this.#numerator + other.numerator;
    const newDen = this.#denominator + other.denominator;
    return new Fraction(newNum, newDen);
  }
  fareyParents() {
    if (this.isInfinite) {
      throw new Error("Cannot find Farey parents of infinite fraction");
    }
    if (this.#numerator === 0n && this.#denominator === 1n) {
      const left = new Fraction(-1n, 0n, { allowInfinite: true });
      const right = new Fraction(1n, 0n, { allowInfinite: true });
      return { left, right };
    }
    let leftBound = new Fraction(-1n, 0n, { allowInfinite: true });
    let rightBound = new Fraction(1n, 0n, { allowInfinite: true });
    let current = new Fraction(0n, 1n);
    while (!current.equals(this)) {
      if (this.lessThan(current)) {
        rightBound = current;
        current = leftBound.mediant(current);
      } else {
        leftBound = current;
        current = current.mediant(rightBound);
      }
    }
    return { left: leftBound, right: rightBound };
  }
  _extendedGcd(a, b) {
    if (b === 0n) {
      return { gcd: a, x: 1n, y: 0n };
    }
    const result = this._extendedGcd(b, a % b);
    const x = result.y;
    const y = result.x - a / b * result.y;
    return { gcd: result.gcd, x, y };
  }
  static mediantPartner(endpoint, mediant) {
    if (endpoint.isInfinite || mediant.isInfinite) {
      throw new Error("Cannot compute mediant partner with infinite fractions");
    }
    const p = endpoint.numerator;
    const q = endpoint.denominator;
    const a = mediant.numerator;
    const b = mediant.denominator;
    const s = 1n;
    const numerator = a * (q + s) - b * p;
    if (numerator % b !== 0n) {
      const r2 = a * 2n - p;
      const s_calculated = b * 2n - q;
      return new Fraction(r2, s_calculated);
    }
    const r = numerator / b;
    return new Fraction(r, s);
  }
  static isMediantTriple(left, mediant, right) {
    if (mediant.isInfinite) {
      return false;
    }
    if (left.isInfinite && right.isInfinite) {
      return false;
    }
    try {
      const computedMediant = left.mediant(right);
      return mediant.equals(computedMediant);
    } catch (error) {
      return false;
    }
  }
  static isFareyTriple(left, mediant, right) {
    if (!Fraction.isMediantTriple(left, mediant, right)) {
      return false;
    }
    if (!left.isInfinite && !right.isInfinite) {
      const a = left.numerator;
      const b = left.denominator;
      const c = right.numerator;
      const d = right.denominator;
      const determinant = a * d - b * c;
      return determinant === 1n || determinant === -1n;
    }
    return left.isInfinite || right.isInfinite;
  }
  sternBrocotParent() {
    if (this.isInfinite) {
      throw new Error("Infinite fractions don't have parents in Stern-Brocot tree");
    }
    if (this.numerator === 0n && this.denominator === 1n) {
      return null;
    }
    const path = this.sternBrocotPath();
    if (path.length === 0) {
      return null;
    }
    const parentPath = path.slice(0, -1);
    return Fraction.fromSternBrocotPath(parentPath);
  }
  sternBrocotChildren() {
    if (this.isInfinite) {
      throw new Error("Infinite fractions don't have children in Stern-Brocot tree");
    }
    const currentPath = this.sternBrocotPath();
    const leftPath = [...currentPath, "L"];
    const rightPath = [...currentPath, "R"];
    return {
      left: Fraction.fromSternBrocotPath(leftPath),
      right: Fraction.fromSternBrocotPath(rightPath)
    };
  }
  sternBrocotPath() {
    if (this.isInfinite) {
      throw new Error("Infinite fractions don't have tree paths");
    }
    const reduced = this.reduce();
    if (reduced.numerator === 0n && reduced.denominator === 1n) {
      return [];
    }
    let left = new Fraction(-1, 0, { allowInfinite: true });
    let right = new Fraction(1, 0, { allowInfinite: true });
    let current = new Fraction(0, 1);
    const path = [];
    while (!current.equals(reduced)) {
      if (reduced.lessThan(current)) {
        path.push("L");
        right = current;
        current = left.mediant(current);
      } else {
        path.push("R");
        left = current;
        current = current.mediant(right);
      }
      if (path.length > 500) {
        throw new Error("Stern-Brocot path too long - this may indicate a bug in the algorithm");
      }
    }
    return path;
  }
  static fromSternBrocotPath(path) {
    let left = new Fraction(-1, 0, { allowInfinite: true });
    let right = new Fraction(1, 0, { allowInfinite: true });
    let current = new Fraction(0, 1);
    for (const direction of path) {
      if (direction === "L") {
        right = current;
        current = left.mediant(current);
      } else if (direction === "R") {
        left = current;
        current = current.mediant(right);
      } else {
        throw new Error(`Invalid direction in path: ${direction}`);
      }
    }
    return current;
  }
  isSternBrocotValid() {
    if (this.isInfinite) {
      return this.numerator === 1n || this.numerator === -1n;
    }
    try {
      const path = this.sternBrocotPath();
      const reconstructed = Fraction.fromSternBrocotPath(path);
      return this.equals(reconstructed);
    } catch (error) {
      return false;
    }
  }
  sternBrocotDepth() {
    if (this.isInfinite) {
      return Infinity;
    }
    if (this.numerator === 0n && this.denominator === 1n) {
      return 0;
    }
    return this.sternBrocotPath().length;
  }
  sternBrocotAncestors() {
    if (this.isInfinite) {
      return [];
    }
    const ancestors = [];
    const path = this.sternBrocotPath();
    for (let i = 0;i < path.length; i++) {
      const partialPath = path.slice(0, i);
      ancestors.push(Fraction.fromSternBrocotPath(partialPath));
    }
    ancestors.reverse();
    return ancestors;
  }
}

// ../../packages/core/src/fraction-interval.js
class FractionInterval {
  #low;
  #high;
  constructor(a, b) {
    if (!(a instanceof Fraction) || !(b instanceof Fraction)) {
      throw new Error("FractionInterval endpoints must be Fraction objects");
    }
    if (a.lessThanOrEqual(b)) {
      this.#low = a;
      this.#high = b;
    } else {
      this.#low = b;
      this.#high = a;
    }
  }
  get low() {
    return this.#low;
  }
  get high() {
    return this.#high;
  }
  mediantSplit() {
    const mediant = Fraction.mediant(this.#low, this.#high);
    return [
      new FractionInterval(this.#low, mediant),
      new FractionInterval(mediant, this.#high)
    ];
  }
  partitionWithMediants(n = 1) {
    if (n < 0) {
      throw new Error("Depth of mediant partitioning must be non-negative");
    }
    if (n === 0) {
      return [this];
    }
    let intervals = [this];
    for (let level = 0;level < n; level++) {
      const newIntervals = [];
      for (const interval of intervals) {
        const splitIntervals = interval.mediantSplit();
        newIntervals.push(...splitIntervals);
      }
      intervals = newIntervals;
    }
    return intervals;
  }
  partitionWith(fn) {
    const partitionPoints = fn(this.#low, this.#high);
    if (!Array.isArray(partitionPoints)) {
      throw new Error("Partition function must return an array of Fractions");
    }
    for (const point of partitionPoints) {
      if (!(point instanceof Fraction)) {
        throw new Error("Partition function must return Fraction objects");
      }
    }
    const allPoints = [this.#low, ...partitionPoints, this.#high];
    allPoints.sort((a, b) => {
      if (a.equals(b))
        return 0;
      if (a.lessThan(b))
        return -1;
      return 1;
    });
    if (!allPoints[0].equals(this.#low) || !allPoints[allPoints.length - 1].equals(this.#high)) {
      throw new Error("Partition points should be within the interval");
    }
    const uniquePoints = [];
    for (let i = 0;i < allPoints.length; i++) {
      if (i === 0 || !allPoints[i].equals(allPoints[i - 1])) {
        uniquePoints.push(allPoints[i]);
      }
    }
    const intervals = [];
    for (let i = 0;i < uniquePoints.length - 1; i++) {
      intervals.push(new FractionInterval(uniquePoints[i], uniquePoints[i + 1]));
    }
    return intervals;
  }
  toRationalInterval() {
    return new RationalInterval(this.#low.toRational(), this.#high.toRational());
  }
  static fromRationalInterval(interval) {
    return new FractionInterval(Fraction.fromRational(interval.low), Fraction.fromRational(interval.high));
  }
  toString() {
    return `${this.#low.toString()}:${this.#high.toString()}`;
  }
  equals(other) {
    return this.#low.equals(other.low) && this.#high.equals(other.high);
  }
  E(exponent) {
    const newLow = this.#low.E(exponent);
    const newHigh = this.#high.E(exponent);
    return new FractionInterval(newLow, newHigh);
  }
}

// ../../packages/core/src/integer.js
class Integer {
  #value;
  static zero = new Integer(0);
  static one = new Integer(1);
  constructor(value) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!/^-?\d+$/.test(trimmed)) {
        throw new Error("Invalid integer format. Must be a whole number");
      }
      this.#value = BigInt(trimmed);
    } else {
      this.#value = BigInt(value);
    }
  }
  get value() {
    return this.#value;
  }
  add(other) {
    if (other instanceof Integer) {
      return new Integer(this.#value + other.value);
    } else if (other instanceof Rational) {
      const thisAsRational = new Rational(this.#value, 1n);
      return thisAsRational.add(other);
    } else if (other.low && other.high && typeof other.low.equals === "function") {
      const thisAsRational = new Rational(this.#value, 1n);
      const IntervalClass = other.constructor;
      const thisAsInterval = new IntervalClass(thisAsRational, thisAsRational);
      return thisAsInterval.add(other);
    } else {
      throw new Error(`Cannot add ${other.constructor.name} to Integer`);
    }
  }
  subtract(other) {
    if (other instanceof Integer) {
      return new Integer(this.#value - other.value);
    } else if (other instanceof Rational) {
      const thisAsRational = new Rational(this.#value, 1n);
      return thisAsRational.subtract(other);
    } else if (other.low && other.high && typeof other.low.equals === "function") {
      const thisAsRational = new Rational(this.#value, 1n);
      const IntervalClass = other.constructor;
      const thisAsInterval = new IntervalClass(thisAsRational, thisAsRational);
      return thisAsInterval.subtract(other);
    } else {
      throw new Error(`Cannot subtract ${other.constructor.name} from Integer`);
    }
  }
  multiply(other) {
    if (other instanceof Integer) {
      return new Integer(this.#value * other.value);
    } else if (other instanceof Rational) {
      const thisAsRational = new Rational(this.#value, 1n);
      return thisAsRational.multiply(other);
    } else if (other.low && other.high && typeof other.low.equals === "function") {
      const thisAsRational = new Rational(this.#value, 1n);
      const IntervalClass = other.constructor;
      const thisAsInterval = new IntervalClass(thisAsRational, thisAsRational);
      return thisAsInterval.multiply(other);
    } else {
      throw new Error(`Cannot multiply Integer by ${other.constructor.name}`);
    }
  }
  divide(other) {
    if (other instanceof Integer) {
      if (other.value === 0n) {
        throw new Error("Division by zero");
      }
      if (this.#value % other.value === 0n) {
        return new Integer(this.#value / other.value);
      } else {
        return new Rational(this.#value, other.value);
      }
    } else if (other instanceof Rational) {
      const thisAsRational = new Rational(this.#value, 1n);
      return thisAsRational.divide(other);
    } else if (other.low && other.high && typeof other.low.equals === "function") {
      const thisAsRational = new Rational(this.#value, 1n);
      const IntervalClass = other.constructor;
      const thisAsInterval = new IntervalClass(thisAsRational, thisAsRational);
      return thisAsInterval.divide(other);
    } else {
      throw new Error(`Cannot divide Integer by ${other.constructor.name}`);
    }
  }
  modulo(other) {
    if (other.value === 0n) {
      throw new Error("Modulo by zero");
    }
    return new Integer(this.#value % other.value);
  }
  negate() {
    return new Integer(-this.#value);
  }
  pow(exponent) {
    const exp = exponent instanceof Integer ? exponent.value : BigInt(exponent);
    if (exp === 0n) {
      if (this.#value === 0n) {
        throw new Error("Zero cannot be raised to the power of zero");
      }
      return new Integer(1);
    }
    if (exp < 0n) {
      if (this.#value === 0n) {
        throw new Error("Zero cannot be raised to a negative power");
      }
      const positiveExp = -exp;
      const positiveResult = this.pow(positiveExp);
      return new Rational(1, positiveResult.value);
    }
    let result = 1n;
    let base = this.#value;
    let n = exp;
    while (n > 0n) {
      if (n & 1n) {
        result *= base;
      }
      base *= base;
      n >>= 1n;
    }
    return new Integer(result);
  }
  equals(other) {
    return this.#value === other.value;
  }
  compareTo(other) {
    if (this.#value < other.value)
      return -1;
    if (this.#value > other.value)
      return 1;
    return 0;
  }
  lessThan(other) {
    return this.#value < other.value;
  }
  lessThanOrEqual(other) {
    return this.#value <= other.value;
  }
  greaterThan(other) {
    return this.#value > other.value;
  }
  greaterThanOrEqual(other) {
    return this.#value >= other.value;
  }
  abs() {
    return this.#value < 0n ? this.negate() : new Integer(this.#value);
  }
  sign() {
    if (this.#value < 0n)
      return new Integer(-1);
    if (this.#value > 0n)
      return new Integer(1);
    return new Integer(0);
  }
  isEven() {
    return this.#value % 2n === 0n;
  }
  isOdd() {
    return this.#value % 2n !== 0n;
  }
  isZero() {
    return this.#value === 0n;
  }
  isPositive() {
    return this.#value > 0n;
  }
  isNegative() {
    return this.#value < 0n;
  }
  gcd(other) {
    let a = this.#value < 0n ? -this.#value : this.#value;
    let b = other.value < 0n ? -other.value : other.value;
    while (b !== 0n) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return new Integer(a);
  }
  lcm(other) {
    if (this.#value === 0n || other.value === 0n) {
      return new Integer(0);
    }
    const gcd = this.gcd(other);
    const product = this.multiply(other).abs();
    return product.divide(gcd);
  }
  toString(base) {
    if (base === undefined) {
      return this.#value.toString();
    }
    if (base instanceof BaseSystem) {
      return base.fromDecimal(this.#value);
    }
    if (typeof base === "number") {
      if (base === 10) {
        return this.#value.toString();
      }
      return BaseSystem.fromBase(base).fromDecimal(this.#value);
    }
    return this.#value.toString();
  }
  toBase(baseSystem) {
    if (!(baseSystem instanceof BaseSystem)) {
      throw new Error("Argument must be a BaseSystem");
    }
    return baseSystem.fromDecimal(this.#value);
  }
  toNumber() {
    return Number(this.#value);
  }
  toRational() {
    return new Rational(this.#value, 1n);
  }
  static from(value) {
    if (value instanceof Integer) {
      return new Integer(value.value);
    }
    return new Integer(value);
  }
  static fromRational(rational) {
    if (rational.denominator !== 1n) {
      throw new Error("Rational is not a whole number");
    }
    return new Integer(rational.numerator);
  }
  E(exponent) {
    const exp = BigInt(exponent);
    if (exp >= 0n) {
      const newValue = this.#value * 10n ** exp;
      return new Integer(newValue);
    } else {
      const powerOf10 = new Rational(1n, 10n ** -exp);
      const thisAsRational = new Rational(this.#value, 1n);
      return thisAsRational.multiply(powerOf10);
    }
  }
  factorial() {
    if (this.#value < 0n) {
      throw new Error("Factorial is not defined for negative integers");
    }
    if (this.#value === 0n || this.#value === 1n) {
      return new Integer(1);
    }
    let result = 1n;
    for (let i = 2n;i <= this.#value; i++) {
      result *= i;
    }
    return new Integer(result);
  }
  doubleFactorial() {
    if (this.#value < 0n) {
      throw new Error("Double factorial is not defined for negative integers");
    }
    if (this.#value === 0n || this.#value === 1n) {
      return new Integer(1);
    }
    let result = 1n;
    for (let i = this.#value;i > 0n; i -= 2n) {
      result *= i;
    }
    return new Integer(result);
  }
  bitLength() {
    if (this.#value === 0n)
      return 0;
    return this.#value < 0n ? (-this.#value).toString(2).length : this.#value.toString(2).length;
  }
}

// ../../packages/reals/src/index.js
var LN2_CF = [0, 1, 2, 3, 1, 6, 3, 1, 1, 2, 1, 1, 6, 1, 6, 1, 1, 4, 1, 2, 4, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
var PI_CF = [3, 7, 15, 1, 292, 1, 1, 1, 2, 1, 3, 1, 14, 2, 1, 1, 2, 2, 2, 2, 1, 84, 2, 1, 1, 15, 3, 13, 1, 4, 2, 6, 6, 99, 1, 2, 2, 6, 3, 5, 1, 1, 6, 8, 1, 7, 1, 2, 3, 7, 1, 2, 1, 1, 12, 1, 1, 1, 3, 1, 1, 8, 1, 1, 2, 1, 6];
var E_CF = [2, 1, 2, 1, 1, 4, 1, 1, 6, 1, 1, 8, 1, 1, 10, 1, 1, 12, 1, 1, 14, 1, 1, 16, 1, 1, 18, 1, 1, 20, 1, 1, 22, 1, 1, 24, 1, 1, 26, 1, 1, 28, 1, 1, 30, 1, 1, 32, 1, 1, 34, 1, 1, 36, 1, 1, 38, 1, 1, 40];
function continuedFractionApproximation(coefficients, terms) {
  if (terms === 0 || coefficients.length === 0) {
    return new Rational(0);
  }
  let num = new Integer(1);
  let den = new Integer(0);
  for (let i = Math.min(terms, coefficients.length) - 1;i >= 0; i--) {
    [num, den] = [den.add(num.multiply(new Integer(coefficients[i]))), num];
  }
  return new Rational(num.value, den.value);
}
function isZero(rational) {
  return rational.numerator === 0n;
}
function isNegative(rational) {
  return rational.numerator < 0n;
}
function floor(rational) {
  if (rational.denominator === 1n) {
    return new Rational(rational.numerator);
  }
  const quotient = rational.numerator / rational.denominator;
  const remainder = rational.numerator % rational.denominator;
  if (remainder === 0n || rational.numerator >= 0n) {
    return new Rational(quotient);
  } else {
    return new Rational(quotient - 1n);
  }
}
function round(rational) {
  if (rational.denominator === 1n) {
    return new Rational(rational.numerator);
  }
  const wholePart = floor(rational);
  const fractionalPart = rational.subtract(wholePart);
  const half = new Rational(1, 2);
  if (fractionalPart.compareTo(half) >= 0) {
    return wholePart.add(new Rational(1));
  } else {
    return wholePart;
  }
}
function parsePrecision(precision) {
  if (precision === undefined) {
    return { epsilon: new Rational(1, 1e6), negative: true };
  }
  if (precision < 0) {
    const denominator = new Integer(10).pow(-precision);
    return { epsilon: new Rational(1, denominator.value), negative: true };
  } else {
    return { epsilon: new Rational(1, precision), negative: false };
  }
}
function createTightRationalInterval(value, precision) {
  const { epsilon } = parsePrecision(precision);
  const epsilonDecimal = epsilon.toNumber();
  const lowerDecimal = value - epsilonDecimal;
  const upperDecimal = value + epsilonDecimal;
  const precisionScale = Math.min(1e9, Math.max(1e6, Math.ceil(1 / epsilonDecimal)));
  const lower = new Rational(Math.floor(lowerDecimal * precisionScale), precisionScale);
  const upper = new Rational(Math.ceil(upperDecimal * precisionScale), precisionScale);
  return new RationalInterval(lower, upper);
}
function getConstant(cfCoefficients, precision) {
  const { epsilon } = parsePrecision(precision);
  let terms = 2;
  let prev = continuedFractionApproximation(cfCoefficients, terms - 1);
  let curr = continuedFractionApproximation(cfCoefficients, terms);
  while (terms < cfCoefficients.length && curr.subtract(prev).abs().compareTo(epsilon) > 0) {
    terms++;
    prev = curr;
    curr = continuedFractionApproximation(cfCoefficients, terms);
  }
  const lower = prev.compareTo(curr) < 0 ? prev : curr;
  const upper = prev.compareTo(curr) > 0 ? prev : curr;
  return new RationalInterval(lower, upper);
}
var PI = (precision) => getConstant(PI_CF, precision);
var E = (precision) => getConstant(E_CF, precision);
function EXP(x, precision) {
  if (x === undefined) {
    return E(precision);
  }
  const { epsilon } = parsePrecision(precision);
  if (x instanceof RationalInterval) {
    const lower = EXP(x.low, precision);
    const upper = EXP(x.high, precision);
    return new RationalInterval(lower.low, upper.high);
  }
  if (!(x instanceof Rational)) {
    x = new Rational(x);
  }
  if (isZero(x)) {
    return new RationalInterval(new Rational(1), new Rational(1));
  }
  const ln2Interval = getConstant(LN2_CF, precision);
  const ln2Approx = ln2Interval.low.add(ln2Interval.high).divide(new Rational(2));
  const k = floor(x.divide(ln2Approx));
  const r = x.subtract(k.multiply(ln2Approx));
  if (isNegative(r)) {
    const kAdjusted = k.subtract(new Rational(1));
    const rAdjusted = x.subtract(kAdjusted.multiply(ln2Approx));
    return EXP(rAdjusted, precision).multiply(new Rational(new Integer(2).pow(kAdjusted.numerator >= 0n ? kAdjusted.numerator : -kAdjusted.numerator).value, 1));
  }
  let expR;
  let sum = new Rational(1);
  let term = new Rational(1);
  let n = 1;
  let converged = false;
  while (term.abs().compareTo(epsilon) > 0 && n < 50) {
    term = term.multiply(r).divide(new Rational(n));
    sum = sum.add(term);
    n++;
    if (sum.denominator > 1000000000n || term.denominator > 1000000000n) {
      break;
    }
    if (term.abs().compareTo(epsilon) <= 0) {
      converged = true;
      break;
    }
  }
  if (converged && sum.denominator <= 1000000000n) {
    const errorBound = term.abs().multiply(new Rational(2));
    expR = new RationalInterval(sum.subtract(errorBound), sum.add(errorBound));
  } else {
    const rDecimal = r.toNumber();
    const expRDecimal = Math.exp(rDecimal);
    expR = createTightRationalInterval(expRDecimal, precision);
  }
  if (isZero(k)) {
    return expR;
  }
  const twoToK = new Rational(new Integer(2).pow(k.numerator >= 0n ? k.numerator : -k.numerator).value, 1);
  if (isNegative(k)) {
    return expR.divide(twoToK);
  } else {
    return expR.multiply(twoToK);
  }
}
function LN(x, precision) {
  const { epsilon } = parsePrecision(precision);
  if (x instanceof RationalInterval) {
    if (isNegative(x.low) || isZero(x.low)) {
      throw new Error("LN: argument must be positive");
    }
    const lower = LN(x.low, precision);
    const upper = LN(x.high, precision);
    return new RationalInterval(lower.low, upper.high);
  }
  if (!(x instanceof Rational)) {
    x = new Rational(x);
  }
  if (isNegative(x) || isZero(x)) {
    throw new Error("LN: argument must be positive");
  }
  if (x.equals(new Rational(1))) {
    return new RationalInterval(new Rational(0), new Rational(0));
  }
  let k = 0;
  let xScaled = x;
  if (x.compareTo(new Rational(1)) > 0) {
    while (xScaled.compareTo(new Rational(2)) >= 0) {
      xScaled = xScaled.divide(new Rational(2));
      k++;
    }
  } else {
    while (xScaled.compareTo(new Rational(1)) < 0) {
      xScaled = xScaled.multiply(new Rational(2));
      k--;
    }
  }
  const y = xScaled.subtract(new Rational(1));
  let lnM;
  let sum = new Rational(0);
  let term = y;
  let n = 1;
  let converged = false;
  while (term.abs().compareTo(epsilon) > 0 && n < 50) {
    sum = sum.add(term.divide(new Rational(n)));
    n++;
    term = term.multiply(y).negate();
    if (sum.denominator > 1000000000n || term.denominator > 1000000000n) {
      break;
    }
    if (term.abs().compareTo(epsilon) <= 0) {
      converged = true;
      break;
    }
  }
  if (converged && sum.denominator <= 1000000000n) {
    const errorBound = term.abs().divide(new Rational(n));
    lnM = new RationalInterval(sum.subtract(errorBound), sum.add(errorBound));
  } else {
    const xScaledDecimal = xScaled.toNumber();
    const lnMDecimal = Math.log(xScaledDecimal);
    lnM = createTightRationalInterval(lnMDecimal, precision);
  }
  if (k === 0) {
    return lnM;
  }
  const ln2Interval = getConstant(LN2_CF, precision);
  const kLn2 = ln2Interval.multiply(new Rational(k));
  return lnM.add(kLn2);
}
function LOG(x, base = 10, precision) {
  if (base === undefined || typeof base === "number" && base < 0) {
    precision = base;
    base = 10;
  }
  const lnX = LN(x, precision);
  const lnBase = LN(new Rational(base), precision);
  return lnX.divide(lnBase);
}
function SIN(x, precision) {
  const { epsilon } = parsePrecision(precision);
  if (x instanceof RationalInterval) {
    const samples = 100;
    let min = null, max = null;
    for (let i = 0;i <= samples; i++) {
      const t = x.low.add(x.high.subtract(x.low).multiply(new Rational(i)).divide(new Rational(samples)));
      const sinT = SIN(t, precision);
      if (min === null || sinT.low.compareTo(min) < 0)
        min = sinT.low;
      if (max === null || sinT.high.compareTo(max) > 0)
        max = sinT.high;
    }
    return new RationalInterval(min, max);
  }
  if (!(x instanceof Rational)) {
    x = new Rational(x);
  }
  const piInterval = PI(precision);
  const piApprox = piInterval.low.add(piInterval.high).divide(new Rational(2));
  const piOver2 = piApprox.divide(new Rational(2));
  const k = round(x.divide(piOver2));
  const r = x.subtract(k.multiply(piOver2));
  const kMod4 = Number(k.numerator % 4n);
  let usecos = false;
  let negate = false;
  switch (kMod4) {
    case 0:
      break;
    case 1:
      usecos = true;
      break;
    case 2:
      negate = true;
      break;
    case 3:
      usecos = true;
      negate = true;
      break;
  }
  let sum = new Rational(0);
  let term = r;
  let n = 1;
  if (usecos) {
    sum = new Rational(1);
    term = new Rational(1);
    n = 0;
  }
  while (term.abs().compareTo(epsilon) > 0 && n < 100) {
    if (usecos) {
      if (n > 0) {
        term = term.multiply(r).multiply(r).negate().divide(new Rational((2 * n - 1) * (2 * n)));
        sum = sum.add(term);
      }
    } else {
      sum = sum.add(term);
      term = term.multiply(r).multiply(r).negate().divide(new Rational((n + 1) * (n + 2)));
    }
    n++;
    if (sum.denominator > 100000000000n || term.denominator > 100000000000n) {
      break;
    }
  }
  if (negate) {
    sum = sum.negate();
  }
  const errorBound = term.abs().multiply(new Rational(2));
  return new RationalInterval(sum.subtract(errorBound), sum.add(errorBound));
}
function COS(x, precision) {
  const { epsilon } = parsePrecision(precision);
  const piInterval = PI(precision);
  const piOver2 = piInterval.divide(new Rational(2));
  if (x instanceof RationalInterval) {
    return SIN(x.add(piOver2), precision);
  } else {
    const piOver2Mid = piOver2.low.add(piOver2.high).divide(new Rational(2));
    const xRational = x instanceof Rational ? x : new Rational(x);
    return SIN(xRational.add(piOver2Mid), precision);
  }
}
function ARCSIN(x, precision) {
  const { epsilon } = parsePrecision(precision);
  if (x instanceof RationalInterval) {
    if (x.low.compareTo(new Rational(-1)) < 0 || x.high.compareTo(new Rational(1)) > 0) {
      throw new Error("ARCSIN: argument must be in [-1, 1]");
    }
    const lower = ARCSIN(x.low, precision);
    const upper = ARCSIN(x.high, precision);
    return new RationalInterval(lower.low, upper.high);
  }
  if (!(x instanceof Rational)) {
    x = new Rational(x);
  }
  if (x.compareTo(new Rational(-1)) < 0 || x.compareTo(new Rational(1)) > 0) {
    throw new Error("ARCSIN: argument must be in [-1, 1]");
  }
  if (isZero(x)) {
    return new RationalInterval(new Rational(0), new Rational(0));
  }
  let sum = x;
  let term = x;
  let n = 1;
  let converged = false;
  while (term.abs().compareTo(epsilon) > 0 && n < 30) {
    term = term.multiply(x).multiply(x).multiply(new Rational((2 * n - 1) * (2 * n - 1))).divide(new Rational(2 * n * (2 * n + 1)));
    sum = sum.add(term);
    n++;
    if (sum.denominator > 1000000000n || term.denominator > 1000000000n) {
      break;
    }
    if (term.abs().compareTo(epsilon) <= 0) {
      converged = true;
      break;
    }
  }
  if (converged && sum.denominator <= 1000000000n) {
    const errorBound = term.abs().multiply(new Rational(2));
    return new RationalInterval(sum.subtract(errorBound), sum.add(errorBound));
  } else {
    const xDecimal = x.toNumber();
    const arcsinDecimal = Math.asin(xDecimal);
    return createTightRationalInterval(arcsinDecimal, precision);
  }
}
function ARCCOS(x, precision) {
  const piOver2 = PI(precision).divide(new Rational(2));
  const arcsinX = ARCSIN(x, precision);
  return piOver2.subtract(arcsinX);
}
function TAN(x, precision) {
  const { epsilon } = parsePrecision(precision);
  if (x instanceof RationalInterval) {
    const samples = 100;
    let min = null, max = null;
    for (let i = 0;i <= samples; i++) {
      const t = x.low.add(x.high.subtract(x.low).multiply(new Rational(i)).divide(new Rational(samples)));
      try {
        const tanT = TAN(t, precision);
        if (min === null || tanT.low.compareTo(min) < 0)
          min = tanT.low;
        if (max === null || tanT.high.compareTo(max) > 0)
          max = tanT.high;
      } catch (e) {
        continue;
      }
    }
    if (min === null || max === null) {
      throw new Error("TAN: interval contains undefined points");
    }
    return new RationalInterval(min, max);
  }
  if (!(x instanceof Rational)) {
    x = new Rational(x);
  }
  const piInterval = PI(precision);
  const piApprox = piInterval.low.add(piInterval.high).divide(new Rational(2));
  const piOver2 = piApprox.divide(new Rational(2));
  const quotient = x.divide(piOver2);
  const nearestOddMultiple = round(quotient);
  if (Number(nearestOddMultiple.numerator % 2n) === 1) {
    const distance = quotient.subtract(nearestOddMultiple).abs();
    if (distance.compareTo(epsilon) < 0) {
      throw new Error("TAN: undefined at odd multiples of π/2");
    }
  }
  const sinX = SIN(x, precision);
  const cosX = COS(x, precision);
  if (cosX.low.abs().compareTo(epsilon) < 0 || cosX.high.abs().compareTo(epsilon) < 0) {
    throw new Error("TAN: undefined (cosine too close to zero)");
  }
  return sinX.divide(cosX);
}
function ARCTAN(x, precision) {
  const { epsilon } = parsePrecision(precision);
  if (x instanceof RationalInterval) {
    const lower = ARCTAN(x.low, precision);
    const upper = ARCTAN(x.high, precision);
    return new RationalInterval(lower.low, upper.high);
  }
  if (!(x instanceof Rational)) {
    x = new Rational(x);
  }
  if (isZero(x)) {
    return new RationalInterval(new Rational(0), new Rational(0));
  }
  const absX = x.abs();
  if (absX.compareTo(new Rational(1)) > 0) {
    const piOver2 = PI(precision).divide(new Rational(2));
    const piOver2Mid = piOver2.low.add(piOver2.high).divide(new Rational(2));
    const arctanRecip = ARCTAN(new Rational(1).divide(absX), precision);
    const result = piOver2Mid.subtract(arctanRecip.low.add(arctanRecip.high).divide(new Rational(2)));
    if (isNegative(x)) {
      return new RationalInterval(result.negate(), result.negate());
    } else {
      return new RationalInterval(result, result);
    }
  }
  let sum = x;
  let term = x;
  let n = 1;
  while (term.abs().compareTo(epsilon) > 0 && n < 100) {
    term = term.multiply(x).multiply(x).negate();
    const denominator = new Rational(2 * n + 1);
    sum = sum.add(term.divide(denominator));
    n++;
    if (sum.denominator > 100000000000n || term.denominator > 100000000000n) {
      break;
    }
  }
  const errorBound = term.abs().multiply(new Rational(2));
  return new RationalInterval(sum.subtract(errorBound), sum.add(errorBound));
}
function newtonRoot(q, n, precision) {
  const { epsilon } = parsePrecision(precision);
  if (!(q instanceof Rational)) {
    q = new Rational(q);
  }
  if (n <= 0) {
    throw new Error("Root degree must be positive");
  }
  if (n === 1) {
    return new RationalInterval(q, q);
  }
  if (isNegative(q) && n % 2 === 0) {
    throw new Error("Even root of negative number");
  }
  const qDecimal = q.toNumber();
  const initialGuess = Math.pow(qDecimal, 1 / n);
  let a = new Rational(Math.round(initialGuess * 1000), 1000);
  let iterations = 0;
  const maxIterations = 100;
  while (iterations < maxIterations) {
    let aPower = a;
    for (let i = 1;i < n - 1; i++) {
      aPower = aPower.multiply(a);
    }
    const b = q.divide(aPower);
    const diff = b.subtract(a).abs();
    if (diff.compareTo(epsilon) <= 0) {
      const lower = a.compareTo(b) < 0 ? a : b;
      const upper = a.compareTo(b) > 0 ? a : b;
      return new RationalInterval(lower, upper);
    }
    if (a.denominator > 100000000000n || b.denominator > 100000000000n) {
      const aDecimal = a.toNumber();
      const bDecimal = b.toNumber();
      if (!isNaN(aDecimal) && !isNaN(bDecimal)) {
        const lowerDecimal = Math.min(aDecimal, bDecimal);
        const upperDecimal = Math.max(aDecimal, bDecimal);
        const precisionScale = 1e7;
        const lowerRational = new Rational(Math.floor(lowerDecimal * precisionScale), precisionScale);
        const upperRational = new Rational(Math.ceil(upperDecimal * precisionScale), precisionScale);
        return new RationalInterval(lowerRational, upperRational);
      }
    }
    a = a.add(b.subtract(a).divide(new Rational(n)));
    iterations++;
  }
  throw new Error("Newton's method did not converge");
}
function rationalIntervalPower(base, exponent, precision) {
  if (exponent instanceof Integer) {
    exponent = exponent.toRational();
  } else if (typeof exponent === "bigint") {
    exponent = new Rational(exponent);
  } else if (typeof exponent === "number") {
    exponent = new Rational(exponent);
  }
  if (exponent instanceof Rational && exponent.denominator <= 10n) {
    const root = newtonRoot(base, Number(exponent.denominator), precision);
    if (exponent.numerator === 1n) {
      return root;
    }
    let result = root;
    const numeratorNum = Number(exponent.numerator);
    for (let i = 1;i < Math.abs(numeratorNum); i++) {
      result = result.multiply(root);
    }
    if (numeratorNum < 0) {
      return new RationalInterval(new Rational(1), new Rational(1)).divide(result);
    }
    return result;
  }
  const lnBase = LN(base, precision);
  const product = lnBase.multiply(exponent);
  if (product instanceof RationalInterval) {
    return EXP(product, precision);
  } else {
    return EXP(product, precision);
  }
}

// ../../packages/reals/src/ratmath-module.js
function getPrecision(context, prec) {
  if (prec !== undefined)
    return prec;
  if (context && context.variables) {
    let val;
    if (context.variables.has("_precision"))
      val = context.variables.get("_precision");
    else if (context.variables.has("PRECISION"))
      val = context.variables.get("PRECISION");
    if (val !== undefined) {
      if (val && val.toNumber)
        return val.toNumber();
      return val;
    }
  }
  return;
}
var functions = {
  PI: {
    type: "js",
    body: function(prec) {
      return PI(getPrecision(this, prec));
    },
    params: ["precision?"],
    doc: "Returns PI with optional precision (default: 10^-6 or env PRECISION)"
  },
  E: {
    type: "js",
    body: function(prec) {
      return E(getPrecision(this, prec));
    },
    params: ["precision?"],
    doc: "Returns e (Euler's number) with optional precision"
  },
  Exp: {
    type: "js",
    body: function(x, prec) {
      return EXP(x, getPrecision(this, prec));
    },
    params: ["x", "precision?"],
    doc: "Computes e^x with optional precision"
  },
  Ln: {
    type: "js",
    body: function(x, prec) {
      return LN(x, getPrecision(this, prec));
    },
    params: ["x", "precision?"],
    doc: "Computes natural logarithm of x"
  },
  Log: {
    type: "js",
    body: function(x, base, prec) {
      return LOG(x, base, getPrecision(this, prec));
    },
    params: ["x", "base", "precision?"],
    doc: "Computes logarithm of x base b"
  },
  Sin: {
    type: "js",
    body: function(x, prec) {
      return SIN(x, getPrecision(this, prec));
    },
    params: ["x", "precision?"],
    doc: "Computes sine of x (radians)"
  },
  Cos: {
    type: "js",
    body: function(x, prec) {
      return COS(x, getPrecision(this, prec));
    },
    params: ["x", "precision?"],
    doc: "Computes cosine of x (radians)"
  },
  Tan: {
    type: "js",
    body: function(x, prec) {
      return TAN(x, getPrecision(this, prec));
    },
    params: ["x", "precision?"],
    doc: "Computes tangent of x (radians)"
  },
  Arcsin: {
    type: "js",
    body: function(x, prec) {
      return ARCSIN(x, getPrecision(this, prec));
    },
    params: ["x", "precision?"],
    doc: "Computes inverse sine of x"
  },
  Arccos: {
    type: "js",
    body: function(x, prec) {
      return ARCCOS(x, getPrecision(this, prec));
    },
    params: ["x", "precision?"],
    doc: "Computes inverse cosine of x"
  },
  Arctan: {
    type: "js",
    body: function(x, prec) {
      return ARCTAN(x, getPrecision(this, prec));
    },
    params: ["x", "precision?"],
    doc: "Computes inverse tangent of x"
  },
  Root: {
    type: "js",
    body: function(q, n, prec) {
      return newtonRoot(q, n, getPrecision(this, prec));
    },
    params: ["q", "n", "precision?"],
    doc: "Computes nth root of q using Newton's method"
  },
  Pow: {
    type: "js",
    body: function(base, exp, prec) {
      return rationalIntervalPower(base, exp, getPrecision(this, prec));
    },
    params: ["base", "exponent", "precision?"],
    doc: "Computes base^exponent (supports fractional exponents)"
  }
};
var variables = {};
export {
  variables,
  functions
};
