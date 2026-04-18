'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AdminGuard from '@/components/AdminGuard'
import { normalizeProgramForms, type ProgramFormSlot } from '@/lib/program-availability'

/**
 * Form-notifications state. Recipients are edited as multi-line text in the UI
 * (one address/phone per line) and converted to arrays only on save.
 * Per-form override keys mirror the camelCase Sanity schema.
 */
type FormNotificationsState = {
  enabled: boolean
  defaultEmailRecipients: string
  perFormEmailRecipients: {
    youthAviation: string
    scholarship: string
    summerCamp: string
    vmcImc: string
    outreach: string
  }
  smsRecipients: string
  adminUserCreatedAlerts: boolean
}

type FormState = {
  siteName: string
  tagline: string
  contactEmail: string
  phone: string
  address: string
  breakfastPrice: string
  breakfastTime: string
  newsletterUrl: string
  newsletterArchiveFolderUrl: string
  socialLinks: {
    facebook: string
    twitter: string
    instagram: string
    youtube: string
  }
  siteAnnouncement: {
    enabled: boolean
    message: string
    linkUrl: string
    linkText: string
    style: 'info' | 'warning' | 'neutral'
    startDate: string
    endDate: string
  }
  storeSectionVisible: boolean
  programForms: {
    youthAviation: ProgramFormSlot
    scholarship: ProgramFormSlot
    summerCamp: ProgramFormSlot
    vmcImc: ProgramFormSlot
    outreach: ProgramFormSlot
  }
  formNotifications: FormNotificationsState
}

function joinLines(list: unknown): string {
  return Array.isArray(list)
    ? list.filter((s): s is string => typeof s === 'string').join('\n')
    : ''
}

