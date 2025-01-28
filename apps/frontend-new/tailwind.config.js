/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
    darkMode: ["class"],
    content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
    theme: {
        extend: {
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            colors: {},
        },
    },
    plugins: [require("tailwindcss-animate")],
};
