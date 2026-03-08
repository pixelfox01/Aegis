import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

export default defineConfig({
  plugins: [
    { 
      enforce: 'pre', 
      ...mdx({ 
        remarkPlugins: [remarkGfm], 
        rehypePlugins: [rehypeHighlight],
        providerImportSource: '@mdx-js/react',
      }) 
    },
    react(),
  ],
  server: {
    port: 3000,
  },
})
