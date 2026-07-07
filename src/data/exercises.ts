import type { Exercise } from '../types'

// 기본 운동 라이브러리 (Fleek은 400+ 종목을 제공 — 여기서는 핵심 종목 시드)
export const SEED_EXERCISES: Exercise[] = [
  // ─ 가슴
  { id: 'bench-press', name: '벤치프레스', nameEn: 'Bench Press', equipment: 'barbell', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'front_delts'] },
  { id: 'incline-bench-press', name: '인클라인 벤치프레스', nameEn: 'Incline Bench Press', equipment: 'barbell', primaryMuscles: ['chest'], secondaryMuscles: ['front_delts', 'triceps'] },
  { id: 'db-bench-press', name: '덤벨 벤치프레스', nameEn: 'Dumbbell Bench Press', equipment: 'dumbbell', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'front_delts'] },
  { id: 'db-incline-press', name: '덤벨 인클라인 프레스', nameEn: 'Dumbbell Incline Press', equipment: 'dumbbell', primaryMuscles: ['chest'], secondaryMuscles: ['front_delts', 'triceps'] },
  { id: 'db-fly', name: '덤벨 플라이', nameEn: 'Dumbbell Fly', equipment: 'dumbbell', primaryMuscles: ['chest'], secondaryMuscles: [] },
  { id: 'cable-crossover', name: '케이블 크로스오버', nameEn: 'Cable Crossover', equipment: 'cable', primaryMuscles: ['chest'], secondaryMuscles: [] },
  { id: 'chest-press-machine', name: '체스트 프레스 머신', nameEn: 'Chest Press Machine', equipment: 'machine', primaryMuscles: ['chest'], secondaryMuscles: ['triceps'] },
  { id: 'pec-deck', name: '펙덱 플라이', nameEn: 'Pec Deck Fly', equipment: 'machine', primaryMuscles: ['chest'], secondaryMuscles: [] },
  { id: 'push-up', name: '푸시업', nameEn: 'Push Up', equipment: 'bodyweight', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'front_delts'] },
  { id: 'dips', name: '딥스', nameEn: 'Dips', equipment: 'bodyweight', primaryMuscles: ['chest', 'triceps'], secondaryMuscles: ['front_delts'] },

  // ─ 등
  { id: 'deadlift', name: '데드리프트', nameEn: 'Deadlift', equipment: 'barbell', primaryMuscles: ['lower_back', 'glutes', 'hamstrings'], secondaryMuscles: ['lats', 'traps', 'forearms', 'quads'] },
  { id: 'pull-up', name: '풀업', nameEn: 'Pull Up', equipment: 'bodyweight', primaryMuscles: ['lats'], secondaryMuscles: ['biceps', 'upper_back'] },
  { id: 'chin-up', name: '친업', nameEn: 'Chin Up', equipment: 'bodyweight', primaryMuscles: ['lats', 'biceps'], secondaryMuscles: ['upper_back'] },
  { id: 'lat-pulldown', name: '랫풀다운', nameEn: 'Lat Pulldown', equipment: 'cable', primaryMuscles: ['lats'], secondaryMuscles: ['biceps', 'upper_back'] },
  { id: 'barbell-row', name: '바벨 로우', nameEn: 'Barbell Row', equipment: 'barbell', primaryMuscles: ['lats', 'upper_back'], secondaryMuscles: ['biceps', 'rear_delts', 'lower_back'] },
  { id: 'db-row', name: '덤벨 로우', nameEn: 'Dumbbell Row', equipment: 'dumbbell', primaryMuscles: ['lats', 'upper_back'], secondaryMuscles: ['biceps', 'rear_delts'] },
  { id: 'seated-cable-row', name: '시티드 케이블 로우', nameEn: 'Seated Cable Row', equipment: 'cable', primaryMuscles: ['upper_back', 'lats'], secondaryMuscles: ['biceps', 'rear_delts'] },
  { id: 't-bar-row', name: '티바 로우', nameEn: 'T-Bar Row', equipment: 'machine', primaryMuscles: ['upper_back', 'lats'], secondaryMuscles: ['biceps', 'rear_delts'] },
  { id: 'back-extension', name: '백 익스텐션', nameEn: 'Back Extension', equipment: 'bodyweight', primaryMuscles: ['lower_back'], secondaryMuscles: ['glutes', 'hamstrings'] },
  { id: 'shrug', name: '슈러그', nameEn: 'Shrug', equipment: 'dumbbell', primaryMuscles: ['traps'], secondaryMuscles: ['forearms'] },

  // ─ 어깨
  { id: 'overhead-press', name: '오버헤드 프레스', nameEn: 'Overhead Press', equipment: 'barbell', primaryMuscles: ['front_delts', 'side_delts'], secondaryMuscles: ['triceps', 'traps'] },
  { id: 'db-shoulder-press', name: '덤벨 숄더 프레스', nameEn: 'Dumbbell Shoulder Press', equipment: 'dumbbell', primaryMuscles: ['front_delts', 'side_delts'], secondaryMuscles: ['triceps'] },
  { id: 'lateral-raise', name: '레터럴 레이즈', nameEn: 'Lateral Raise', equipment: 'dumbbell', primaryMuscles: ['side_delts'], secondaryMuscles: [] },
  { id: 'front-raise', name: '프론트 레이즈', nameEn: 'Front Raise', equipment: 'dumbbell', primaryMuscles: ['front_delts'], secondaryMuscles: [] },
  { id: 'rear-delt-fly', name: '리어 델트 플라이', nameEn: 'Rear Delt Fly', equipment: 'dumbbell', primaryMuscles: ['rear_delts'], secondaryMuscles: ['upper_back'] },
  { id: 'face-pull', name: '페이스 풀', nameEn: 'Face Pull', equipment: 'cable', primaryMuscles: ['rear_delts'], secondaryMuscles: ['traps', 'upper_back'] },
  { id: 'arnold-press', name: '아놀드 프레스', nameEn: 'Arnold Press', equipment: 'dumbbell', primaryMuscles: ['front_delts', 'side_delts'], secondaryMuscles: ['triceps'] },

  // ─ 팔
  { id: 'barbell-curl', name: '바벨 컬', nameEn: 'Barbell Curl', equipment: 'barbell', primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'] },
  { id: 'db-curl', name: '덤벨 컬', nameEn: 'Dumbbell Curl', equipment: 'dumbbell', primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'] },
  { id: 'hammer-curl', name: '해머 컬', nameEn: 'Hammer Curl', equipment: 'dumbbell', primaryMuscles: ['biceps', 'forearms'], secondaryMuscles: [] },
  { id: 'preacher-curl', name: '프리처 컬', nameEn: 'Preacher Curl', equipment: 'machine', primaryMuscles: ['biceps'], secondaryMuscles: [] },
  { id: 'cable-pushdown', name: '케이블 푸시다운', nameEn: 'Cable Pushdown', equipment: 'cable', primaryMuscles: ['triceps'], secondaryMuscles: [] },
  { id: 'overhead-triceps-ext', name: '오버헤드 트라이셉 익스텐션', nameEn: 'Overhead Triceps Extension', equipment: 'dumbbell', primaryMuscles: ['triceps'], secondaryMuscles: [] },
  { id: 'skull-crusher', name: '스컬 크러셔', nameEn: 'Skull Crusher', equipment: 'barbell', primaryMuscles: ['triceps'], secondaryMuscles: [] },
  { id: 'close-grip-bench', name: '클로즈그립 벤치프레스', nameEn: 'Close Grip Bench Press', equipment: 'barbell', primaryMuscles: ['triceps'], secondaryMuscles: ['chest', 'front_delts'] },
  { id: 'wrist-curl', name: '리스트 컬', nameEn: 'Wrist Curl', equipment: 'dumbbell', primaryMuscles: ['forearms'], secondaryMuscles: [] },

  // ─ 하체
  { id: 'squat', name: '스쿼트', nameEn: 'Squat', equipment: 'barbell', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings', 'lower_back', 'abs'] },
  { id: 'front-squat', name: '프론트 스쿼트', nameEn: 'Front Squat', equipment: 'barbell', primaryMuscles: ['quads'], secondaryMuscles: ['glutes', 'abs'] },
  { id: 'leg-press', name: '레그 프레스', nameEn: 'Leg Press', equipment: 'machine', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'] },
  { id: 'romanian-deadlift', name: '루마니안 데드리프트', nameEn: 'Romanian Deadlift', equipment: 'barbell', primaryMuscles: ['hamstrings', 'glutes'], secondaryMuscles: ['lower_back'] },
  { id: 'leg-extension', name: '레그 익스텐션', nameEn: 'Leg Extension', equipment: 'machine', primaryMuscles: ['quads'], secondaryMuscles: [] },
  { id: 'leg-curl', name: '레그 컬', nameEn: 'Leg Curl', equipment: 'machine', primaryMuscles: ['hamstrings'], secondaryMuscles: [] },
  { id: 'lunge', name: '런지', nameEn: 'Lunge', equipment: 'dumbbell', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'] },
  { id: 'bulgarian-split-squat', name: '불가리안 스플릿 스쿼트', nameEn: 'Bulgarian Split Squat', equipment: 'dumbbell', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'] },
  { id: 'hip-thrust', name: '힙 쓰러스트', nameEn: 'Hip Thrust', equipment: 'barbell', primaryMuscles: ['glutes'], secondaryMuscles: ['hamstrings'] },
  { id: 'calf-raise', name: '카프 레이즈', nameEn: 'Calf Raise', equipment: 'machine', primaryMuscles: ['calves'], secondaryMuscles: [] },
  { id: 'goblet-squat', name: '고블릿 스쿼트', nameEn: 'Goblet Squat', equipment: 'dumbbell', primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['abs'] },

  // ─ 코어
  { id: 'plank', name: '플랭크', nameEn: 'Plank', equipment: 'bodyweight', primaryMuscles: ['abs'], secondaryMuscles: ['obliques', 'lower_back'] },
  { id: 'crunch', name: '크런치', nameEn: 'Crunch', equipment: 'bodyweight', primaryMuscles: ['abs'], secondaryMuscles: [] },
  { id: 'leg-raise', name: '레그 레이즈', nameEn: 'Leg Raise', equipment: 'bodyweight', primaryMuscles: ['abs'], secondaryMuscles: ['obliques'] },
  { id: 'russian-twist', name: '러시안 트위스트', nameEn: 'Russian Twist', equipment: 'bodyweight', primaryMuscles: ['obliques'], secondaryMuscles: ['abs'] },
  { id: 'cable-crunch', name: '케이블 크런치', nameEn: 'Cable Crunch', equipment: 'cable', primaryMuscles: ['abs'], secondaryMuscles: [] },
  { id: 'ab-wheel', name: '앱휠 롤아웃', nameEn: 'Ab Wheel Rollout', equipment: 'other', primaryMuscles: ['abs'], secondaryMuscles: ['obliques', 'lats'] },

  // ─ 전신/기타
  { id: 'kettlebell-swing', name: '케틀벨 스윙', nameEn: 'Kettlebell Swing', equipment: 'kettlebell', primaryMuscles: ['glutes', 'hamstrings'], secondaryMuscles: ['lower_back', 'abs'] },
  { id: 'clean-and-press', name: '클린 앤 프레스', nameEn: 'Clean and Press', equipment: 'barbell', primaryMuscles: ['front_delts', 'quads', 'glutes'], secondaryMuscles: ['traps', 'triceps', 'lower_back'] },
]
