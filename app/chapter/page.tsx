import Link from 'next/link'

export default function ChapterPage() {
  const chapterLinks = [
    { name: 'Agenda', href: '/chapter/agenda', description: 'View our upcoming meeting agendas' },
    { name: 'Board', href: '/chapter/board', description: 'Meet the EAA 690 board members' },
    { name: 'Bylaws', href: '/chapter/bylaws', description: 'Chapter bylaws and governance' },
    { name: 'General Info', href: '/chapter/general-info', description: 'General information about EAA 690' },
    { name: 'Hangar Rental', href: '/chapter/hangar-rental', description: 'Information about hangar rental' },
    { name: 'Visit Us', href: '/chapter/visit-us', description: 'Directions and information for visiting' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-8">Chapter Information</h1>
      
      <div className="prose max-w-none mb-8">
        <p className="text-lg text-gray-700">
          EAA 690 is a vibrant chapter of the Experimental Aircraft Association, serving aviation enthusiasts in the
          Lawrenceville, Georgia area. We are proud to be a Gold Chapter, recognized for our commitment to promoting
          aviation and supporting our community.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chapterLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-eaa-yellow"
          >
            <h2 className="text-xl font-bold text-eaa-blue mb-2">{link.name}</h2>
            <p className="text-gray-600">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

