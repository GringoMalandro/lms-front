'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import type { AdminQuizQuestion } from '@/lib/independizar/course-management'
import { AdminForm, field, numberField, Publication, TextField } from './admin-fields'

export type QuizDraft = { questions: AdminQuizQuestion[]; passing_score: number; published: boolean }

type DraftQuestion = AdminQuizQuestion & { key: number }
const emptyQuestion = (key: number): DraftQuestion => ({ key, prompt: '', choices: ['', ''], correct: 0 })

export function QuizEditor({ lessonId, quiz }: { lessonId: string; quiz: QuizDraft | null }) {
  const [questions, setQuestions] = useState<DraftQuestion[]>(() =>
    quiz?.questions.map((question, key) => ({ ...question, key })) ?? [emptyQuestion(0)])
  const nextKey = useRef(questions.length)

  function update(key: number, change: (question: DraftQuestion) => DraftQuestion) {
    setQuestions((current) => current.map((question) => question.key === key ? change(question) : question))
  }

  async function save(data: FormData) {
    const payload = questions.map(({ prompt, choices, correct }) => ({
      prompt: prompt.trim(), choices: choices.map((choice) => choice.trim()), correct,
    }))
    if (payload.some((question) => !question.prompt || question.choices.some((choice) => !choice))) {
      throw new Error('Completa todas las preguntas y opciones.')
    }
    const { error } = await createClient().from('lesson_quizzes').upsert({
      lesson_id: lessonId,
      questions: payload,
      passing_score: numberField(data, 'passing_score') ?? 70,
      published: field(data, 'published') === 'yes',
    })
    if (error) throw new Error(error.message)
  }

  return <details className="mt-4 rounded-lg border p-3">
    <summary className="cursor-pointer font-medium">Cuestionario opcional</summary>
    <div className="mt-3">
      <AdminForm save={save} label="Guardar cuestionario">
        <TextField name="passing_score" label="Puntaje mínimo (%)" type="number" max={100} required value={quiz?.passing_score ?? 70} />
        <Publication value={quiz?.published} />
        {questions.map((question, index) => (
          <div key={question.key} className="space-y-3 rounded-md border p-3 sm:col-span-2">
            <label className="grid gap-1 text-sm">Pregunta {index + 1}
              <Input required maxLength={1000} value={question.prompt} onChange={(event) => {
                const prompt = event.target.value
                update(question.key, (item) => ({ ...item, prompt }))
              }} />
            </label>
            {question.choices.map((choice, choiceIndex) => (
              <div key={choiceIndex} className="space-y-1">
                <label className="grid gap-1 text-sm">Opción {choiceIndex + 1}
                  <Input required maxLength={500} value={choice} onChange={(event) => {
                    const value = event.target.value
                    update(question.key, (item) => ({
                      ...item, choices: item.choices.map((text, i) => i === choiceIndex ? value : text),
                    }))
                  }} />
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name={`correct-${question.key}`} checked={question.correct === choiceIndex}
                      onChange={() => update(question.key, (item) => ({ ...item, correct: choiceIndex }))} />
                    Correcta
                  </label>
                  {question.choices.length > 2 && <Button variant="ghost" type="button" onClick={() => {
                    update(question.key, (item) => ({
                      ...item,
                      choices: item.choices.filter((_, i) => i !== choiceIndex),
                      correct: item.correct === choiceIndex ? 0 : item.correct - Number(item.correct > choiceIndex),
                    }))
                  }}>Quitar opción {choiceIndex + 1}</Button>}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {question.choices.length < 6 && <Button variant="outline" type="button" onClick={() => {
                update(question.key, (item) => ({ ...item, choices: [...item.choices, ''] }))
              }}>Agregar opción</Button>}
              {questions.length > 1 && <Button variant="outline" type="button" onClick={() => {
                setQuestions((current) => current.filter((item) => item.key !== question.key))
              }}>Quitar pregunta {index + 1}</Button>}
            </div>
          </div>
        ))}
        {questions.length < 30 && <div className="sm:col-span-2">
          <Button variant="outline" type="button" onClick={() => {
            const question = emptyQuestion(nextKey.current++)
            setQuestions((current) => [...current, question])
          }}>Agregar pregunta</Button>
        </div>}
      </AdminForm>
    </div>
  </details>
}
