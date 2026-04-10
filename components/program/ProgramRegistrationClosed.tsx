import Link from 'next/link'
import { DEFAULT_PROGRAM_CLOSED_MESSAGE } from '@/lib/program-availability'

type Props = {
  title: string
  /** Custom message from Site Settings; falls back to default copy when empty. */
  message?: string
}

export default function ProgramRegistrationClosed({ title, message }: Props) {
  const body = message?.trim() ? message.trim() : DEFAULT_PROGRAM_CLOSED_MESSAGE

  return (
    <section
      className="bg-amber-50 border border-amber-200 rounded-lg p-6 shadow-sm"
      role="status"
      aria-live="polite"
      aria-labelledby="program-registration-unavailable-title"
    >
      {/*
        h3: parent program sections use h2; avoids duplicate h2 landmarks (WCAG heading order).
      */}
      <h3 id="program-registration-unavailable-title" className="text-xl font-bold text-eaa-blue mb-2">
        {title}
      </h3>
      <p className="text-gray-800 text-sm leading-relaxed mb-4">{body}</p>
      <Link
        href="/contact"
        className="inline-flex items-center text-sm font-semibold text-eaa-light-blue hover:text-eaa-blue hover:underline"
      >
        Contact the chapter
      </Link>
    </section>
  )
}
