import { describe, it, test, expect } from "bun:test";
import { Rational, RationalInterval } from "@ratmath/core";
import { PI, E, SIN, COS, ARCSIN, ARCCOS, EXP, LN, LOG, newtonRoot, rationalIntervalPower } from "@ratmath/reals";
import { Parser } from "@ratmath/parser";
import { VariableManager } from "@ratmath/algebra";
import * as RealsModule from "@ratmath/reals/src/ratmath-module.js";

// Test constants
test("PI constant", () => {
  const pi = PI();
  expect(pi).toBeInstanceOf(RationalInterval);
  // Check that it's approximately 3.14159...
  expect(pi.low.toNumber()).toBeCloseTo(3.14159, 4);
  expect(pi.high.toNumber()).toBeCloseTo(3.14159, 4);
});

test("PI with precision", () => {
  const pi6 = PI(6); // 1/6 precision
  const piNeg6 = PI(-6); // 10^-6 precision

  expect(pi6).toBeInstanceOf(RationalInterval);
  expect(piNeg6).toBeInstanceOf(RationalInterval);

  // Higher precision should have smaller interval
  const width6 = pi6.high.subtract(pi6.low);
  const widthNeg6 = piNeg6.high.subtract(piNeg6.low);
  expect(widthNeg6.compareTo(width6) < 0).toBe(true);
});

test("E constant", () => {
  const e = E();
  expect(e).toBeInstanceOf(RationalInterval);
  // Check that it's approximately 2.71828...
  expect(e.low.toNumber()).toBeCloseTo(2.71828, 4);
  expect(e.high.toNumber()).toBeCloseTo(2.71828, 4);
});

// Test exponential function
test("EXP function", () => {
  // EXP(0) should be 1
  const exp0 = EXP(new Rational(0));
  expect(exp0).toBeInstanceOf(RationalInterval);
  expect(exp0.low.toNumber()).toBeCloseTo(1, 6);
  expect(exp0.high.toNumber()).toBeCloseTo(1, 6);

  // EXP(1) should be approximately e
  const exp1 = EXP(new Rational(1));
  expect(exp1.low.toNumber()).toBeCloseTo(2.71828, 4);
  expect(exp1.high.toNumber()).toBeCloseTo(2.71828, 4);

  // EXP(2) should be approximately e^2
  const exp2 = EXP(new Rational(2));
  expect(exp2.low.toNumber()).toBeCloseTo(7.38906, 4);
  expect(exp2.high.toNumber()).toBeCloseTo(7.38906, 4);
});

test("EXP with intervals", () => {
  const interval = new RationalInterval(new Rational(0), new Rational(1));
  const result = EXP(interval);
  expect(result).toBeInstanceOf(RationalInterval);
  expect(result.low.toNumber()).toBeCloseTo(1, 5);
  expect(result.high.toNumber()).toBeCloseTo(2.71828, 4);
});

// Test logarithm functions
test("LN function", () => {
  // LN(1) should be 0
  const ln1 = LN(new Rational(1));
  expect(ln1).toBeInstanceOf(RationalInterval);
  expect(ln1.low.toNumber()).toBeCloseTo(0, 6);
  expect(ln1.high.toNumber()).toBeCloseTo(0, 6);

  // LN(e) should be approximately 1
  const e = E();
  const eMid = e.low.add(e.high).divide(new Rational(2));
  const lnE = LN(eMid);
  expect(lnE.low.toNumber()).toBeCloseTo(1, 3);
  expect(lnE.high.toNumber()).toBeCloseTo(1, 3);

  // Test with negative input (should throw)
  expect(() => LN(new Rational(-1))).toThrow();
});

test("LOG function", () => {
  // LOG(10) should be 1 (base 10)
  const log10 = LOG(new Rational(10));
  expect(log10).toBeInstanceOf(RationalInterval);
  expect(log10.low.toNumber()).toBeCloseTo(1, 5);
  expect(log10.high.toNumber()).toBeCloseTo(1, 5);

  // LOG(8, 2) should be 3
  const log8base2 = LOG(new Rational(8), new Rational(2));
  expect(log8base2.low.toNumber()).toBeCloseTo(3, 4);
  expect(log8base2.high.toNumber()).toBeCloseTo(3, 4);
});