function splitLines(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

const emptyProgramForms = normalizeProgramForms(undefined)

const emptyForm: FormState = {
  siteName: '',
  tagline: '',
  contactEmail: '',
  phone: '',
  address: '',
  breakfastPrice: '',
  breakfastTime: '',
  newsletterUrl: '',
  newsletterArchiveFolderUrl: '',
  socialLinks: {
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: '',
  },
  siteAnnouncement: {
    enabled: false,
    message: '',
    linkUrl: '',
    linkText: '',
    style: 'info',
    startDate: '',
    endDate: '',
  },
  storeSectionVisible: true,
  programForms: emptyProgramForms,
  formNotifications: {
    enabled: true,
    defaultEmailRecipients: '',
    perFormEmailRecipients: {
      youthAviation: '',
      scholarship: '',
      summerCamp: '',
      vmcImc: '',
      outreach: '',
    },
    smsRecipients: '',
    adminUserCreatedAlerts: true,
  },
}

function SiteSettingsForm() {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/site-settings')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load settings')
        return
      }
      if (data.settings) {
        setForm({
          siteName: data.settings.siteName,
          tagline: data.settings.tagline,
          contactEmail: data.settings.contactEmail,
          phone: data.settings.phone,
          address: data.settings.address,
          breakfastPrice: data.settings.breakfastPrice,
          breakfastTime: data.settings.breakfastTime,
          newsletterUrl: data.settings.newsletterUrl,
          newsletterArchiveFolderUrl: data.settings.newsletterArchiveFolderUrl ?? '',
          socialLinks: { ...emptyForm.socialLinks, ...data.settings.socialLinks },
          siteAnnouncement: {
            ...emptyForm.siteAnnouncement,
            ...data.settings.siteAnnouncement,
            style:
              data.settings.siteAnnouncement?.style === 'warning' ||
              data.settings.siteAnnouncement?.style === 'neutral'
                ? data.settings.siteAnnouncement.style
                : 'info',
          },
          storeSectionVisible: data.settings.storeSectionVisible !== false,
          programForms: normalizeProgramForms(data.settings.programForms),
          formNotifications: {
            enabled: data.settings.formNotifications?.enabled !== false,
            defaultEmailRecipients: joinLines(
              data.settings.formNotifications?.defaultEmailRecipients
            ),
            perFormEmailRecipients: {
              youthAviation: joinLines(
                data.settings.formNotifications?.perFormEmailRecipients?.youth_aviation
              ),
              scholarship: joinLines(
                data.settings.formNotifications?.perFormEmailRecipients?.scholarship
              ),
              summerCamp: joinLines(
                data.settings.formNotifications?.perFormEmailRecipients?.summer_camp
              ),
              vmcImc: joinLines(
                data.settings.formNotifications?.perFormEmailRecipients?.vmc_imc
              ),
              outreach: joinLines(
                data.settings.formNotifications?.perFormEmailRecipients?.outreach
              ),
            },
            smsRecipients: joinLines(data.settings.formNotifications?.smsRecipients),
            adminUserCreatedAlerts:
              data.settings.formNotifications?.adminUserCreatedAlerts !== false,
          },
        })
        setLogoPreviewUrl(data.settings.logoPreviewUrl ?? null)
      } else {
        setForm(emptyForm)
        setLogoPreviewUrl(null)
        setError(
          'No Site Settings document found. Create it in Sanity Studio (Site Settings) once, then reload this page.'
        )
      }
    } catch {
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setToast('')
    try {
      const payload = {
        ...form,
        formNotifications: {
          enabled: form.formNotifications.enabled,
          defaultEmailRecipients: splitLines(form.formNotifications.defaultEmailRecipients),
          perFormEmailRecipients: {
            youthAviation: splitLines(form.formNotifications.perFormEmailRecipients.youthAviation),
            scholarship: splitLines(form.formNotifications.perFormEmailRecipients.scholarship),
            summerCamp: splitLines(form.formNotifications.perFormEmailRecipients.summerCamp),
            vmcImc: splitLines(form.formNotifications.perFormEmailRecipients.vmcImc),
            outreach: splitLines(form.formNotifications.perFormEmailRecipients.outreach),
          },
          smsRecipients: splitLines(form.formNotifications.smsRecipients),
          adminUserCreatedAlerts: form.formNotifications.adminUserCreatedAlerts,
        },
      }
      const res = await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Save failed')
        return
      }
      setToast('Settings saved.')
      setLastSavedAt(new Date())
      await load()
    } catch {
      setError('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link
          href="/admin"
          className="text-sm text-eaa-light-blue hover:text-eaa-blue mb-2 inline-block"
        >
          ← Admin dashboard
        </Link>
        <h1 className="text-4xl font-bold text-eaa-blue">Site settings</h1>
        <p className="text-gray-500 mt-1">
          These values power the public site (footer, contact blocks, breakfast promos, newsletter link).
          They are stored in your Sanity <strong className="font-medium text-gray-700">Site Settings</strong>{' '}
          document — the same data you can edit in Studio.
        </p>
      </div>

      <div className="mb-4 space-y-2" aria-live="polite" aria-atomic="true">
        {toast ? (
          <p
            role="status"
            className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2"
          >
            {toast}
            {lastSavedAt ? (
              <span className="text-green-700/80 ml-1">
                ({lastSavedAt.toLocaleTimeString()})
              </span>
            ) : null}
          </p>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2"
          >
            {error}
          </p>
        ) : null}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-8">
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-eaa-blue mb-4">Brand</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">
                  Site name
                </label>
                <input
                  id="siteName"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={form.siteName}
                  onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="tagline" className="block text-sm font-medium text-gray-700 mb-1">
                  Tagline
                </label>
                <input
                  id="tagline"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={form.tagline}
                  onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Logo</p>
                {logoPreviewUrl ? (
                  <div className="flex items-start gap-4">
                    <div className="relative w-32 h-20 border border-gray-200 rounded bg-gray-50 overflow-hidden shrink-0">
                      <Image
                        src={logoPreviewUrl}
                        alt="Current logo"
                        fill
                        className="object-contain p-1"
                        unoptimized
                      />
                    </div>
                    <p className="text-sm text-gray-500 pt-1">
                      To replace or remove the logo, open{' '}
                      <Link href="/studio" className="text-eaa-light-blue hover:underline">
                        Sanity Studio
                      </Link>{' '}
                      and edit <strong className="font-medium text-gray-600">Site Settings</strong> (image field).
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No logo uploaded yet. Add one in{' '}
                    <Link href="/studio" className="text-eaa-light-blue hover:underline">
                      Sanity Studio
                    </Link>{' '}
                    under Site Settings.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-eaa-blue mb-4">Contact</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact email
                </label>
                <input
                  id="contactEmail"
                  type="email"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={form.contactEmail}
                  onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  id="phone"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  id="address"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-eaa-blue mb-4">Programs & links</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="breakfastPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Pancake breakfast price
                </label>
                <input
                  id="breakfastPrice"
                  placeholder='e.g. "$10/each"'
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={form.breakfastPrice}
                  onChange={(e) => setForm((f) => ({ ...f, breakfastPrice: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="breakfastTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Breakfast serving time
                </label>
                <input
                  id="breakfastTime"
                  placeholder='e.g. "8:00 to 10:00 AM"'
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={form.breakfastTime}
                  onChange={(e) => setForm((f) => ({ ...f, breakfastTime: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="newsletterUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Latest newsletter URL (fallback)
                </label>
                <input
                  id="newsletterUrl"
                  type="url"
                  placeholder="https://…"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={form.newsletterUrl}
                  onChange={(e) => setForm((f) => ({ ...f, newsletterUrl: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used when no NAVCOM issue is published in the CMS, or as a quick PDF link.
                </p>
              </div>
              <div>
                <label
                  htmlFor="newsletterArchiveFolderUrl"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full PDF archive folder URL
                </label>
                <input
                  id="newsletterArchiveFolderUrl"
                  type="url"
                  placeholder="https://drive.google.com/…"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={form.newsletterArchiveFolderUrl}
                  onChange={(e) => setForm((f) => ({ ...f, newsletterArchiveFolderUrl: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional — e.g. Google Drive folder; shown on the public NAVCOM archive page.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-eaa-blue mb-1">Site-wide announcement</h2>
            <p className="text-sm text-gray-500 mb-4">
              Optional banner below the main navigation on every public page. Use for weather cancellations,
              meeting location changes, or deadlines.
            </p>
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-eaa-blue focus:ring-eaa-blue"
                  checked={form.siteAnnouncement.enabled}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      siteAnnouncement: { ...f.siteAnnouncement, enabled: e.target.checked },
                    }))
                  }
                />
                <span className="text-sm font-medium text-gray-700">Show announcement banner</span>
              </label>
              <div>
                <label htmlFor="annMessage" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="annMessage"
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={form.siteAnnouncement.message}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      siteAnnouncement: { ...f.siteAnnouncement, message: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="annLinkUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Optional link URL
                  </label>
                  <input
                    id="annLinkUrl"
                    type="url"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.siteAnnouncement.linkUrl}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        siteAnnouncement: { ...f.siteAnnouncement, linkUrl: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label htmlFor="annLinkText" className="block text-sm font-medium text-gray-700 mb-1">
                    Link label
                  </label>
                  <input
                    id="annLinkText"
                    placeholder='e.g. "Details"'
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.siteAnnouncement.linkText}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        siteAnnouncement: { ...f.siteAnnouncement, linkText: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Style</span>
                <div className="flex flex-wrap gap-4">
                  {(
                    [
                      { value: 'info' as const, label: 'Info (blue)' },
                      { value: 'warning' as const, label: 'Warning (amber)' },
                      { value: 'neutral' as const, label: 'Neutral (gray)' },
                    ]
                  ).map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="annStyle"
                        className="border-gray-300 text-eaa-blue focus:ring-eaa-blue"
                        checked={form.siteAnnouncement.style === value}
                        onChange={() =>
                          setForm((f) => ({
                            ...f,
                            siteAnnouncement: { ...f.siteAnnouncement, style: value },
                          }))
                        }
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="annStart" className="block text-sm font-medium text-gray-700 mb-1">
                    Show on or after (optional)
                  </label>
                  <input
                    id="annStart"
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.siteAnnouncement.startDate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        siteAnnouncement: { ...f.siteAnnouncement, startDate: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label htmlFor="annEnd" className="block text-sm font-medium text-gray-700 mb-1">
                    Last day to show (optional)
                  </label>
                  <input
                    id="annEnd"
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.siteAnnouncement.endDate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        siteAnnouncement: { ...f.siteAnnouncement, endDate: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-eaa-blue mb-1">Program forms & PDFs</h2>
            <p className="text-sm text-gray-500 mb-4">
              Control online forms and chapter PDF links on <code className="text-xs bg-gray-100 px-1 rounded">/programs</code>{' '}
              pages (same fields exist in Sanity Studio under Site Settings → Program registration & documents).
            </p>
            <div className="space-y-8">
              {(
                [
                  {
                    key: 'youthAviation' as const,
                    title: 'Youth Aviation Program',
                    showDocs: true,
                  },
                  {
                    key: 'scholarship' as const,
                    title: 'Scholarships',
                    showDocs: true,
                  },
                  {
                    key: 'summerCamp' as const,
                    title: 'Summer Camp (waitlist)',
                    showDocs: false,
                  },
                  {
                    key: 'vmcImc' as const,
                    title: 'VMC/IMC Club',
                    showDocs: false,
                  },
                  {
                    key: 'outreach' as const,
                    title: 'Outreach (event / appearance requests)',
                    showDocs: false,
                  },
                ] as const
              ).map(({ key, title, showDocs }) => (
                <div key={key} className="border border-gray-100 rounded-md p-4 bg-gray-50/80">
                  <h3 className="text-sm font-bold text-eaa-blue mb-3">{title}</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-eaa-blue focus:ring-eaa-blue"
                        checked={form.programForms[key].registrationOpen}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            programForms: {
                              ...f.programForms,
                              [key]: { ...f.programForms[key], registrationOpen: e.target.checked },
                            },
                          }))
                        }
                      />
                      <span className="text-sm font-medium text-gray-700">Accept online signups / applications</span>
                    </label>
                    {showDocs ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-eaa-blue focus:ring-eaa-blue"
                          checked={form.programForms[key].documentsVisible}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              programForms: {
                                ...f.programForms,
                                [key]: { ...f.programForms[key], documentsVisible: e.target.checked },
                              },
                            }))
                          }
                        />
                        <span className="text-sm font-medium text-gray-700">Show chapter PDF links on the page</span>
                      </label>
                    ) : null}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message when signups are closed <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="Shown instead of the form when signups are off."
                        value={form.programForms[key].closedMessage}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            programForms: {
                              ...f.programForms,
                              [key]: { ...f.programForms[key], closedMessage: e.target.value },
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-eaa-blue mb-1">Form notifications (alerts)</h2>
            <p className="text-sm text-gray-500 mb-4">
              Who gets an email when a website form submission reaches the database. Per-form lists, when set,
              replace the defaults for that form. SMS scaffolding is in place but does nothing until Twilio
              env vars (<code className="text-xs bg-gray-100 px-1 rounded">TWILIO_ACCOUNT_SID</code>,{' '}
              <code className="text-xs bg-gray-100 px-1 rounded">TWILIO_AUTH_TOKEN</code>,{' '}
              <code className="text-xs bg-gray-100 px-1 rounded">TWILIO_FROM_NUMBER</code>) are configured.
            </p>

            <label className="flex items-center gap-2 cursor-pointer mb-4">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-eaa-blue focus:ring-eaa-blue"
                checked={form.formNotifications.enabled}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    formNotifications: { ...f.formNotifications, enabled: e.target.checked },
                  }))
                }
              />
              <span className="text-sm font-medium text-gray-700">
                Send notifications when forms are submitted
              </span>
            </label>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="defaultEmailRecipients"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Default email recipients
                </label>
                <textarea
                  id="defaultEmailRecipients"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                  placeholder="one address per line — e.g. board@eaa690.org"
                  value={form.formNotifications.defaultEmailRecipients}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      formNotifications: {
                        ...f.formNotifications,
                        defaultEmailRecipients: e.target.value,
                      },
                    }))
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used for any program form unless a per-form list below is set. Leave empty to fall back to
                  the <code className="text-xs bg-gray-100 px-1 rounded">CONTACT_EMAIL_TO</code> environment
                  variable.
                </p>
              </div>

              <details className="border border-gray-100 rounded-md bg-gray-50/80">
                <summary className="cursor-pointer text-sm font-bold text-eaa-blue px-4 py-3 select-none">
                  Per-form recipient overrides (optional)
                </summary>
                <div className="px-4 pb-4 pt-1 space-y-4">
                  {(
                    [
                      { key: 'youthAviation' as const, title: 'Youth Aviation Program' },
                      { key: 'scholarship' as const, title: 'Scholarships' },
                      { key: 'summerCamp' as const, title: 'Summer Camp waitlist' },
                      { key: 'vmcImc' as const, title: 'VMC/IMC Club' },
                      { key: 'outreach' as const, title: 'Outreach / event requests (Heidi)' },
                    ] as const
                  ).map(({ key, title }) => (
                    <div key={key}>
                      <label
                        htmlFor={`perForm-${key}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {title}
                      </label>
                      <textarea
                        id={`perForm-${key}`}
                        rows={2}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                        placeholder="one address per line — leave empty to use defaults"
                        value={form.formNotifications.perFormEmailRecipients[key]}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            formNotifications: {
                              ...f.formNotifications,
                              perFormEmailRecipients: {
                                ...f.formNotifications.perFormEmailRecipients,
                                [key]: e.target.value,
                              },
                            },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </details>

              <div>
                <label htmlFor="smsRecipients" className="block text-sm font-medium text-gray-700 mb-1">
                  SMS phone numbers (E.164 format)
                </label>
                <textarea
                  id="smsRecipients"
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                  placeholder="one number per line — e.g. +14045551234"
                  value={form.formNotifications.smsRecipients}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      formNotifications: { ...f.formNotifications, smsRecipients: e.target.value },
                    }))
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use E.164 format with country code (e.g. <code className="text-xs bg-gray-100 px-1 rounded">+14045551234</code>).
                  Numbers are saved now but no SMS will be sent until Twilio env vars are configured on the server.
                </p>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-gray-300 text-eaa-blue focus:ring-eaa-blue"
                  checked={form.formNotifications.adminUserCreatedAlerts}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      formNotifications: {
                        ...f.formNotifications,
                        adminUserCreatedAlerts: e.target.checked,
                      },
                    }))
                  }
                />
                <span className="text-sm font-medium text-gray-700">
                  Alert recipients when a user is promoted to admin
                  <span className="block text-xs font-normal text-gray-500 mt-0.5">
                    Security event: emails the default recipients when an existing admin grants admin
                    access via /admin/users.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-eaa-blue mb-1">Store</h2>
            <p className="text-sm text-gray-500 mb-4">
              Turn off to hide the Store link and cart in the navigation and show a notice on store pages.
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-eaa-blue focus:ring-eaa-blue"
                checked={form.storeSectionVisible}
                onChange={(e) => setForm((f) => ({ ...f, storeSectionVisible: e.target.checked }))}
              />
              <span className="text-sm font-medium text-gray-700">Show chapter store</span>
            </label>
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-eaa-blue mb-4">Social media</h2>
            <p className="text-sm text-gray-500 mb-4">Full URLs to chapter pages (leave blank to hide).</p>
            <div className="space-y-4">
              {(
                ['facebook', 'twitter', 'instagram', 'youtube'] as const
              ).map((key) => (
                <div key={key}>
                  <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                    {key === 'twitter' ? 'X (Twitter)' : key}
                  </label>
                  <input
                    id={key}
                    type="url"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={form.socialLinks[key]}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        socialLinks: { ...f.socialLinks, [key]: e.target.value },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-eaa-blue text-white text-sm font-medium rounded-md hover:bg-eaa-light-blue transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <Link
              href="/studio"
              className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
            >
              Open Studio
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}

export default function AdminSiteSettingsPage() {
  return (
    <AdminGuard>
      <SiteSettingsForm />
    </AdminGuard>
  )
}
