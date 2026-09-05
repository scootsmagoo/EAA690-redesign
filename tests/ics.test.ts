import { describe, expect, it } from 'vitest'
import { eventToVEvent, nextDayCompact, nowDtStamp, wrapVCalendar } from '@/lib/ics'
import type { Event } from '@/lib/sanity-types'

const base: Event = {
  _id: 'evt1',
  title: 'Pancake Breakfast',
  date: '2026-04-04',
  location: 'Briscoe Field (KLZU)',
  eventType: 'breakfast',
}

describe('nextDayCompact', () => {
  it('advances one day and drops separators', () => {
    expect(nextDayCompact('2026-04-04')).toBe('20260405')
  })
  it('rolls over month and year boundaries', () => {
    expect(nextDayCompact('2026-01-31')).toBe('20260201')
    expect(nextDayCompact('2026-12-31')).toBe('20270101')
  })
})

describe('nowDtStamp', () => {
  it('is a compact UTC timestamp', () => {
    expect(nowDtStamp()).toMatch(/^\d{8}T\d{6}Z$/)
  })
})

describe('eventToVEvent', () => {
  it('emits an all-day event when there is no start time', () => {
    const v = eventToVEvent(base, '20260101T000000Z')
    expect(v).toContain('DTSTART;VALUE=DATE:20260404')
    expect(v).toContain('DTEND;VALUE=DATE:20260405')
    expect(v).toContain('SUMMARY:Pancake Breakfast')
    expect(v).toContain('UID:evt1@eaa690.org')
  })

  it('converts 12-hour times to local timed DTSTART/DTEND', () => {
    const v = eventToVEvent({ ...base, startTime: '8:00 AM', endTime: '12:30 PM' }, 'X')
    expect(v).toContain('DTSTART;TZID=America/New_York:20260404T080000')
    expect(v).toContain('DTEND;TZID=America/New_York:20260404T123000')
  })

  it('handles the 12 AM / 12 PM edge cases', () => {
    const v = eventToVEvent({ ...base, startTime: '12:00 AM', endTime: '12:00 PM' }, 'X')
    expect(v).toContain('DTSTART;TZID=America/New_York:20260404T000000')
    expect(v).toContain('DTEND;TZID=America/New_York:20260404T120000')
  })

  it('escapes RFC 5545 special characters in text fields', () => {
    const v = eventToVEvent(
      { ...base, description: 'Coffee, donuts; and more\nSecond line', location: 'Hangar 1, KLZU' },
      'X'
    )
    expect(v).toContain('DESCRIPTION:Coffee\\, donuts\\; and more\\nSecond line')
    expect(v).toContain('LOCATION:Hangar 1\\, KLZU')
  })

  it('folds lines longer than 75 octets', () => {
    const v = eventToVEvent({ ...base, description: 'x'.repeat(200) }, 'X')
    for (const line of v.split('\r\n')) {
      expect(line.length).toBeLessThanOrEqual(75)
    }
    expect(v).toContain('\r\n x')
  })
})

describe('wrapVCalendar', () => {
  it('wraps events with required calendar headers', () => {
    const cal = wrapVCalendar(['BEGIN:VEVENT\r\nEND:VEVENT'], { name: 'EAA 690' })
    const lines = cal.split('\r\n')
    expect(lines[0]).toBe('BEGIN:VCALENDAR')
    expect(lines).toContain('VERSION:2.0')
    expect(lines).toContain('X-WR-CALNAME:EAA 690')
    expect(lines).toContain('X-WR-TIMEZONE:America/New_York')
    expect(lines[lines.length - 1]).toBe('END:VCALENDAR')
  })
})
