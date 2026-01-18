
import { describe, test, expect, spyOn, beforeEach, afterEach, mock } from "bun:test";
import { WebCalculator } from "../src/web-calc.js";
import { VariableManager } from "@ratmath/algebra";

// Mock DOM environment
const mockInput = { value: "", focus: () => { }, setSelectionRange: () => { }, addEventListener: () => { }, setAttribute: () => { } };
const mockOutput = { appendChild: () => { }, innerHTML: "" };
const mockElement = { addEventListener: () => { }, style: {}, click: () => { } };

global.document = {
    getElementById: (id) => {
        if (id === "calculatorInput") return mockInput;
        if (id === "outputHistory") return mockOutput;
        return mockElement;
    },
    createElement: (tag) => {
        return {
            className: "",
            appendChild: () => { },
            innerHTML: "",
            addEventListener: () => { },
            dataset: {}
        };
    },
    addEventListener: () => { }
};
global.window = {
    innerWidth: 1024,
    location: { search: "" },
    URLSearchParams: class { get() { return null; } }
};

describe("WebCalculator Advanced Features", () => {
    let calc;
    let fetchMock;

    beforeEach(() => {
        // Reset mocks
        mockInput.value = "";
        fetchMock = mock(() => Promise.resolve({
            ok: true,
            text: () => Promise.resolve("F(x) -> x*2\nvar = 10")
        }));
        global.fetch = fetchMock;

        calc = new WebCalculator();
        // Mock addToOutput to inspect results
        calc.lastOutput = "";
        calc.addToOutput = (input, output, isError) => {
            calc.lastOutput = output;
        };
    });

    test("HELP command should show specific topic help", () => {
        // Setup a function with doc
        calc.variableManager.defineFunction("TestFunc", ["x"], "x+1", "Adds one to x");

        calc.inputElement.value = "HELP TestFunc";
        calc.processInput();

        // Function names are normalized to uppercase (TestFunc -> TESTFUNC)
        expect(calc.lastOutput).toContain("TESTFUNC(x)");
        expect(calc.lastOutput).toContain("Adds one to x");
    });

    test("LOAD command should fetch url", async () => {
        calc.inputElement.value = "LOAD http://example.com/mod.rat";

        // internal handleLoadCommand is async, processInput calls it but doesn't await it (it returns void)
        // We can await the promise if we spy on it or simple wait
        calc.processInput();

        // Wait for microtasks
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(fetchMock).toHaveBeenCalledWith("http://example.com/mod.rat");
        console.log("Last Output:", calc.lastOutput);
        expect(calc.lastOutput.includes("Function F[x] defined") || calc.lastOutput.includes("Loading") || calc.lastOutput.includes("Module")).toBe(true);

        // Verify loaded function works
        expect(calc.variableManager.functions.has("F")).toBe(true);
    });

    test("LOAD @@Module command should fetch convention url", async () => {
        calc.inputElement.value = "LOAD @@MyModule";
        calc.processInput();
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(fetchMock).toHaveBeenCalledWith("MyModule.rat");
    });

    test("loadModulesFromUrl should trigger loading", async () => {
        // Mock window location
        global.window.location.search = "?load=http://mod1.rat,@@Mod2";
        // Need to recreate class? Or just call method?
        // In constructor it calls it. But here we manually call it to test logic on existing instance
        // or create new instance with mocked window

        // Mock URLSearchParams on global window
        global.window.URLSearchParams = class {
            get(k) { return k === 'load' ? "http://mod1.rat,@@Mod2" : null; }
        };

        calc.loadModulesFromUrl();
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(fetchMock).toHaveBeenCalledWith("http://mod1.rat");
        expect(fetchMock).toHaveBeenCalledWith("Mod2.rat");
    });

});
