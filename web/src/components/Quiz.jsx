import { useState } from 'react';
import { markDone } from '../streak.js';

export default function Quiz({ questions, onFinish }) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState(null);
  const [correct, setCorrect] = useState(0);

  if (step >= questions.length) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="font-display text-4xl tabular-nums">{correct}/{questions.length}</p>
        <p className="text-sm text-ink-3 mt-2">
          {correct === questions.length ? 'הכול נכון. עקבת.' : 'נתראה מחר עם חידון חדש.'}
        </p>
      </div>
    );
  }

  const question = questions[step];

  function choose(i) {
    if (picked !== null) return;
    setPicked(i);
    if (i === question.answer) setCorrect(c => c + 1);
  }

  function next() {
    setPicked(null);
    if (step + 1 >= questions.length) onFinish?.(markDone());
    setStep(s => s + 1);
  }

  return (
    <div className="px-5 py-6">
      <p className="text-xs text-ink-3 mb-2 tabular-nums">שאלה {step + 1} מתוך {questions.length}</p>
      <h2 className="font-display text-[22px] leading-[1.3] mb-5 text-balance">{question.q}</h2>

      <div className="flex flex-col gap-2">
        {question.options.map((option, i) => {
          const isAnswer = i === question.answer;
          const state = picked === null ? 'idle' : isAnswer ? 'right' : i === picked ? 'wrong' : 'other';
          return (
            <button key={i} onClick={() => choose(i)} disabled={picked !== null}
                    className={`text-right px-4 py-3 rounded-[3px] border text-sm transition-colors ${
                      state === 'right' ? 'border-t-economy bg-t-economy/5 font-bold'
                      : state === 'wrong' ? 'border-t-security text-ink-3 line-through'
                      : state === 'other' ? 'border-rule text-ink-3'
                      : 'border-rule bg-paper-2'}`}>
              {option}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <button onClick={next} className="mt-5 w-full py-3 rounded-[3px] bg-ink text-paper font-bold">
          {step + 1 >= questions.length ? 'לתוצאה' : 'הבא'}
        </button>
      )}
    </div>
  );
}
