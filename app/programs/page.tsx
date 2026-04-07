import Link from 'next/link'

export default function ProgramsPage() {
  const programs = [
    {
      name: 'Eagle Flights',
      href: '/programs/eagle-flights',
      description: 'Experience the joy of flight with our Eagle Flights program',
    },
    {
      name: 'Ground School',
      href: '/programs/ground-school',
      description: 'Comprehensive ground school training for aspiring pilots',
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
      href: '/programs/youth-aviation',
      description: 'Comprehensive youth aviation education program',
    },
    {
      name: 'Young Eagles',
      href: '/programs/young-eagles',
      description: 'EAA Young Eagles program - giving youth their first flight experience',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-eaa-blue mb-8">Programs</h1>
      
      <div className="prose max-w-none mb-8">
        <p className="text-lg text-gray-700">
          EAA 690 offers a wide range of programs designed to promote aviation, support youth education, and engage
          our community. From flight experiences to educational opportunities, we have something for everyone interested
          in aviation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <Link
            key={program.name}
            href={program.href}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-eaa-yellow"
          >
            <h2 className="text-xl font-bold text-eaa-blue mb-2">{program.name}</h2>
            <p className="text-gray-600">{program.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

