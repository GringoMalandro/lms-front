'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

type StudentButtonProps = { userId: string; english: boolean } & (
  | { kind: 'enroll'; courseId: string }
  | { kind: 'complete'; lessonId: string }
)

export function StudentButton(props: StudentButtonProps) {
  const { userId, english, kind } = props
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const label = kind === 'enroll'
    ? (english ? 'Enroll' : 'Inscribirme')
    : (english ? 'Mark lesson complete' : 'Marcar lección como completada')

  async function save() {
    setState('saving')
    try {
      const supabase = createClient()
      const { error } = props.kind === 'enroll'
        ? await supabase.from('enrollments').upsert(
          { user_id: userId, course_id: props.courseId },
          { onConflict: 'user_id,course_id', ignoreDuplicates: true },
        )
        : await supabase.from('lesson_progress').upsert(
          { user_id: userId, lesson_id: props.lessonId },
          { onConflict: 'user_id,lesson_id', ignoreDuplicates: true },
        )
      if (error) throw error
      setState('saved')
      router.refresh()
    } catch {
      setState('error')
    }
  }

  return (
    <div>
      <Button type="button" disabled={state === 'saving' || state === 'saved'} onClick={save}>
        {state === 'saving' ? (english ? 'Saving…' : 'Guardando…') :
          state === 'saved' ? (english ? 'Saved' : 'Guardado') : label}
      </Button>
      {state === 'error' && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {english ? 'Unable to save. Check your course access and try again.' :
            'No se pudo guardar. Verifica tu acceso al curso e inténtalo de nuevo.'}
        </p>
      )}
    </div>
  )
}

export function StudentProfile({ userId, displayName, english }: {
  userId: string
  displayName: string
  english: boolean
}) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const router = useRouter()

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = String(new FormData(event.currentTarget).get('displayName') ?? '').trim()
    if (!name) {
      setStatus('error')
      return
    }
    setStatus('saving')
    try {
      const { error } = await createClient().from('profiles').upsert({ id: userId, display_name: name })
      if (error) throw error
      setStatus('saved')
      router.refresh()
    } catch {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={save} className="mt-5 space-y-3">
      <label htmlFor="displayName" className="block text-sm font-medium">
        {english ? 'Display name' : 'Nombre visible'}
      </label>
      <Input id="displayName" name="displayName" required maxLength={120} defaultValue={displayName}
        onChange={() => setStatus('idle')} disabled={status === 'saving'} />
      <Button type="submit" disabled={status === 'saving'}>
        {english ? 'Save profile' : 'Guardar perfil'}
      </Button>
      {status === 'saved' && <p role="status">{english ? 'Profile saved.' : 'Perfil guardado.'}</p>}
      {status === 'error' && <p role="alert" className="text-destructive">
        {english ? 'Unable to save the name.' : 'No se pudo guardar el nombre.'}
      </p>}
    </form>
  )
}
