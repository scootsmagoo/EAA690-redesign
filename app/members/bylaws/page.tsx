import AuthGuard from '@/components/AuthGuard'
import Link from 'next/link'

/**
 * Board of Directors meeting minutes, newest first — mirrors eaa690.org/bylaws (Nov 2026).
 * Most years are shared Google Drive folders; 2019 and 2020 were PDFs hosted on the old
 * Squarespace site, so copies live in /public/documents/minutes.
 */
const MEETING_MINUTES: { year: number; href: string }[] = [
  { year: 2026, href: 'https://drive.google.com/drive/folders/1poorO7k61_rscahldirGUrTCgxKXNeGA?usp=share_link' },
  { year: 2025, href: 'https://drive.google.com/drive/folders/1TS4GY79w5Ws0g6faQxI-KBdf64Z_wNxt?usp=share_link' },
  { year: 2024, href: 'https://drive.google.com/drive/folders/1Y_RiJkJxKkOprHSqGnreFy9PqqRK4whX?usp=share_link' },
  { year: 2023, href: 'https://drive.google.com/drive/folders/1UC6YaFcX31vI7uU5hGL9DMU6LdJmm2cz?usp=share_link' },
  { year: 2022, href: 'https://drive.google.com/drive/folders/1tdsVe9LBUGvRg8e6QyVoyLV4H-7lfqgs?usp=sharing' },
  { year: 2021, href: 'https://drive.google.com/drive/folders/1ICgh0WY21K0fQlEQg7inrgNECkpitqyi?usp=sharing' },
  { year: 2020, href: '/documents/minutes/EAA-690-2020-Minutes-Combined.pdf' },
  { year: 2019, href: '/documents/minutes/EAA-690-2019-Minutes-Combined.pdf' },
  { year: 2018, href: 'https://drive.google.com/drive/folders/1K3SN-GAsOpeAjQNDd0dOc50yoCi0r35p?usp=sharing' },
  { year: 2017, href: 'https://drive.google.com/drive/folders/10KlLsEm1d9Nz1CGy0sezvD5fV7OmNJ6E?usp=sharing' },
  { year: 2016, href: 'https://drive.google.com/drive/folders/173QxNevpHFwSTNzE3vK0T4pQf3XxDLiC?usp=sharing' },
  { year: 2015, href: 'https://drive.google.com/drive/folders/1ncB05HZuim4UubVB2IAvfFxZubrrEfpH?usp=sharing' },
  { year: 2014, href: 'https://drive.google.com/drive/folders/1UP6xgE0bksdgzRQ0Suew-LQonl-xWRQc?usp=sharing' },
  { year: 2013, href: 'https://drive.google.com/drive/folders/1JuSK5FoHBE4x819Vpyboa8ACJHn0R2i0?usp=sharing' },
  { year: 2012, href: 'https://drive.google.com/drive/folders/1oQGD9YuuJ8S-xK05v6Tg7SqwJc7TlrwR?usp=sharing' },
]

export default function MemberBylawsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/members" className="text-sm text-eaa-light-blue hover:underline mb-4 block">
          ← Back to Members Area
        </Link>
        <h1 className="text-4xl font-bold text-eaa-blue mb-8">Bylaws and Meeting Minutes</h1>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-eaa-blue mb-4">Chapter Bylaws</h2>
            <p className="text-gray-700 mb-6">
              The bylaws of EAA 690 govern the operations and structure of our chapter. These documents outline the
              rules, procedures, and organizational structure that guide our activities.
            </p>

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-bold text-eaa-blue mb-4">Download the Bylaws</h3>
              <p className="text-gray-700 mb-4">
                The chapter bylaws may be downloaded using the link below. Bylaws are reviewed periodically and may be
                amended by the membership according to the procedures outlined within.
              </p>
              <a
                href="https://drive.google.com/file/d/1efLhPJE2XmoRK376OFLHMqHBwJ1AZZzx/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-eaa-blue text-white px-6 py-2 rounded-md font-semibold hover:bg-eaa-light-blue transition-colors"
              >
                Download Bylaws (PDF)
              </a>
            </div>
          </section>

          <section className="mb-8" aria-labelledby="minutes-heading">
            <h2 id="minutes-heading" className="text-2xl font-bold text-eaa-blue mb-4">
              Board of Directors Meeting Minutes
            </h2>
            <p className="text-gray-700 mb-4">
              The chapter Board of Directors meeting minutes are available for the following years:
            </p>
            <ul className="grid grid-cols-3 sm:grid-cols-5 gap-3 list-none pl-0">
              {MEETING_MINUTES.map(({ year, href }) => (
                <li key={year} className="m-0">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center rounded-md border border-gray-200 bg-white px-3 py-2 font-semibold text-eaa-light-blue hover:bg-gray-50 hover:underline"
                  >
                    {year}
                    <span className="sr-only">
                      {' '}
                      meeting minutes{href.endsWith('.pdf') ? ' (PDF)' : ' (Google Drive folder)'} (opens in a new tab)
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-eaa-yellow text-eaa-blue p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Member Access</h3>
            <p className="mb-2">
              All chapter members have the right to review the chapter bylaws. These documents help ensure transparency
              and accountability in chapter operations.
            </p>
            <p>
              If you have questions about the bylaws or would like to propose changes, please don&apos;t hesitate to
              reach out to chapter leadership.
            </p>
          </section>
        </div>
      </div>
    </AuthGuard>
  )
}
