import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import CookieBanner from '@/components/CookieBanner'
import LatestNavcomCard from '@/components/newsletter/LatestNavcomCard'
import { getHomePage, getLatestNewsletterIssue, getSiteSettings, urlFor } from '@/lib/sanity'
import { isSafeSiteHref, safePortableTextLinkHref } from '@/lib/search-safety'
import type { HomePageContent, HomeProgramCard } from '@/lib/sanity-types'

export const revalidate = 30

const DEFAULT_META_TITLE = 'EAA 690 - Experimental Aircraft Association Chapter 690'
const DEFAULT_META_DESCRIPTION =
  'EAA 690 is a Chapter of the Experimental Aircraft Association, located at Briscoe Field (KLZU) in Lawrenceville, Georgia.'

const FALLBACK_PROGRAMS: HomeProgramCard[] = [
  {
    icon: '✈️',
    name: 'Young Eagles',
    description:
      'Free first flights for youth ages 8–17. EAA 690 has flown Young Eagles for over 30 years.',
    href: '/programs/young-eagles',
    cta: 'Register for a Flight',
  },
  {
    icon: '🏕️',
    name: 'Aviation Summer Camp',
    description: 'A week-long immersive STEM aviation program for youth 12–18 at Gwinnett County Airport.',
    href: '/programs/summer-camp',
    cta: 'Join the Waitlist',
  },
  {
    icon: '🎓',
    name: 'Scholarships',
    description:
      'The Ray Aviation Scholarship and Chapter 690 Scholarship help young pilots reach their goals.',
    href: '/programs/scholarships',
    cta: 'Apply Now',
  },
  {
    icon: '🔧',
    name: 'Youth Aviation Program',
    description:
      'Youth ages 14+ build real airplanes in our hangar — earning credits toward future flight training.',
    href: '/programs/youth-aviation',
    cta: 'Express Interest',
  },
  {
    icon: '🛩️',
    name: 'VMC/IMC Club',
    description:
      'Monthly scenario-based safety meetings every 3rd Thursday. Open to all pilots and enthusiasts.',
    href: '/programs/vmc-imc-club',
    cta: 'Get Notified',
  },
  {
    icon: '🦅',
    name: 'Eagle Flights',
    description: 'Introductory flights for adults to experience general aviation firsthand.',
    href: '/programs/eagle-flights',
    cta: 'Learn More',
  },
]

function blockHasContent(blocks: unknown[] | undefined): boolean {
  return Array.isArray(blocks) && blocks.length > 0
}

const portableTextComponents = {
  types: {
    image: ({ value }: { value: Parameters<typeof urlFor>[0] }) => {
      const src = urlFor(value).width(900).fit('max').url()
      const alt = (value as { alt?: string }).alt?.trim() ?? ''
      return (
        <figure className="my-6">
          <Image
            src={src}
            alt={alt}
            width={900}
            height={600}
            className="rounded-lg w-full object-cover"
          />
        </figure>
      )
    },
  },
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className="text-lg text-gray-700 mb-4 leading-relaxed">{children}</p>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="text-2xl font-bold text-eaa-blue mt-6 mb-3">{children}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-xl font-bold text-eaa-blue mt-4 mb-2">{children}</h3>
    ),
    h4: ({ children }: { children?: ReactNode }) => (
      <h4 className="text-lg font-bold text-eaa-blue mt-3 mb-2">{children}</h4>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="border-l-4 border-eaa-yellow pl-4 italic text-gray-600 my-4">{children}</blockquote>
    ),
  },
  marks: {
    strong: ({ children }: { children?: ReactNode }) => <strong className="font-semibold">{children}</strong>,
    link: ({ children, value }: { children?: ReactNode; value?: { href?: string } }) => {
      const safe = safePortableTextLinkHref(value?.href)
      if (!safe) {
        return <span className="underline decoration-gray-400">{children}</span>
      }
      if (safe.startsWith('http://') || safe.startsWith('https://')) {
        return (
          <a href={safe} className="text-eaa-blue underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        )
      }
      return (
        <Link href={safe} className="text-eaa-blue underline">
          {children}
        </Link>
      )
    },
  },
}

const spotlightPortableComponents = {
  ...portableTextComponents,
  block: {
    ...portableTextComponents.block,
    normal: ({ children }: { children?: ReactNode }) => (
      <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-lg font-bold text-eaa-blue mt-6 mb-2">{children}</h3>
    ),
    h4: ({ children }: { children?: ReactNode }) => (
      <h4 className="text-base font-bold text-eaa-blue mt-4 mb-2">{children}</h4>
    ),
  },
}

