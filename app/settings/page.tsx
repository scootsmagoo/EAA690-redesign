import type { Metadata } from 'next'
import SettingsForm from '@/components/settings/SettingsForm'

export const metadata: Metadata = {
  title: 'Settings — EAA 690',
  description:
    'Personal display and accessibility preferences for the EAA 690 site, including theme (light/dark), text size, reduced motion, and high contrast.',
  // Per-visitor preferences page; no value to indexers and may contain account-state hints.
  robots: { index: false, follow: false },
}

export default function SettingsPage() {
  return <SettingsForm />
}
