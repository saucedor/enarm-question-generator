import type { StorybookConfig } from '@storybook/react-vite';
const config: StorybookConfig = { staticDirs: ['../public'], stories: ['../src/**/*.stories.tsx'], addons: ['@storybook/addon-essentials'], framework: { name: '@storybook/react-vite', options: {} } };
export default config;
