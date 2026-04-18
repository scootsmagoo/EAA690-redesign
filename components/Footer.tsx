import Link from 'next/link'
import Image from 'next/image'
import FooterSignup from '@/components/newsletter/FooterSignup'

export default function Footer() {
  return (
    <footer className="bg-eaa-blue dark:bg-eaa-bg-dark text-white mt-auto border-t border-transparent dark:border-eaa-border-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FooterSignup />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Image
              src="/logo.png"
              alt="EAA 690 Logo"
              width={80}
              height={80}
              className="h-20 w-auto mb-4"
            />
            <h3 className="text-lg font-bold mb-4">EAA 690</h3>
            <p className="text-sm text-gray-300">
              A Chapter of the Experimental Aircraft Association, located at Briscoe Field (KLZU) in Lawrenceville, Georgia.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/chapter" className="hover:text-eaa-yellow transition-colors">
                  Chapter Info
                </Link>
              </li>
              <li>
                <Link href="/programs" className="hover:text-eaa-yellow transition-colors">
                  Programs
                </Link>
              </li>
              <li>
                <Link href="/calendar" className="hover:text-eaa-yellow transition-colors">
                  Calendar
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-eaa-yellow transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-eaa-yellow transition-colors">
                  Privacy &amp; data use
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-eaa-yellow transition-colors">
                  Settings &amp; accessibility
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <p className="text-sm text-gray-300">
              690 Airport Road<br />
              Hangar 1, Briscoe Field<br />
              Lawrenceville, Ga. 30046<br />
              <a href="tel:4048572492" className="hover:text-eaa-yellow transition-colors">
                (404) 857-2492
              </a>
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Follow Us</h3>
            <div className="flex items-center space-x-4">
              <a href="https://www.twitter.com/eaa690" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" className="text-gray-300 hover:text-eaa-yellow transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
              </a>
              <a href="https://www.facebook.com/groups/eaa690/events" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-300 hover:text-eaa-yellow transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
              <a href="https://www.youtube.com/channel/UC9ucwsZDcp6svWNiisQEyKg/featured" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-gray-300 hover:text-eaa-yellow transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/eaa690/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-300 hover:text-eaa-yellow transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-300">
          <p>© {new Date().getFullYear()} EAA 690. All rights reserved.</p>
          <p className="mt-2">Founded in 1980. IRS-approved 501(c)(3) non-profit entity.</p>
        </div>
      </div>
    </footer>
  )
}

