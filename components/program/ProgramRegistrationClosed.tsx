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
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-bold text-eaa-blue mb-2">{title}</h2>
      <p className="text-gray-800 text-sm leading-relaxed mb-4">{body}</p>
      <Link
        href="/contact"
        className="inline-flex items-center text-sm font-semibold text-eaa-light-blue hover:text-eaa-blue hover:underline"
      >
        Contact the chapter
      </Link>
    </div>
  )
}
