'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SearchForm from '@/components/SearchForm'
import { useSession, signOut } from '@/lib/better-auth-client'
import { useIsAdmin, useIsEditor } from '@/lib/auth-utils'
import Image from 'next/image'
import { useStoreCart } from '@/components/StoreCartProvider'
import type { ProgramNavRow } from '@/lib/sanity'

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      focusable="false"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  )
}

function ShoppingCartNavLink({
  totalItems,
  className,
  onClick,
}: {
  totalItems: number
  className?: string
  onClick?: () => void
}) {
  const label =
    totalItems === 0
      ? 'Shopping cart'
      : `Shopping cart, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}`
  return (
    <Link
      href="/store/cart"
      className={className}
      onClick={onClick}
      aria-label={label}
      title={totalItems === 0 ? 'View shopping cart' : `${totalItems} items in cart`}
    >
      <span className="relative inline-flex items-center justify-center">
        <CartIcon className="h-6 w-6" />
        {totalItems > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-2 -top-2 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-eaa-yellow px-0.5 text-[10px] font-bold leading-none text-eaa-blue"
          >
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        ) : null}
      </span>
    </Link>
  )
}

function SettingsGearIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1.04 1.56V21a2 2 0 01-4 0v-.08A1.7 1.7 0 008.96 19.36a1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.56-1.04H3a2 2 0 010-4h.08A1.7 1.7 0 004.64 8.96a1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34H9a1.7 1.7 0 001.04-1.56V3a2 2 0 014 0v.08c0 .68.4 1.3 1.04 1.56a1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87V9c.26.64.88 1.04 1.56 1.04H21a2 2 0 010 4h-.08a1.7 1.7 0 00-1.52 1.04z"
      />
    </svg>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

const DEFAULT_PROGRAM_SUBMENU = [
  { name: 'Eagle Flights', href: '/programs/eagle-flights' },
  { name: 'Ground School', href: '/programs/ground-school' },
  { name: 'Outreach', href: '/programs/outreach' },
  { name: 'Scholarships', href: '/programs/scholarships' },
  { name: 'Summer Camp', href: '/programs/summer-camp' },
  { name: 'VMC/IMC Club', href: '/programs/vmc-imc-club' },
  { name: 'Youth Aviation Program', href: '/programs/youth-aviation' },
  { name: 'Young Eagles', href: '/programs/young-eagles' },
] as const

