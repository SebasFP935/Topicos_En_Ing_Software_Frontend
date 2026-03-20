import { copyFileSync, existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const distDir = resolve(process.cwd(), 'dist')
const indexHtml = resolve(distDir, 'index.html')
const notFoundHtml = resolve(distDir, '404.html')
const noJekyllFile = resolve(distDir, '.nojekyll')

if (!existsSync(indexHtml)) {
  throw new Error('No se encontro dist/index.html. Ejecuta vite build antes de preparar GitHub Pages.')
}

copyFileSync(indexHtml, notFoundHtml)
writeFileSync(noJekyllFile, '', 'utf8')

console.log('GitHub Pages listo: se genero dist/404.html y dist/.nojekyll')
