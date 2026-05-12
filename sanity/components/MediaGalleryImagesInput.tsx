'use client'

import { useRef, useState } from 'react'
import {
  PatchEvent,
  insert,
  set,
  setIfMissing,
  useClient,
  type ArrayOfObjectsInputProps,
} from 'sanity'

type ImageArrayItem = {
  _key?: string
  _type?: string
  asset?: {
    _type?: string
    _ref?: string
  }
}

function makeKey(): string {
  return Math.random().toString(36).slice(2, 13)
}

function isCompleteImage(item: unknown): item is ImageArrayItem {
  if (!item || typeof item !== 'object') return false
  const asset = (item as ImageArrayItem).asset
  return typeof asset?._ref === 'string' && asset._ref.length > 0
}

export function MediaGalleryImagesInput(props: ArrayOfObjectsInputProps) {
  const { onChange, renderDefault, value } = props
  const client = useClient({ apiVersion: '2024-01-01' })
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const items = Array.isArray(value) ? value : []
  const incompleteCount = items.filter((item) => !isCompleteImage(item)).length

  const handleFiles = async (files: FileList | null) => {
    const imageFiles = Array.from(files ?? []).filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    setUploading(true)
    setStatus(`Uploading 0 of ${imageFiles.length} images...`)

    try {
      const uploadedItems = []
      for (let index = 0; index < imageFiles.length; index += 1) {
        const file = imageFiles[index]
        setStatus(`Uploading ${index + 1} of ${imageFiles.length}: ${file.name}`)
        const asset = await client.assets.upload('image', file, { filename: file.name })
        uploadedItems.push({
          _key: makeKey(),
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: asset._id,
          },
        })
      }

      onChange(PatchEvent.from(insert(uploadedItems, 'after', [-1])).prepend(setIfMissing([])))
      setStatus(`Added ${uploadedItems.length} image${uploadedItems.length === 1 ? '' : 's'}.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Image upload failed.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeIncompleteItems = () => {
    onChange(PatchEvent.from(set(items.filter(isCompleteImage))))
    setStatus(`Removed ${incompleteCount} incomplete image slot${incompleteCount === 1 ? '' : 's'}.`)
  }

  return (
    <div>
      <div
        style={{
          border: '1px solid var(--card-border-color)',
          borderRadius: 6,
          marginBottom: 16,
          padding: 16,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(event) => {
            void handleFiles(event.currentTarget.files)
          }}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          style={{
            border: 0,
            borderRadius: 4,
            cursor: uploading ? 'not-allowed' : 'pointer',
            font: 'inherit',
            fontWeight: 600,
            padding: '0.6rem 0.9rem',
          }}
        >
          {uploading ? 'Uploading images...' : 'Bulk upload images'}
        </button>
        {incompleteCount > 0 ? (
          <button
            type="button"
            disabled={uploading}
            onClick={removeIncompleteItems}
            style={{
              background: 'transparent',
              border: '1px solid currentColor',
              borderRadius: 4,
              cursor: uploading ? 'not-allowed' : 'pointer',
              font: 'inherit',
              marginLeft: 8,
              padding: '0.55rem 0.85rem',
            }}
          >
            Remove incomplete image slots
          </button>
        ) : null}
        {status ? <p style={{ marginBottom: 0 }}>{status}</p> : null}
        {incompleteCount > 0 ? (
          <p style={{ marginBottom: 0 }}>
            {incompleteCount} incomplete image slot{incompleteCount === 1 ? '' : 's'} detected from a
            failed upload. Remove them before opening individual image rows.
          </p>
        ) : null}
      </div>
      {incompleteCount > 0 ? null : renderDefault(props)}
    </div>
  )
}
