'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { QuizResult, StudentQuiz as Quiz } from '@/lib/independizar/course-management'

export function StudentQuiz({ lessonId, quiz, previous, english }: {
  lessonId: string
  quiz: Quiz
  previous: QuizResult | null
  english: boolean
}) {
  const [result, setResult] = useState(previous)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const answers = quiz.questions.map((_, index) => data.get(`question-${index}`))
    if (answers.some((answer) => typeof answer !== 'string')) return
    setPending(true)
    setError('')
    try {
      const response = await createClient().rpc('independizar_lesson_quiz', {
        target_lesson: lessonId,
        submitted_revision: quiz.revision,
        submitted_answers: answers.map(Number),
      })
      if (response.error || !response.data) throw new Error()
      setResult(response.data as QuizResult)
    } catch {
      setError(english ? 'Your attempt could not be saved. Reload the lesson and try again.'
        : 'No se pudo guardar el intento. Recarga la lección e inténtalo de nuevo.')
    } finally {
      setPending(false)
    }
  }

  return <section className="space-y-3 border-t pt-4">
    <h4 className="text-lg font-semibold">{english ? 'Lesson quiz' : 'Cuestionario de la lección'}</h4>
    <p>{english ? 'Passing score' : 'Puntaje mínimo'} · {quiz.passing_score}%</p>
    {result && <p role="status">
      {english ? 'Last attempt' : 'Último intento'} · {result.score}% · {result.passed
        ? (english ? 'Passed' : 'Aprobado') : (english ? 'Below passing score' : 'Por debajo del mínimo')}
    </p>}
    <form onSubmit={submit}>
      <fieldset disabled={pending} className="space-y-4">
        {quiz.questions.map((question, index) => <fieldset key={index} className="space-y-2 rounded-md border p-3">
          <legend className="px-1 font-medium">{index + 1}. {question.prompt}</legend>
          {question.choices.map((choice, choiceIndex) => <label key={choiceIndex} className="flex items-start gap-2">
            <input className="mt-1" type="radio" required name={`question-${index}`} value={choiceIndex} />
            <span>{choice}</span>
          </label>)}
        </fieldset>)}
        <Button type="submit">{pending ? (english ? 'Submitting…' : 'Enviando…')
          : (english ? 'Submit answers' : 'Enviar respuestas')}</Button>
        {error && <p role="alert" className="text-destructive">{error}</p>}
      </fieldset>
    </form>
  </section>
}
