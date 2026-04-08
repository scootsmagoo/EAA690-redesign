'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from '@/lib/better-auth-client'
import { useIsAdmin, useIsEditor } from '@/lib/auth-utils'
import Image from 'next/image'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isChapterOpen, setIsChapterOpen] = useState(false)
  const [isProgramsOpen, setIsProgramsOpen] = useState(false)
  const { data: session, isPending } = useSession()
  const isAdmin = useIsAdmin()
  const isEditor = useIsEditor()
  const router = useRouter()

  /** Avoid hydration mismatch: session is null on SSR but loads on client — don't branch nav on session until mounted + session resolved. */
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
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
    {
      name: 'Programs',
      href: '/programs',
      submenu: [
        { name: 'Eagle Flights', href: '/programs/eagle-flights' },
        { name: 'Ground School', href: '/programs/ground-school' },
        { name: 'Outreach', href: '/programs/outreach' },
        { name: 'Scholarships', href: '/programs/scholarships' },
        { name: 'Summer Camp', href: '/programs/summer-camp' },
        { name: 'VMC/IMC Club', href: '/programs/vmc-imc-club' },
        { name: 'Youth Aviation Program', href: '/programs/youth-aviation' },
        { name: 'Young Eagles', href: '/programs/young-eagles' },
      ],
    },
    ...(showSessionNavItems ? [{ name: 'Members', href: '/members' }] : []),
    { name: 'Store', href: '/store' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <nav className="bg-eaa-blue text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center space-x-3">
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

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-1 justify-center items-center space-x-1">
            {navigation.map((item) => (
              <div key={item.name} className="relative group">
                <Link
                  href={item.href}
                  className="px-2 py-2 text-sm font-medium hover:text-eaa-yellow transition-colors whitespace-nowrap"
                >
                  {item.name}
                </Link>
                {item.submenu && (
                  <div className="absolute left-0 mt-2 w-56 bg-white text-eaa-blue rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.name}
                          href={subitem.href}
                          className="block px-4 py-2 text-sm hover:bg-eaa-blue hover:text-white transition-colors"
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

          {/* Right side actions */}
          <div className="hidden lg:flex shrink-0 items-center space-x-2">
            {isPending ? (
              <div className="px-4 py-2 text-sm font-medium opacity-0">Login</div>
            ) : session ? (
              <div className="flex items-center space-x-4 min-w-0">
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
                  className="px-4 py-2 text-sm font-medium hover:text-eaa-yellow transition-colors"
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

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-eaa-light-blue transition-colors"
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

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div id="mobile-menu" className="lg:hidden pb-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className="block px-3 py-2 text-base font-medium hover:bg-eaa-light-blue rounded-md"
                    onClick={() => {
                      if (!item.submenu) setIsMenuOpen(false)
                    }}
                  >
                    {item.name}
                  </Link>
                  {item.submenu && (
                    <div className="pl-6 mt-1 space-y-1">
                      {item.submenu.map((subitem) => (
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
                  )}
                </div>
              ))}
              {isPending ? null : session ? (
                <div>
                  <Link
                    href="/members"
                    className="block px-3 py-2 text-sm text-gray-200 hover:bg-eaa-light-blue rounded-md"
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

