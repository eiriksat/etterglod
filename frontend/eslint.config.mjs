// Flat config for monorepo (Next frontend + Express backend)
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import prettier from "eslint-plugin-prettier";

export default [
    // Ignorer genererte/build-mapper
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

    // Felles JS/TS-baseline
    js.configs.recommended,
    ...tseslint.configs.recommended,

    // FRONTEND: React/Next-kode
    {
        files: ["frontend/src/**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: { ...globals.browser, ...globals.node },
        },
        plugins: { react, prettier },
        settings: {
            // ← Fjerner "React version not specified" og velger riktig versjon automatisk
            react: { version: "detect" },
        },
        rules: {
            // Moderne React/Next trenger ikke `import React from "react"`
            "react/react-in-jsx-scope": "off",
            "prettier/prettier": "error",
        },
    },

    // BACKEND: Node/Express-kode
    {
        files: ["backend/src/**/*.{js,ts}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: { ...globals.node },
        },
        rules: {
            // legg backend-spesifikke regler her om ønskelig
        },
    },
];