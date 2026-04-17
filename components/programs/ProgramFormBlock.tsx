import type { FormType } from '@/lib/forms-db'
import { getProgramSlotForFormType, type ProgramFormTypeKey } from '@/lib/program-availability'
import { getProgramFormsSettings } from '@/lib/program-forms-sanity'
import ProgramRegistrationClosed from '@/components/program/ProgramRegistrationClosed'
import SummerCampForm from '@/components/forms/SummerCampForm'
import ScholarshipForm from '@/components/forms/ScholarshipForm'
import YouthAviationForm from '@/components/forms/YouthAviationForm'
import VmcImcForm from '@/components/forms/VmcImcForm'
import ProgramPortableText from '@/components/programs/ProgramPortableText'
import type { PortableTextBlock } from '@portabletext/types'
import Link from 'next/link'

type Props = {
  sectionHeading?: string | null
  intro?: PortableTextBlock[] | null
  formKey: string | null | undefined
}

export default async function ProgramFormBlock({ sectionHeading, intro, formKey }: Props) {
  const valid: FormType[] = ['summer_camp', 'scholarship', 'youth_aviation', 'vmc_imc']
  const key = typeof formKey === 'string' && valid.includes(formKey as FormType) ? (formKey as FormType) : null
  if (!key) {
    return (
      <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-4">
        This form is not configured correctly. Please contact the chapter.
      </p>
    )
  }

  const slots = await getProgramFormsSettings()
  const slot = getProgramSlotForFormType(key as ProgramFormTypeKey, slots)

  const formEl =
    key === 'summer_camp' ? (
      <SummerCampForm />
    ) : key === 'scholarship' ? (
      <ScholarshipForm />
    ) : key === 'youth_aviation' ? (
      <YouthAviationForm />
    ) : (
      <VmcImcForm />
    )

  return (
    <div className="bg-white rounded-lg shadow-md p-8 mb-8">
      {sectionHeading ? (
        <h2 className="text-2xl font-bold text-eaa-blue mb-2">{sectionHeading}</h2>
      ) : null}
      {intro && intro.length > 0 ? (
        <div className="prose prose-sm max-w-none text-gray-700 mb-6">
          <ProgramPortableText value={intro} />
        </div>
      ) : null}
      <p className="text-xs text-gray-600 mb-6">
        How we use your information is described on our{' '}
        <Link href="/privacy" className="text-eaa-light-blue font-semibold underline hover:no-underline">
          privacy &amp; data use
        </Link>{' '}
        page.
      </p>
      {slot.registrationOpen ? (
        formEl
      ) : (
        <ProgramRegistrationClosed
          title="Online submissions unavailable"
          message={slot.closedMessage || undefined}
        />
      )}
    </div>
  )
}