export default function Navigation({
  showStore = true,
  programNavItems,
}: {
  showStore?: boolean
  programNavItems?: ProgramNavRow[]
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  /** Which parent nav group is expanded in the mobile drawer (Chapter, Programs, …). */
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null)
  const { data: session, isPending } = useSession()
  const isAdmin = useIsAdmin()
  const isEditor = useIsEditor()
  const router = useRouter()
  const { totalItems } = useStoreCart()

  /** Avoid hydration mismatch: session is null on SSR but loads on client — don't branch nav on session until mounted + session resolved. */
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isMenuOpen) setOpenMobileSection(null)
  }, [isMenuOpen])
  const showSessionNavItems = mounted && !isPending && !!session

  const handleLogout = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  /** Desktop: first name only when `name` has multiple words; full string in `title` on hover. */
  const navUserLabel = session?.user
    ? (() => {
        const u = session.user
        const nameTrim = u.name?.trim()
        const full = nameTrim || u.email || ''
        const compact =
          nameTrim && nameTrim.includes(' ')
            ? nameTrim.split(/\s+/)[0] ?? full
            : full
        return { full, compact }
      })()
    : null

  const programsSubmenu =
    programNavItems && programNavItems.length > 0 ? programNavItems : [...DEFAULT_PROGRAM_SUBMENU]

  const navigation = [
    {
      name: 'Chapter',
      href: '/chapter',
      submenu: [
        { name: 'Agenda', href: '/chapter/agenda' },
        { name: 'Board', href: '/chapter/board' },
        { name: 'Bylaws', href: '/chapter/bylaws' },
        { name: 'General Info', href: '/chapter/general-info' },
        ...(showSessionNavItems
          ? [{ name: 'Hangar Rental', href: '/chapter/hangar-rental' }]
          : []),
        { name: 'Visit Us', href: '/chapter/visit-us' },
      ],
    },
    { name: 'Calendar', href: '/calendar' },
    { name: 'Media', href: '/media' },
    { name: 'Kudos', href: '/kudos' },
    { name: 'News', href: '/news' },
    { name: 'NAVCOM', href: '/newsletter' },
    {
      name: 'Programs',
      href: '/programs',
      submenu: programsSubmenu,
    },
    ...(showSessionNavItems ? [{ name: 'Members', href: '/members' }] : []),
    ...(showStore ? [{ name: 'Store', href: '/store' }] : []),
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <nav className="bg-eaa-blue dark:bg-eaa-bg-dark text-white border-b border-transparent dark:border-eaa-border-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop: primary row — logo, links, account only (no search here) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 h-20">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center space-x-3 min-w-0">
            <Image
              src="/logo.png"
              alt="EAA 690 Logo"
              width={64}
              height={64}
              className="h-16 w-auto"
              style={{ width: 'auto', height: '4rem' }}
              priority
            />
            <span className="text-xl font-bold">EAA 690</span>
          </Link>

          {/* Desktop Navigation — xl (1280px) so mid-width viewports use the hamburger + avoid overlap with cart/account */}
          <div className="hidden xl:flex flex-1 justify-center items-center space-x-1 min-w-0 px-1 sm:px-2">
            {navigation.map((item) => (
              /**
               * WCAG 2.1.1 (Keyboard) — submenu must reveal on keyboard focus, not
               * just hover. `focus-within` keeps the panel open while either the
               * parent link OR any submenu link has focus, so Tab navigation works.
               */
              <div key={item.name} className="relative group">
                <Link
                  href={item.href}
                  aria-haspopup={item.submenu ? 'true' : undefined}
                  className="px-2 py-2 text-sm font-medium hover:text-eaa-yellow transition-colors whitespace-nowrap"
                >
                  {item.name}
                </Link>
                {item.submenu && (
                  <div
                    className="absolute left-0 mt-2 w-56 bg-white text-eaa-blue dark:bg-eaa-surface-dark dark:text-gray-100 rounded-md shadow-lg dark:border dark:border-eaa-border-dark opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-50"
                  >
                    <div className="py-1">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.name}
                          href={subitem.href}
                          className="block px-4 py-2 text-sm hover:bg-eaa-blue hover:text-white dark:hover:bg-eaa-yellow dark:hover:text-eaa-blue focus-visible:bg-eaa-blue focus-visible:text-white dark:focus-visible:bg-eaa-yellow dark:focus-visible:text-eaa-blue focus-visible:outline-none transition-colors"
                        >
                          {subitem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Cart icon + settings + account (desktop) */}
          <div className="hidden xl:flex shrink-0 items-center gap-3 2xl:gap-5">
            <Link
              href="/settings"
              aria-label="Settings and accessibility preferences"
              title="Settings"
              className="rounded-md p-2 text-white hover:bg-white/10 hover:text-eaa-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-eaa-blue dark:focus-visible:ring-offset-eaa-bg-dark"
            >
              <SettingsGearIcon className="h-6 w-6" />
            </Link>
            {showStore ? (
              <ShoppingCartNavLink
                totalItems={totalItems}
                className="rounded-md p-2 text-white hover:bg-white/10 hover:text-eaa-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-eaa-blue dark:focus-visible:ring-offset-eaa-bg-dark"
              />
            ) : null}
            {isPending ? (
              <div className="px-4 py-2 text-sm font-medium opacity-0">Login</div>
            ) : session ? (
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  href="/members"
                  className="text-sm text-gray-200 min-w-0 max-w-[10rem] xl:max-w-[13rem] truncate hover:text-eaa-yellow transition-colors"
                  title={navUserLabel?.full ? `${navUserLabel.full} — Members area` : 'Members area'}
                >
                  {navUserLabel?.compact ||
                    session.user?.name ||
                    session.user?.email ||
                    'Account'}
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="px-3 py-1 text-xs font-semibold rounded border border-eaa-yellow text-eaa-yellow hover:bg-eaa-yellow hover:text-eaa-blue transition-colors"
                  >
                    Admin
                  </Link>
                )}
                {(isAdmin || isEditor) && (
                  <Link
                    href="/studio"
                    className="px-3 py-1 text-xs font-semibold rounded border border-gray-400 text-gray-300 hover:bg-gray-400 hover:text-eaa-blue transition-colors"
                  >
                    Studio
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm font-medium hover:text-eaa-yellow transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium hover:text-eaa-yellow transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Tablet / narrow desktop: settings + cart + menu toggle */}
          <div className="flex items-center gap-0.5 xl:hidden ml-auto shrink-0">
            <Link
              href="/settings"
              aria-label="Settings and accessibility preferences"
              title="Settings"
              className="rounded-md p-2 text-white hover:bg-white/10 hover:text-eaa-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-eaa-blue dark:focus-visible:ring-offset-eaa-bg-dark"
            >
              <SettingsGearIcon className="h-6 w-6" />
            </Link>
            {showStore ? (
              <ShoppingCartNavLink
                totalItems={totalItems}
                className="rounded-md p-2 text-white hover:bg-white/10 hover:text-eaa-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-eaa-blue dark:focus-visible:ring-offset-eaa-bg-dark"
              />
            ) : null}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md hover:bg-eaa-light-blue dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop only: search on its own row so the main bar stays uncluttered */}
        <div className="hidden xl:block border-t border-white/15 py-2.5">
          <div className="flex justify-center px-1">
            <div className="w-full max-w-2xl">
              <SearchForm compact compactFullWidth />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div id="mobile-menu" className="xl:hidden pb-4 border-t border-white/10 pt-4">
            <div className="px-1 mb-4 max-w-md">
              <SearchForm compact />
            </div>
            <div className="space-y-1">
              {navigation.map((item) => {
                const hasSub = Boolean(item.submenu?.length)
                const sectionOpen = openMobileSection === item.name
                const subId = `mobile-nav-sub-${item.name.replace(/\s+/g, '-').toLowerCase()}`

                if (!hasSub) {
                  return (
                    <div key={item.name}>
                      <Link
                        href={item.href}
                        className="block px-3 py-2 text-base font-medium hover:bg-eaa-light-blue rounded-md"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    </div>
                  )
                }

                return (
                  <div key={item.name}>
                    <div className="flex min-h-[2.75rem] items-stretch overflow-hidden rounded-md hover:bg-white/5">
                      <Link
                        href={item.href}
                        className="flex flex-1 items-center px-3 py-2 text-base font-medium hover:bg-eaa-light-blue"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        className="flex shrink-0 items-center justify-center px-3 text-white hover:bg-eaa-light-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-yellow focus-visible:ring-inset"
                        aria-expanded={sectionOpen}
                        aria-controls={subId}
                        aria-label={`${sectionOpen ? 'Collapse' : 'Expand'} ${item.name} submenu`}
                        onClick={() =>
                          setOpenMobileSection((prev) => (prev === item.name ? null : item.name))
                        }
                      >
                        <ChevronDownIcon
                          className={`h-5 w-5 transition-transform duration-200 ${sectionOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>
                    {sectionOpen ? (
                      <div id={subId} className="mt-1 space-y-1 border-l border-white/20 pl-4 ml-3">
                        {item.submenu!.map((subitem) => (
                          <Link
                            key={subitem.name}
                            href={subitem.href}
                            className="block px-3 py-2 text-sm hover:bg-eaa-light-blue rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {subitem.name}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })}
              <Link
                href="/settings"
                className="block px-3 py-2 text-base font-medium hover:bg-eaa-light-blue dark:hover:bg-white/10 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Settings &amp; accessibility
              </Link>
              {isPending ? null : session ? (
                <div>
                  <Link
                    href="/members"
                    className="block px-3 py-2 text-sm text-gray-200 hover:bg-eaa-light-blue dark:hover:bg-white/10 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {session.user?.name || session.user?.email}
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2 text-base font-medium text-eaa-yellow hover:bg-eaa-light-blue rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  {(isAdmin || isEditor) && (
                    <Link
                      href="/studio"
                      className="block px-3 py-2 text-base font-medium text-gray-300 hover:bg-eaa-light-blue rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Content Studio
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 text-base font-medium hover:bg-eaa-light-blue rounded-md"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/sign-in"
                  className="block px-3 py-2 text-base font-medium hover:bg-eaa-light-blue rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

