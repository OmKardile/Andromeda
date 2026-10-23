'use client';

// Calculator — iOS-style calculator. Dark #1C1C1E screen, huge
// right-aligned display, 4×5 key grid (AC ± % ÷ / 7 8 9 × / 4 5 6 − /
// 1 2 3 + / 0 . =). Math runs through a tiny reducer — no eval().

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';

type Op = '+' | '−' | '×' | '÷';

interface CalcState {
  display: string;
  /** left operand of the pending operation */
  acc: number | null;
  op: Op | null;
  /** last right-hand operand — makes "=" repeat like the real thing */
  lastB: number | null;
  /** true when the display holds a result and the next digit starts fresh */
  fresh: boolean;
  /** pending / just-completed expression shown above the display */
  history: string;
}

const MAX_DIGITS = 9;

function apply(a: number, op: Op, b: number): number {
  switch (op) {
    case '+':
      return a + b;
    case '−':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? NaN : a / b;
  }
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return 'Error';
  const abs = Math.abs(n);
  if (abs >= 1e10 || (abs > 0 && abs < 1e-7)) return n.toExponential(4);
  const s = Number(n.toPrecision(MAX_DIGITS)).toString();
  if (s.replace(/[-.]/g, '').length > MAX_DIGITS) {
    return Number(n.toPrecision(MAX_DIGITS - 2)).toString();
  }
  return s;
}

function pressDigit(s: CalcState, d: string): CalcState {
  let st = s;
  if (st.display === 'Error') {
    st = { display: '0', acc: null, op: null, lastB: null, fresh: true, history: '' };
  }
  if (st.fresh) {
    // after "=" a fresh digit starts a new calculation (history clears);
    // after an operator it becomes the new right-hand operand (history stays)
    const history = st.lastB !== null ? '' : st.history;
    return { ...st, display: d === '.' ? '0.' : d, fresh: false, history };
  }
  if (d === '.') return st.display.includes('.') ? st : { ...st, display: st.display + '.' };
  if (st.display.replace(/[-.]/g, '').length >= MAX_DIGITS) return st;
  return { ...st, display: st.display === '0' ? d : st.display + d };
}

function pressOp(s: CalcState, next: Op): CalcState {
  if (s.display === 'Error') {
    // terminal error — start a fresh expression anchored at 0
    return { display: '0', acc: 0, op: next, lastB: null, fresh: true, history: `0 ${next}` };
  }
  const cur = parseFloat(s.display);
  if (s.op !== null && s.acc !== null && !s.fresh) {
    const r = apply(s.acc, s.op, cur);
    if (!Number.isFinite(r)) {
      return { display: 'Error', acc: null, op: null, lastB: null, fresh: true, history: '' };
    }
    return { display: fmt(r), acc: r, op: next, lastB: null, fresh: true, history: `${fmt(r)} ${next}` };
  }
  return { ...s, acc: cur, op: next, fresh: true, history: `${fmt(cur)} ${next}` };
}

function pressEquals(s: CalcState): CalcState {
  if (s.display === 'Error' || s.op === null || s.acc === null) {
    return { ...s, fresh: true };
  }
  const cur = s.fresh ? (s.lastB ?? s.acc) : parseFloat(s.display);
  const r = apply(s.acc, s.op, cur);
  if (!Number.isFinite(r)) {
    return { display: 'Error', acc: null, op: null, lastB: null, fresh: true, history: '' };
  }
  return {
    display: fmt(r),
    acc: r,
    op: s.op,
    lastB: cur,
    fresh: true,
    history: `${fmt(s.acc)} ${s.op} ${fmt(cur)} =`,
  };
}

function pressPercent(s: CalcState): CalcState {
  if (s.display === 'Error') return s;
  let cur = parseFloat(s.display);
  if (s.op === '+' || s.op === '−') {
    // iOS: "200 + 10 %" treats 10% as 10% *of* 200
    cur = ((s.acc ?? 0) * cur) / 100;
  } else {
    cur = cur / 100;
  }
  // lastB carries the percented value so "=" applies it (200 + 5 % = -> 210)
  return { ...s, display: fmt(cur), lastB: cur, fresh: true };
}

function pressNegate(s: CalcState): CalcState {
  if (s.display === 'Error' || s.display === '0') return s;
  return { ...s, display: s.display.startsWith('-') ? s.display.slice(1) : '-' + s.display };
}

/** Entry already cleared — pressing clear again performs a full AC. */
function entryClear(s: CalcState): boolean {
  return s.display === '0' && s.fresh;
}

function displayFontSize(text: string): number {
  const len = text.length;
  if (len <= 6) return 80;
  if (len <= 7) return 68;
  if (len <= 9) return 54;
  if (len <= 11) return 42;
  return 32;
}

type KeyKind = 'num' | 'fn' | 'op';

