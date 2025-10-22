// eslint.config.mjs (root)
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import prettier from "eslint-plugin-prettier";

export default [
    // Ignorer genererte/build mapper globalt
    {
        ignores: [
            "**/.next/**",
            "**/out/**",
            "**/build/**",
            "**/dist/**",
            "**/node_modules/**",
            "**/next-env.d.ts",
        ],
    },

    // Felles JS/TS baseline
    js.configs.recommended,
    ...tseslint.configs.recommended,

    // FRONTEND (React/Next)
    {
        files: ["frontend/src/**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: { ...globals.browser, ...globals.node },
        },
        plugins: { react, prettier },
        settings: {
            react: { version: "detect" }, // ← fjerner versjonsadvarselen
        },
        rules: {
            "react/react-in-jsx-scope": "off", // ← Next/React 17+ trenger ikke import React
            "prettier/prettier": "error",
        },
    },

    // BACKEND (Node/Express)
    {
        files: ["backend/src/**/*.{js,ts}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: { ...globals.node },
        },
        rules: {
            // legg backend-spesifikke regler om ønskelig
        },
    },
];