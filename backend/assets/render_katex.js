#!/usr/bin/env node

/**
 * KaTeX Renderer Script
 * 
 * Purpose: Render LaTeX to KaTeX HTML format
 * 
 * Usage: node render_katex.js
 * Input: JSON via stdin: {"latex": "x^2", "displayMode": false}
 * Output: KaTeX HTML on stdout
 * 
 * Example:
 * echo '{"latex": "x^2+y^2", "displayMode": false}' | node render_katex.js
 */

const katex = require('katex');
const readline = require('readline');

/**
 * Create readline interface for stdin
 */
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

/**
 * Process each line of input
 */
rl.on('line', (line) => {
    try {
        // Parse JSON input
        const data = JSON.parse(line);
        const { latex, displayMode } = data;

        // Validate input
        if (!latex || typeof latex !== 'string') {
            console.error('Error: latex parameter must be a non-empty string');
            process.exit(1);
        }

        // Render LaTeX to KaTeX HTML
        const html = katex.renderToString(latex, {
            displayMode: displayMode || false,
            throwOnError: false,  // Don't throw on error, render partial
            output: 'html',       // Output HTML (not MathML)
            trust: false,         // Don't trust user LaTeX (security)
            strict: 'warn'        // Warn on deprecated commands
        });

        // Output the HTML
        console.log(html);

        // Exit after processing one line
        process.exit(0);

    } catch (error) {
        // Handle JSON parse errors or other exceptions
        console.error('Error: ' + error.message);
        process.exit(1);
    }
});

/**
 * Handle EOF
 */
rl.on('close', () => {
    // No input provided
    if (process.exitCode === undefined) {
        console.error('Error: No input provided');
        process.exit(1);
    }
});

/**
 * Handle errors
 */
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception: ' + error.message);
    process.exit(1);
});