// Test trigonometric functions
test("SIN function", () => {
  // SIN(0) should be 0
  const sin0 = SIN(new Rational(0));
  expect(sin0).toBeInstanceOf(RationalInterval);
  expect(sin0.low.toNumber()).toBeCloseTo(0, 6);
  expect(sin0.high.toNumber()).toBeCloseTo(0, 6);

  // SIN(π/2) should be approximately 1
  const piOver2 = PI().divide(new Rational(2));
  const piOver2Mid = piOver2.low.add(piOver2.high).divide(new Rational(2));
  const sinPiOver2 = SIN(piOver2Mid);
  expect(sinPiOver2.low.toNumber()).toBeCloseTo(1, 3);
  expect(sinPiOver2.high.toNumber()).toBeCloseTo(1, 3);
});

test("COS function", () => {
  // COS(0) should be 1
  const cos0 = COS(new Rational(0));
  expect(cos0).toBeInstanceOf(RationalInterval);
  expect(cos0.low.toNumber()).toBeCloseTo(1, 5);
  expect(cos0.high.toNumber()).toBeCloseTo(1, 5);

  // COS(π) should be approximately -1
  const pi = PI();
  const piMid = pi.low.add(pi.high).divide(new Rational(2));
  const cosPi = COS(piMid);
  expect(cosPi.low.toNumber()).toBeCloseTo(-1, 3);
  expect(cosPi.high.toNumber()).toBeCloseTo(-1, 3);
});

test("ARCSIN function", () => {
  // ARCSIN(0) should be 0
  const arcsin0 = ARCSIN(new Rational(0));
  expect(arcsin0).toBeInstanceOf(RationalInterval);
  expect(arcsin0.low.toNumber()).toBeCloseTo(0, 6);
  expect(arcsin0.high.toNumber()).toBeCloseTo(0, 6);

  // ARCSIN(1) should be approximately π/2
  const arcsin1 = ARCSIN(new Rational(1));
  const piOver2 = PI().divide(new Rational(2));
  const piOver2Mid = piOver2.low.add(piOver2.high).divide(new Rational(2));
  expect(arcsin1.low.toNumber()).toBeCloseTo(piOver2Mid.toNumber(), 1);
  expect(arcsin1.high.toNumber()).toBeCloseTo(piOver2Mid.toNumber(), 1);

  // Test domain error
  expect(() => ARCSIN(new Rational(2))).toThrow();
  expect(() => ARCSIN(new Rational(-2))).toThrow();
});

test("ARCCOS function", () => {
  // ARCCOS(1) should be 0
  const arccos1 = ARCCOS(new Rational(1));
  expect(arccos1).toBeInstanceOf(RationalInterval);
  expect(arccos1.low.toNumber()).toBeCloseTo(0, 1);
  expect(arccos1.high.toNumber()).toBeCloseTo(0, 1);

  // ARCCOS(0) should be approximately π/2
  const arccos0 = ARCCOS(new Rational(0));
  const piOver2 = PI().divide(new Rational(2));
  const piOver2Mid = piOver2.low.add(piOver2.high).divide(new Rational(2));
  expect(arccos0.low.toNumber()).toBeCloseTo(piOver2Mid.toNumber(), 1);
  expect(arccos0.high.toNumber()).toBeCloseTo(piOver2Mid.toNumber(), 1);
});

// Test Newton's method for roots
test("Newton's method for square root", () => {
  const sqrt4 = newtonRoot(new Rational(4), 2);
  expect(sqrt4).toBeInstanceOf(RationalInterval);
  expect(sqrt4.low.toNumber()).toBeCloseTo(2, 5);
  expect(sqrt4.high.toNumber()).toBeCloseTo(2, 5);

  const sqrt2 = newtonRoot(new Rational(2), 2);
  expect(sqrt2.low.toNumber()).toBeCloseTo(1.41421, 4);
  expect(sqrt2.high.toNumber()).toBeCloseTo(1.41421, 4);
});