function DefaultHeroIntro() {
  return (
    <>
      <p className="text-lg text-gray-700 mb-4">
        EAA 690 is a Chapter of the Experimental Aircraft Association, located at{' '}
        <strong className="font-semibold">Briscoe Field (KLZU)</strong> in Lawrenceville, Georgia. A diverse chapter with over{' '}
        <strong className="font-semibold">250 members</strong>, awarded EAA&apos;s top level{' '}
        <strong className="font-semibold">Gold Chapter status</strong>, we offer a wide range of aviation-related activities on
        a regular basis.
      </p>
      <p className="text-lg text-gray-700 mb-4">
        While the Pancake Breakfast and our monthly meetings are the norm, we are also heavily involved in youth education through
        EAA&apos;s Young Eagles program and our youth build programs, regularly conduct fly-outs, and host historical aircraft such
        as EAA&apos;s B-17 &quot;Aluminum Overcast&quot; and the Ford Tri-Motor.
      </p>
      <p className="text-lg text-gray-700 mb-6">
        Founded in 1980, the chapter is an <strong className="font-semibold">IRS-approved 501(c)(3) non-profit entity</strong>.
      </p>
    </>
  )
}

function resolvePrograms(home: HomePageContent | null): HomeProgramCard[] {
  const cards = home?.programCards
  if (!cards?.length) return FALLBACK_PROGRAMS
  const valid = cards.filter(
    (c): c is Required<Pick<HomeProgramCard, 'name' | 'description' | 'href' | 'cta'>> & HomeProgramCard =>
      Boolean(c?.name && c?.description && c?.href && c?.cta)
  )
  return valid.length > 0 ? valid : FALLBACK_PROGRAMS
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const home = await getHomePage()
    return {
      title: home?.seo?.metaTitle?.trim() || DEFAULT_META_TITLE,
      description: home?.seo?.metaDescription?.trim() || DEFAULT_META_DESCRIPTION,
    }
  } catch {
    return {
      title: DEFAULT_META_TITLE,
      description: DEFAULT_META_DESCRIPTION,
    }
  }
}

