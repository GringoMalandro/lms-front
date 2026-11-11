'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function field(data: FormData, name: string) {
  return String(data.get(name) ?? '').trim()
}

export function numberField(data: FormData, name: string) {
  const value = field(data, name)
  return value === '' ? null : Number(value)
}

export function AdminForm({ children, save, label = 'Guardar', reset = false }: {
  children: ReactNode
  save: (data: FormData) => Promise<void>
  label?: string
  reset?: boolean
}) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setPending(true)
    setMessage('')
    try {
      await save(data)
      if (reset) form.reset()
      setFailed(false)
      setMessage('Guardado.')
    } catch (error) {
      setFailed(true)
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} onChange={() => setMessage('')}>
      <fieldset disabled={pending} className="grid min-w-0 gap-3 sm:grid-cols-2">
        {children}
        <div className="space-y-1 sm:col-span-2">
          <Button type="submit">{pending ? 'Guardando…' : label}</Button>
          {message && <p role={failed ? 'alert' : 'status'} className={failed ? 'text-destructive' : undefined}>{message}</p>}
        </div>
      </fieldset>
    </form>
  )
}

export function TextField({ name, label, value, required, type = 'text', max }: {
  name: string
  label: string
  value?: string | number | null
  required?: boolean
  type?: 'text' | 'number' | 'url'
  max?: number
}) {
  return <label className="grid gap-1 text-sm">{label}
    <Input name={name} defaultValue={value ?? ''} required={required} type={type}
      min={type === 'number' ? 0 : undefined} max={type === 'number' ? max : undefined}
      step={type === 'number' ? 1 : undefined} maxLength={type === 'text' ? max : undefined} />
  </label>
}

export function LongField({ name, label, value }: { name: string; label: string; value?: string | null }) {
  return <label className="grid gap-1 text-sm sm:col-span-2">{label}
    <Textarea name={name} defaultValue={value ?? ''} rows={3} />
  </label>
}

export function SelectField({ name, label, value, children }: {
  name: string
  label: string
  value?: string | null
  children: ReactNode
}) {
  return <label className="grid gap-1 text-sm">{label}
    <select name={name} defaultValue={value ?? ''} className="min-w-0 rounded-md border bg-background px-3 py-2">
      {children}
    </select>
  </label>
}

export function Publication({ value }: { value?: boolean }) {
  return <SelectField name="published" label="Estado" value={value ? 'yes' : 'no'}>
    <option value="no">Borrador</option>
    <option value="yes">Publicado</option>
  </SelectField>
}

export function httpsField(data: FormData, name: string, label: string) {
  const value = field(data, name)
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href
  } catch {
    // The same validation message covers malformed and non-HTTPS URLs.
  }
  throw new Error(`${label}: introduce un enlace HTTPS válido.`)
}
