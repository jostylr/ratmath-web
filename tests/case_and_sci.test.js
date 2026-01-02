import { describe, test, expect, beforeEach } from "bun:test";
import { WebCalculator } from "../src/web-calc.js";
import { BaseSystem } from "@ratmath/core";

if (typeof document === "undefined") {
    global.document = {
        addEventListener: () => { },
        getElementById: () => ({ value: "", focus: () => { }, addEventListener: () => { } }),
    };
    global.window = { innerWidth: 1024 };
}

class TestWebCalculator extends WebCalculator {
    constructor() {
        super();
        this.logs = [];
    }
    initializeElements() {
        this.inputElement = { value: "", focus: () => { }, addEventListener: () => { }, setAttribute: () => { } };
        this.outputHistoryElement = { appendChild: () => { }, scrollHeight: 0, scrollTop: 0 };
    }
    setupEventListeners() { }
    displayWelcome() { }
    addToOutput(input, output, isError) {
        if (output) this.logs.push(output);
    }
    finishEntry(output) { }
    getLastLog() { return this.logs[this.logs.length - 1]; }
    clearLogs() { this.logs = []; }
}

describe("WebCalc: Custom Base Sensitivity and Sci Notation", () => {
    let calc;
    beforeEach(() => { calc = new TestWebCalculator(); });

    test("Base 62 Case Sensitivity (a vs A)", () => {
        calc.handleBaseCommand("BASE 62");
        calc.clearLogs();

        // 'A' -> 36
        calc.processExpression("A");
        expect(calc.getLastLog()).toContain("36");

        calc.clearLogs();
        // 'a' -> 10
        calc.processExpression("a");
        expect(calc.getLastLog()).toContain("10");
    });

    test("Base 62 uses _^ for scientific notation", () => {
        calc.handleBaseCommand("BASE 62");
        calc.clearLogs();

        calc.processExpression("1_^2");

        const output = calc.getLastLog();
        expect(output).not.toContain("Error");
        expect(output).not.toContain("Expected E notation");
    });

    test("Base 32 treats E as digit and forbids E notation", () => {
        calc.handleBaseCommand("BASE 32");
        calc.clearLogs();

        // 5E2 -> 5570
        calc.processExpression("5E2");
        expect(calc.getLastLog()).toContain("5570");

        // 5_^2 -> 5120
        calc.processExpression("5_^2");
        expect(calc.getLastLog()).toContain("5120");
    });

    test("HEX input handled correctly (Double Processing Fix)", () => {
        calc.handleBaseCommand("BASE 16");
        calc.clearLogs();

        calc.processExpression("a"); // 10
        expect(calc.getLastLog()).toContain("10"); // Should NOT contain 16
    });

    test("Base 10 supports _^ by default", () => {
        calc.handleBaseCommand("BASE 10");
        calc.clearLogs();

        calc.processExpression("5_^2"); // 500
        expect(calc.getLastLog()).toContain("500");
    });

    test("Scientific Notation with negative exponent works (e.g. 1_^-1)", () => {
        calc.handleBaseCommand("BASE 16");
        calc.clearLogs();

        calc.processExpression("1_^-1");
        const log = calc.getLastLog();
        const validOutputs = ["0.0625", "1/16", "0.1", "6.25E-2"];
        const matches = validOutputs.some(val => log.includes(val));
        expect(matches).toBe(true);
        expect(log).not.toContain("E-252");
    });
});