test("Newton's method for cube root", () => {
  const cbrt8 = newtonRoot(new Rational(8), 3);
  expect(cbrt8).toBeInstanceOf(RationalInterval);
  expect(cbrt8.low.toNumber()).toBeCloseTo(2, 0);
  expect(cbrt8.high.toNumber()).toBeCloseTo(2, 0);

  const cbrt27 = newtonRoot(new Rational(27), 3);
  expect(cbrt27.low.toNumber()).toBeCloseTo(3, 0);
  expect(cbrt27.high.toNumber()).toBeCloseTo(3, 0);
});

// Test fractional exponentiation
test("Rational interval power", () => {
  // 4^(1/2) should be 2
  const sqrt4 = rationalIntervalPower(new Rational(4), new Rational(1, 2));
  expect(sqrt4).toBeInstanceOf(RationalInterval);
  expect(sqrt4.low.toNumber()).toBeCloseTo(2, 4);
  expect(sqrt4.high.toNumber()).toBeCloseTo(2, 4);

  // 8^(1/3) should be 2
  const cbrt8 = rationalIntervalPower(new Rational(8), new Rational(1, 3));
  expect(cbrt8.low.toNumber()).toBeCloseTo(2, 0);
  expect(cbrt8.high.toNumber()).toBeCloseTo(2, 0);

  // 2^3 should be 8
  const twoToThree = rationalIntervalPower(new Rational(2), new Rational(3));
  expect(twoToThree.low.toNumber()).toBeCloseTo(8, 4);
  expect(twoToThree.high.toNumber()).toBeCloseTo(8, 4);
});

// Test VariableManager integration with reals package loaded
test("VariableManager integration - constants", () => {
  const vm = new VariableManager();
  vm.loadModule("Reals", RealsModule);
  
  const piResult = vm.processInput("PI()");
  expect(piResult.type).toBe("expression");
  expect(piResult.result).toBeInstanceOf(RationalInterval);
  expect(piResult.result.low.toNumber()).toBeCloseTo(3.14159, 4);

  const eResult = vm.processInput("E()");
  expect(eResult.type).toBe("expression");
  expect(eResult.result).toBeInstanceOf(RationalInterval);
  expect(eResult.result.low.toNumber()).toBeCloseTo(2.71828, 4);
});

test("VariableManager integration - functions", () => {
  const vm = new VariableManager();
  vm.loadModule("Reals", RealsModule);
  
  const sinResult = vm.processInput("Sin(0)");
  expect(sinResult.type).toBe("expression");
  expect(sinResult.result).toBeInstanceOf(RationalInterval);
  expect(sinResult.result.low.toNumber()).toBeCloseTo(0, 6);

  const expResult = vm.processInput("Exp(1)");
  expect(expResult.type).toBe("expression");
  expect(expResult.result).toBeInstanceOf(RationalInterval);
  expect(expResult.result.low.toNumber()).toBeCloseTo(2.71828, 4);

  const lnResult = vm.processInput("Ln(1)");
  expect(lnResult.type).toBe("expression");
  expect(lnResult.result).toBeInstanceOf(RationalInterval);
  expect(lnResult.result.low.toNumber()).toBeCloseTo(0, 6);
});

test("VariableManager integration - precision as negative exponent", () => {
  const vm = new VariableManager();
  vm.loadModule("Reals", RealsModule);
  
  // Test with precision as negative exponent (e.g., -8 means 10^-8)
  const piPrecise = vm.processInput("PI(-8)");
  expect(piPrecise.type).toBe("expression");
  expect(piPrecise.result).toBeInstanceOf(RationalInterval);

  const expPrecise = vm.processInput("Exp(1, -8)");
  expect(expPrecise.type).toBe("expression");
  expect(expPrecise.result).toBeInstanceOf(RationalInterval);
  expect(expPrecise.result.low.toNumber()).toBeCloseTo(2.71828, 5);
});

