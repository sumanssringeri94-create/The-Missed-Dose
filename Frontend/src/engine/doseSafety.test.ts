import { describe, expect, it } from 'vitest'
import { recordDose, missedDose, MISSED_DOSE_COPY, DUPLICATE_DOSE_COPY, URGENT_DUPLICATE_COPY } from './doseSafety'

describe('dose safety events', () => {
  it('records a duplicate instead of silently toggling it away', () => {
    const first = recordDose('morning', [])
    expect(recordDose('morning', [first]).status).toBe('duplicate')
  })
  it('creates a missed event with safe non-dosing copy', () => expect(missedDose('evening').status).toBe('missed'))
  it('keeps safety copy free of dosing instructions', () => {
    const copy = `${MISSED_DOSE_COPY} ${DUPLICATE_DOSE_COPY} ${URGENT_DUPLICATE_COPY}`.toLowerCase()
    expect(copy).not.toMatch(/stop taking|skip this dose|discontinue|take an extra/)
    expect(copy).toContain('please check your prescription')
  })
})
