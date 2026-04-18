import Image from 'next/image'
import { getBoardMembers, urlFor } from '@/lib/sanity'

interface NormalizedMember {
  key: string
  name: string
  title: string
  imageSrc: string | null
  bio: string
}

// Static fallback — used when Sanity has no boardMember documents yet
const STATIC_MEMBERS: NormalizedMember[] = [
  {
    key: 'sean-brigham',
    name: 'Sean Brigham',
    title: 'President',
    imageSrc: '/images/board/sean-brigham.webp',
    bio: 'Sean is an Army Aviator and experienced military leader with a strong background in aviation operations, safety, and team leadership. Currently flying as a UH-60 Instructor Pilot but would love to build his own plane.',
  },
  {
    key: 'billy-stewart',
    name: 'Billy Stewart',
    title: 'Vice President',
    imageSrc: '/images/board/billy-stewart.webp',
    bio: 'Billy is an active member of the chapter, including leading the Youth Aviation Program and teaching the sheet metal classes in Summer Camp. He built a Zenith 601XLB which he flies regularly.',
  },
  {
    key: 'john-murtaugh',
    name: 'John Murtaugh',
    title: 'Treasurer',
    imageSrc: '/images/board/john-murtaugh.webp',
    bio: 'An IT guy who likes to fly. Originally from upstate NY, he moved to Florida in 1998 where he learned to fly, then to Atlanta where he built a Vans RV-9A that he continues to enjoy today. Currently retired and active in the youth build program.',
  },
  {
    key: 'pam-sidhi',
    name: 'Pam Sidhi',
    title: 'Secretary',
    imageSrc: '/images/board/pam-sidhi.webp',
    bio: 'A proud mom, she blends strategy with heart to engage and strengthen the community and chapter.',
  },
  {
    key: 'peter-ditomaso',
    name: 'Peter DiTomaso',
    title: 'At Large Member',
    imageSrc: '/images/board/peter-ditomaso.webp',
    bio: 'A Canadian by birth, Peter has been an active chapter member for many years, an avid Oshkosh attendee, and is currently building an RV-7.',
  },
  {
    key: 'brian-falony',
    name: 'Brian Falony',
    title: 'At Large Member',
    imageSrc: '/images/board/brian-falony.webp',
    bio: 'Brian is a retired marketing executive with a life-long interest in aviation. He currently serves as Young Eagles Coordinator for the chapter.',
  },
  {
    key: 'john-patchin',
    name: 'John Patchin',
    title: 'At Large Member',
    imageSrc: '/images/board/john-patchin.webp',
    bio: "John is part of the kitchen crew and helps cook for the Saturday breakfasts and events throughout the year. He's currently building a Van's RV-4 and owns a Sonex which is hangared at Winder Airport.",
  },
  {
    key: 'jim-madeley',
    name: 'Jim Madeley',
    title: 'At Large Member',
    imageSrc: '/images/board/jim-madeley.webp',
    bio: 'Jim is a retired orthopedic surgeon, flies an RV-12, and participates regularly in chapter fly-outs to various southeastern venues.',
  },
]

export default async function BoardPage() {
  // Try Sanity first; fall back to static data if no documents exist yet
  let members: NormalizedMember[] = STATIC_MEMBERS
  try {
    const sanityMembers = await getBoardMembers()
    if (sanityMembers && sanityMembers.length > 0) {
      members = sanityMembers.map((m: any) => ({
        key: m._id,
        name: m.name,
        title: m.role,
        imageSrc: m.image ? urlFor(m.image).width(600).auto('format').url() : null,
        bio: m.bio ?? '',
      }))
    }
  } catch {
    // Sanity not configured or unreachable — static fallback already set
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-10 text-center">Chapter Leaders</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 mb-16 max-w-5xl mx-auto">
        {members.map((member, index) => (
          <article key={member.key} className="text-center">
            {member.imageSrc && (
              <div className="relative rounded-xl overflow-hidden shadow-md mb-4 mx-auto w-full max-w-xs aspect-[3/4] bg-gray-100">
                <Image
                  src={member.imageSrc}
                  alt={`Portrait of ${member.name}, ${member.title}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                  className="object-contain"
                  {...(index === 0 ? { priority: true } : {})}
                />
              </div>
            )}
            <h2 className="text-xl font-bold text-eaa-blue">{member.name}</h2>
            <p className="text-eaa-light-blue font-semibold mb-3">{member.title}</p>
            <p className="text-gray-700 leading-relaxed text-sm">{member.bio}</p>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <section aria-label="Board of Trustees" className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-bold text-eaa-blue mb-4">Board of Trustees</h2>
          <ul className="space-y-2 text-gray-700">
            <li>James Knight — Class of 2025&ndash;27</li>
            <li>Bill Miller — Class of 2024&ndash;26</li>
            <li>Chuck Roberts — Class of 2024&ndash;26</li>
            <li>Leonard Lowe — Class of 2023&ndash;25</li>
            <li>Ralph Kirkland — Class of 2023&ndash;25</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">Two trustees are elected annually for 3-year terms.</p>
        </section>

        <section aria-label="Members of the Year" className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-bold text-eaa-blue mb-4">Members of the Year</h2>
          <ul className="space-y-2 text-gray-700">
            <li><span className="font-semibold">2025</span> — Brian Falony</li>
            <li><span className="font-semibold">2024</span> — Billy Stewart</li>
            <li><span className="font-semibold">2023</span> — Randy Woolery</li>
            <li><span className="font-semibold">2022</span> — Louis Pucci</li>
            <li><span className="font-semibold">2021</span> — Terry Hurst</li>
            <li><span className="font-semibold">2020</span> — John Post</li>
          </ul>
        </section>

        <section aria-label="Food Service" className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-bold text-eaa-blue mb-4">Food Service</h2>
          <ul className="space-y-2 text-gray-700">
            <li><span className="font-semibold">Pancake Breakfast:</span> Mark Ferguson (Co-Chair)</li>
            <li><span className="font-semibold">Special Events:</span> John Patchin (Co-Chair)</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
