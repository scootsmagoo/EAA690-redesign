/** Used when no Program pages are published in Sanity yet (migration / empty dataset). */
export type ProgramNavItem = { name: string; href: string }

/** Program slugs removed from the site — still filtered from Sanity-driven lists. */
export const RETIRED_PROGRAM_SLUGS = ['ground-school'] as const

export function isRetiredProgramSlug(slug: string): boolean {
  return (RETIRED_PROGRAM_SLUGS as readonly string[]).includes(slug)
}

export const PROGRAM_NAV_FALLBACK: ProgramNavItem[] = [
  { name: 'Eagle Flights', href: '/programs/eagle-flights' },
  { name: 'Outreach', href: '/programs/outreach' },
  { name: 'Scholarships', href: '/programs/scholarships' },
  { name: 'Summer Camp', href: '/programs/summer-camp' },
  { name: 'VMC/IMC Club', href: '/programs/vmc-imc-club' },
  { name: 'Youth Aviation Program', href: '/programs/youth-aviation-program' },
  { name: 'Young Eagles', href: '/programs/young-eagles' },
]

export type ProgramIndexCard = { name: string; href: string; description: string }

export const PROGRAM_INDEX_FALLBACK: ProgramIndexCard[] = [
  {
    name: 'Eagle Flights',
    href: '/programs/eagle-flights',
    description: 'Experience the joy of flight with our Eagle Flights program',
  },
  {
    name: 'Outreach',
    href: '/programs/outreach',
    description: 'Community outreach and aviation education programs',
  },
  {
    name: 'Scholarships',
    href: '/programs/scholarships',
    description: 'Aviation scholarships for deserving students',
  },
  {
    name: 'Summer Camp',
    href: '/programs/summer-camp',
    description: 'Aviation summer camp for youth',
  },
  {
    name: 'VMC/IMC Club',
    href: '/programs/vmc-imc-club',
    description: 'Visual and Instrument Meteorological Conditions club',
  },
  {
    name: 'Youth Aviation Program',
    href: '/programs/youth-aviation-program',
    description: 'Comprehensive youth aviation education program',
  },
  {
    name: 'Young Eagles',
    href: '/programs/young-eagles',
    description: 'EAA Young Eagles program — first flight experience for youth',
  },
]
