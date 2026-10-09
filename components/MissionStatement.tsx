/** "Our Mission" callout used on the home page hero and Chapter Info. One per page (fixed heading id). */
export default function MissionStatement({ mission, className = '' }: { mission: string; className?: string }) {
  return (
    <section
      aria-labelledby="mission-heading"
      className={`rounded-r-lg border-l-4 border-eaa-yellow bg-white py-4 pl-5 pr-4 shadow-sm ${className}`}
    >
      <h2 id="mission-heading" className="mb-1 text-sm font-bold uppercase tracking-wider text-eaa-light-blue">
        Our Mission
      </h2>
      <p className="text-xl font-semibold leading-snug text-eaa-blue">{mission}</p>
    </section>
  )
}
