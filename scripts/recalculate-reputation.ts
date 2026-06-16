import { recalculateAllReputations } from '../src/lib/reputation'

async function main() {
  console.log('Recalculando reputación de todos los negocios...')
  const result = await recalculateAllReputations()
  console.log(`Procesados: ${result.processed}`)
  console.log(`Tiempo: ${(result.elapsed / 1000).toFixed(1)}s`)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
