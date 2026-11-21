import { dayKey, entryKey, shiftDay } from './date'
import { emptyNote } from './types'
import type { DayCursor, DayNote } from './types'

export interface DemoData {
  entries: Record<string, string>
  notes: Record<string, DayNote>
}

interface DemoDay {
  offset: number
  texts: [string, string, string, string]
  note: Partial<DayNote>
}

const DAYS: DemoDay[] = [
  {
    offset: -2,
    texts: [
      '지원서 열두 번째. 오늘도 떨어졌다. 탈락 메일을 읽고 삼십 분쯤 그대로 앉아 있었다. 그래도 내일 하나 더 넣기로 했다. 엄마한테는 아직 말하지 못했다.',
      '출근한 지 두 달. 아직 회의실 이름도 다 못 외웠다. 오늘은 회의록을 대신 써 봤는데 팀장님이 정리가 좋다고 한 마디 해 주셨다. 그 한 마디로 하루가 버텨졌다.',
      '프로젝트 리드를 맡은 첫 주. 내가 결정하면 누군가의 일이 바뀐다는 게 이렇게 무겁다. 새벽 두 시까지 일정표를 고쳤다.',
      '아침에 삼십 분 일찍 일어나 동네를 걸었다. 작년 이맘때는 그럴 힘도 없었는데. 같은 길인데 마음이 다르다.',
    ],
    note: {
      freeNote: '비가 왔다. 우산을 두고 나와서 조금 젖었다. 젖은 채로 걸은 십 분이 나쁘지 않았다.',
      mood: 'blue',
      weather: 'rain',
      highlights: { '2023': '열두 번째 지원서', '2024': '첫 회의록 칭찬', '2025': '리드 첫 주', '2026': '아침 산책' },
    },
  },
  {
    offset: -1,
    texts: [
      '도서관 자리는 늘 같다. 창가에서 세 번째. 자기소개서를 세 번 고쳤다. 성장이라는 말을 빼고 구체적인 일로 바꿔 썼다.',
      '실수했다. 정산 금액을 잘못 넣어서 팀장님이 바로 잡아 주셨다. 혼나는 것보다 무서운 건 아무도 말해 주지 않는 것이다. 내일 아침에 먼저 물어보자.',
      '팀 회고. 내가 말을 너무 많이 했다. 다음에는 질문을 먼저 하자. 리드는 말하는 사람이 아니라 듣는 사람이라는 걸 오늘 배웠다.',
      '오후에 창밖을 오래 봤다. 급하지 않은 일을 급하지 않게 두는 연습.',
    ],
    note: {
      freeNote: '회의가 끝나고 남은 방의 공기. 말하지 못한 것들을 여기에 적어 둔다.',
      mood: 'tired',
      weather: 'cloud',
      highlights: { '2023': '창가 세 번째 자리', '2024': '정산 실수', '2025': '듣는 리드', '2026': '창밖을 보는 연습' },
    },
  },
  {
    offset: 0,
    texts: [
      '면접이 하나 남았다. 떨려서 어제 잠을 설쳤다. 그래도 여기까지 왔다. 결과는 내일 알 수 있다. 오늘은 스스로에게 잘했다고 말해 주기로 했다.',
      '점심에 팀 사람들과 국수를 먹었다. 오후에는 처음으로 내 이름이 걸린 기획서를 올렸다. 아직 부족한데도 뿌듯했다.',
      '릴리스 날. 새벽 네 시에 지표를 봤다. 숫자가 오르는 걸 보니 웃음이 났다. 다들 고생했는데 고맙다는 말을 충분히 못 했다.',
      '수첩을 바꾸지 않고 다섯 해째다. 처음엔 취업 준비였고, 그다음엔 신입이었고, 지금은 누군가를 기다리게 하는 사람이 됐다. 내일의 나에게, 조금만 천천히.',
    ],
    note: {
      freeNote: '오후 세 시, 창가 자리. 커피가 식기 전에 한 장을 다 채웠다. 내일은 이 문장을 다시 읽어 보자.',
      mood: 'calm',
      weather: 'sun',
      highlights: { '2023': '마지막 면접 전날', '2024': '내 이름이 걸린 기획서', '2025': '새벽 네 시의 릴리스', '2026': '다섯 해째 같은 수첩' },
    },
  },
  {
    offset: 1,
    texts: [
      '결과를 기다리는 하루. 아무것도 손에 잡히지 않아서 청소를 두 번 했다.',
      '기획서 피드백을 받았다. 열 줄 중에 여섯 줄이 빨간펜이었다. 창피했지만 그 여섯 줄이 제일 값진 선물이었다.',
      '릴리스 다음 날. 아무 일도 일어나지 않았다. 그게 제일 좋은 결과라는 걸 이제 안다.',
      '주말 계획을 세웠다. 오래 미뤄 둔 책 한 권, 동네 산책 한 번, 아무것도 안 하는 오후 한 번.',
    ],
    note: {
      freeNote: '빨간펜 자국을 지우지 않았다. 내일 다시 보려고.',
      mood: 'flutter',
      weather: 'sun',
      highlights: { '2023': '청소를 두 번 한 날', '2024': '여섯 줄의 빨간펜', '2025': '아무 일도 없던 날', '2026': '주말 계획' },
    },
  },
  {
    offset: 2,
    texts: [
      '합격했다. 전화를 받고 울었다. 엄마한테 먼저 말했다. 다섯 해 뒤의 나는 이날을 어떻게 기억할까.',
      '이제 익숙해진 출근길. 처음에는 무서웠던 그 길이 요즘은 제일 생각이 정리되는 시간이다.',
      '다음 분기 계획을 세웠다. 작년의 나라면 못 만든 표다. 조금은 자란 것 같다.',
      '오늘은 일기를 두 번 썼다. 아침에 한 번, 밤에 한 번. 같은 날인데 다른 사람이 쓴 것 같다.',
    ],
    note: {
      freeNote: '주말 계획: 책 한 권, 산책 한 번, 아무것도 안 하는 오후 한 번.',
      mood: 'joy',
      weather: 'sun',
      highlights: { '2023': '합격 통화', '2024': '익숙해진 출근길', '2025': '다음 분기 계획', '2026': '하루에 두 번 쓴 일기' },
    },
  },
]

