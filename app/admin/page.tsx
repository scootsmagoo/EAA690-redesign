'use client'

import { useState } from 'react'
import AdminGuard from '@/components/AdminGuard'
import Link from 'next/link'

type AdminAction = {
  label: string
  href: string
  variant?: 'primary' | 'secondary'
}

type AdminItem = {
  title: string
  description: string
  note: string
  actions: AdminAction[]
}

type AdminTab = {
  id: 'people' | 'content' | 'operations'
  label: string
  summary: string
  items: AdminItem[]
}

const ADMIN_TABS: AdminTab[] = [
  {
    id: 'people',
    label: 'People',
    summary: 'Review account access and manage website roles.',
    items: [
      {
        title: 'Registration Review',
        description: 'Approve new website account requests for confirmed EAA 690 members.',
        note: 'Member access',
        actions: [{ label: 'Review Registrations', href: '/admin/registrations' }],
      },
      {
        title: 'User Management',
        description: 'View all users and assign Admin, Editor, or Member roles.',
        note: 'Roles',
        actions: [{ label: 'Manage Users', href: '/admin/users' }],
      },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    summary: 'Edit site content, publish updates, and maintain site-wide settings.',
    items: [
      {
        title: 'Chapter calendar',
        description:
          'Events are edited in Google Calendar (read-only on the public site). Connect the calendar ID and share setup steps.',
        note: 'Google Calendar',
        actions: [{ label: 'Calendar setup', href: '/admin/calendar' }],
      },
      {
        title: 'Content Studio',
        description: 'Edit news, presentations, board members, and CMS-managed pages.',
        note: 'Sanity CMS',
        actions: [
          { label: 'Open Studio', href: '/studio' },
          { label: 'Publish Queue', href: '/admin/content', variant: 'secondary' },
        ],
      },
      {
        title: 'Site Settings',
        description: 'Update chapter details, contact info, breakfast promos, social links, and store settings.',
        note: 'Global config',
        actions: [{ label: 'Open Site Settings', href: '/admin/settings' }],
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    summary: 'Review submissions, contact messages, and payment activity.',
    items: [
      {
        title: 'Program Submissions',
        description: 'View, filter, and export form submissions from chapter programs.',
        note: 'Forms',
        actions: [{ label: 'View Submissions', href: '/admin/submissions' }],
      },
      {
        title: 'Contact Messages',
        description: 'Review inquiries from the public contact form, separate from program registrations.',
        note: 'Inbox',
        actions: [{ label: 'View Messages', href: '/admin/contact' }],
      },
      {
        title: 'Payments',
        description: 'View recent Stripe charges, active memberships, and subscription statuses.',
        note: 'Stripe',
        actions: [{ label: 'View Payments', href: '/admin/payments' }],
      },
    ],
  },
]

function ActionLink({ action }: { action: AdminAction }) {
  const isSecondary = action.variant === 'secondary'
  return (
    <Link
      href={action.href}
      className={`inline-flex justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
        isSecondary
          ? 'border border-eaa-blue text-eaa-blue hover:bg-blue-50'
          : 'bg-eaa-blue text-white hover:bg-eaa-light-blue'
      }`}
    >
      {action.label}
    </Link>
  )
}

export default function AdminPage() {
  const [activeTabId, setActiveTabId] = useState<AdminTab['id']>('people')
  const activeTab = ADMIN_TABS.find((tab) => tab.id === activeTabId) ?? ADMIN_TABS[0]

  return (
    <AdminGuard>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-eaa-blue mb-2">Admin Dashboard</h1>
        <p className="text-gray-500 mb-8">EAA 690 site administration, grouped by the work you need to do.</p>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Admin sections">
              {ADMIN_TABS.map((tab) => {
                const selected = tab.id === activeTab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                      selected
                        ? 'bg-eaa-blue text-white shadow-sm'
                        : 'text-gray-600 hover:bg-white hover:text-eaa-blue'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="px-4 py-5 sm:px-6">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-eaa-blue">{activeTab.label}</h2>
              <p className="mt-1 text-sm text-gray-500">{activeTab.summary}</p>
            </div>

            <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
              {activeTab.items.map((item) => (
                <div
                  key={item.title}
                  className="grid grid-cols-1 gap-4 px-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5"
                >
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-eaa-blue">
                        {item.note}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {item.actions.map((action) => (
                      <ActionLink key={`${item.title}-${action.href}`} action={action} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  )
}