function KeyBtn({
  label,
  aria,
  kind,
  active = false,
  wide = false,
  onPress,
}: {
  label: string;
  aria: string;
  kind: KeyKind;
  active?: boolean;
  wide?: boolean;
  onPress: () => void;
}) {
  const base =
    'flex h-[74px] items-center justify-center rounded-full text-[32px] font-normal select-none transition-[transform,background-color] duration-100 active:scale-95';
  const look =
    kind === 'num'
      ? 'bg-[#333333] text-white active:bg-[#747478]'
      : kind === 'fn'
        ? 'bg-[#A5A5A5] text-black active:bg-[#D4D4D4]'
        : active
          ? 'bg-white text-[#FF9F0A] active:bg-[#EBEBED]'
          : 'bg-[#FF9F0A] text-white active:bg-[#FFC86E]';
  return (
    <button
      type="button"
      aria-label={aria}
      className={`${base} ${look} ${wide ? 'col-span-2' : ''}`}
      onClick={onPress}
    >
      {label}
    </button>
  );
}

export function CalculatorApp() {
  const [calc, setCalc] = useState<CalcState>({
    display: '0',
    acc: null,
    op: null,
    lastB: null,
    fresh: true,
    history: '',
  });

  const clean = entryClear(calc);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[#1C1C1E]" role="application" aria-label="Calculator">
      {/* back to home (every app screen keeps an exit) */}
      <button
        type="button"
        onClick={() => useLauncher.getState().closeOverlay()}
        className="absolute left-3 top-[62px] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20"
        aria-label="Back to home"
      >
        <ChevronLeft size={22} />
      </button>

      {/* display */}
      <div className="flex min-h-0 flex-1 flex-col items-end justify-end overflow-hidden px-7 pb-5 pt-[70px]">
        {calc.history && (
          <div className="mb-2 w-full truncate text-right text-[19px] font-light leading-none text-white/40 tabular-nums">
            {calc.history}
          </div>
        )}
        <div
          className="font-extralight tabular-nums leading-none text-white"
          style={{ fontSize: displayFontSize(calc.display) }}
          aria-live="polite"
          aria-label={`Result ${calc.display}`}
        >
          {calc.display}
        </div>
      </div>

      {/* keypad */}
      <div className="grid grid-cols-4 gap-3 px-3 pb-9 pt-1">
        <KeyBtn
          label={clean ? 'AC' : 'C'}
          aria={clean ? 'All clear' : 'Clear entry'}
          kind="fn"
          onPress={() =>
            setCalc(
              clean
                ? { display: '0', acc: null, op: null, lastB: null, fresh: true, history: '' }
                : { ...calc, display: '0', fresh: true },
            )
          }
        />
        <KeyBtn label="±" aria="Negate" kind="fn" onPress={() => setCalc(pressNegate(calc))} />
        <KeyBtn label="%" aria="Percent" kind="fn" onPress={() => setCalc(pressPercent(calc))} />
        <KeyBtn
          label="÷"
          aria="Divide"
          kind="op"
          active={calc.op === '÷' && calc.fresh}
          onPress={() => setCalc(pressOp(calc, '÷'))}
        />

        <KeyBtn label="7" aria="Seven" kind="num" onPress={() => setCalc(pressDigit(calc, '7'))} />
        <KeyBtn label="8" aria="Eight" kind="num" onPress={() => setCalc(pressDigit(calc, '8'))} />
        <KeyBtn label="9" aria="Nine" kind="num" onPress={() => setCalc(pressDigit(calc, '9'))} />
        <KeyBtn
          label="×"
          aria="Multiply"
          kind="op"
          active={calc.op === '×' && calc.fresh}
          onPress={() => setCalc(pressOp(calc, '×'))}
        />

        <KeyBtn label="4" aria="Four" kind="num" onPress={() => setCalc(pressDigit(calc, '4'))} />
        <KeyBtn label="5" aria="Five" kind="num" onPress={() => setCalc(pressDigit(calc, '5'))} />
        <KeyBtn label="6" aria="Six" kind="num" onPress={() => setCalc(pressDigit(calc, '6'))} />
        <KeyBtn
          label="−"
          aria="Subtract"
          kind="op"
          active={calc.op === '−' && calc.fresh}
          onPress={() => setCalc(pressOp(calc, '−'))}
        />

        <KeyBtn label="1" aria="One" kind="num" onPress={() => setCalc(pressDigit(calc, '1'))} />
        <KeyBtn label="2" aria="Two" kind="num" onPress={() => setCalc(pressDigit(calc, '2'))} />
        <KeyBtn label="3" aria="Three" kind="num" onPress={() => setCalc(pressDigit(calc, '3'))} />
        <KeyBtn
          label="+"
          aria="Add"
          kind="op"
          active={calc.op === '+' && calc.fresh}
          onPress={() => setCalc(pressOp(calc, '+'))}
        />

        <KeyBtn label="0" aria="Zero" kind="num" wide onPress={() => setCalc(pressDigit(calc, '0'))} />
        <KeyBtn label="." aria="Decimal point" kind="num" onPress={() => setCalc(pressDigit(calc, '.'))} />
        <KeyBtn label="=" aria="Equals" kind="op" onPress={() => setCalc(pressEquals(calc))} />
      </div>
    </div>
  );
}
