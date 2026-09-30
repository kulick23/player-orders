import fioriTools from '@sap-ux/eslint-plugin-fiori-tools';

export default [
    ...fioriTools.configs.recommended,
    {
        languageOptions: {
            globals: {
                Promise: 'readonly'
            }
        },
        rules: {
            camelcase: ['warn', { properties: 'never' }]
        }
    }
];