test("Parser integration - fractional exponents", () => {
  // Test 4^(1/2) = 2
  const sqrt4 = Parser.parse("4^(1/2)");
  expect(sqrt4).toBeInstanceOf(RationalInterval);
  expect(sqrt4.low.toNumber()).toBeCloseTo(2, 4);

  // Test 8**(1/3) = 2 (using Newton's method)
  const cbrt8 = Parser.parse("8**(1/3)");
  expect(cbrt8).toBeInstanceOf(RationalInterval);
  expect(cbrt8.low.toNumber()).toBeCloseTo(2, 0);
});

test("Complex expressions with VariableManager", () => {
  const vm = new VariableManager();
  vm.loadModule("Reals", RealsModule);
  
  // Test Exp(Ln(2)) ≈ 2
  const expLn2 = vm.processInput("Exp(Ln(2))");
  expect(expLn2.type).toBe("expression");
  expect(expLn2.result).toBeInstanceOf(RationalInterval);
  expect(expLn2.result.low.toNumber()).toBeCloseTo(2, 3);
  expect(expLn2.result.high.toNumber()).toBeCloseTo(2, 3);

  // Test Sin(PI()/2) ≈ 1
  const sinPiOver2 = vm.processInput("Sin(PI()/2)");
  expect(sinPiOver2.type).toBe("expression");
  expect(sinPiOver2.result).toBeInstanceOf(RationalInterval);
  expect(sinPiOver2.result.low.toNumber()).toBeCloseTo(1, 2);
  expect(sinPiOver2.result.high.toNumber()).toBeCloseTo(1, 2);

  // Test Log(Exp(2), 10) ≈ 2/LN(10) - Log requires base argument
  const logExp2 = vm.processInput("Log(Exp(2), 10)");
  expect(logExp2.type).toBe("expression");
  expect(logExp2.result).toBeInstanceOf(RationalInterval);
  expect(logExp2.result.low.toNumber()).toBeCloseTo(0.86859, 3);
  expect(logExp2.result.high.toNumber()).toBeCloseTo(0.86859, 3);
});

test("Error cases - domain errors", () => {
  // Domain errors - test directly with functions
  expect(() => LN(new Rational(-1))).toThrow();
  expect(() => ARCSIN(new Rational(2))).toThrow();
  expect(() => ARCCOS(new Rational(-2))).toThrow();
});

test("Reals functions not available without loading", () => {
  const vm = new VariableManager();
  // Don't load reals module
  
  // These should fail since reals is not loaded
  const result = vm.processInput("Sin(0)");
  expect(result.type).toBe("error");
});

describe("Continued Fraction Integration", () => {
  it("should work with continued fraction notation in intervals", () => {
    // Use Parser to create CF rationals, then create intervals
    const cf1 = Parser.parse("3.~7");
    const cf2 = Parser.parse("0.~3");

    const interval1 = new RationalInterval(cf1, new Rational(333, 106));
    expect(interval1.low.equals(new Rational(333, 106))).toBe(true);  // 333/106 is smaller
    expect(interval1.high.equals(new Rational(22, 7))).toBe(true);    // 22/7 is larger

    const interval2 = new RationalInterval(new Rational(1, 3), cf2);
    // Since 1/3 = 0.~3, this creates equal endpoints
    // Just verify the continued fraction was parsed correctly
    expect(cf2.equals(new Rational(1, 3))).toBe(true);
  });

  it("should parse continued fraction intervals correctly", () => {
    // Test with Parser
    const parsed = Parser.parse("3.~7:3.~15");
    expect(parsed.constructor.name).toBe("RationalInterval");
    expect(parsed.low.equals(new Rational(46, 15))).toBe(true);
    expect(parsed.high.equals(new Rational(22, 7))).toBe(true);
  });
});