interface ExtraDay {
  month: number
  day: number
  years: [number, string][]
  note?: Partial<DayNote>
}

const EXTRA: ExtraDay[] = [
  {
    month: 3,
    day: 14,
    years: [
      [2024, '사탕 대신 팀 사람들에게 커피를 돌렸다. 어색한 날이라 더 웃었던 것 같다.'],
      [2025, '봄이 왔다. 점심시간에 회사 앞 벚나무를 봤다. 한 해가 또 이렇게 지나가겠지.'],
    ],
    note: { freeNote: '벚꽃이 이틀 만에 다 폈다.', mood: 'flutter', weather: 'sun' },
  },
  {
    month: 7,
    day: 7,
    years: [
      [2023, '장마. 집에서 이력서를 고쳤다. 창밖이 하루 종일 회색이었다.'],
      [2025, '반기 회고. 상반기에 배운 것을 세 줄로 적어 봤다.'],
    ],
    note: { freeNote: '비 소리가 하루 종일 배경음처럼 깔렸다.', mood: 'calm', weather: 'rain' },
  },
  {
    month: 9,
    day: 30,
    years: [
      [2024, '추석 연휴 마지막 날. 내일부터 다시 일하는 게 조금은 설렜다.'],
      [2026, '구월의 끝. 올해 남은 석 달에 하고 싶은 일을 적어 두었다.'],
    ],
    note: { freeNote: '가을 냄새가 났다. 창문을 열어 두고 잤다.', mood: 'calm', weather: 'wind' },
  },
  {
    month: 12,
    day: 31,
    years: [
      [2023, '한 해의 마지막 날. 내년에는 꼭 붙고 싶다.'],
      [2024, '첫 회사에서 보낸 한 해. 고맙다.'],
      [2025, '리드로 보낸 한 해. 무거웠지만 좋았다.'],
    ],
    note: { freeNote: '자정 직전에 촛불을 껐다. 내년에도 이 수첩을 쓰고 싶다.', mood: 'joy', weather: 'cloud' },
  },
]

export function buildDemo(cursor: DayCursor): DemoData {
  const entries: Record<string, string> = {}
  const notes: Record<string, DayNote> = {}

  for (const day of DAYS) {
    const date = shiftDay(cursor, day.offset)
    const years = [2023, 2024, 2025, 2026]
    day.texts.forEach((text, index) => {
      entries[entryKey(years[index], date.month, date.day)] = text
    })
    const note = { ...emptyNote(), ...day.note, photos: [] }
    note.highlights = { ...(day.note.highlights ?? {}) }
    notes[dayKey(date.month, date.day)] = note
  }

  for (const extra of EXTRA) {
    for (const [year, text] of extra.years) {
      entries[entryKey(year, extra.month, extra.day)] = text
    }
    if (extra.note) {
      const key = dayKey(extra.month, extra.day)
      if (!notes[key]) {
        const note = { ...emptyNote(), ...extra.note, photos: [] }
        note.highlights = {}
        notes[key] = note
      }
    }
  }

  return { entries, notes }
}

export function hasNoteContent(note: DayNote | undefined): boolean {
  if (!note) return false
  return Boolean(
    note.freeNote.trim() ||
      note.mood ||
      note.weather ||
      note.photos.length ||
      Object.values(note.highlights).some((text) => text.trim()),
  )
}
