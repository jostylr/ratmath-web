import { describe, test, expect, beforeEach } from "bun:test";
import { WebCalculator } from "../src/web-calc.js";
import { BaseSystem } from "@ratmath/core";

// Mock global document if it doesn't exist (Bun environment might not have it)
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

    // Override DOM initialization to be safe
    initializeElements() {
        this.inputElement = {
            value: "",
            focus: () => { },
            addEventListener: () => { },
            setAttribute: () => { }
        };
        // Mock other properties needed
        this.outputHistoryElement = { appendChild: () => { }, scrollHeight: 0, scrollTop: 0 };
    }

    setupEventListeners() {
        // No-op
    }

    displayWelcome() {
        // No-op
    }

    // Capture output
    addToOutput(input, output, isError) {
        if (output) {
            this.logs.push(output);
        }
    }

    finishEntry(output) {
        // No-op
    }

    getLastLog() {
        return this.logs[this.logs.length - 1];
    }

    clearLogs() {
        this.logs = [];
    }
}

describe("WebCalculator Prefix Strictness", () => {
    let calc;

    beforeEach(() => {
        calc = new TestWebCalculator();
    });

    test("Strict Prefix Interpretation", () => {
        // Set base to 36
        calc.handleBaseCommand("BASE 36");
        calc.clearLogs();

        // Process 0b10. In Base 36, 'b' is a digit (11).
        // If interpreted as Base 36, 0b10 = 0*36^3 + 11*36^2 + 1*36 + 0? No.
        // It's 14292 if interpreted as Base 36 digits `b`, `1`, `0`? (11*36^2 + 1*36 + 0 = 14256 + 36 = 14292)
        // With strict prefix, 0b... MUST be binary. 0b10 = 2.

        calc.processExpression("0b10");

        // Output should be '2' (in Base 36, 2 is '2')
        expect(calc.getLastLog()).toBe("2");
    });

    test("BASES command linking", () => {
        calc.handleBasesCommand("t:32, z:62");

        const linkedT = calc.logs.some(l => l.includes("Linked prefix '0t' to Base 32"));
        expect(linkedT).toBe(true);

        calc.clearLogs();
        calc.processExpression("0t10"); // Base 32 '10' = 32
        expect(calc.getLastLog()).toBe("32");

        calc.clearLogs();
        calc.processExpression("0z10"); // Base 62 '10' = 62
        expect(calc.getLastLog()).toBe("62");
    });

    test("Case sensitive prefixes", () => {
        calc.handleBasesCommand("q:4, Q:5");

        calc.clearLogs();
        calc.processExpression("0q10"); // Base 4 '10' = 4
        expect(calc.getLastLog()).toBe("4");

        calc.clearLogs();
        calc.processExpression("0Q10"); // Base 5 '10' = 5
        expect(calc.getLastLog()).toBe("5");
    });

    test("Strictness - Unregistered Prefix", () => {
        calc.processExpression("0j10");
        expect(calc.getLastLog()).toContain("Invalid or unregistered prefix '0j'");
    });
});