export default async function Home() {
  let latestIssue: Awaited<ReturnType<typeof getLatestNewsletterIssue>> = null
  try {
    latestIssue = await getLatestNewsletterIssue()
  } catch {
    latestIssue = null
  }
  const siteSettings = await getSiteSettings()
  const fallbackPdfUrl = siteSettings?.newsletterUrl?.trim() || null

  let home: HomePageContent | null = null
  try {
    home = await getHomePage()
  } catch {
    home = null
  }

  const programs = resolvePrograms(home)
  const heroHeadline = home?.heroHeadline?.trim() || 'Welcome to EAA 690'
  const programsTitle = home?.programsSectionTitle?.trim() || 'Get Involved'
  const programsSubtitle =
    home?.programsSectionSubtitle?.trim() ||
    "From free youth flights to scholarships and hands-on build programs — there's a place for everyone at EAA 690."

  const showPancake = home?.pancakeSectionEnabled !== false
  const pancakeTitle =
    home?.pancakeTitle?.trim() || '1ST SATURDAY PANCAKE BREAKFAST AND AVIATION PROGRAM'
  const pancakeIntro = home?.pancakeIntro?.trim() || 'Hosted by the Gwinnett EAA Chapter 690 of the Experimental Aircraft Association.'
  const pancakeBreakfast =
    home?.pancakeBreakfastTime?.trim() || 'Breakfast served 8:00 to 10:00 AM'
  const pancakeProgram = home?.pancakeProgramTime?.trim() || 'Program at 10:00 AM'
  const pancakePrice = home?.pancakePriceNote?.trim() || 'Please Note: Breakfast has increased to $10/each!'

  const showSpotlight = home?.spotlightEnabled !== false
  const spotlightTitle = home?.spotlightTitle?.trim() || 'April 5th Presentation at 10 AM'
  const spotlightSubtitle = home?.spotlightSubtitle?.trim() || 'Alex Ortlano — "Dust Off"'
  const heroVisual = home?.heroVisual === 'heroImage' && home?.heroImage ? 'heroImage' : 'goldBadge'
  const goldCode = home?.goldBadgeCode?.trim() || 'EAA 020-202'
  const heroImageAltText =
    home?.heroImageAlt?.trim() || (heroHeadline ? `Photograph: ${heroHeadline}` : 'EAA Chapter 690')
  const spotlightPhotoAlt =
    home?.spotlightImageAlt?.trim() ||
    (spotlightSubtitle ? `Illustration: ${spotlightSubtitle}` : `Illustration: ${spotlightTitle}`)

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl font-bold text-eaa-blue mb-6">{heroHeadline}</h1>
            {blockHasContent(home?.heroIntro as unknown[] | undefined) ? (
              <div className="mb-4">
                <PortableText value={home!.heroIntro as never} components={portableTextComponents} />
              </div>
            ) : (
              <DefaultHeroIntro />
            )}
            <div className="mb-6">
              <LatestNavcomCard issue={latestIssue} fallbackPdfUrl={fallbackPdfUrl} />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/donate"
                className="bg-eaa-yellow text-eaa-blue px-8 py-3 rounded-full font-bold text-lg hover:bg-yellow-400 transition-colors text-center"
              >
                DONATE TODAY!
              </Link>
              <Link
                href="/join"
                className="bg-eaa-yellow text-eaa-blue px-8 py-3 rounded-full font-bold text-lg hover:bg-yellow-400 transition-colors text-center"
              >
                Join/Renew EAA 690!
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            {heroVisual === 'heroImage' && home?.heroImage ? (
              <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src={urlFor(home.heroImage).width(800).height(600).fit('crop').url()}
                  alt={heroImageAltText}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 400px"
                  priority
                />
              </div>
            ) : (
              <div className="w-48 h-48 bg-eaa-yellow rounded-full flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <div className="text-eaa-blue font-bold text-2xl mb-2">GOLD</div>
                  <div className="text-eaa-blue font-bold text-xl">CHAPTER</div>
                  <div className="text-eaa-blue text-sm mt-2">{goldCode}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-eaa-blue mb-3">{programsTitle}</h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">{programsSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <div
                key={`${program.name}-${program.href}`}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col p-6"
              >
                <div className="text-4xl mb-4" aria-hidden="true">
                  {program.icon ?? '✈️'}
                </div>
                <h3 className="text-lg font-bold text-eaa-blue mb-2">{program.name}</h3>
                <p className="text-gray-700 text-sm leading-relaxed flex-1 mb-5">{program.description}</p>
                <Link
                  href={isSafeSiteHref(program.href!.trim()) ? program.href!.trim() : '/programs'}
                  aria-label={`${program.cta} — ${program.name}`}
                  className="inline-block text-center bg-eaa-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-eaa-light-blue transition-colors"
                >
                  {program.cta} <span aria-hidden="true">→</span>
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/programs"
              className="inline-block text-eaa-blue border-2 border-eaa-blue px-8 py-3 rounded-full font-bold hover:bg-eaa-blue hover:text-white transition-colors"
            >
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {showPancake ? (
        <section className="bg-eaa-blue text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-8">{pancakeTitle}</h2>
            <div className="text-center space-y-4">
              <p className="text-lg">{pancakeIntro}</p>
              <div className="bg-white text-eaa-blue p-6 rounded-lg max-w-2xl mx-auto">
                <p className="text-xl mb-2">{pancakeBreakfast}</p>
                <p className="text-xl mb-4">{pancakeProgram}</p>
                <p className="text-red-800 font-bold text-lg">{pancakePrice}</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {showSpotlight ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className={home?.spotlightImage ? 'grid grid-cols-1 lg:grid-cols-2 gap-8 items-start' : ''}>
              <div>
                <h2 className="text-2xl font-bold text-eaa-blue mb-4">{spotlightTitle}</h2>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{spotlightSubtitle}</h3>
                {blockHasContent(home?.spotlightBody as unknown[] | undefined) ? (
                  <div className="prose max-w-none mt-6">
                    <PortableText value={home!.spotlightBody as never} components={spotlightPortableComponents} />
                  </div>
                ) : (
                  <div className="prose max-w-none mt-6">
                    <p className="text-gray-700 mb-4">
                      While in his senior year of college, Alex learned to fly in the first year of the Army ROTC Flight Training
                      Program. He received his Private Pilot&apos;s Single Engine Land license, and was commissioned as a Second
                      Lieutenant upon graduation.
                    </p>
                    <p className="text-gray-700 mb-4">
                      Alex learned to fly helicopters while attending Army Flight School in Ft. Wolters, TX and Ft. Rucker, AL. He
                      served in Vietnam in 1965 with the 57th Medical Detachment (Dustoff), flying out of Tan Son Nhut Airfield in
                      Saigon.
                    </p>
                    <p className="text-gray-700 mb-4">
                      After leaving the Army he applied for and received a Commercial Helicopter License and never flew again.
                    </p>
                    <p className="text-gray-700">
                      In civilian life he was an automobile executive with Ford Motor Company, American Motors Corporation, and Toyota
                      Motor Sales, retiring from Toyota in 1998.
                    </p>
                  </div>
                )}
              </div>
              {home?.spotlightImage ? (
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden shadow-md">
                  <Image
                    src={urlFor(home.spotlightImage).width(900).height(675).fit('crop').url()}
                    alt={spotlightPhotoAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 450px"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <CookieBanner />
    </div>
  )
}
