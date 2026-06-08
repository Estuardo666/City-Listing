import { googleHoursSync } from '../src/lib/google/google-hours-sync'

async function main() {
  const maxRecords = parseInt(process.argv[2] || '100', 10)
  const batchSize = parseInt(process.argv[3] || '20', 10)

  console.log(`Google Hours Sync - maxRecords: ${maxRecords}, batchSize: ${batchSize}`)
  console.log('---')

  const result = await googleHoursSync.run(maxRecords, batchSize)

  console.log('---')
  console.log(`Processed: ${result.processed}`)
  console.log(`Updated:   ${result.updated}`)
  console.log(`Skipped:   ${result.skipped}`)
  console.log(`Errors:    ${result.errors}`)
  console.log(`Elapsed:   ${(result.elapsed / 1000).toFixed(1)}s`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
